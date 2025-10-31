import { ProjectMemory } from '../orchestrator/projectMemory';
import inquirer from 'inquirer';

export class AgentAuthManager {
  mem: ProjectMemory;
  constructor(mem: ProjectMemory) { this.mem = mem; }

  async ensureAuth(agent: any) {
    // apiKey mode
    if ((agent.authType ?? 'apiKey') === 'apiKey') {
      const key = agent.apiKey || process.env[`${agent.name.toUpperCase()}_API_KEY`];
      if (!key) throw new Error(`API-Key fÃÂ¼r Agent ${agent.name} fehlt`);
      return { type: 'apiKey', token: key };
    }

    // login mode: try memory first
    const stored = this.mem.get(`${agent.name}.session`);
    const now = Date.now();
    if (stored && stored.token && (!stored.expiry || stored.expiry > now)) return { type: 'session', token: stored.token };

    // interactive login fallback
    const answers = await inquirer.prompt([
      { name: 'username', message: `Username for ${agent.name}:` },
      { type: 'password', name: 'password', message: `Password for ${agent.name}:` }
    ]);
    // TODO: call API login endpoint here Ã¢ÂÂ we return a fake token for skeleton
    const token = `session-${Math.random().toString(36).slice(2,9)}`;
    const expiry = Date.now() + 1000 * 60 * 60;
    await this.mem.set(`${agent.name}.session`, { token, expiry });
    return { type: 'session', token };
  }
}
