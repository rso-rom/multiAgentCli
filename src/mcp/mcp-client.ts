/**
 * MCP (Model Context Protocol) Client
 *
 * Connects to MCP servers and executes tools
 */

import axios, { AxiosInstance } from 'axios';
import { MCPServer, MCPTool } from './mcp-detector';

export interface MCPToolResult {
  success: boolean;
  output: any;
  error?: string;
}

export class MCPClient {
  private axios: AxiosInstance;
  private server: MCPServer;

  constructor(server: MCPServer) {
    this.server = server;
    this.axios = axios.create({
      baseURL: server.url,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'cacli-mcp-client/1.0'
      }
    });
  }

  /**
   * Execute a tool on the MCP server
   */
  async executeTool(toolName: string, parameters: Record<string, any>): Promise<MCPToolResult> {
    try {
      console.log(`🔧 [MCP] Executing ${this.server.name}:${toolName}...`);

      const response = await this.axios.post('/mcp/tools/execute', {
        tool: toolName,
        parameters
      });

      if (response.status === 200) {
        console.log(`✅ [MCP] ${toolName} executed successfully`);
        return {
          success: true,
          output: response.data
        };
      }

      return {
        success: false,
        output: null,
        error: `Server returned status ${response.status}`
      };
    } catch (error: any) {
      console.log(`❌ [MCP] ${toolName} failed: ${error.message}`);
      return {
        success: false,
        output: null,
        error: error.message
      };
    }
  }

  /**
   * Get list of available tools from server
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const response = await this.axios.get('/mcp/tools');

      if (response.status === 200 && Array.isArray(response.data.tools)) {
        return response.data.tools;
      }

      return [];
    } catch {
      return this.server.tools || [];
    }
  }

  /**
   * Check if server is alive
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.axios.get('/mcp/ping', { timeout: 2000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get server info
   */
  async getInfo(): Promise<any> {
    try {
      const response = await this.axios.get('/mcp/info');
      return response.data;
    } catch {
      return {
        name: this.server.name,
        url: this.server.url,
        available: false
      };
    }
  }
}

/**
 * MCP Tool Executor - integrates MCP into the tool system
 */
export class MCPToolExecutor {
  private clients: Map<string, MCPClient> = new Map();
  private permittedServers: Set<string> = new Set();

  constructor(servers: MCPServer[], permissions: Set<string>) {
    // Create clients for permitted servers
    for (const server of servers) {
      if (permissions.has(server.name)) {
        this.clients.set(server.name, new MCPClient(server));
        this.permittedServers.add(server.name);
      }
    }
  }

  /**
   * Execute MCP tool
   * Format: [TOOL:mcp:server_name:tool_name:parameters_json]
   */
  async executeMCPTool(
    serverName: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<MCPToolResult> {
    // Check permission
    if (!this.permittedServers.has(serverName)) {
      return {
        success: false,
        output: null,
        error: `MCP server '${serverName}' not permitted`
      };
    }

    // Get client
    const client = this.clients.get(serverName);
    if (!client) {
      return {
        success: false,
        output: null,
        error: `MCP server '${serverName}' not found`
      };
    }

    // Execute tool
    return await client.executeTool(toolName, parameters);
  }

  /**
   * Parse MCP tool call from LLM response
   * Format: [TOOL:mcp:vscode:open_file:{"file_path":"README.md"}]
   */
  parseMCPToolCall(response: string): Array<{
    server: string;
    tool: string;
    parameters: Record<string, any>;
  }> {
    const mcpToolRegex = /\[TOOL:mcp:(\w+):(\w+):({[^}]+})\]/g;
    const calls: Array<{ server: string; tool: string; parameters: Record<string, any> }> = [];

    let match;
    while ((match = mcpToolRegex.exec(response)) !== null) {
      try {
        const parameters = JSON.parse(match[3]);
        calls.push({
          server: match[1],
          tool: match[2],
          parameters
        });
      } catch (error) {
        console.error(`Failed to parse MCP tool call parameters: ${match[3]}`);
      }
    }

    return calls;
  }

  /**
   * Get all available MCP tools
   */
  async getAllTools(): Promise<Array<{ server: string; tool: MCPTool }>> {
    const allTools: Array<{ server: string; tool: MCPTool }> = [];

    for (const [serverName, client] of this.clients.entries()) {
      const tools = await client.listTools();
      for (const tool of tools) {
        allTools.push({ server: serverName, tool });
      }
    }

    return allTools;
  }

  /**
   * Build prompt that teaches LLM how to use MCP tools
   */
  static buildMCPToolUsePrompt(tools: Array<{ server: string; tool: MCPTool }>): string {
    if (tools.length === 0) {
      return '';
    }

    let prompt = '\n**MCP (Model Context Protocol) Tools:**\n\n';
    prompt += 'You have access to MCP servers with the following tools:\n\n';

    // Group by server
    const byServer = new Map<string, MCPTool[]>();
    for (const { server, tool } of tools) {
      if (!byServer.has(server)) {
        byServer.set(server, []);
      }
      byServer.get(server)!.push(tool);
    }

    for (const [serverName, serverTools] of byServer.entries()) {
      prompt += `**${serverName}:**\n`;
      for (const tool of serverTools) {
        const params = JSON.stringify(tool.parameters);
        prompt += `- **${tool.name}**: ${tool.description}\n`;
        prompt += `  Usage: [TOOL:mcp:${serverName}:${tool.name}:${params}]\n`;
      }
      prompt += '\n';
    }

    prompt += 'Example:\n';
    prompt += '[TOOL:mcp:vscode:open_file:{"file_path":"README.md"}]\n\n';

    return prompt;
  }
}
