import re
from pygments import highlight
from pygments.lexers import guess_lexer, get_lexer_by_name, PythonLexer
from pygments.formatters import TerminalFormatter
import sys
import time

_CODE_FENCE_RE = re.compile(r"```(?:([\w+-]+)\n)?(.*?)```", re.S)

def highlight_code(text, hint_lang=None):
    # If text contains a code fence, extract it and highlight
    m = _CODE_FENCE_RE.search(text)
    src = text
    if m:
        code = m.group(2)
        lang = m.group(1) or hint_lang or "python"
        try:
            lexer = get_lexer_by_name(lang)
        except Exception:
            try:
                lexer = guess_lexer(code)
            except Exception:
                lexer = PythonLexer()
        return highlight(code, lexer, TerminalFormatter())
    else:
        # no fence -> try to guess
        try:
            lexer = guess_lexer(text)
            return highlight(text, lexer, TerminalFormatter())
        except Exception:
            return text

def stream_print(chunk):
    # simple streaming print (flush)
    sys.stdout.write(chunk)
    sys.stdout.flush()
    # small delay can be added to emulate streaming but keep responsiveness
    # time.sleep(0.001)
