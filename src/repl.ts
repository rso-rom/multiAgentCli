import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { getBackend } from './config';
import { streamToConsole } from './utils/stream';
import { highlightCode } from './utils/highlight';
import { runHost, runDocker } from './utils/run';
import { eventBus } from './orchestrator/event-system';
import { AskStoreHandler } from './orchestrator/ask-store-handler';
import { MemoryManager } from './memory/memory-manager';

function readFileSafe(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

export class ReplSession {
  backendName?: string;
  backend: any;
  currentFile?: string;
  currentCode?: string;
  lastModelOutput?: string;
  allowWeb: boolean = false;
  askStoreHandler?: AskStoreHandler;

  constructor(backendName?: string) {
    this.backendName = backendName;
    this.backend = getBackend(backendName);
  }

  /**
   * Initialize ask-store handler
   */
  async initializeAskStore(): Promise<void> {
    try {
      const { createMemoryManager } = await import('./memory/memory-factory');
      const memory = await createMemoryManager();
      const { createAskStoreHandler } = await import('./orchestrator/ask-store-handler');
      this.askStoreHandler = await createAskStoreHandler(memory);
    } catch (error) {
      // Ask-store is optional, continue without it
      console.warn('⚠️ Ask-store not available (requires Qdrant)');
    }
  }

  async run(): Promise<void> {
    console.log(`🧠 cacli REPL (backend=${this.backendName || process.env.MODEL_BACKEND || 'mock'})`);
    console.log('Type "/help" for commands, or just start typing to ask questions');

    // Initialize ask-store handler
    await this.initializeAskStore();

    while (true) {
      const { cmd } = await inquirer.prompt([
        { name: 'cmd', message: '>', prefix: '' }
      ]);

      const trimmed = (cmd || '').trim();
      if (!trimmed) continue;

      try {
        // Check if it's a slash command
        if (trimmed.startsWith('/')) {
          await this.handleSlashCommand(trimmed.slice(1));
        } else {
          // Check if this looks like a development task
          if (await this.looksLikeDevelopmentTask(trimmed)) {
            await this.handleAutoWorkflow(trimmed);
          } else {
            // Natural language → auto ask
            await this.ask(trimmed);
          }
        }
      } catch (e: any) {
        console.error('Error:', e?.message || e);
      }
    }

    console.log('👋 Bye!');
  }

  /**
   * Handle slash commands
   */
  async handleSlashCommand(command: string): Promise<void> {
    const [verb, ...rest] = command.split(' ');
    const arg = rest.join(' ');

    if (verb === 'exit' || verb === 'quit') {
      process.exit(0);
    } else if (verb === 'help' || verb === 'h') {
      this.printHelp();
    } else if (verb === 'load' || verb === 'l') {
      await this.cmdLoad(arg);
    } else if (verb === 'improve' || verb === 'i') {
      await this.cmdImprove(arg);
    } else if (verb === 'run' || verb === 'r') {
      await this.cmdRun();
    } else if (verb === 'save' || verb === 's') {
      await this.cmdSave();
    } else if (verb === 'ask' || verb === 'a') {
      await this.ask(arg);
    } else if (verb === 'web' || verb === 'w') {
      await this.cmdWeb(arg);
    } else if (verb === 'webs' || verb === 'ws') {
      await this.cmdWebSearch(arg);
    } else if (verb === 'orchestrate' || verb === 'o') {
      await this.cmdOrchestrate(arg);
    } else if (verb === 'workflow' || verb === 'wf') {
      await this.cmdWorkflow(arg);
    } else if (verb === 'workflows') {
      await this.cmdListWorkflows();
    } else if (verb === 'tools' || verb === 't') {
      await this.cmdTools();
    } else if (verb === 'history' || verb === 'hist') {
      await this.cmdHistory(arg);
    } else if (verb === 'token') {
      await this.cmdToken(arg);
    } else if (verb === 'screenshot' || verb === 'ss' || verb === 'image' || verb === 'img') {
      await this.cmdScreenshot(arg);
    } else if (verb === 'paste' || verb === 'clip' || verb === 'clipboard') {
      await this.cmdPaste(arg);
    } else if (verb === 'clear' || verb === 'c') {
      console.clear();
    } else {
      // Try to find as workflow name
      const workflowPath = this.findWorkflowByName(verb);
      if (workflowPath) {
        await this.cmdWorkflow(`${verb} ${arg}`);
      } else {
        console.log(`❌ Unknown command: /${verb}`);
        console.log('Type "/help" for available commands');
      }
    }
  }

  /**
   * Find workflow by name
   */
  private findWorkflowByName(name: string): string | null {
    const { MarkdownWorkflowParser } = require('./orchestrator/markdown-workflow-parser');
    return MarkdownWorkflowParser.findWorkflow(name);
  }

  /**
   * Check if input looks like a development task
   */
  private async looksLikeDevelopmentTask(input: string): Promise<boolean> {
    const devKeywords = [
      'entwickle', 'erstelle', 'baue', 'implementiere',
      'develop', 'create', 'build', 'implement', 'make',
      'app', 'application', 'website', 'api', 'service',
      'calculator', 'rechner', 'webshop', 'blog', 'cms'
    ];

    const lowerInput = input.toLowerCase();

    // Check if starts with development verb
    for (const keyword of devKeywords) {
      if (lowerInput.startsWith(keyword) || lowerInput.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle automatic workflow selection and execution
   */
  private async handleAutoWorkflow(input: string): Promise<void> {
    const { DynamicWorkflowGenerator } = await import('./orchestrator/dynamic-workflow-generator');
    const inquirer = await import('inquirer');

    console.log('\n🤖 Analyzing your task with Requirements Engineer...\n');

    try {
      // Step 1: Run Requirements Engineer FIRST
      const reqPrompt = DynamicWorkflowGenerator.createRequirementsPrompt(input);

      console.log('📋 Requirements Engineer analyzing...\n');

      let requirementsOutput = '';
      const onStream = (chunk: string) => {
        requirementsOutput += chunk;
        process.stdout.write(chunk);
      };

      await this.backend.chat(reqPrompt, onStream);
      console.log('\n');

      // Step 2: Parse requirements
      const requirements = DynamicWorkflowGenerator.parseRequirementsResponse(requirementsOutput);

      if (!requirements) {
        console.log('⚠️  Could not parse requirements analysis. Using fallback workflow.\n');
        await this.handleFallbackWorkflow(input);
        return;
      }

      // Step 3: Generate workflow based on requirements
      const workflowPlan = DynamicWorkflowGenerator.generateFromRequirements(input, requirements);

      console.log('\n📊 Requirements Analysis Complete!\n');
      console.log(`Scope: ${requirements.scope}`);
      console.log(`Components: ${requirements.components.join(', ')}`);
      console.log(`Database needed: ${requirements.needsDatabase ? 'YES' : 'NO'}`);
      console.log(`Complexity: ${requirements.complexity}`);
      console.log(`\n🔧 Generated Workflow:`);
      console.log(`Agents (${workflowPlan.agents.length}): ${workflowPlan.agents.join(' → ')}`);
      console.log(`\n💡 ${workflowPlan.reasoning}\n`);

      // Step 4: Ask for confirmation
      const { confirm } = await inquirer.default.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Run this auto-generated workflow with ${workflowPlan.agents.length} agents?`,
        default: true
      }]);

      if (!confirm) {
        console.log('\n💬 Using regular ask instead...\n');
        await this.ask(input);
        return;
      }

      // Step 5: Execute dynamic workflow
      await this.executeDynamicWorkflow(input, workflowPlan, requirements, requirementsOutput);

    } catch (error: any) {
      console.error('❌ Error in auto-workflow:', error.message);
      console.log('\n💬 Falling back to regular ask...\n');
      await this.ask(input);
    }
  }

  /**
   * Execute dynamically generated workflow
   */
  private async executeDynamicWorkflow(
    task: string,
    plan: any,
    requirements: any,
    requirementsOutput: string
  ): Promise<void> {
    const { DynamicWorkflowGenerator } = await import('./orchestrator/dynamic-workflow-generator');

    console.log(`\n🚀 Executing workflow...\n`);

    const results: Record<string, string> = {
      requirements: requirementsOutput
    };

    // Execute each agent in sequence
    for (let i = 1; i < plan.agents.length; i++) {
      const agentName = plan.agents[i];
      const config = DynamicWorkflowGenerator.getAgentConfig(agentName);

      console.log(`\n🤖 [${agentName}] (${config.role})\n`);

      // Replace placeholders in prompt
      let prompt = config.prompt
        .replace(/{TASK}/g, task)
        .replace(/{requirements}/g, results.requirements || '');

      // Replace context references
      for (const [key, value] of Object.entries(results)) {
        const placeholder = `{${key}}`;
        prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
      }

      // Execute agent
      let output = '';
      const onStream = (chunk: string) => {
        output += chunk;
        process.stdout.write(chunk);
      };

      await this.backend.chat(prompt, onStream);
      console.log('\n');

      results[agentName] = output;
    }

    console.log('\n✅ Workflow completed!\n');
    console.log('📊 Results Summary:\n');
    for (const [agent, output] of Object.entries(results)) {
      if (agent === 'requirements') continue; // Already shown
      console.log(`\n[${agent}]:`);
      console.log(output.substring(0, 200) + (output.length > 200 ? '...' : ''));
    }
  }

  /**
   * Fallback to static workflow
   */
  private async handleFallbackWorkflow(input: string): Promise<void> {
    const { WorkflowSelector } = await import('./orchestrator/workflow-selector');
    const { MarkdownWorkflowParser } = await import('./orchestrator/markdown-workflow-parser');
    const { Workflow } = await import('./orchestrator/workflow');

    const suggestion = WorkflowSelector.analyzeTask(input);
    const workflowPath = MarkdownWorkflowParser.findWorkflow(suggestion.workflow);

    if (!workflowPath) {
      console.log('❌ No workflow available. Using regular ask.');
      await this.ask(input);
      return;
    }

    const variables = { task: input, TASK: input, arguments: input, ARGUMENTS: input };
    const definition = MarkdownWorkflowParser.parseFile(workflowPath, variables);
    const workflow = new Workflow(definition);
    await workflow.execute();
  }

  printHelp(): void {
    console.log(`
╭─────────────────────────────────────────────────────────────╮
│  🧠 CAILI - Natural Language + Slash Commands              │
╰─────────────────────────────────────────────────────────────╯

💬 NATURAL LANGUAGE (default)
  Just type your question - no command needed!

  Examples:
    > Was ist TypeScript?
    > Erkläre mir async/await
    > Wie erstelle ich eine REST API?

📂 FILE OPERATIONS
  /load <file>      Load file into session (alias: /l)
  /save             Save last output to file (alias: /s)
  /run              Execute last output or loaded file (alias: /r)
  /improve <instr>  Improve loaded file (alias: /i)

🤖 AI INTERACTION
  /ask <prompt>     Explicit ask (alias: /a)
  /web on|off       Toggle web search (alias: /w)
  /webs <query>     Direct web search (alias: /ws)

🎯 WORKFLOWS
  /workflow <name> [args]   Run markdown workflow (alias: /wf)
  /workflows                List available workflows
  /orchestrate <yml>        Run YAML workflow (alias: /o)

  Quick workflows:
    /develop <task>           Full-stack development
    /quickstart <task>        Quick prototype
    /api <task>               REST API development

  Examples:
    /develop Erstelle einen Blog mit Next.js
    /api User management system

📸 VISION & IMAGES
  /screenshot <file> [question]  Analyze image file (alias: /ss, /image, /img)
  /paste [question]              Analyze image from clipboard (alias: /clip)

  Examples:
    /screenshot error.png "What's wrong?"
    /paste "Explain this UI"
    /ss bug.jpg

  Supported: .png, .jpg, .jpeg, .gif, .webp, .bmp (max 20MB)
  Requires: OPENAI_API_KEY (uses GPT-4 Vision)

🔧 UTILITIES
  /tools            Show available CLI tools (alias: /t)
  /history [query]  Search prompt history (alias: /hist)
  /token <cmd>      Manage OAuth tokens
  /clear            Clear screen (alias: /c)
  /help             Show this help (alias: /h)
  /exit             Quit (alias: /quit)

💡 TIPS:
  • Workflows support arguments via $TASK and $1, $2, etc.
  • Drag & drop image files into terminal to get the path
  • Type "/workflows" to see all available templates
`);
  }

  async cmdLoad(p: string): Promise<void> {
    if (!p) return console.log('Usage: load <file>');

    const content = readFileSafe(p);
    if (content === null) return console.log(`Failed to read ${p}`);

    this.currentFile = p;
    this.currentCode = content;
    console.log(`✅ Loaded ${p} (${content.length} bytes)`);
    console.log(highlightCode(content, path.extname(p).replace('.', '') || 'python'));
  }

  async cmdImprove(instr: string): Promise<void> {
    if (!this.currentCode) return console.log('No file loaded. Use load <file>.');
    if (!instr) return console.log('Usage: improve <instruction>');

    const prompt = `You are an AI code assistant. Improve the following file according to the instruction:
Instruction: ${instr}

---FILE---
${this.currentCode}
---END---

Return the full file in a code block.`;

    // Emit ask-store event
    if (this.askStoreHandler && this.askStoreHandler.isEnabled()) {
      eventBus.emitAskStore({
        agent: 'repl',
        text: instr,
        metadata: {
          command: 'improve',
          file: this.currentFile,
          codeLength: this.currentCode.length
        },
        timestamp: new Date()
      });
    }

    console.log('⤴️ Sending to model...');
    let buf = '';
    const onStream = (chunk: string) => {
      buf += chunk;
      process.stdout.write(chunk);
    };

    const maybe = await this.backend.chat(prompt, onStream);
    if (maybe && typeof maybe === 'string') buf = maybe;

    // Extract code from code fence
    const m = buf.match(/```(?:\w+)?\n([\s\S]*?)```/);
    const code = m ? m[1].trim() : buf.trim();
    this.lastModelOutput = code;

    console.log('\n--- model output (highlight) ---');
    console.log(highlightCode(code, path.extname(this.currentFile || '').replace('.', '') || 'python'));
  }

  async cmdRun(): Promise<void> {
    const toRun = this.lastModelOutput || this.currentCode;
    if (!toRun) return console.log('Nothing to run.');

    // Write temp file
    const ext = this.currentFile ? path.extname(this.currentFile) : '.py';
    const tmp = path.join(process.cwd(), `.cacli_tmp_${Date.now()}${ext}`);
    fs.writeFileSync(tmp, toRun, 'utf-8');

    const mode = (process.env.EXECUTION_MODE || 'host');
    console.log(`⚙️ Running (${mode})...`);

    try {
      if (mode === 'docker') {
        const res = await runDocker(tmp);
        console.log(`\nExit: ${res.code}`);
      } else {
        const res = await runHost(tmp);
        console.log(`\nExit: ${res.code}`);
      }
    } finally {
      fs.unlinkSync(tmp);
    }
  }

  async cmdSave(): Promise<void> {
    if (!this.currentFile) return console.log('No file loaded to save into.');
    if (!this.lastModelOutput) return console.log('No model output to save.');

    fs.writeFileSync(this.currentFile, this.lastModelOutput, 'utf-8');
    console.log(`💾 Saved changes to ${this.currentFile}`);
  }

  async ask(prompt: string): Promise<void> {
    if (!prompt) return console.log('Usage: ask <prompt>');

    // Emit ask-store event
    if (this.askStoreHandler && this.askStoreHandler.isEnabled()) {
      eventBus.emitAskStore({
        agent: 'repl',
        text: prompt,
        metadata: {
          command: 'ask',
          webEnabled: this.allowWeb,
          file: this.currentFile
        },
        timestamp: new Date()
      });
    }

    if (this.allowWeb) {
      console.log('⤴️ Asking model with web access...');
      const { runWebAgent } = await import('./tools/webagent');
      await runWebAgent(this.backend, prompt);
    } else {
      console.log('⤴️ Asking model...');
      const onStream = (chunk: string) => process.stdout.write(chunk);
      const maybe = await this.backend.chat(prompt, onStream);
      if (maybe && typeof maybe === 'string') console.log(maybe);
      console.log('');
    }
  }

  async cmdWeb(arg: string): Promise<void> {
    const mode = arg.toLowerCase().trim();

    if (mode === 'on') {
      this.allowWeb = true;
      console.log('✅ Web access enabled. Ask and improve commands will use web agent.');
    } else if (mode === 'off') {
      this.allowWeb = false;
      console.log('✅ Web access disabled.');
    } else {
      console.log(`Current web mode: ${this.allowWeb ? 'ON' : 'OFF'}`);
      console.log('Usage: web on | web off');
    }
  }

  async cmdWebSearch(query: string): Promise<void> {
    if (!query) return console.log('Usage: webs <search query>');

    console.log(`🔍 Searching web and asking model: ${query}`);
    const { runWebAgent } = await import('./tools/webagent');
    await runWebAgent(this.backend, query);
  }

  async cmdOrchestrate(filePath: string): Promise<void> {
    if (!filePath) return console.log('Usage: /orchestrate <workflow.yml>');

    try {
      const { Workflow } = await import('./orchestrator/workflow');
      const workflow = Workflow.fromFile(filePath);
      await workflow.execute();

      console.log('📊 Results:');
      const results = workflow.getAllResults();
      for (const [agent, output] of Object.entries(results)) {
        console.log(`\n[${agent}]:`);
        console.log(output.substring(0, 200) + (output.length > 200 ? '...' : ''));
      }
    } catch (error: any) {
      console.error('Error running workflow:', error.message);
    }
  }

  async cmdWorkflow(input: string): Promise<void> {
    if (!input) {
      console.log('Usage: /workflow <name> [arguments]');
      console.log('Example: /workflow develop Erstelle einen Blog');
      console.log('\nType "/workflows" to see available templates');
      return;
    }

    try {
      const { MarkdownWorkflowParser } = await import('./orchestrator/markdown-workflow-parser');
      const { Workflow } = await import('./orchestrator/workflow');

      // Parse input: first word is workflow name, rest are arguments
      const [workflowName, ...args] = input.split(' ');
      const task = args.join(' ');

      // Find workflow file
      const workflowPath = MarkdownWorkflowParser.findWorkflow(workflowName);
      if (!workflowPath) {
        console.log(`❌ Workflow not found: ${workflowName}`);
        console.log('\nAvailable workflows:');
        const available = MarkdownWorkflowParser.listWorkflows();
        available.forEach(name => console.log(`  - ${name}`));
        return;
      }

      // Parse markdown workflow with variables
      const variables: Record<string, string> = {
        task,
        TASK: task,
        arguments: task,
        ARGUMENTS: task
      };

      // Add positional arguments
      args.forEach((arg, index) => {
        variables[(index + 1).toString()] = arg;
      });

      console.log(`\n🚀 Running workflow: ${workflowName}`);
      if (task) {
        console.log(`📝 Task: ${task}\n`);
      }

      const definition = MarkdownWorkflowParser.parseFile(workflowPath, variables);
      const workflow = new Workflow(definition);
      await workflow.execute();

      console.log('\n📊 Results:');
      const results = workflow.getAllResults();
      for (const [agent, output] of Object.entries(results)) {
        console.log(`\n[${agent}]:`);
        console.log(output.substring(0, 200) + (output.length > 200 ? '...' : ''));
      }
    } catch (error: any) {
      console.error('❌ Error running workflow:', error.message);
    }
  }

  async cmdListWorkflows(): Promise<void> {
    const { MarkdownWorkflowParser } = await import('./orchestrator/markdown-workflow-parser');
    const workflows = MarkdownWorkflowParser.listWorkflows();

    console.log('\n📋 Available Workflows:\n');

    if (workflows.length === 0) {
      console.log('No workflows found.');
      console.log('\nCreate workflows in:');
      console.log('  - .claude/workflows/');
      console.log('  - ~/.claude/workflows/');
      console.log('  - templates/workflows/');
      return;
    }

    workflows.forEach(name => {
      console.log(`  /${name} [arguments]`);

      // Try to get description from workflow
      try {
        const workflowPath = MarkdownWorkflowParser.findWorkflow(name);
        if (workflowPath) {
          const content = require('fs').readFileSync(workflowPath, 'utf-8');
          const descMatch = content.match(/description:\s*(.+)/);
          if (descMatch) {
            console.log(`     ${descMatch[1]}`);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    });

    console.log('\nUsage:');
    console.log('  /workflow <name> <task>');
    console.log('  or directly: /<name> <task>');
    console.log('\nExample:');
    console.log('  /develop Erstelle einen Webshop');
    console.log('');
  }

  async cmdTools(): Promise<void> {
    const { globalToolRegistry } = await import('./orchestrator/tool-registry');
    const { formatToolStatus } = await import('./orchestrator/tool-checker');

    await globalToolRegistry.initialize();

    console.log('\n🔧 Tool Registry Status\n');

    const available = globalToolRegistry.getAvailableTools();
    const unavailable = globalToolRegistry.getUnavailableTools();

    if (available.length > 0) {
      console.log('Available Tools:');
      available.forEach(tool => {
        console.log(`  ${formatToolStatus(tool)}`);
        console.log(`     ${tool.usage}`);
      });
    }

    if (unavailable.length > 0) {
      console.log('\nUnavailable Tools:');
      unavailable.forEach(tool => {
        console.log(`  ${formatToolStatus(tool, false)}`);
        console.log(`     ${tool.usage}`);
      });
    }

    const status = globalToolRegistry.getStatus();
    console.log(`\nTotal: ${status.total} tools (${status.available} available, ${status.unavailable} unavailable)\n`);
  }

  async cmdHistory(query?: string): Promise<void> {
    if (!this.askStoreHandler) {
      return console.log('❌ History not available (requires Qdrant and enabled ask-store)');
    }

    console.log('\n📜 Prompt History\n');

    try {
      const results = query
        ? await this.askStoreHandler.searchPrompts(query, 10)
        : await this.askStoreHandler.getRecentPrompts(10);

      if (results.length === 0) {
        console.log('No prompts found.');
        return;
      }

      results.forEach((result, index) => {
        const timestamp = (result as any).timestamp || result.metadata?.timestamp || '';
        const date = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown';
        const command = result.metadata?.command || 'unknown';
        const file = result.metadata?.file || '';
        const similarity = (result as any).similarity ? ` (${((result as any).similarity * 100).toFixed(1)}% match)` : '';

        console.log(`${index + 1}. [${date}] ${command}${similarity}`);

        // Show preview (first 100 chars)
        const preview = result.text.length > 100
          ? result.text.substring(0, 100) + '...'
          : result.text;
        console.log(`   "${preview}"`);

        if (file) {
          console.log(`   File: ${file}`);
        }
        console.log('');
      });

      console.log(`Showing ${results.length} results`);
      if (query) {
        console.log(`Search query: "${query}"`);
      } else {
        console.log('(Most recent first)');
      }
      console.log('');
    } catch (error: any) {
      console.error(`❌ Error retrieving history: ${error.message}`);
    }
  }

  async cmdToken(arg: string): Promise<void> {
    const [subcommand, ...rest] = arg.split(' ');
    const provider = rest.join(' ');

    try {
      const { globalTokenManager } = await import('./auth/token-manager');
      await globalTokenManager.initialize();

      if (!subcommand || subcommand === 'list') {
        // List all saved tokens
        const tokens = globalTokenManager.listTokens();

        if (tokens.length === 0) {
          console.log('📋 No saved OAuth tokens');
          return;
        }

        console.log('\n📋 Saved OAuth Tokens:\n');
        tokens.forEach(token => {
          const status = token.expires_in === 'expired' ? '⚠️ ' : '✅';
          const expires = token.expires_in ? ` (expires in ${token.expires_in})` : '';
          const refresh = token.has_refresh ? ' [auto-refresh]' : '';
          console.log(`  ${status} ${token.provider}${expires}${refresh}`);
        });
        console.log('');
      } else if (subcommand === 'revoke') {
        if (!provider) {
          console.log('Usage: token revoke <provider>');
          return;
        }
        await globalTokenManager.revokeToken(provider);
      } else if (subcommand === 'clear') {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete all tokens?',
          default: false
        }]);

        if (confirm) {
          await globalTokenManager.clearAll();
        } else {
          console.log('Cancelled');
        }
      } else {
        console.log(`Token commands:
  token list              List all saved OAuth tokens
  token revoke <provider> Revoke and delete a specific token
  token clear             Delete all saved tokens`);
      }
    } catch (error: any) {
      console.error(`❌ Token error: ${error.message}`);
    }
  }

  /**
   * Analyze screenshot/image with vision model
   */
  async cmdScreenshot(arg: string): Promise<void> {
    if (!arg) {
      console.log(`Usage: /screenshot <image-path> [question]

Examples:
  /screenshot error.png
  /screenshot screenshot.png "What's wrong in this UI?"
  /ss ~/Desktop/bug.jpg "Analyze this error"

Supported formats: .png, .jpg, .jpeg, .gif, .webp, .bmp
Max size: 20MB
Requires: OPENAI_API_KEY environment variable
`);
      return;
    }

    try {
      // Parse argument: first part is path, rest is optional question
      const parts = arg.split(' ');
      const imagePath = parts[0];
      const question = parts.slice(1).join(' ') || undefined;

      // Load image handler and vision backend
      const { imageHandler } = await import('./utils/image-handler');
      const { VisionOpenAI } = await import('./backends/vision-openai');

      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        console.log(`❌ OpenAI API key required for vision models.

Please set OPENAI_API_KEY environment variable:
  export OPENAI_API_KEY=your-key-here

Or add to .env file:
  OPENAI_API_KEY=your-key-here
`);
        return;
      }

      // Validate image
      console.log(`📸 Loading image: ${imagePath}`);
      const validation = await imageHandler.validateImage(imagePath);

      if (!validation.valid) {
        console.log(`❌ ${validation.error}`);
        return;
      }

      // Initialize vision backend
      const vision = new VisionOpenAI();

      // Analyze screenshot
      console.log(`🔍 Analyzing with GPT-4 Vision...`);
      const response = await vision.analyzeScreenshot(imagePath, question);

      console.log(`\n💡 Analysis:\n`);
      console.log(response);
      console.log('');

      // Store in ask history if available
      if (this.askStoreHandler) {
        const prompt = question || 'Analyze screenshot';
        await this.askStoreHandler.storePrompt({
          agent: 'vision',
          text: `${prompt} [Image: ${imagePath}]`,
          timestamp: new Date(),
          metadata: {
            command: 'screenshot',
            file: imagePath,
          },
        });
      }
    } catch (error: any) {
      console.error(`❌ Screenshot analysis error: ${error.message}`);

      if (error.message.includes('API key')) {
        console.log(`\n💡 Tip: Make sure your OpenAI API key is valid and has access to GPT-4 Vision (gpt-4o model).`);
      }
    }
  }

  /**
   * /paste - Analyze image from clipboard
   */
  async cmdPaste(arg: string): Promise<void> {
    try {
      // Parse optional question from argument
      const question = arg || undefined;

      // Load image handler and vision backend
      const { imageHandler } = await import('./utils/image-handler');
      const { VisionOpenAI } = await import('./backends/vision-openai');

      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        console.log(`❌ OpenAI API key required for vision models.

Please set OPENAI_API_KEY environment variable:
  export OPENAI_API_KEY=your-key-here

Or add to .env file:
  OPENAI_API_KEY=your-key-here
`);
        return;
      }

      // Load image from clipboard
      console.log(`📋 Reading image from clipboard...`);
      const { image } = await imageHandler.loadImageFromClipboard(question);

      // Initialize vision backend
      const vision = new VisionOpenAI();

      // Analyze screenshot
      console.log(`🔍 Analyzing with GPT-4 Vision...`);
      const response = await vision.generate(question || 'What do you see in this image?', [image]);

      console.log(`\n💡 Analysis:\n`);
      console.log(response);
      console.log('');

      // Store in ask history if available
      if (this.askStoreHandler) {
        const prompt = question || 'Analyze clipboard image';
        await this.askStoreHandler.storePrompt({
          agent: 'vision',
          text: `${prompt} [From clipboard]`,
          timestamp: new Date(),
          metadata: {
            command: 'paste',
            source: 'clipboard',
          },
        });
      }
    } catch (error: any) {
      console.error(`❌ Clipboard analysis error: ${error.message}`);

      if (error.message.includes('Install')) {
        console.log(`\n💡 Setup required for clipboard support:`);
        console.log(error.message);
      } else if (error.message.includes('No image')) {
        console.log(`\n💡 Tip: Copy an image to your clipboard first (Cmd+C / Ctrl+C on an image).`);
      } else if (error.message.includes('API key')) {
        console.log(`\n💡 Tip: Make sure your OpenAI API key is valid and has access to GPT-4 Vision (gpt-4o model).`);
      }
    }
  }
}
