import { Command } from 'commander';
import { ReplSession } from './repl';
import { getBackendName } from './config';
import { AnthropicBackend } from './backends/anthropic';
import { globalTokenStore } from './auth/token-store';
import { SetupWizard } from './setup/setup-wizard';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('cacli')
  .description('cacli (Coding Assistent CLI): Multi-Agent AI Orchestration with Dynamic Workflow Generation')
  .version('3.0.0')
  .option('-b, --backend <name>', 'override backend (ollama|openwebui|openai|claude|anthropic|mock)')
  .action((opts) => {
    // Default action: start REPL
    const session = new ReplSession(opts.backend);
    session.run().catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
  });

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

// Setup wizard
program
  .command('setup')
  .description('Interactive setup wizard for first-time configuration')
  .action(async () => {
    try {
      const wizard = new SetupWizard();
      await wizard.run();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Setup failed:', err.message);
      process.exit(1);
    }
  });

// Login command for OAuth authentication
program
  .command('login')
  .description('Login to a backend using OAuth')
  .argument('<backend>', 'Backend to login (claude|anthropic)')
  .action(async (backend: string) => {
    if (backend === 'claude' || backend === 'anthropic') {
      try {
        await AnthropicBackend.login();
        process.exit(0);
      } catch (err: any) {
        console.error('❌ Login failed:', err.message);
        process.exit(1);
      }
    } else {
      console.error(`❌ OAuth login not supported for backend: ${backend}`);
      console.log('Supported backends: claude, anthropic');
      process.exit(1);
    }
  });

// Logout command
program
  .command('logout')
  .description('Logout from a backend')
  .argument('<backend>', 'Backend to logout (claude|anthropic)')
  .action(async (backend: string) => {
    if (backend === 'claude' || backend === 'anthropic') {
      try {
        await AnthropicBackend.logout();
        process.exit(0);
      } catch (err: any) {
        console.error('❌ Logout failed:', err.message);
        process.exit(1);
      }
    } else {
      console.error(`❌ Logout not supported for backend: ${backend}`);
      process.exit(1);
    }
  });

// Token management commands
const tokenCmd = program
  .command('token')
  .description('Manage OAuth tokens');

tokenCmd
  .command('list')
  .description('List all saved OAuth tokens')
  .action(async () => {
    await globalTokenStore.initialize();
    const tokens = globalTokenStore.listTokens();

    if (tokens.length === 0) {
      console.log('📋 No saved tokens');
      process.exit(0);
    }

    console.log('📋 Saved OAuth Tokens:');
    for (const token of tokens) {
      const refreshInfo = token.has_refresh ? '[auto-refresh]' : '';
      const expiresInfo = token.expires_in ? `(expires in ${token.expires_in})` : '';
      console.log(`  ✅ ${token.provider} ${expiresInfo} ${refreshInfo}`);
    }
    process.exit(0);
  });

tokenCmd
  .command('revoke')
  .description('Revoke and delete a saved token')
  .argument('<provider>', 'Provider name (e.g., anthropic)')
  .action(async (provider: string) => {
    await globalTokenStore.initialize();
    await globalTokenStore.revokeToken(provider);
    console.log(`✅ Token revoked and deleted: ${provider}`);
    process.exit(0);
  });

tokenCmd
  .command('clear')
  .description('Clear all saved tokens')
  .action(async () => {
    await globalTokenStore.initialize();
    await globalTokenStore.clearAll();
    console.log('✅ All tokens cleared');
    process.exit(0);
  });

program.parse(process.argv);
