import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ExecutionMode } from '../types';

export class ExecutionController {
  mode: ExecutionMode;
  projectRoot: string;
  constructor(mode: ExecutionMode = (process.env.EXECUTION_MODE as ExecutionMode) || 'safe', projectRoot = process.cwd()) {
    this.mode = mode;
    this.projectRoot = projectRoot;
  }

  // action = { type: 'shell' | 'write' | 'mkdir', payload: ... }
  async handleAction(action: any) {
    if (this.mode === 'direct') {
      return this.execute(action);
    }
    // safe: display and ask
    console.log('AI schlÃÂ¤gt vor:', JSON.stringify(action, null, 2));
    const confirmed = await this.promptConfirm('Execute? (y/n)');
    if (confirmed) return this.execute(action);
    return { ok: false, cancelled: true };
  }

  private promptConfirm(question: string) {
    // minimal sync prompt (could use inquirer for nicer UX)
    return new Promise<boolean>((res) => {
      process.stdout.write(question + ' ');
      process.stdin.once('data', (d) => {
        const v = String(d).trim().toLowerCase();
        res(v === 'y' || v === 'yes');
      });
    });
  }

  private execute(action: any) {
    if (action.type === 'mkdir') {
      const target = path.join(this.projectRoot, action.path);
      fs.mkdirSync(target, { recursive: true });
      return { ok: true, created: target };
    }
    if (action.type === 'write') {
      const target = path.join(this.projectRoot, action.path);
      fs.writeFileSync(target, action.content, 'utf-8');
      return { ok: true, wrote: target };
    }
    if (action.type === 'shell') {
      // limit allowed commands to project root for safety
      return new Promise((resolve) => {
        const child = spawn(action.command, { shell: true, cwd: this.projectRoot, stdio: 'inherit' });
        child.on('close', (code) => resolve({ ok: code === 0, code }));
      });
    }
    return { ok: false, reason: 'unknown action' };
  }
}
