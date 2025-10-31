import subprocess, sys

def safe_run_file(file, timeout=6):
    if not file.endswith(".py"):
        return 1, "", "Only .py files supported"
    try:
        proc = subprocess.Popen([sys.executable, file],
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                text=True)
        out, err = proc.communicate(timeout=timeout)
        return proc.returncode, out, err
    except subprocess.TimeoutExpired:
        proc.kill()
        return 124, "", "Timeout"
