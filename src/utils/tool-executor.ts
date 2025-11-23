/**
 * Tool Executor - Allows LLM to execute shell commands for research
 *
 * Enables agentic behavior: LLM can use curl, wget, etc. to research APIs
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  execute: (args: string) => Promise<ToolResult>;
}

/**
 * Available tools for LLM to use
 */
export class ToolExecutor {
  private allowedCommands = ['curl', 'wget', 'http'];
  private maxOutputLength = 10000; // Limit output to prevent overload
  private timeout = 10000; // 10 second timeout

  /**
   * Get available tools that LLM can use
   */
  getAvailableTools(): Tool[] {
    return [
      // Web Tools
      {
        name: 'curl',
        description: 'Fetch URL content using curl. Usage: curl <url> [options]',
        execute: (args: string) => this.executeCurl(args)
      },
      {
        name: 'wget',
        description: 'Download URL content using wget. Usage: wget <url> [options]',
        execute: (args: string) => this.executeWget(args)
      },
      {
        name: 'http_get',
        description: 'Make HTTP GET request. Usage: http_get <url>',
        execute: (url: string) => this.executeHttpGet(url)
      },

      // Git Tools
      {
        name: 'git_clone',
        description: 'Clone a git repository. Usage: git_clone <url> [directory]',
        execute: (args: string) => this.executeGitClone(args)
      },

      // Package Managers
      {
        name: 'npm_info',
        description: 'Get npm package info. Usage: npm_info <package-name>',
        execute: (args: string) => this.executeNpmInfo(args)
      },

      // File Operations
      {
        name: 'cat',
        description: 'Read file content. Usage: cat <file-path>',
        execute: (args: string) => this.executeCat(args)
      },
      {
        name: 'grep',
        description: 'Search in files. Usage: grep <pattern> <file>',
        execute: (args: string) => this.executeGrep(args)
      },

      // Code Execution
      {
        name: 'node',
        description: 'Execute Node.js code. Usage: node -e "<code>"',
        execute: (args: string) => this.executeNode(args)
      },

      // JSON Tools
      {
        name: 'jq',
        description: 'Parse JSON. Usage: jq <filter> <input>',
        execute: (args: string) => this.executeJq(args)
      },

      // General Shell
      {
        name: 'shell',
        description: 'Execute safe shell command. Usage: shell <command>',
        execute: (args: string) => this.executeShell(args)
      }
    ];
  }

  /**
   * Execute a curl command
   */
  private async executeCurl(args: string): Promise<ToolResult> {
    try {
      // Security: Only allow safe curl options
      const safeArgs = this.sanitizeCurlArgs(args);
      const command = `curl ${safeArgs}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout || stderr),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute a wget command
   */
  private async executeWget(args: string): Promise<ToolResult> {
    try {
      // Security: Only allow safe wget options
      const safeArgs = this.sanitizeWgetArgs(args);
      const command = `wget -q -O - ${safeArgs}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout || stderr),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute HTTP GET request (safer alternative)
   */
  private async executeHttpGet(url: string): Promise<ToolResult> {
    try {
      const command = `curl -s -L -A "cacli-auto-configurator/1.0" "${url}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Sanitize curl arguments to prevent command injection
   */
  private sanitizeCurlArgs(args: string): string {
    // Remove dangerous characters and options
    let safe = args
      .replace(/[;&|`$()]/g, '') // Remove shell operators
      .replace(/--.*(?:exec|config)/gi, '') // Remove dangerous flags
      .trim();

    // Add safe defaults
    safe = `-s -L -A "cacli-auto-configurator/1.0" ${safe}`;

    return safe;
  }

