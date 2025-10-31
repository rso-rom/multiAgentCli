import click
from codechat.config import get_backend
from codechat.util import stream_print, highlight_code
from codechat.executor import safe_run_file
from codechat.edit_loop import extract_code

class ReplSession:
    def __init__(self):
        self.backend = get_backend()
        self.current_file = None
        self.current_code = None
        self.last_model_output = None

    def run(self):
        click.echo("?? codechat REPL started (type 'help' for commands, 'exit' to quit)\n")
        while True:
            try:
                cmd = input("> ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n?? Bye!")
                break

            if not cmd:
                continue
            if cmd in ["exit", "quit"]:
                break
            if cmd == "help":
                self.print_help()
                continue

            if cmd.startswith("load "):
                self.load_file(cmd.split(" ", 1)[1])
            elif cmd.startswith("improve "):
                self.improve(cmd.split(" ", 1)[1])
            elif cmd == "run":
                self.run_code()
            elif cmd == "save":
                self.save_file()
            elif cmd.startswith("ask "):
                self.ask(cmd.split(" ", 1)[1])
            else:
                click.echo("? Unknown command. Type 'help' for options.")

    def print_help(self):
        click.echo("""
Commands:
  load <file>       Load a file into memory
  improve <prompt>  Ask model to improve current file
  run               Execute current code safely
  save              Save current code to disk
  ask <prompt>      Ask a general question
  help              Show this help
  exit              Quit session
""")

    def load_file(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                self.current_code = f.read()
            self.current_file = path
            click.echo(f"? Loaded {path}")
        except Exception as e:
            click.echo(f"? Failed to load {path}: {e}")

    def improve(self, instruction):
        if not self.current_code:
            click.echo("??  No file loaded. Use `load <file>` first.")
            return
        prompt = (
            f"Improve the following code according to this instruction:\n"
            f"{instruction}\n\n"
            f"```python\n{self.current_code}\n```"
        )
        result = self.backend.chat(prompt, stream=False)
        code = extract_code(result)
        if code:
            self.last_model_output = code
            click.echo(highlight_code(code))
        else:
            click.echo("?? Model did not return code.")

    def run_code(self):
        if not (self.last_model_output or self.current_code):
            click.echo("?? No code loaded or generated yet.")
            return
        code = self.last_model_output or self.current_code
        import tempfile, os
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name
        rc, out, err = safe_run_file(tmp_path)
        click.echo(f"?? Output:\n{out}")
        if err:
            click.echo(f"?? Errors:\n{err}")
        click.echo(f"Exit code: {rc}")
        os.remove(tmp_path)

    def save_file(self):
        if not self.current_file or not self.last_model_output:
            click.echo("?? Nothing to save.")
            return
        with open(self.current_file, "w", encoding="utf-8") as f:
            f.write(self.last_model_output)
        click.echo(f"?? Saved changes to {self.current_file}")

    def ask(self, question):
        self.backend.chat(question, stream=True, on_stream=stream_print)
        print()
