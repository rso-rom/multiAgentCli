/**
 * MCP (Model Context Protocol) Server Detector
 *
 * Detects available MCP servers on the system (VS Code, Obsidian, etc.)
 * and allows agents to use them as tools.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface MCPServer {
  name: string;
  type: 'vscode' | 'obsidian' | 'custom';
  url: string;
  port?: number;
  available: boolean;
  tools?: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class MCPDetector {
  private cache: Map<string, MCPServer> = new Map();

  /**
   * Detect all available MCP servers
   */
  async detectAll(): Promise<MCPServer[]> {
    console.log('🔍 Scanning for MCP servers...\n');

    const servers: MCPServer[] = [];

    // 1. Check VS Code MCP
    const vscode = await this.detectVSCodeMCP();
    if (vscode) servers.push(vscode);

    // 2. Check Obsidian MCP
    const obsidian = await this.detectObsidianMCP();
    if (obsidian) servers.push(obsidian);

    // 3. Check custom MCP servers from config
    const custom = await this.detectCustomMCP();
    servers.push(...custom);

    // 4. Scan common MCP ports
    const running = await this.scanMCPPorts();
    servers.push(...running);

    return servers;
  }

  /**
   * Detect VS Code MCP Server
   */
  private async detectVSCodeMCP(): Promise<MCPServer | null> {
    try {
      // Check if VS Code is installed
      const { stdout } = await execAsync('code --version', { timeout: 2000 });

      if (!stdout) return null;

      // Check for MCP extension
      const configPath = path.join(
        os.homedir(),
        '.vscode',
        'extensions',
        'anthropic.mcp-*',
        'package.json'
      );

      // Try to find MCP extension
      const vscodeExtDir = path.join(os.homedir(), '.vscode', 'extensions');

      if (!fs.existsSync(vscodeExtDir)) {
        return null;
      }

      const extensions = fs.readdirSync(vscodeExtDir);
      const mcpExtension = extensions.find(ext => ext.includes('mcp'));

      if (!mcpExtension) {
        return {
          name: 'VS Code',
          type: 'vscode',
          url: 'http://localhost:3000',
          port: 3000,
          available: false, // Extension not installed
        };
      }

      // MCP extension found - assume server is available
      return {
        name: 'VS Code MCP',
        type: 'vscode',
        url: 'http://localhost:3000',
        port: 3000,
        available: true,
        tools: [
          {
            name: 'open_file',
            description: 'Open a file in VS Code',
            parameters: { file_path: 'string' }
          },
          {
            name: 'edit_file',
            description: 'Edit a file in VS Code',
            parameters: { file_path: 'string', content: 'string' }
          },
          {
            name: 'run_terminal',
            description: 'Run command in VS Code terminal',
            parameters: { command: 'string' }
          },
          {
            name: 'search_files',
            description: 'Search for files in workspace',
            parameters: { query: 'string' }
          }
        ]
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect Obsidian MCP Server
   */
  private async detectObsidianMCP(): Promise<MCPServer | null> {
    try {
      // Check Obsidian config directory
      const obsidianConfigDir = path.join(
        os.homedir(),
        '.obsidian',
        'plugins',
        'mcp-server'
      );

      if (!fs.existsSync(obsidianConfigDir)) {
        return null;
      }

      return {
        name: 'Obsidian MCP',
        type: 'obsidian',
        url: 'http://localhost:3001',
        port: 3001,
        available: true,
        tools: [
          {
            name: 'create_note',
            description: 'Create a new note in Obsidian',
            parameters: { title: 'string', content: 'string' }
          },
          {
            name: 'search_notes',
            description: 'Search notes in Obsidian vault',
            parameters: { query: 'string' }
          },
          {
            name: 'link_notes',
            description: 'Create links between notes',
            parameters: { from: 'string', to: 'string' }
          },
          {
            name: 'get_note',
            description: 'Get content of a note',
            parameters: { title: 'string' }
          }
        ]
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect custom MCP servers from config file
   */
  private async detectCustomMCP(): Promise<MCPServer[]> {
    try {
      const configPath = path.join(os.homedir(), '.config', 'mcp', 'servers.json');

      if (!fs.existsSync(configPath)) {
        return [];
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const servers: MCPServer[] = [];

      for (const [name, serverConfig] of Object.entries(config.servers || {})) {
        const server = serverConfig as any;
        servers.push({
          name,
          type: 'custom',
          url: server.url || `http://localhost:${server.port}`,
          port: server.port,
          available: true,
          tools: server.tools || []
        });
      }

      return servers;
    } catch {
      return [];
    }
  }

  /**
   * Scan common MCP ports for running servers
   */
  private async scanMCPPorts(): Promise<MCPServer[]> {
    const commonPorts = [3000, 3001, 3002, 3003, 8080, 8081];
    const servers: MCPServer[] = [];

    for (const port of commonPorts) {
      try {
        // Try to fetch /mcp/info endpoint
        const response = await fetch(`http://localhost:${port}/mcp/info`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000)
        });

        if (response.ok) {
          const info = await response.json();
          servers.push({
            name: info.name || `MCP Server (port ${port})`,
            type: 'custom',
            url: `http://localhost:${port}`,
            port,
            available: true,
            tools: info.tools || []
          });
        }
      } catch {
        // Port not responding, continue
      }
    }

    return servers;
  }

  /**
   * Request user permissions for MCP servers
   */
  async requestPermissions(servers: MCPServer[]): Promise<Set<string>> {
    const inquirer = await import('inquirer');
    const availableServers = servers.filter(s => s.available);

    if (availableServers.length === 0) {
      console.log('⚠️  No MCP servers detected\n');
      return new Set();
    }

    // Show detected servers
    console.log('\n📋 Detected MCP Servers:\n');
    for (const server of availableServers) {
      console.log(`${server.name} (${server.url}):`);
      if (server.tools && server.tools.length > 0) {
        server.tools.forEach(tool => {
          console.log(`  ✅ ${tool.name} - ${tool.description}`);
        });
      } else {
        console.log(`  ⚙️  Server available`);
      }
      console.log('');
    }

    // Ask for permission
    const { permission } = await inquirer.default.prompt([{
      type: 'list',
      name: 'permission',
      message: 'Allow AI agents to use MCP servers?',
      choices: [
        { name: '✅ Allow all detected MCP servers', value: 'all' },
        { name: '⚙️  Select specific servers', value: 'select' },
        { name: '❌ No, use only local tools', value: 'none' }
      ],
      default: 'all'
    }]);

    if (permission === 'none') {
      return new Set();
    }

    if (permission === 'all') {
      return new Set(availableServers.map(s => s.name));
    }

    // Select specific servers
    const { selectedServers } = await inquirer.default.prompt([{
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select MCP servers to allow:',
      choices: availableServers.map(s => ({
        name: `${s.name} (${s.tools?.length || 0} tools)`,
        value: s.name,
        checked: true
      })),
      pageSize: 20
    }]);

    return new Set(selectedServers);
  }

  /**
   * Generate MCP servers report
   */
  generateReport(servers: MCPServer[]): string {
    let report = '# MCP Servers Report\n\n';

    for (const server of servers) {
      const status = server.available ? '✅' : '❌';
      report += `${status} **${server.name}** (${server.url})\n`;

      if (server.tools && server.tools.length > 0) {
        report += `\nAvailable Tools:\n`;
        for (const tool of server.tools) {
          report += `  - ${tool.name}: ${tool.description}\n`;
        }
      }

      report += '\n';
    }

    const available = servers.filter(s => s.available).length;
    report += `\nTotal: ${servers.length} servers (${available} available)\n`;

    return report;
  }
}