  /**
   * Sanitize wget arguments to prevent command injection
   */
  private sanitizeWgetArgs(args: string): string {
    // Remove dangerous characters and options
    let safe = args
      .replace(/[;&|`$()]/g, '') // Remove shell operators
      .replace(/--.*(?:exec|config|post-file|input-file)/gi, '') // Remove dangerous flags
      .trim();

    return safe;
  }

  /**
   * Execute git clone
   */
  private async executeGitClone(args: string): Promise<ToolResult> {
    try {
      // Sanitize - only allow https URLs, no arbitrary commands
      const parts = args.trim().split(/\s+/);
      const url = parts[0];

      if (!url.startsWith('https://')) {
        return {
          success: false,
          output: '',
          error: 'Only HTTPS git URLs are allowed'
        };
      }

      const command = `git clone --depth 1 "${url}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 seconds for git clone
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout || stderr),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute npm info
   */
  private async executeNpmInfo(packageName: string): Promise<ToolResult> {
    try {
      // Sanitize package name
      const safe = packageName.trim().replace(/[;&|`$()]/g, '');
      const command = `npm info ${safe} --json`;

      const { stdout } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute cat (read file)
   */
  private async executeCat(filePath: string): Promise<ToolResult> {
    try {
      // Sanitize file path - prevent directory traversal
      const safe = filePath.trim().replace(/[;&|`$()]/g, '');

      // Only allow reading from safe directories
      if (safe.includes('..') || safe.startsWith('/etc') || safe.startsWith('/root')) {
        return {
          success: false,
          output: '',
          error: 'Access to this path is restricted'
        };
      }

      const command = `cat "${safe}"`;

      const { stdout } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute grep
   */
  private async executeGrep(args: string): Promise<ToolResult> {
    try {
      const safe = args.replace(/[;&|`$()]/g, '');
      const command = `grep ${safe}`;

      const { stdout } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute Node.js code
   */
  private async executeNode(args: string): Promise<ToolResult> {
    try {
      // Extract code from -e "code" format
      const match = args.match(/-e\s+["'](.+)["']/);
      if (!match) {
        return {
          success: false,
          output: '',
          error: 'Invalid node command format. Use: node -e "code"'
        };
      }

      const code = match[1];

      // Security: Limit what can be executed
      if (code.includes('require') && !code.includes('require(\'fs\')')) {
        // Allow only safe requires
        return {
          success: false,
          output: '',
          error: 'Unsafe code execution detected'
        };
      }

      const command = `node -e "${code}"`;

      const { stdout } = await execAsync(command, {
        timeout: 5000, // 5 seconds for code execution
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute jq for JSON parsing
   */
  private async executeJq(args: string): Promise<ToolResult> {
    try {
      const safe = args.replace(/[;&|`$()]/g, '');
      const command = `echo '${safe}' | jq .`;

      const { stdout } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Execute safe shell command
   */
  private async executeShell(command: string): Promise<ToolResult> {
    try {
      // Whitelist of allowed commands
      const allowedCommands = [
        'ls', 'pwd', 'whoami', 'date', 'uname',
        'which', 'echo', 'head', 'tail'
      ];

      const cmd = command.trim().split(/\s+/)[0];

      if (!allowedCommands.includes(cmd)) {
        return {
          success: false,
          output: '',
          error: `Command '${cmd}' is not allowed. Allowed: ${allowedCommands.join(', ')}`
        };
      }

      // Sanitize
      const safe = command.replace(/[;&|`$()]/g, '');

      const { stdout } = await execAsync(safe, {
        timeout: this.timeout,
        maxBuffer: this.maxOutputLength
      });

      return {
        success: true,
        output: this.truncateOutput(stdout),
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Truncate output to prevent overwhelming the LLM
   */
  private truncateOutput(output: string): string {
    if (output.length <= this.maxOutputLength) {
      return output;
    }

    return output.substring(0, this.maxOutputLength) + '\n\n[Output truncated...]';
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, args: string): Promise<ToolResult> {
    const tools = this.getAvailableTools();
    const tool = tools.find(t => t.name === toolName);

    if (!tool) {
      return {
        success: false,
        output: '',
        error: `Tool '${toolName}' not found`
      };
    }

    console.log(`🔧 Executing tool: ${toolName} ${args.substring(0, 50)}...`);
    const result = await tool.execute(args);

    if (result.success) {
      console.log(`✅ Tool executed successfully (${result.output.length} bytes)`);
    } else {
      console.log(`❌ Tool execution failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Parse tool calls from LLM response
   * Format: [TOOL:curl:https://api.example.com/docs]
   */
  parseToolCalls(response: string): Array<{ tool: string; args: string }> {
    const toolCallRegex = /\[TOOL:(\w+):([^\]]+)\]/g;
    const calls: Array<{ tool: string; args: string }> = [];

    let match;
    while ((match = toolCallRegex.exec(response)) !== null) {
      calls.push({
        tool: match[1],
        args: match[2].trim()
      });
    }

    return calls;
  }

  /**
   * Execute all tool calls found in LLM response
   */
  async executeToolCalls(response: string): Promise<Map<string, ToolResult>> {
    const calls = this.parseToolCalls(response);
    const results = new Map<string, ToolResult>();

    for (const call of calls) {
      const result = await this.executeTool(call.tool, call.args);
      const key = `${call.tool}:${call.args}`;
      results.set(key, result);
    }

    return results;
  }

  /**
   * Build a prompt that teaches LLM how to use tools
   */
  static buildToolUsePrompt(): string {
    return `
You have access to the following tools for research and development:

**Web Tools:**
1. **curl** - Fetch web pages and API responses
   Usage: [TOOL:curl:https://example.com/api/docs]

2. **wget** - Download content from URLs
   Usage: [TOOL:wget:https://example.com/documentation.html]

3. **http_get** - Simple HTTP GET request
   Usage: [TOOL:http_get:https://api.example.com/v1/models]

**Git Tools:**
4. **git_clone** - Clone a repository (HTTPS only)
   Usage: [TOOL:git_clone:https://github.com/user/repo.git]

**Package Tools:**
5. **npm_info** - Get package information
   Usage: [TOOL:npm_info:package-name]

**File Tools:**
6. **cat** - Read file content
   Usage: [TOOL:cat:path/to/file.txt]

7. **grep** - Search in files
   Usage: [TOOL:grep:pattern file.txt]

**Code Execution:**
8. **node** - Execute Node.js code
   Usage: [TOOL:node:-e "console.log('test')"]

**JSON Tools:**
9. **jq** - Parse and format JSON
   Usage: [TOOL:jq:. data.json]

**Shell Tools:**
10. **shell** - Execute safe shell commands (ls, pwd, date, etc.)
    Usage: [TOOL:shell:ls -la]

To use a tool, include it in your response using this format:
[TOOL:tool_name:arguments]

Example workflow:
"To research the Gemini API, I will:
1. Fetch the documentation:
   [TOOL:curl:https://docs.gemini.ai/api-reference]

2. Check if there's an official SDK:
   [TOOL:npm_info:@google-ai/generative-sdk]

3. If SDK exists, clone the repository to see examples:
   [TOOL:git_clone:https://github.com/google/gemini-sdk.git]

4. Read the package.json to understand the structure:
   [TOOL:cat:gemini-sdk/package.json]"

The tools will be executed and their output will be provided to you for analysis.

IMPORTANT:
- Use tools to gather real, current information
- Chain multiple tools to build complete understanding
- Start with web research, then dive deeper with code/file tools
- Analyze outputs before making conclusions
`;
  }
}
