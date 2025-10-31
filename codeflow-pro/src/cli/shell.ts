import readline from 'readline';
import { Orchestrator } from '../orchestrator/orchestrator';
import { AskStorePayload } from '../llm/adapterStreaming';

export class InteractiveShell {
  private readonly orchestrator: Orchestrator;
  private readonly rl: readline.Interface;
  private busy = false;

  constructor(orchestrator: Orchestrator) {
    this.orchestrator = orchestrator;
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'codeflow> ' });
    this.bindEvents();
  }

  async start() {
    console.log('Codeflow shell ready. Type "help" for commands.');
    this.rl.prompt();
    for await (const line of this.rl) {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        continue;
      }
      try {
        await this.handleInput(input);
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err);
      }
      this.rl.prompt();
    }
  }

  private async handleInput(input: string) {
    if (input === 'help') {
      console.log('Commands:\n  run <workflow.yml>\n  @agent <message>\n  memory keys|show <key>|recent <agent> [limit]\n  exit');
      return;
    }
    if (input === 'exit' || input === 'quit') {
      this.rl.close();
      process.exit(0);
    }
    if (input.startsWith('run ')) {
      const file = input.slice(4).trim();
      await this.orchestrator.runWorkflowFile(file);
      return;
    }
    if (input.startsWith('@')) {
      const [agentToken, ...rest] = input.split(' ');
      const agentName = agentToken.slice(1);
      const message = rest.join(' ');
      if (!agentName || !message) {
        console.log('Usage: @agent <message>');
        return;
      }
      const result = await this.orchestrator.invokeAgentOneshot(agentName, message);
      console.log(`\n[${agentName}]\n${result}\n`);
      return;
    }
    if (input.startsWith('memory')) {
      await this.handleMemoryCommand(input.slice('memory'.length).trim());
      return;
    }
    console.log('Unknown command. Type "help".');
  }

  private async handleMemoryCommand(args: string) {
    const [cmd, ...rest] = args.split(/\s+/).filter(Boolean);
    if (!cmd) {
      console.log('memory keys|show <key>|recent <agent> [limit]');
      return;
    }
    if (cmd === 'keys') {
      console.log(Object.keys(this.orchestrator.memory.mid.all()).join('\n'));
      return;
    }
    if (cmd === 'show') {
      const key = rest[0];
      if (!key) {
        console.log('memory show <key>');
        return;
      }
      console.log(this.orchestrator.memory.mid.get(key) ?? '(not found)');
      return;
    }
    if (cmd === 'recent') {
      const agent = rest[0];
      const limit = rest[1] ? Number(rest[1]) : 5;
      if (!agent) {
        console.log('memory recent <agent> [limit]');
        return;
      }
      const entries = this.orchestrator.memory.recent(agent, limit);
      entries.forEach((entry, idx) => console.log(`#${idx + 1}:`, entry));
      return;
    }
    console.log('Unknown memory command.');
  }

  private bindEvents() {
    this.orchestrator.on('workflow-start', (info) => {
      console.log(`\n=== workflow start: ${info?.name ?? 'unnamed'} ===`);
    });
    this.orchestrator.on('workflow-finished', () => {
      console.log('\n=== workflow finished ===');
    });
    this.orchestrator.on('step-start', ({ agent }) => {
      console.log(`\n[${agent}]`);
    });
    this.orchestrator.on('chunk', ({ chunk }) => {
      process.stdout.write(chunk);
    });
    this.orchestrator.on('step-complete', () => {
      process.stdout.write('\n');
    });
    this.orchestrator.on('ask-store', (payload: AskStorePayload) => this.onAskStore(payload));
    this.orchestrator.on('error', ({ error }) => {
      console.error('\n[orchestrator error]', error);
    });
  }

  private async onAskStore(payload: AskStorePayload) {
    if (this.busy) return;
    this.busy = true;
    process.stdout.write('\n');
    const answer = await this.question(`Store output from ${payload.agent}? (y/N) `);
    if (answer.toLowerCase().startsWith('y')) {
      await payload.confirm();
      console.log('stored.');
    } else {
      payload.skip();
      console.log('skipped.');
    }
    this.busy = false;
    this.rl.prompt();
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => resolve(answer.trim()));
    });
  }
}
