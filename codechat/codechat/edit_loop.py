import click
from codechat.util import highlight_code

def edit_loop(file_path, backend, auto_accept=False):
    """Claude Code-like edit loop"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    click.echo(f"?? Editing {file_path} using {backend.__class__.__name__}\n")
    prompt = (
        "You are an AI code assistant. Review and improve this file. "
        "Return the *full improved version* wrapped in a code block:\n\n"
        f"```python\n{content}\n```"
    )

    result = backend.chat(prompt, stream=False)
    code = extract_code(result)
    if not code:
        click.echo("??  No code block detected. Showing full output:")
        click.echo(result)
        return

    highlighted = highlight_code(code)
    click.echo(highlighted)

    if not auto_accept:
        accept = click.confirm("Apply these changes?", default=False)
        if not accept:
            click.echo("? Changes discarded.")
            return

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    click.echo("? Changes applied successfully.")

def extract_code(text):
    import re
    m = re.search(r"```(?:\w+)?\n(.*?)```", text, re.S)
    return m.group(1).strip() if m else None
