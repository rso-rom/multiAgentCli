import os
import json
import click
from .backend import get_backend
from .util import highlight_code, stream_print
from .executor import safe_run_file

@click.group()
def cli():
    """claudecode - minimal Claude-like code CLI"""
    pass

@cli.command()
@click.argument("prompt", required=False)
@click.option("--model", default=None, help="Model name or backend")
@click.option("--stream/--no-stream", default=True, help="Stream output")
def chat(prompt, model, stream):
    """One-shot chat / code generation. If no PROMPT, enters interactive REPL."""
    backend = get_backend(model)
    if not prompt:
        click.echo("Entering interactive chat. Ctrl-C or Ctrl-D to exit.")
        try:
            while True:
                p = click.prompt("You")
                resp = backend.chat(p, stream=stream, on_stream=stream_print if stream else None)
                if not stream:
                    click.echo(resp)
        except (KeyboardInterrupt, EOFError):
            click.echo("\nBye.")
        return

    resp = backend.chat(prompt, stream=stream, on_stream=stream_print if stream else None)
    if not stream:
        # If the model returned a code block, highlight it heuristically:
        highlighted = highlight_code(resp)
        click.echo(highlighted)

@cli.command()
@click.argument("file", type=click.Path(exists=True))
@click.option("--model", default=None, help="Model name or backend")
@click.option("--run/--no-run", default=False, help="Run generated file after creation")
def complete_file(file, model, run):
    """Ask model to complete or improve a file; prints result and optionally runs it."""
    backend = get_backend(model)
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    prompt = f"Here is a source file. Improve, fix bugs, and return the full file.\n\n---\n{content}\n---\nReturn only the full file contents."
    resp = backend.chat(prompt, stream=False)
    click.echo(highlight_code(resp))
    out_path = file + ".model_out"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(resp)
    click.echo(f"Wrote suggested file to {out_path}")
    if run:
        click.echo("Running file (sandboxed)...")
        rc, out, err = safe_run_file(out_path)
        click.echo("--- STDOUT ---")
        click.echo(out)
        click.echo("--- STDERR ---")
        click.echo(err)
        click.echo(f"Return code: {rc}")

@cli.command()
@click.argument("code", required=True)
@click.option("--lang", default="python", help="language hint for highlighting")
def highlight(code, lang):
    """Quick syntax highlight (prints colored to terminal)."""
    click.echo(highlight_code(code, lang))
