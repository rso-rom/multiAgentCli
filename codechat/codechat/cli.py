import click
from codechat.config import get_backend
from codechat.util import stream_print, highlight_code
from codechat.executor import safe_run_file
from codechat.edit_loop import edit_loop

@click.group()
def cli():
    """codechat - Claude Code-like CLI for any model"""
    pass

@cli.command()
@click.argument("prompt", required=False)
@click.option("--model", help="Override backend")
@click.option("--stream/--no-stream", default=True)
def ask(prompt, model, stream):
    """Ask a question or start chat loop"""
    backend = get_backend(model)
    if not prompt:
        click.echo("Entering interactive chat (Ctrl+C to exit)")
        try:
            while True:
                user_input = click.prompt("You")
                backend.chat(user_input, stream=stream, on_stream=stream_print)
                click.echo()
        except (KeyboardInterrupt, EOFError):
            click.echo("\nBye!")
    else:
        backend.chat(prompt, stream=stream, on_stream=stream_print)
        click.echo()

@cli.command()
@click.argument("file", type=click.Path(exists=True))
@click.option("--auto-accept", is_flag=True, help="Automatically accept model changes")
def edit(file, auto_accept):
    """Run Claude-like edit loop"""
    backend = get_backend()
    edit_loop(file, backend, auto_accept)

@cli.command()
@click.argument("file", type=click.Path(exists=True))
def run(file):
    """Run a generated Python file safely"""
    rc, out, err = safe_run_file(file)
    click.echo(out)
    if err:
        click.echo(err, err=True)
    click.echo(f"[exit code {rc}]")
