import { Command } from 'commander';
import { ReplSession } from './repl';
import { getBackendName } from './config';
import { AnthropicBackend } from './backends/anthropic';
import { globalTokenStore } from './auth/token-store';
import { SetupWizard } from './setup/setup-wizard';
import { AutoConfigurator } from './setup/auto-configurator';
import { CapabilityDetector } from './utils/capability-detector';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('cacli')
  .description('cacli (Coding Assistent CLI): Multi-Agent AI Orchestration with Intelligent Auto-Routing')
  .version('4.1.1')
  .option('-b, --backend <name>', 'override backend (ollama|openwebui|openai|claude|anthropic|mock)')
  .option('--enable-tools', 'enable agents to use system tools (curl, git, npm, etc.)')
  .option('--enable-mcp', 'enable MCP server integration (VS Code, Obsidian, etc.)')
  .option('--enable-gui', 'enable GUI control (Photoshop, GIMP, etc.) - POWERFUL!')
  .action((opts) => {
    // Default action: start REPL
    const session = new ReplSession(opts.backend, opts.enableTools, opts.enableMcp, opts.enableGui);
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
  .option('--enable-tools', 'enable agents to use system tools')
  .option('--enable-mcp', 'enable MCP server integration')
  .option('--enable-gui', 'enable GUI control')
  .action(async (promptParts: string[], opts) => {
    const prompt = promptParts.join(' ');
    const session = new ReplSession(opts.backend, opts.enableTools, opts.enableMcp, opts.enableGui);
    if (opts.enableTools) {
      await session.setupToolCapabilities();
    }
    if (opts.enableMcp) {
      await session.setupMCPCapabilities();
    }
    if (opts.enableGui) {
      await session.setupGUICapabilities();
    }
    // Setup Multi-Agent system (always available for task delegation)
    await session.setupMultiAgent();
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

// Auto-configuration commands
const configCmd = program
  .command('configure')
  .description('Auto-configure a new backend using AI');

configCmd
  .command('backend <name>')
  .description('Auto-configure a specific backend (e.g., gemini, mistral)')
  .option('--api-key <key>', 'API key for the backend')
  .option('--no-web-search', 'Disable web search (use only LLM knowledge)')
  .option('--no-agentic-tools', 'Disable LLM tool use (curl/wget)')
  .action(async (name: string, opts) => {
    try {
      const useWebSearch = opts.webSearch !== false;
      const useAgenticTools = opts.agenticTools !== false;
      const configurator = new AutoConfigurator(undefined, useWebSearch, useAgenticTools);

      console.log('\n🎯 Configuration mode:');
      if (useAgenticTools) {
        console.log('   🤖 Agentic Tool Use: Enabled (LLM can use curl/wget)');
      } else if (useWebSearch) {
        console.log('   🌐 Web Search: Enabled (pre-fetch documentation)');
      } else {
        console.log('   📚 LLM Knowledge Only: No web access');
      }

      const success = await configurator.configure(name, opts.apiKey);
      process.exit(success ? 0 : 1);
    } catch (err: any) {
      console.error('❌ Auto-configuration failed:', err.message);
      process.exit(1);
    }
  });

configCmd
  .command('interactive')
  .alias('wizard')
  .description('Interactive auto-configuration wizard')
  .action(async () => {
    try {
      const configurator = new AutoConfigurator();
      await configurator.interactiveConfiguration();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Configuration failed:', err.message);
      process.exit(1);
    }
  });

configCmd
  .command('list')
  .description('List backends that can be auto-configured')
  .action(async () => {
    const backends = await AutoConfigurator.listAvailableBackends();
    console.log('\n🤖 Backends that can be auto-configured:\n');
    for (const backend of backends) {
      console.log(`  • ${backend.charAt(0).toUpperCase() + backend.slice(1)}`);
    }
    console.log(`\nUsage: cacli configure backend <name>`);
    console.log(`   or: cacli configure interactive\n`);
    process.exit(0);
  });

// Capability management commands
const capabilityCmd = program
  .command('capabilities')
  .alias('caps')
  .description('Manage system capabilities and tool permissions');

capabilityCmd
  .command('scan')
  .description('Scan system for available tools and show report')
  .action(async () => {
    try {
      const detector = new CapabilityDetector();
      const capabilities = await detector.detectAll();
      const report = detector.generateReport(capabilities);
      console.log(report);
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Capability scan failed:', err.message);
      process.exit(1);
    }
  });

capabilityCmd
  .command('grant')
  .description('Grant tool permissions interactively')
  .action(async () => {
    try {
      const detector = new CapabilityDetector();
      const capabilities = await detector.detectAll();
      const permissions = await detector.requestPermissions(capabilities);

      const permissionsPath = path.join(process.cwd(), '.cacli-permissions.json');
      await detector.savePermissions(permissionsPath);

      console.log(`\n✅ Permissions saved to .cacli-permissions.json`);
      console.log(`   Granted: ${permissions.size} tools\n`);
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Permission grant failed:', err.message);
      process.exit(1);
    }
  });

capabilityCmd
  .command('revoke')
  .description('Revoke all tool permissions')
  .action(async () => {
    try {
      const permissionsPath = path.join(process.cwd(), '.cacli-permissions.json');
      const fs = await import('fs');

      if (fs.existsSync(permissionsPath)) {
        fs.unlinkSync(permissionsPath);
        console.log('✅ All tool permissions revoked');
      } else {
        console.log('⚠️  No permissions file found');
      }
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Permission revoke failed:', err.message);
      process.exit(1);
    }
  });

capabilityCmd
  .command('list')
  .description('List currently granted tool permissions')
  .action(async () => {
    try {
      const detector = new CapabilityDetector();
      const permissionsPath = path.join(process.cwd(), '.cacli-permissions.json');

      await detector.loadPermissions(permissionsPath);
      const permitted = detector.getPermittedCapabilities();

      if (permitted.length === 0) {
        console.log('\n📋 No tool permissions granted\n');
        console.log('Run: cacli capabilities grant\n');
      } else {
        console.log('\n📋 Granted Tool Permissions:\n');
        for (const tool of permitted) {
          console.log(`  ✅ ${tool}`);
        }
        console.log(`\n   Total: ${permitted.length} tools\n`);
      }
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Failed to list permissions:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
