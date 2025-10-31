import sys
from pygments import highlight
from pygments.lexers import guess_lexer, PythonLexer
from pygments.formatters import TerminalFormatter

def stream_print(chunk):
    sys.stdout.write(chunk)
    sys.stdout.flush()

def highlight_code(code):
    try:
        lexer = guess_lexer(code)
    except Exception:
        lexer = PythonLexer()
    return highlight(code, lexer, TerminalFormatter())
