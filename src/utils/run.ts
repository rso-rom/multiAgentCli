import { spawn } from 'child_process';
import path from 'path';

export type RunResult = {
  code: number | null;
  stdout: string;
  stderr: string
};

function extToCmd(file: string, mode: 'host' | 'docker'): string | null {
  const ext = path.extname(file).replace('.', '');
  if (mode === 'host') {
    const map: Record<string, string> = {
      js: `node ${file}`,
      ts: `npx ts-node ${file}`,
      py: `python ${file}`,
      go: `go run ${file}`,
      java: `javac ${file} && java ${path.basename(file, '.java')}`,
      cpp: `g++ ${file} -o /tmp/a.out && /tmp/a.out`
    };
    return map[ext] || null;
  }
  return null;
}

export function runHost(file: string, timeoutMs = 10000): Promise<RunResult> {
  return new Promise((resolve) => {
    const cmd = extToCmd(file, 'host');
    if (!cmd) {
      return resolve({
        code: 1,
        stdout: '',
        stderr: 'Unsupported file type for host run'
      });
    }

    const child = spawn(cmd, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let out = '';
    let err = '';

    child.stdout.on('data', (d) => {
      out += d.toString();
      process.stdout.write(d.toString());
    });

    child.stderr.on('data', (d) => {
      err += d.toString();
      process.stderr.write(d.toString());
    });

    const killTimer = setTimeout(() => {
      child.kill();
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(killTimer);
      resolve({ code, stdout: out, stderr: err });
    });
  });
}

export async function runDocker(
  file: string,
  image = process.env.DOCKER_RUNTIME_IMAGE || 'python:3.12-slim',
  timeoutSec = 12
): Promise<RunResult> {
  const fname = path.basename(file);
  const cmd = `docker run --rm -v "${process.cwd()}":/work -w /work --network none ${image} sh -c "${getDockerCmdForExt(fname)}"`;

  return new Promise((resolve) => {
    const child = spawn(cmd, { shell: true });
    let out = '';
    let err = '';

    child.stdout.on('data', (d) => {
      out += d.toString();
      process.stdout.write(d.toString());
    });

    child.stderr.on('data', (d) => {
      err += d.toString();
      process.stderr.write(d.toString());
    });

    const killTimer = setTimeout(() => {
      child.kill();
    }, timeoutSec * 1000);

    child.on('close', (code) => {
      clearTimeout(killTimer);
      resolve({ code, stdout: out, stderr: err });
    });
  });
}

function getDockerCmdForExt(fname: string): string {
  const ext = path.extname(fname).replace('.', '');
  const map: Record<string, string> = {
    py: `python ${fname}`,
    js: `node ${fname}`,
    ts: `npx ts-node ${fname}`,
    go: `go run ${fname}`,
    cpp: `g++ ${fname} -o /tmp/a.out && /tmp/a.out`
  };
  return map[ext] || 'echo "unsupported ext"';
}
