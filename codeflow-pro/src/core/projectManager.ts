import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { makeProjectId } from './id';

export class ProjectManager {
  root: string; // base storage for projects (memory root)
  constructor(root = process.env.MEMORY_ROOT || './memory') {
    this.root = path.resolve(root);
    if (!fs.existsSync(this.root)) fs.mkdirSync(this.root, { recursive: true });
  }

  detectProject(cwd = process.cwd()): { name?: string, root?: string } {
    // walk up to find .codeflow or package.json
    let cur = cwd;
    while (true) {
      const p = path.join(cur, '.codeflow');
      if (fs.existsSync(p)) {
        const cfg = fs.readFileSync(p, 'utf-8');
        try {
          const meta = yaml.load(cfg) as any;
          return { name: meta.name, root: cur };
        } catch {
          return { name: path.basename(cur), root: cur };
        }
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    return {};
  }

  createProject(name: string) {
    const id = makeProjectId(name);
    const projDir = path.join(this.root, 'projects', id);
    fs.mkdirSync(projDir, { recursive: true });
    // create metadata file in project root for auto-detect
    const dot = path.join(projDir, '.codeflow');
    const meta = { name, id, createdAt: new Date().toISOString() };
    fs.writeFileSync(dot, yaml.dump(meta));
    return { id, projDir, meta };
  }

  getProjectDirById(projectId: string) {
    return path.join(this.root, 'projects', projectId);
  }
}
