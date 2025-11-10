import { Command } from 'commander';
import { ReplSession } from './repl';
import { getBackendName } from './config';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('cacli')
  .description('cacli (Coding Assistent CLI): Multi-Agent AI Orchestration with Dynamic Workflow Generation')
  .version('3.0.0')
  .option('-b, --backend <name>', 'override backend (ollama|openwebui|openai|mock)');

program
  .command('ask')
  .description('One-off question without starting REPL')
  .argument('<prompt...>', 'prompt to send to model')
  .option('-b, --backend <name>')
  .action(async (promptParts: string[], opts) => {
    const prompt = promptParts.join(' ');
    const session = new ReplSession(opts.backend);
    await session.ask(prompt);
    process.exit(0);
  });

program.parse(process.argv);

// If no command specified, start REPL by default
if (!process.argv.slice(2).length || process.argv.slice(2).every(arg => arg.startsWith('-'))) {
  const opts = program.opts();
  const session = new ReplSession(opts.backend);
  session.run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
