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
You have access to the following tools for research:

1. **curl** - Fetch web pages and API responses
   Usage: [TOOL:curl:https://example.com/api/docs]

2. **wget** - Download content from URLs
   Usage: [TOOL:wget:https://example.com/documentation.html]

3. **http_get** - Simple HTTP GET request
   Usage: [TOOL:http_get:https://api.example.com/v1/models]

To use a tool, include it in your response using this format:
[TOOL:tool_name:arguments]

Example:
"To research the API, I will fetch the documentation:
[TOOL:curl:https://docs.gemini.ai/api-reference]

After analyzing the docs, I'll check the API endpoints:
[TOOL:http_get:https://generativelanguage.googleapis.com/v1beta/models]"

The tools will be executed and their output will be provided to you for analysis.

IMPORTANT:
- Use tools to gather real, current information
- Prefer official documentation URLs
- Try multiple URLs if first one fails
- Analyze the output to extract API details
`;
  }
}
