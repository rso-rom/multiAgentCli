import subprocess
import shlex
import tempfile
import os
import sys
import time

def safe_run_file(path, timeout=8):
    """
    Run a python file in a very small sandbox (resource-limited not implemented here).
    WARNING: Running untrusted code is dangerous. This function is a convenience for testing only.
    For production use run in container / proper sandbox (firejail, seccomp, docker).
    """
    if not path.endswith(".py"):
        return (1, "", "Can only run .py files in this helper.")
    cmd = [sys.executable, path]
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out, err = p.communicate(timeout=timeout)
        return (p.returncode, out, err)
    except subprocess.TimeoutExpired:
        p.kill()
        return (124, "", "Timeout")
    except Exception as e:
        return (1, "", str(e))
