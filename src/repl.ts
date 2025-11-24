import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { getBackend, getBackendAuto } from './config';
import { streamToConsole } from './utils/stream';
import { highlightCode } from './utils/highlight';
import { runHost, runDocker } from './utils/run';
import { eventBus } from './orchestrator/event-system';
import { AskStoreHandler } from './orchestrator/ask-store-handler';
import { MemoryManager } from './memory/memory-manager';
import { ToolExecutor } from './utils/tool-executor';
import { CapabilityDetector } from './utils/capability-detector';
import { MCPDetector } from './mcp/mcp-detector';
import { MCPToolExecutor } from './mcp/mcp-client';
import { GUIController } from './gui/gui-controller';
import { ImageEditorAutomator } from './gui/app-automators/image-editor-automator';
import { MasterAgent, globalMasterAgent } from './orchestrator/master-agent';
import { FrontendAgent, BackendAgent, DevOpsAgent, DesignAgent, GeneralAgent } from './orchestrator/example-agents';
import { AgentCapability } from './orchestrator/worker-agent';
import { TaskDetector, globalTaskDetector } from './orchestrator/task-detector';
import { LearningCoordinator, globalLearningCoordinator } from './orchestrator/learning-coordinator';

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
  toolExecutor?: ToolExecutor;
  enableTools: boolean = false;
  mcpExecutor?: MCPToolExecutor;
  enableMcp: boolean = false;
  guiController?: GUIController;
  imageAutomator?: ImageEditorAutomator;
  enableGui: boolean = false;
  masterAgent?: MasterAgent;
  enableMultiAgent: boolean = false;

  constructor(backendName?: string, enableTools?: boolean, enableMcp?: boolean, enableGui?: boolean) {
    this.backendName = backendName;
    this.backend = getBackend(backendName);
    // Enable tools and GUI by default (can be disabled via flags or env vars)
    this.enableTools = enableTools ?? (process.env.ENABLE_AGENT_TOOLS !== 'false');
    this.enableMcp = enableMcp ?? (process.env.ENABLE_MCP === 'true'); // MCP remains optional (requires external servers)
    this.enableGui = enableGui ?? (process.env.ENABLE_GUI_CONTROL !== 'false');
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

  /**
   * Setup tool capabilities for agents
   */
  async setupToolCapabilities(): Promise<void> {
    if (!this.enableTools) {
      return;
    }

    console.log('\n🔍 Detecting system capabilities for agents...\n');

    const detector = new CapabilityDetector();

    // Check if permissions already exist
    const permissionsPath = path.join(process.cwd(), '.cacli-permissions.json');
    try {
      await detector.loadPermissions(permissionsPath);
      const permitted = detector.getPermittedCapabilities();

      if (permitted.length > 0) {
        console.log(`✅ Loaded ${permitted.length} tool permissions from file\n`);
        this.toolExecutor = new ToolExecutor(detector);
        return;
      }
    } catch {
      // No existing permissions, continue to detection
    }

    // Detect all available tools
    const capabilities = await detector.detectAll();

    // Request user permissions
    const permissions = await detector.requestPermissions(capabilities);

    if (permissions.size === 0) {
      console.log('⚠️  No tools permitted. Agents will work without system tools.\n');
      return;
    }

    // Save permissions for future use
    await detector.savePermissions(permissionsPath);
    console.log(`💾 Permissions saved to .cacli-permissions.json\n`);

    // Create tool executor with permissions
    this.toolExecutor = new ToolExecutor(detector);
    console.log(`✅ Agents can now use ${permissions.size} system tools\n`);
  }

  /**
   * Setup MCP capabilities for agents
   */
  async setupMCPCapabilities(): Promise<void> {
    if (!this.enableMcp) {
      return;
    }

    console.log('\n🔍 Scanning for MCP servers...\n');

    const detector = new MCPDetector();
    const servers = await detector.detectAll();

    if (servers.filter(s => s.available).length === 0) {
      console.log('⚠️  No MCP servers detected\n');
      console.log('💡 To use MCP:');
      console.log('   - Install VS Code MCP extension');
      console.log('   - Setup Obsidian MCP plugin');
      console.log('   - Configure custom servers in ~/.config/mcp/servers.json\n');
      return;
    }

    // Request user permissions
    const permissions = await detector.requestPermissions(servers);

    if (permissions.size === 0) {
      console.log('⚠️  No MCP servers permitted\n');
      return;
    }

    // Create MCP executor
    this.mcpExecutor = new MCPToolExecutor(servers, permissions);
    console.log(`✅ Connected to ${permissions.size} MCP server(s)\n`);
  }

  /**
   * Setup GUI control capabilities for agents
   */
  async setupGUICapabilities(): Promise<void> {
    if (!this.enableGui) {
      return;
    }

    console.log('\n⚠️  GUI CONTROL ENABLED\n');
    console.log('   This allows agents to control your mouse and keyboard!\n');
    console.log('   Agents can:');
    console.log('   - Move your mouse');
    console.log('   - Click buttons');
    console.log('   - Type text');
    console.log('   - Control applications (Photoshop, GIMP, etc.)\n');
    console.log('   ⚠️  Make sure you supervise the agent!');
    console.log('   ⚠️  Press Ctrl+C anytime to stop.\n');

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Continue with GUI control enabled?',
      default: false
    }]);

    if (!confirm) {
      console.log('❌ GUI control cancelled\n');
      this.enableGui = false;
      return;
    }

    this.guiController = new GUIController();
    this.imageAutomator = new ImageEditorAutomator('gimp'); // Default to GIMP

    console.log('✅ GUI control enabled\n');
    console.log('💡 Agents can now automate Photoshop, GIMP, Paint, Krita, etc.\n');
  }

  /**
   * Setup Multi-Agent system
   */
  async setupMultiAgent(): Promise<void> {
    // Prevent double initialization
    if (this.enableMultiAgent && this.masterAgent) {
      return;
    }

    this.enableMultiAgent = true;
    this.masterAgent = globalMasterAgent;

    // Check if agents already spawned (in global registry)
    if (this.masterAgent.listAgents().length > 0) {
      console.log('\n🤖 Multi-Agent System already initialized\n');
      return;
    }

    console.log('\n🤖 Multi-Agent System enabled\n');
    console.log('   Starting default worker agents with LLM backend...\n');

    // Spawn default agents with LLM backend for intelligent reasoning
    const frontendAgent = new FrontendAgent(this.backend);
    const backendAgent = new BackendAgent(this.backend);
    const devopsAgent = new DevOpsAgent(this.backend);
    const designAgent = new DesignAgent(this.backend);
    const generalAgent = new GeneralAgent(this.backend);

    this.masterAgent.spawnAgent(frontendAgent);
    this.masterAgent.spawnAgent(backendAgent);
    this.masterAgent.spawnAgent(devopsAgent);
    this.masterAgent.spawnAgent(designAgent);
    this.masterAgent.spawnAgent(generalAgent);

    console.log('✅ Multi-Agent system ready with 5 worker agents\n');
    console.log(`🧠 LLM Backend: ${this.backendName || process.env.MODEL_BACKEND || 'mock'}\n`);
    if (this.enableTools) {
      console.log('🛠️  System tools enabled (git, npm, curl, etc.)\n');
    }
    if (this.enableGui) {
      console.log('🎨 GUI control enabled (Photoshop, GIMP, etc.)\n');
    }
    console.log('💡 Just type your task - agents will use LLM for intelligent execution!\n');
  }

  async run(): Promise<void> {
    console.log(`🧠 cacli REPL (backend=${this.backendName || process.env.MODEL_BACKEND || 'mock'})`);
    console.log('Type "/help" for commands, or just start typing to ask questions');

    // Initialize ask-store handler
    await this.initializeAskStore();

    // Setup tool capabilities if enabled
    await this.setupToolCapabilities();

    // Setup MCP capabilities if enabled
    await this.setupMCPCapabilities();

    // Setup GUI control if enabled
    await this.setupGUICapabilities();

    // Setup Multi-Agent system if enabled
    await this.setupMultiAgent();

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
    } else if (verb === 'agenttools' || verb === 'at') {
      await this.cmdAgentTools();
    } else if (verb === 'history' || verb === 'hist') {
      await this.cmdHistory(arg);
    } else if (verb === 'learned') {
      await this.cmdLearned(arg);
    } else if (verb === 'stats' || verb === 'statistics') {
      await this.cmdStats();
    } else if (verb === 'share') {
      await this.cmdShare(arg);
    } else if (verb === 'import') {
      await this.cmdImport(arg);
    } else if (verb === 'export') {
      await this.cmdExport(arg);
    } else if (verb === 'load-knowledge') {
      await this.cmdLoadKnowledge(arg);
    } else if (verb === 'forget') {
      await this.cmdForget(arg);
    } else if (verb === 'agents') {
      await this.cmdAgents(arg);
    } else if (verb === 'task') {
      await this.cmdTask(arg);
    } else if (verb === 'broadcast') {
      await this.cmdBroadcast(arg);
    } else if (verb === 'agent-status') {
      await this.cmdAgentStatus();
    } else if (verb === 'reflect') {
      await this.cmdReflect();
    } else if (verb === 'insights') {
      await this.cmdInsights();
    } else if (verb === 'knowledge') {
      await this.cmdKnowledge(arg);
    } else if (verb === 'agent-stats') {
      await this.cmdAgentStats(arg);
    } else if (verb === 'auto-reflect') {
      await this.cmdAutoReflect(arg);
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
      const workflowPlan = await DynamicWorkflowGenerator.generateFromRequirements(input, requirements);

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
    const toolStatus = this.toolExecutor ? '✅ ENABLED' : '❌ disabled';
    const mcpStatus = this.mcpExecutor ? '✅ ENABLED' : '❌ disabled';
    const guiStatus = this.guiController ? '✅ ENABLED' : '❌ disabled';

    const hasAdvancedFeatures = this.toolExecutor || this.mcpExecutor || this.guiController;

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
${hasAdvancedFeatures ? `
  🚀 ADVANCED AGENT CAPABILITIES:
${this.toolExecutor ? `     🔧 System Tools: ${toolStatus}
        Agents can use curl, git, npm, etc. for real-time data
` : ''}${this.mcpExecutor ? `     🔌 MCP Integration: ${mcpStatus}
        Agents can use VS Code, Obsidian, and other MCP servers
` : ''}${this.guiController ? `     🖱️ GUI Control: ${guiStatus}
        Agents can control Photoshop, GIMP, and other applications
` : ''}
     Enable with: cacli --enable-tools --enable-mcp --enable-gui
` : ''}
📂 FILE OPERATIONS
  /load <file>      Load file into session (alias: /l)
  /save             Save last output to file (alias: /s)
  /run              Execute last output or loaded file (alias: /r)
  /improve <instr>  Improve loaded file (alias: /i)

🤖 AI INTERACTION
  /ask <prompt>     Explicit ask (alias: /a)
  /web on|off       Toggle web search (alias: /w)
  /webs <query>     Direct web search (alias: /ws)${this.toolExecutor ? '\n  /agenttools       Show available agent tools and permissions' : ''}

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
  /tools               Show available CLI tools (alias: /t)
  /history [query]     Search prompt history (alias: /hist)
  /learned [query]     Show learned knowledge from self-learning
  /stats               Show self-learning statistics and analytics
  /share <query>       Share learned knowledge to global memory (team sharing)
  /import <query>      Import learned knowledge from global memory
  /export [filename]   Export learned knowledge to JSON file
  /load-knowledge <f>  Load learned knowledge from JSON file
  /forget <query>      Delete learned knowledge by search query
  /token <cmd>         Manage OAuth tokens
  /clear               Clear screen (alias: /c)
  /help                Show this help (alias: /h)
  /exit                Quit (alias: /quit)

🤖 MULTI-AGENT SYSTEM
  /agents [list]       Show all active worker agents
  /task <description>  Delegate task to best available agent
  /broadcast <message> Send message to all agents
  /agent-status        Show multi-agent system status

🧠 COLLABORATIVE LEARNING & REFLECTION
  /reflect             Conduct reflection session (analyze agent experiences)
  /insights            Show recent learning insights from reflection sessions
  /knowledge <query>   Query collective knowledge from all agents
  /agent-stats [id]    Show agent learning statistics (all or specific)
  /auto-reflect <arg>  Enable/disable automatic reflection (on|off|<minutes>)

  Examples:
    /reflect                    - Analyze all agent experiences
    /knowledge "React hooks"    - Search what agents learned about React hooks
    /agent-stats               - Show collective statistics
    /auto-reflect on           - Enable automatic reflection every 30 min

💡 TIPS:
  • Workflows support arguments via $TASK and $1, $2, etc.
  • Drag & drop image files into terminal to get the path
  • Type "/workflows" to see all available templates
  • Agents learn from every task and share knowledge automatically
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
          toolsEnabled: !!this.toolExecutor,
          file: this.currentFile
        },
        timestamp: new Date()
      });
    }

    // INTELLIGENT AUTO-ROUTING: Check if this is a task that should be delegated
    if (this.enableMultiAgent && this.masterAgent) {
      const detection = globalTaskDetector.detect(prompt);

      if (detection.isTask && detection.confidence >= 0.6) {
        // This looks like a task - delegate to Master Agent automatically!
        console.log(`\n🎯 Task detected (${(detection.confidence * 100).toFixed(0)}% confidence)`);
        if (detection.reasoning) {
          console.log(`   Reason: ${detection.reasoning}`);
        }
        console.log(`   Routing to Multi-Agent System...\n`);

        const result = await this.masterAgent.executeTask(prompt);

        if (result.success && result.output) {
          console.log(`\n📦 Result:\n`);
          console.log(JSON.stringify(result.output, null, 2));
          console.log('');
        }
        return; // Task handled by agents
      } else if (detection.confidence >= 0.4) {
        // Borderline - inform user they can use /task if needed
        console.log(`\n💡 Tip: If this is a task, use /task for agent delegation (${(detection.confidence * 100).toFixed(0)}% task-like)`);
      }
    }

    // Not a task or Multi-Agent not available - use normal flow
    if (this.allowWeb) {
      console.log('⤴️ Asking model with web access...');
      const { runWebAgent } = await import('./tools/webagent');
      await runWebAgent(this.backend, prompt);
    } else if (this.toolExecutor) {
      // Agent with tool use
      await this.askWithTools(prompt);
    } else {
      console.log('⤴️ Asking model...');
      const onStream = (chunk: string) => process.stdout.write(chunk);
      const maybe = await this.backend.chat(prompt, onStream);
      if (maybe && typeof maybe === 'string') console.log(maybe);
      console.log('');
    }
  }

  /**
   * Ask with tool use capability (agentic mode)
   */
  private async askWithTools(prompt: string): Promise<void> {
    console.log('⤴️ Asking model with tool access...\n');

    // Build enhanced prompt with tool instructions
    let toolPrompt = ToolExecutor.buildToolUsePrompt();

    // Add MCP tools if available
    if (this.mcpExecutor) {
      const mcpTools = await this.mcpExecutor.getAllTools();
      if (mcpTools.length > 0) {
        toolPrompt += '\n' + MCPToolExecutor.buildMCPToolUsePrompt(mcpTools);
      }
    }

    // Add GUI tools if available
    if (this.guiController) {
      toolPrompt += '\n**GUI Control Tools:**\n\n';
      toolPrompt += 'You can control the GUI to automate applications:\n\n';
      toolPrompt += '- **launch_app**: Launch application\n';
      toolPrompt += '  Usage: [TOOL:gui:launch_app:{\"app\":\"gimp\"}]\n';
      toolPrompt += '- **create_image**: Create new image in image editor\n';
      toolPrompt += '  Usage: [TOOL:gui:create_image:{\"width\":800,\"height\":600}]\n';
      toolPrompt += '- **draw_rectangle**: Draw rectangle\n';
      toolPrompt += '  Usage: [TOOL:gui:draw_rectangle:{\"x\":100,\"y\":100,\"width\":200,\"height\":150,\"color\":\"#FF0000\"}]\n';
      toolPrompt += '- **draw_ellipse**: Draw ellipse\n';
      toolPrompt += '  Usage: [TOOL:gui:draw_ellipse:{\"x\":100,\"y\":100,\"width\":200,\"height\":150,\"color\":\"#00FF00\"}]\n';
      toolPrompt += '- **add_text**: Add text to image\n';
      toolPrompt += '  Usage: [TOOL:gui:add_text:{\"x\":100,\"y\":100,\"text\":\"Hello\",\"size\":48,\"color\":\"#000000\"}]\n';
      toolPrompt += '- **save_image**: Save image\n';
      toolPrompt += '  Usage: [TOOL:gui:save_image:{\"path\":\"/tmp/output.png\"}]\n';
      toolPrompt += '\nNote: GUI tools control your mouse and keyboard. Use responsibly!\n';
    }

    const enhancedPrompt = `${toolPrompt}

User question: ${prompt}

You can use the tools above to gather information, execute code, or perform tasks.
If you need real-time data, API information, or want to test code, use the appropriate tools.
Provide your answer based on tool results when available.`;

    // Check if we've learned this task before (self-learning)
    const learned = await this.checkLearnedKnowledge(prompt);
    if (learned && learned.similarity > 0.8) {
      const learnedAt = new Date(learned.metadata.learned_at).toLocaleString();
      console.log(`💡 I remember learning this before! (${(learned.similarity * 100).toFixed(1)}% match)\n`);
      console.log(`📅 Learned: ${learnedAt}\n`);
      console.log(`📚 Using saved knowledge:\n`);
      console.log(learned.text);
      console.log('\n');
      return;
    }

    // Agentic loop: LLM can use tools iteratively
    let iteration = 0;
    const maxIterations = 3;
    let currentPrompt = enhancedPrompt;

    // Track learning for self-learning feature
    let usedCurlWget = false;
    let tutorialUrl = '';
    let executedSteps: string[] = [];
    let allExecutionsSuccessful = true;

    while (iteration < maxIterations) {
      iteration++;

      // Get LLM response
      let response = '';
      const onStream = (chunk: string) => {
        response += chunk;
        process.stdout.write(chunk);
      };

      const maybe = await this.backend.chat(currentPrompt, onStream);
      if (maybe && typeof maybe === 'string') response = maybe;

      // Check for all types of tool calls
      const toolCalls = this.toolExecutor!.parseToolCalls(response);
      const mcpCalls = this.mcpExecutor?.parseMCPToolCall(response) || [];
      const guiCalls = this.parseGUIToolCalls(response);

      const totalCalls = toolCalls.length + mcpCalls.length + guiCalls.length;

      if (totalCalls === 0) {
        // No more tool calls - agent is done
        console.log('\n');
        break;
      }

      // Build feedback for next iteration
      let feedback = '\nTool execution results:\n\n';

      // Execute system tools
      if (toolCalls.length > 0) {
        console.log(`\n\n🔧 Executing ${toolCalls.length} system tool(s)...\n`);
        const toolResults = await this.toolExecutor!.executeToolCalls(response);

        for (const [key, result] of toolResults.entries()) {
          if (result.success) {
            feedback += `✅ ${key}:\n${result.output.substring(0, 1000)}\n\n`;

            // Track curl/wget for self-learning
            if (key.includes('curl') || key.includes('wget')) {
              usedCurlWget = true;
              // Try to extract URL from tool call
              const urlMatch = key.match(/https?:\/\/[^\s]+/);
              if (urlMatch && !tutorialUrl) {
                tutorialUrl = urlMatch[0];
              }
            }
          } else {
            feedback += `❌ ${key} failed: ${result.error}\n\n`;
          }
        }
      }

      // Execute MCP tools
      if (mcpCalls.length > 0) {
        console.log(`\n\n🔌 Executing ${mcpCalls.length} MCP tool(s)...\n`);
        for (const call of mcpCalls) {
          const result = await this.mcpExecutor!.executeMCPTool(
            call.server,
            call.tool,
            call.parameters
          );

          if (result.success) {
            feedback += `✅ [MCP] ${call.server}:${call.tool}:\n${JSON.stringify(result.output, null, 2).substring(0, 1000)}\n\n`;
          } else {
            feedback += `❌ [MCP] ${call.server}:${call.tool} failed: ${result.error}\n\n`;
          }
        }
      }

      // Execute GUI tools
      if (guiCalls.length > 0) {
        console.log(`\n\n🖱️ Executing ${guiCalls.length} GUI tool(s)...\n`);
        for (const call of guiCalls) {
          try {
            const result = await this.executeGUITool(call.action, call.parameters);
            feedback += `✅ [GUI] ${call.action}: ${result}\n\n`;

            // Track GUI steps for self-learning (only successful ones)
            executedSteps.push(`${call.action}: ${JSON.stringify(call.parameters)}`);
          } catch (error: any) {
            feedback += `❌ [GUI] ${call.action} failed: ${error.message}\n\n`;
            allExecutionsSuccessful = false; // Mark as failed
          }
        }

        // Save learned knowledge only if ALL executions were successful
        if (usedCurlWget && executedSteps.length > 0 && allExecutionsSuccessful) {
          const stepsText = executedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');

          // Ask user for confirmation before saving (unless disabled)
          const autoSave = process.env.SELF_LEARNING_AUTO_SAVE === 'true';

          if (autoSave) {
            await this.saveLearnedKnowledge(prompt, tutorialUrl || 'unknown', stepsText);
          } else {
            console.log('\n💡 I successfully learned this task!');
            console.log(`   Tutorial: ${tutorialUrl || 'unknown'}`);
            console.log(`   Steps executed: ${executedSteps.length}`);

            const { shouldSave } = await inquirer.prompt([{
              type: 'confirm',
              name: 'shouldSave',
              message: 'Save this knowledge for future use?',
              default: true
            }]);

            if (shouldSave) {
              await this.saveLearnedKnowledge(prompt, tutorialUrl || 'unknown', stepsText);
            } else {
              console.log('⏭️  Knowledge not saved\n');
            }
          }
        } else if (usedCurlWget && executedSteps.length > 0 && !allExecutionsSuccessful) {
          console.log(`⚠️  Learning not saved: Some GUI operations failed\n`);
        }
      }

      feedback += '\nBased on these tool results, please provide your final answer to the user.\n';

      // Continue conversation with tool results
      currentPrompt = feedback;
      console.log('\n💭 Agent processing results...\n');
    }

    if (iteration >= maxIterations) {
      console.log('\n⚠️  Maximum iterations reached\n');
    }
  }

  /**
   * Parse GUI tool calls from response
   */
  private parseGUIToolCalls(response: string): Array<{action: string; parameters: any}> {
    const guiCallRegex = /\[TOOL:gui:(\w+):({[^}]+})\]/g;
    const calls: Array<{action: string; parameters: any}> = [];

    let match;
    while ((match = guiCallRegex.exec(response)) !== null) {
      try {
        const parameters = JSON.parse(match[2]);
        calls.push({
          action: match[1],
          parameters
        });
      } catch (error) {
        console.error(`Failed to parse GUI tool call parameters: ${match[2]}`);
      }
    }

    return calls;
  }

  /**
   * Execute GUI tool
   */
  private async executeGUITool(action: string, params: any): Promise<string> {
    if (!this.guiController || !this.imageAutomator) {
      throw new Error('GUI control not enabled');
    }

    switch (action) {
      case 'launch_app':
        await this.guiController.launchApp(params.app);
        return `Launched ${params.app}`;

      case 'create_image':
        await this.imageAutomator.createNewImage(params.width, params.height);
        return `Created ${params.width}x${params.height} image`;

      case 'draw_rectangle':
        await this.imageAutomator.drawRectangle(
          params.x, params.y, params.width, params.height, params.color
        );
        return `Drew rectangle at (${params.x},${params.y})`;

      case 'draw_ellipse':
        await this.imageAutomator.drawEllipse(
          params.x, params.y, params.width, params.height, params.color
        );
        return `Drew ellipse at (${params.x},${params.y})`;

      case 'add_text':
        await this.imageAutomator.addText(
          params.x, params.y, params.text, params.size, params.color
        );
        return `Added text "${params.text}" at (${params.x},${params.y})`;

      case 'save_image':
        await this.imageAutomator.saveImage(params.path);
        return `Saved image to ${params.path}`;

      case 'move_mouse':
        await this.guiController.moveMouse(params.x, params.y);
        return `Moved mouse to (${params.x},${params.y})`;

      case 'click':
        await this.guiController.click(params.button || 'left');
        return `Clicked ${params.button || 'left'} button`;

      case 'type':
        await this.guiController.type(params.text);
        return `Typed: ${params.text}`;

      default:
        throw new Error(`Unknown GUI action: ${action}`);
    }
  }

  /**
   * Check if we've learned this task before (semantic search)
   */
  private async checkLearnedKnowledge(query: string): Promise<{
    id: string;
    text: string;
    similarity: number;
    metadata: any;
  } | null> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      return null;
    }

    try {
      // Search for similar learned tasks
      const results = await this.askStoreHandler.searchPrompts(query, 5);

      // Configurable similarity threshold (default 0.8 = 80%)
      const threshold = parseFloat(
        process.env.SELF_LEARNING_SIMILARITY_THRESHOLD || '0.8'
      );

      // Filter only learned tasks with high similarity
      const learned = results.find(r =>
        r.metadata?.type === 'learned_task' &&
        r.similarity > threshold
      );

      return learned || null;
    } catch (error: any) {
      console.error(`❌ Failed to check learned knowledge: ${error.message}`);
      return null;
    }
  }

  /**
   * Save learned knowledge to long-term memory
   */
  private async saveLearnedKnowledge(
    task: string,
    tutorialUrl: string,
    steps: string
  ): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      return;
    }

    try {
      const learningEntry = `Task: ${task}

Tutorial: ${tutorialUrl}

Steps learned:
${steps}`;

      await this.askStoreHandler.storePrompt({
        agent: 'self-learning',
        text: learningEntry,
        timestamp: new Date(),
        metadata: {
          type: 'learned_task',
          task: task,
          tutorialUrl: tutorialUrl,
          learned_at: new Date().toISOString(),
          source: 'emergent_self_learning'
        }
      });

      console.log(`💡 Knowledge saved for future use!\n`);
    } catch (error: any) {
      console.error(`❌ Failed to save learned knowledge: ${error.message}`);
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

  /**
   * Show agent tools status and permissions
   */
  async cmdAgentTools(): Promise<void> {
    if (!this.toolExecutor) {
      console.log('\n❌ Agent tools not enabled\n');
      console.log('To enable agent tools:');
      console.log('  1. Start REPL with --enable-tools flag:');
      console.log('     cacli --enable-tools\n');
      console.log('  2. Or set environment variable:');
      console.log('     export ENABLE_AGENT_TOOLS=true\n');
      console.log('  3. Or run: cacli capabilities grant\n');
      return;
    }

    console.log('\n🤖 Agent Tools Status\n');

    const tools = this.toolExecutor.getAvailableTools();

    console.log('Available Tools:');
    tools.forEach(tool => {
      console.log(`  ✅ ${tool.name} - ${tool.description}`);
    });

    console.log(`\nTotal: ${tools.length} tools available for agents\n`);

    console.log('📋 Permission File: .cacli-permissions.json');
    console.log('\nManage permissions:');
    console.log('  cacli capabilities scan    - Scan system');
    console.log('  cacli capabilities grant   - Grant permissions');
    console.log('  cacli capabilities list    - List permissions');
    console.log('  cacli capabilities revoke  - Revoke all\n');
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

  /**
   * Show learned knowledge from self-learning
   */
  async cmdLearned(query?: string): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Self-learning not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable self-learning:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    console.log('\n📚 Learned Knowledge\n');

    try {
      // Search all prompts, then filter for learned tasks
      const allResults = query
        ? await this.askStoreHandler.searchPrompts(query, 50)
        : await this.askStoreHandler.searchPrompts('', 50);

      // Filter only learned tasks
      const learnedTasks = allResults.filter(r => r.metadata?.type === 'learned_task');

      if (learnedTasks.length === 0) {
        console.log('No learned tasks yet.');
        console.log('\n💡 Tasks are learned automatically when you:');
        console.log('   1. Use curl/wget to fetch tutorials');
        console.log('   2. Use GUI tools to execute steps');
        console.log('\nExample: "Create a watermark in GIMP"\n');
        return;
      }

      learnedTasks.forEach((task, index) => {
        const learnedAt = task.metadata?.learned_at
          ? new Date(task.metadata.learned_at).toLocaleString()
          : 'Unknown';
        const tutorialUrl = task.metadata?.tutorialUrl || 'unknown';
        const taskName = task.metadata?.task || 'Unnamed task';
        const similarity = (task as any).similarity
          ? ` (${((task as any).similarity * 100).toFixed(1)}% match)`
          : '';

        console.log(`${index + 1}. ${taskName}${similarity}`);
        console.log(`   📅 Learned: ${learnedAt}`);
        console.log(`   🔗 Tutorial: ${tutorialUrl}`);

        // Show preview of steps
        const steps = task.text.split('Steps learned:')[1];
        if (steps) {
          const firstSteps = steps.split('\n').slice(0, 3).join('\n');
          console.log(`   📝 Steps:${firstSteps}${steps.split('\n').length > 3 ? '\n      ...' : ''}`);
        }
        console.log('');
      });

      console.log(`Showing ${learnedTasks.length} learned task(s)`);
      if (query) {
        console.log(`Search query: "${query}"`);
      }
      console.log('\n💡 Tip: Use similar queries to reuse this knowledge automatically!\n');
    } catch (error: any) {
      console.error(`❌ Error retrieving learned knowledge: ${error.message}`);
    }
  }

  /**
   * Show learning statistics
   */
  async cmdStats(): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Statistics not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable statistics:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    console.log('\n📊 Self-Learning Statistics\n');

    try {
      // Get all learned tasks
      const allResults = await this.askStoreHandler.searchPrompts('', 1000);
      const learnedTasks = allResults.filter(r => r.metadata?.type === 'learned_task');

      if (learnedTasks.length === 0) {
        console.log('No learned tasks yet.\n');
        return;
      }

      // Calculate statistics
      const totalTasks = learnedTasks.length;

      // Extract timestamps
      const timestamps = learnedTasks
        .map(t => t.metadata?.learned_at ? new Date(t.metadata.learned_at).getTime() : 0)
        .filter(t => t > 0)
        .sort((a, b) => a - b);

      const oldestDate = timestamps.length > 0 ? new Date(timestamps[0]).toLocaleString() : 'Unknown';
      const newestDate = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toLocaleString() : 'Unknown';

      // Count tutorial sources
      const sources: Record<string, number> = {};
      learnedTasks.forEach(task => {
        const url = task.metadata?.tutorialUrl || 'unknown';
        try {
          const domain = url !== 'unknown' ? new URL(url).hostname : 'unknown';
          sources[domain] = (sources[domain] || 0) + 1;
        } catch {
          sources['unknown'] = (sources['unknown'] || 0) + 1;
        }
      });

      // Sort sources by count
      const sortedSources = Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Calculate average tasks per week (if we have date range)
      let tasksPerWeek = 0;
      if (timestamps.length > 1) {
        const daysDiff = (timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24);
        const weeksDiff = Math.max(daysDiff / 7, 1);
        tasksPerWeek = totalTasks / weeksDiff;
      }

      // Display statistics
      console.log(`📈 Overview:`);
      console.log(`   Total learned tasks: ${totalTasks}`);
      console.log(`   First learned: ${oldestDate}`);
      console.log(`   Most recent: ${newestDate}`);
      if (tasksPerWeek > 0) {
        console.log(`   Average: ${tasksPerWeek.toFixed(1)} tasks/week`);
      }
      console.log('');

      console.log(`🔗 Top Tutorial Sources:`);
      sortedSources.forEach(([domain, count], index) => {
        const percentage = ((count / totalTasks) * 100).toFixed(1);
        console.log(`   ${index + 1}. ${domain} - ${count} tasks (${percentage}%)`);
      });
      console.log('');

      // Recent activity (last 7 days, 30 days)
      const now = Date.now();
      const last7Days = timestamps.filter(t => (now - t) < 7 * 24 * 60 * 60 * 1000).length;
      const last30Days = timestamps.filter(t => (now - t) < 30 * 24 * 60 * 60 * 1000).length;

      console.log(`🕐 Recent Activity:`);
      console.log(`   Last 7 days: ${last7Days} tasks`);
      console.log(`   Last 30 days: ${last30Days} tasks`);
      console.log('');

      console.log(`💡 Use /learned to view all tasks or /forget to delete tasks\n`);
    } catch (error: any) {
      console.error(`❌ Error calculating statistics: ${error.message}`);
    }
  }

  /**
   * Share learned knowledge to global memory (cross-project)
   */
  async cmdShare(query?: string): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Sharing not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable sharing:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    if (!query) {
      console.log('❌ Usage: /share <search query>');
      console.log('\nExample: /share watermark');
      console.log('         /share GIMP tutorial\n');
      console.log('💡 This shares learned knowledge to global memory,');
      console.log('   making it available across all projects.\n');
      return;
    }

    console.log(`\n🔍 Searching for learned tasks matching "${query}"...\n`);

    try {
      // Search for learned tasks matching the query
      const results = await this.askStoreHandler.searchPrompts(query, 10);
      const learnedTasks = results.filter(r => r.metadata?.type === 'learned_task');

      if (learnedTasks.length === 0) {
        console.log('No learned tasks found matching your query.\n');
        return;
      }

      // Show matching tasks
      console.log('Found the following learned tasks:\n');
      learnedTasks.forEach((task, index) => {
        const taskName = task.metadata?.task || 'Unnamed task';
        const learnedAt = task.metadata?.learned_at
          ? new Date(task.metadata.learned_at).toLocaleString()
          : 'Unknown';
        const similarity = (task as any).similarity
          ? ` (${((task as any).similarity * 100).toFixed(1)}% match)`
          : '';

        console.log(`${index + 1}. ${taskName}${similarity}`);
        console.log(`   📅 Learned: ${learnedAt}`);
        console.log(`   🆔 ID: ${task.id.substring(0, 12)}...`);
        console.log('');
      });

      // Ask for confirmation
      const { shouldShare } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldShare',
          message: `Share ${learnedTasks.length} task(s) to global memory?`,
          default: true
        }
      ]);

      if (!shouldShare) {
        console.log('⏭️  No tasks shared\n');
        return;
      }

      // Share tasks
      let shared = 0;
      for (const task of learnedTasks) {
        try {
          await this.askStoreHandler.shareToGlobal(task.id);
          shared++;
        } catch (error: any) {
          console.error(`❌ Failed to share task ${task.id.substring(0, 8)}...: ${error.message}`);
        }
      }

      console.log(`\n✅ Successfully shared ${shared} of ${learnedTasks.length} task(s) to global memory`);
      console.log(`💡 Other projects can now import this knowledge with /import\n`);
    } catch (error: any) {
      console.error(`❌ Error sharing knowledge: ${error.message}`);
    }
  }

  /**
   * Import learned knowledge from global memory
   */
  async cmdImport(query?: string): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Import not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable import:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    if (!query) {
      console.log('❌ Usage: /import <search query>');
      console.log('\nExample: /import watermark');
      console.log('         /import GIMP tutorial\n');
      console.log('💡 This imports learned knowledge from global memory,');
      console.log('   shared by other projects or team members.\n');
      return;
    }

    console.log(`\n🔍 Searching global memory for "${query}"...\n`);

    try {
      // Search global memory
      const results = await this.askStoreHandler.importFromGlobal(query, 10);
      const learnedTasks = results.filter(r => r.metadata?.type === 'learned_task');

      if (learnedTasks.length === 0) {
        console.log('No learned tasks found in global memory.\n');
        console.log('💡 Use /share to add knowledge to global memory first.\n');
        return;
      }

      // Show matching tasks
      console.log('Found the following tasks in global memory:\n');
      learnedTasks.forEach((task, index) => {
        const taskName = task.metadata?.task || 'Unnamed task';
        const sharedAt = task.metadata?.shared_at
          ? new Date(task.metadata.shared_at).toLocaleString()
          : 'Unknown';
        const sharedFrom = task.metadata?.shared_from_project || 'unknown project';
        const similarity = (task as any).similarity
          ? ` (${((task as any).similarity * 100).toFixed(1)}% match)`
          : '';

        console.log(`${index + 1}. ${taskName}${similarity}`);
        console.log(`   📅 Shared: ${sharedAt}`);
        console.log(`   📦 From: ${sharedFrom}`);
        console.log(`   🆔 ID: ${task.id.substring(0, 12)}...`);
        console.log('');
      });

      // Ask for confirmation
      const { shouldImport } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldImport',
          message: `Import ${learnedTasks.length} task(s) to this project?`,
          default: true
        }
      ]);

      if (!shouldImport) {
        console.log('⏭️  No tasks imported\n');
        return;
      }

      // Import tasks (store them in local long-term memory)
      let imported = 0;
      for (const task of learnedTasks) {
        try {
          await this.askStoreHandler.storePrompt({
            agent: 'self-learning',
            text: task.text,
            timestamp: new Date(),
            metadata: {
              ...task.metadata,
              imported_at: new Date().toISOString(),
              imported_from: 'global_memory'
            }
          });
          imported++;
        } catch (error: any) {
          console.error(`❌ Failed to import task: ${error.message}`);
        }
      }

      console.log(`\n✅ Successfully imported ${imported} of ${learnedTasks.length} task(s)`);
      console.log(`💡 Use /learned to view your imported knowledge\n`);
    } catch (error: any) {
      console.error(`❌ Error importing knowledge: ${error.message}`);
    }
  }

  /**
   * Export learned knowledge to JSON file
   */
  async cmdExport(filename?: string): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Export not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable export:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    const outputFile = filename || `learned-knowledge-${Date.now()}.json`;

    console.log('\n📤 Exporting learned knowledge...\n');

    try {
      // Get all learned tasks
      const allResults = await this.askStoreHandler.searchPrompts('', 1000);
      const learnedTasks = allResults.filter(r => r.metadata?.type === 'learned_task');

      if (learnedTasks.length === 0) {
        console.log('No learned tasks to export.\n');
        return;
      }

      // Prepare export data
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_tasks: learnedTasks.length,
        tasks: learnedTasks.map(task => ({
          id: task.id,
          text: task.text,
          metadata: task.metadata
        }))
      };

      // Write to file
      const fs = await import('fs/promises');
      await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2), 'utf-8');

      console.log(`✅ Successfully exported ${learnedTasks.length} task(s)`);
      console.log(`📁 File: ${outputFile}`);
      console.log(`📊 Size: ${(JSON.stringify(exportData).length / 1024).toFixed(2)} KB\n`);
      console.log(`💡 Use /load-knowledge ${outputFile} to import this file\n`);
    } catch (error: any) {
      console.error(`❌ Error exporting knowledge: ${error.message}`);
    }
  }

  /**
   * Load learned knowledge from JSON file
   */
  async cmdLoadKnowledge(filename?: string): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Load not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable load:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    if (!filename) {
      console.log('❌ Usage: /load-knowledge <filename>');
      console.log('\nExample: /load-knowledge learned-knowledge-1234567890.json\n');
      return;
    }

    console.log(`\n📥 Loading learned knowledge from ${filename}...\n`);

    try {
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(filename, 'utf-8');
      const importData = JSON.parse(fileContent);

      // Validate format
      if (!importData.version || !importData.tasks || !Array.isArray(importData.tasks)) {
        throw new Error('Invalid export file format');
      }

      console.log(`📊 File info:`);
      console.log(`   Version: ${importData.version}`);
      console.log(`   Exported: ${importData.exported_at ? new Date(importData.exported_at).toLocaleString() : 'Unknown'}`);
      console.log(`   Total tasks: ${importData.total_tasks}`);
      console.log('');

      // Ask for confirmation
      const { shouldLoad } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldLoad',
          message: `Load ${importData.tasks.length} task(s) from file?`,
          default: true
        }
      ]);

      if (!shouldLoad) {
        console.log('⏭️  No tasks loaded\n');
        return;
      }

      // Load tasks
      let loaded = 0;
      for (const task of importData.tasks) {
        try {
          await this.askStoreHandler.storePrompt({
            agent: 'self-learning',
            text: task.text,
            timestamp: new Date(),
            metadata: {
              ...task.metadata,
              imported_at: new Date().toISOString(),
              imported_from: 'file'
            }
          });
          loaded++;
        } catch (error: any) {
          console.error(`❌ Failed to load task: ${error.message}`);
        }
      }

      console.log(`\n✅ Successfully loaded ${loaded} of ${importData.tasks.length} task(s)`);
      console.log(`💡 Use /learned to view your loaded knowledge\n`);
    } catch (error: any) {
      if ((error as any).code === 'ENOENT') {
        console.error(`❌ File not found: ${filename}`);
      } else if (error instanceof SyntaxError) {
        console.error(`❌ Invalid JSON file: ${error.message}`);
      } else {
        console.error(`❌ Error loading knowledge: ${error.message}`);
      }
      console.log('');
    }
  }

  /**
   * Forget/delete learned knowledge
   */
  async cmdForget(query?: string): Promise<void> {
    if (!this.askStoreHandler || !this.askStoreHandler.isEnabled()) {
      console.log('❌ Self-learning not available (requires Qdrant and --enable-tools --enable-gui)');
      console.log('\n💡 To enable self-learning:');
      console.log('   1. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      console.log('   2. Run: cacli --enable-tools --enable-gui\n');
      return;
    }

    if (!query) {
      console.log('❌ Usage: /forget <search query>');
      console.log('\nExample: /forget watermark');
      console.log('         /forget GIMP tutorial\n');
      return;
    }

    console.log(`\n🔍 Searching for learned tasks matching "${query}"...\n`);

    try {
      // Search for learned tasks matching the query
      const results = await this.askStoreHandler.searchPrompts(query, 10);
      const learnedTasks = results.filter(r => r.metadata?.type === 'learned_task');

      if (learnedTasks.length === 0) {
        console.log('No learned tasks found matching your query.\n');
        return;
      }

      // Show matching tasks
      console.log('Found the following learned tasks:\n');
      learnedTasks.forEach((task, index) => {
        const taskName = task.metadata?.task || 'Unnamed task';
        const learnedAt = task.metadata?.learned_at
          ? new Date(task.metadata.learned_at).toLocaleString()
          : 'Unknown';
        const similarity = (task as any).similarity
          ? ` (${((task as any).similarity * 100).toFixed(1)}% match)`
          : '';

        console.log(`${index + 1}. ${taskName}${similarity}`);
        console.log(`   📅 Learned: ${learnedAt}`);
        console.log(`   🆔 ID: ${task.id.substring(0, 12)}...`);
        console.log('');
      });

      // Ask for confirmation
      const { shouldDelete } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldDelete',
          message: `Delete ${learnedTasks.length} learned task(s)?`,
          default: false
        }
      ]);

      if (!shouldDelete) {
        console.log('⏭️  No tasks deleted\n');
        return;
      }

      // Delete tasks
      let deleted = 0;
      for (const task of learnedTasks) {
        try {
          await this.askStoreHandler.deletePrompt(task.id);
          deleted++;
        } catch (error: any) {
          console.error(`❌ Failed to delete task ${task.id.substring(0, 8)}...: ${error.message}`);
        }
      }

      console.log(`\n✅ Successfully deleted ${deleted} of ${learnedTasks.length} task(s)\n`);
    } catch (error: any) {
      console.error(`❌ Error deleting learned knowledge: ${error.message}`);
    }
  }

  /**
   * Manage agents (list, spawn, kill)
   */
  async cmdAgents(arg?: string): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      console.log('\n💡 Multi-Agent requires tools or GUI to be enabled');
      console.log('   Run: cacli --enable-tools or cacli --enable-gui\n');
      return;
    }

    const [subcommand, ...rest] = (arg || '').split(' ');

    if (!subcommand || subcommand === 'list') {
      const agents = this.masterAgent.listAgents();

      if (agents.length === 0) {
        console.log('\n📋 No agents running\n');
        return;
      }

      console.log('\n🤖 Active Agents:\n');
      agents.forEach((agent, index) => {
        const statusIcon = {
          idle: '💤',
          busy: '⚙️',
          error: '❌',
          stopped: '🔴'
        }[agent.status];

        console.log(`${index + 1}. ${agent.name} (${agent.id})`);
        console.log(`   Status: ${statusIcon} ${agent.status}`);
        console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);
        if (agent.currentTask) {
          console.log(`   Current Task: ${agent.currentTask}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Unknown subcommand. Use /agents list\n');
    }
  }

  /**
   * Delegate task to agents via Master Agent
   */
  async cmdTask(task?: string): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      console.log('\n💡 Multi-Agent requires tools or GUI to be enabled');
      console.log('   Run: cacli --enable-tools or cacli --enable-gui\n');
      return;
    }

    if (!task) {
      console.log('❌ Usage: /task <task description>');
      console.log('\nExample: /task Create a React component for user login');
      console.log('         /task Setup FastAPI with PostgreSQL\n');
      return;
    }

    const result = await this.masterAgent.executeTask(task);

    if (result.success && result.output) {
      console.log(`\n📦 Output:\n`);
      console.log(JSON.stringify(result.output, null, 2));
      console.log('');
    }
  }

  /**
   * Broadcast message to all agents
   */
  async cmdBroadcast(message?: string): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      console.log('\n💡 Multi-Agent requires tools or GUI to be enabled');
      console.log('   Run: cacli --enable-tools or cacli --enable-gui\n');
      return;
    }

    if (!message) {
      console.log('❌ Usage: /broadcast <message>');
      console.log('\nExample: /broadcast Status check - how are you all doing?\n');
      return;
    }

    this.masterAgent.broadcast(message);
  }

  /**
   * Show agent system status
   */
  async cmdAgentStatus(): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      console.log('\n💡 Multi-Agent requires tools or GUI to be enabled');
      console.log('   Run: cacli --enable-tools or cacli --enable-gui\n');
      return;
    }

    const status = this.masterAgent.getStatus();

    console.log('\n📊 Multi-Agent System Status\n');
    console.log(`🤖 Total Agents: ${status.totalAgents}`);
    console.log(`   💤 Idle: ${status.idleAgents}`);
    console.log(`   ⚙️  Busy: ${status.busyAgents}`);
    console.log('');
    console.log(`🎯 Available Capabilities:`);
    status.capabilities.forEach(cap => {
      console.log(`   - ${cap}`);
    });
    console.log('');
    console.log(`📝 Task History: ${status.taskHistory} tasks completed`);
    console.log(`📨 Messages: ${status.messageStats.totalMessages} total`);
    console.log('');
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

Backend support:
  - Ollama: Use vision models like 'llava' or 'bakllava'
  - OpenAI: Automatically uses gpt-4o (requires OPENAI_API_KEY)
  - Current backend: ${this.backendName}
  - Vision support: ${this.backend.supportsVision() ? '✅ Yes' : '❌ No'}
`);
      return;
    }

    try {
      // Check if current backend supports vision
      if (!this.backend.supportsVision()) {
        console.log(`❌ Current backend (${this.backendName}) does not support vision.

To use vision features:
  1. Switch to OpenAI: cacli -b openai (requires OPENAI_API_KEY)
  2. Or use Ollama with vision model: OLLAMA_MODEL=llava cacli -b ollama
  3. Or switch backend: /help for more info
`);
        return;
      }

      // Parse argument: first part is path, rest is optional question
      const parts = arg.split(' ');
      const imagePath = parts[0];
      const question = parts.slice(1).join(' ') || 'What do you see in this image? Describe it in detail.';

      // Load image handler
      const { imageHandler } = await import('./utils/image-handler');

      // Validate image
      console.log(`📸 Loading image: ${imagePath}`);
      const validation = await imageHandler.validateImage(imagePath);

      if (!validation.valid) {
        console.log(`❌ ${validation.error}`);
        return;
      }

      // Load the image
      const image = await imageHandler.loadImage(imagePath);

      // Analyze with current backend
      console.log(`🔍 Analyzing with ${this.backendName} vision model...`);

      let response = '';
      const onStream = (chunk: string) => {
        response += chunk;
        process.stdout.write(chunk);
      };

      console.log(`\n💡 Analysis:\n`);
      await this.backend.analyzeImage(question, [image], onStream);
      console.log('\n');

      // Store in ask history if available
      if (this.askStoreHandler) {
        await this.askStoreHandler.storePrompt({
          agent: 'vision',
          text: `${question} [Image: ${imagePath}]`,
          timestamp: new Date(),
          metadata: {
            command: 'screenshot',
            file: imagePath,
            backend: this.backendName,
          },
        });
      }
    } catch (error: any) {
      console.error(`❌ Screenshot analysis error: ${error.message}`);

      if (error.message.includes('API key')) {
        console.log(`\n💡 Tip: Make sure your API key is set and valid.`);
      } else if (error.message.includes('vision')) {
        console.log(`\n💡 Tip: Switch to a vision-capable model or backend.`);
      }
    }
  }

  /**
   * /paste - Analyze image from clipboard
   */
  async cmdPaste(arg: string): Promise<void> {
    try {
      // Check if current backend supports vision
      if (!this.backend.supportsVision()) {
        console.log(`❌ Current backend (${this.backendName}) does not support vision.

To use vision features:
  1. Switch to OpenAI: cacli -b openai (requires OPENAI_API_KEY)
  2. Or use Ollama with vision model: OLLAMA_MODEL=llava cacli -b ollama
  3. Or switch backend: /help for more info
`);
        return;
      }

      // Parse optional question from argument
      const question = arg || 'What do you see in this image?';

      // Load image handler
      const { imageHandler } = await import('./utils/image-handler');

      // Load image from clipboard
      console.log(`📋 Reading image from clipboard...`);
      const { image } = await imageHandler.loadImageFromClipboard(question);

      // Analyze with current backend
      console.log(`🔍 Analyzing with ${this.backendName} vision model...`);

      let response = '';
      const onStream = (chunk: string) => {
        response += chunk;
        process.stdout.write(chunk);
      };

      console.log(`\n💡 Analysis:\n`);
      await this.backend.analyzeImage(question, [image], onStream);
      console.log('\n');

      // Store in ask history if available
      if (this.askStoreHandler) {
        await this.askStoreHandler.storePrompt({
          agent: 'vision',
          text: `${question} [From clipboard]`,
          timestamp: new Date(),
          metadata: {
            command: 'paste',
            source: 'clipboard',
            backend: this.backendName,
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
        console.log(`\n💡 Tip: Make sure your API key is set and valid.`);
      } else if (error.message.includes('vision')) {
        console.log(`\n💡 Tip: Switch to a vision-capable model or backend.`);
      }
    }
  }

  /**
   * /reflect - Conduct reflection session
   */
  async cmdReflect(): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      return;
    }

    console.log('\n🧠 Conducting reflection session...\n');

    const result = await globalLearningCoordinator.conductReflectionSession();

    // Show summary
    console.log(result.summary);

    // Show patterns
    if (result.patterns.length > 0) {
      console.log('\n📊 Identified Patterns:\n');
      for (const pattern of result.patterns.slice(0, 5)) {
        const icon = {
          success: '✅',
          failure: '❌',
          insight: '💡',
          optimization: '⚡'
        }[pattern.category];
        console.log(`${icon} ${pattern.pattern}`);
        console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(0)}%`);
        console.log(`   Recommendation: ${pattern.recommendation}\n`);
      }
    }

    // Show insights
    if (result.insights.length > 0) {
      console.log('💭 Key Insights:\n');
      for (const insight of result.insights) {
        console.log(`• ${insight.insight}`);
        if (insight.recommendation) {
          console.log(`  → ${insight.recommendation}`);
        }
        console.log('');
      }
    }

    // Show recommendations
    if (result.recommendations.length > 0) {
      console.log('🎯 Recommendations:\n');
      for (const rec of result.recommendations) {
        console.log(`  ${rec}\n`);
      }
    }
  }

  /**
   * /insights - Show recent learning insights
   */
  async cmdInsights(): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      return;
    }

    const sessions = globalLearningCoordinator.getRecentSessions(3);

    if (sessions.length === 0) {
      console.log('\n💭 No reflection sessions yet');
      console.log('   Use /reflect to conduct a reflection session\n');
      return;
    }

    console.log('\n💭 Recent Learning Insights:\n');

    for (const session of sessions) {
      console.log(`📅 ${session.timestamp.toLocaleString()}`);
      console.log(`   Agents: ${session.participatingAgents.length}`);
      console.log(`   Experiences: ${session.experiencesAnalyzed}`);
      console.log(`   Patterns: ${session.patternsIdentified}`);
      console.log(`   Insights: ${session.insightsGenerated}`);
      console.log('');
    }
  }

  /**
   * /knowledge <query> - Query collective knowledge
   */
  async cmdKnowledge(query?: string): Promise<void> {
    if (!query) {
      console.log('❌ Usage: /knowledge <query>');
      console.log('   Example: /knowledge React hooks');
      return;
    }

    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      return;
    }

    console.log(`\n🔍 Searching collective knowledge for: "${query}"\n`);

    const results = await globalLearningCoordinator.queryCollectiveKnowledge(query, 5);

    if (results.length === 0) {
      console.log('❌ No relevant knowledge found\n');
      return;
    }

    console.log(`✅ Found ${results.length} relevant experiences:\n`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(`${i + 1}. Similarity: ${(result.similarity * 100).toFixed(0)}% | Source: ${result.source}`);
      console.log(`   ${result.experience.substring(0, 200)}...`);
      console.log('');
    }
  }

  /**
   * /agent-stats [agentId] - Show agent learning statistics
   */
  async cmdAgentStats(agentId?: string): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      return;
    }

    const stats = globalLearningCoordinator.getCollectiveStats();

    if (!agentId) {
      // Show collective stats
      console.log('\n📊 Collective Learning Statistics:\n');
      console.log(`Total Agents: ${stats.totalAgents}`);
      console.log(`Total Experiences: ${stats.totalExperiences}`);
      console.log(`Overall Success Rate: ${(stats.overallSuccessRate * 100).toFixed(0)}%`);
      console.log(`Reflection Sessions: ${stats.reflectionSessions}\n`);

      if (stats.topTechnologies.length > 0) {
        console.log('Top Technologies:');
        for (const { tech, count } of stats.topTechnologies.slice(0, 5)) {
          console.log(`  • ${tech}: ${count} uses`);
        }
        console.log('');
      }

      if (stats.topKeywords.length > 0) {
        console.log('Top Action Keywords:');
        for (const { keyword, count } of stats.topKeywords.slice(0, 5)) {
          console.log(`  • ${keyword}: ${count} times`);
        }
        console.log('');
      }

      console.log('Agent Performance:');
      for (const agent of stats.agentStats) {
        console.log(`  • ${agent.agentId}: ${agent.experiences} exp, ${(agent.successRate * 100).toFixed(0)}% success`);
      }
      console.log('');
    } else {
      // Show specific agent stats
      const learning = globalLearningCoordinator.getAgentLearning(agentId);
      if (!learning) {
        console.log(`❌ Agent ${agentId} not found`);
        return;
      }

      const agentStats = learning.getStats();
      console.log(`\n📊 Learning Statistics for ${agentId}:\n`);
      console.log(`Total Experiences: ${agentStats.totalExperiences}`);
      console.log(`Success Rate: ${(agentStats.successRate * 100).toFixed(0)}%`);
      console.log(`Average Duration: ${agentStats.avgDuration.toFixed(0)}ms\n`);

      if (agentStats.topTechnologies.length > 0) {
        console.log('Top Technologies:');
        for (const { tech, count } of agentStats.topTechnologies) {
          console.log(`  • ${tech}: ${count} uses`);
        }
        console.log('');
      }

      console.log('Complexity Distribution:');
      console.log(`  Simple: ${agentStats.complexityDistribution.simple}`);
      console.log(`  Medium: ${agentStats.complexityDistribution.medium}`);
      console.log(`  Complex: ${agentStats.complexityDistribution.complex}\n`);
    }
  }

  /**
   * /auto-reflect [on|off|<minutes>] - Enable/disable automatic reflection
   */
  async cmdAutoReflect(arg?: string): Promise<void> {
    if (!this.masterAgent) {
      console.log('❌ Multi-Agent system not available');
      return;
    }

    if (!arg) {
      console.log('Usage: /auto-reflect [on|off|<minutes>]');
      console.log('   /auto-reflect on         - Enable with default interval (30 min)');
      console.log('   /auto-reflect off        - Disable');
      console.log('   /auto-reflect 60         - Enable with 60 minute interval');
      return;
    }

    if (arg === 'off') {
      globalLearningCoordinator.disableAutoReflection();
    } else if (arg === 'on') {
      globalLearningCoordinator.enableAutoReflection(30);
    } else {
      const minutes = parseInt(arg, 10);
      if (isNaN(minutes) || minutes < 1) {
        console.log('❌ Invalid interval. Provide a number of minutes >= 1');
        return;
      }
      globalLearningCoordinator.enableAutoReflection(minutes);
    }
  }
}
