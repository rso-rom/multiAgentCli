/**
 * Capability Detector - Discovers available tools and models on the system
 *
 * Scans the system for installed tools and asks for permission to use them
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export interface SystemCapability {
  name: string;
  available: boolean;
  version?: string;
  path?: string;
}

export interface CapabilityGroup {
  category: string;
  capabilities: SystemCapability[];
}

export class CapabilityDetector {
  private cache: Map<string, SystemCapability> = new Map();
  private permissionsGranted: Set<string> = new Set();

  /**
   * Detect all available system capabilities
   */
  async detectAll(): Promise<CapabilityGroup[]> {
    console.log('🔍 Scanning system for available tools...\n');

    const groups: CapabilityGroup[] = [
      {
        category: 'Development Tools',
        capabilities: await this.detectDevTools()
      },
      {
        category: 'Package Managers',
        capabilities: await this.detectPackageManagers()
      },
      {
        category: 'Version Control',
        capabilities: await this.detectVersionControl()
      },
      {
        category: 'Container & VM',
        capabilities: await this.detectContainers()
      },
      {
        category: 'AI Models (Ollama)',
        capabilities: await this.detectOllamaModels()
      },
      {
        category: 'Programming Languages',
        capabilities: await this.detectLanguages()
      },
      {
        category: 'Build Tools',
        capabilities: await this.detectBuildTools()
      }
    ];

    return groups;
  }

  /**
   * Detect development tools
   */
  private async detectDevTools(): Promise<SystemCapability[]> {
    const tools = ['code', 'vim', 'nano', 'emacs', 'make', 'cmake'];
    return await this.detectCommands(tools);
  }

  /**
   * Detect package managers
   */
  private async detectPackageManagers(): Promise<SystemCapability[]> {
    const managers = ['npm', 'yarn', 'pnpm', 'pip', 'pip3', 'cargo', 'go'];
    return await this.detectCommands(managers);
  }

  /**
   * Detect version control systems
   */
  private async detectVersionControl(): Promise<SystemCapability[]> {
    const vcs = ['git', 'gh', 'svn', 'hg'];
    return await this.detectCommands(vcs);
  }

  /**
   * Detect containers and VMs
   */
  private async detectContainers(): Promise<SystemCapability[]> {
    const tools = ['docker', 'docker-compose', 'podman', 'kubectl'];
    return await this.detectCommands(tools);
  }

  /**
   * Detect programming languages
   */
  private async detectLanguages(): Promise<SystemCapability[]> {
    const languages = ['node', 'python', 'python3', 'ruby', 'java', 'rustc', 'go'];
    return await this.detectCommands(languages);
  }

  /**
   * Detect build tools
   */
  private async detectBuildTools(): Promise<SystemCapability[]> {
    const tools = ['webpack', 'vite', 'rollup', 'esbuild', 'tsc'];
    return await this.detectCommands(tools);
  }

  /**
   * Detect Ollama models
   */
  private async detectOllamaModels(): Promise<SystemCapability[]> {
    try {
      const { stdout } = await execAsync('ollama list', { timeout: 5000 });
      const lines = stdout.split('\n').slice(1); // Skip header

      const models: SystemCapability[] = lines
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          const name = parts[0];
          const size = parts[1];

          return {
            name: `ollama:${name}`,
            available: true,
            version: size
          };
        });

      return models;
    } catch {
      return [];
    }
  }

  /**
   * Detect multiple commands
   */
  private async detectCommands(commands: string[]): Promise<SystemCapability[]> {
    const results = await Promise.all(
      commands.map(cmd => this.detectCommand(cmd))
    );

    return results;
  }

  /**
   * Detect a single command
   */
  private async detectCommand(command: string): Promise<SystemCapability> {
    // Check cache first
    if (this.cache.has(command)) {
      return this.cache.get(command)!;
    }

    try {
      // Try 'which' command to find path
      const { stdout: path } = await execAsync(`which ${command}`, { timeout: 1000 });

      // Try to get version
      let version: string | undefined;
      try {
        const { stdout: versionOutput } = await execAsync(`${command} --version`, { timeout: 2000 });
        version = versionOutput.split('\n')[0].substring(0, 50);
      } catch {
        // Version command failed, that's ok
      }

      const capability: SystemCapability = {
        name: command,
        available: true,
        version,
        path: path.trim()
      };

      this.cache.set(command, capability);
      return capability;

    } catch {
      const capability: SystemCapability = {
        name: command,
        available: false
      };

      this.cache.set(command, capability);
      return capability;
    }
  }

  /**
   * Ask user for permission to use detected capabilities
   */
  async requestPermissions(groups: CapabilityGroup[]): Promise<Set<string>> {
    const availableCapabilities = groups
      .flatMap(g => g.capabilities)
      .filter(c => c.available);

    if (availableCapabilities.length === 0) {
      console.log('⚠️  No additional tools detected on system\n');
      return new Set();
    }

    // Show detected capabilities
    console.log('\n📋 Detected System Capabilities:\n');
    for (const group of groups) {
      const available = group.capabilities.filter(c => c.available);
      if (available.length > 0) {
        console.log(`${group.category}:`);
        for (const cap of available) {
          const version = cap.version ? ` (${cap.version})` : '';
          console.log(`  ✅ ${cap.name}${version}`);
        }
        console.log('');
      }
    }

    // Ask for permission
    const { permission } = await inquirer.prompt([{
      type: 'list',
      name: 'permission',
      message: 'Allow AI agents to use these tools?',
      choices: [
        { name: '✅ Allow all detected tools', value: 'all' },
        { name: '⚙️  Select specific tools', value: 'select' },
        { name: '❌ No, use only safe defaults', value: 'none' }
      ],
      default: 'all'
    }]);

    if (permission === 'none') {
      return new Set();
    }

    if (permission === 'all') {
      this.permissionsGranted = new Set(availableCapabilities.map(c => c.name));
      console.log(`\n✅ Granted permission to use ${this.permissionsGranted.size} tools\n`);
      return this.permissionsGranted;
    }

    // Select specific
    const { selectedTools } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedTools',
      message: 'Select tools to allow:',
      choices: availableCapabilities.map(c => ({
        name: `${c.name} ${c.version ? `(${c.version})` : ''}`,
        value: c.name,
        checked: true
      })),
      pageSize: 20
    }]);

    this.permissionsGranted = new Set(selectedTools);
    console.log(`\n✅ Granted permission to use ${this.permissionsGranted.size} tools\n`);

    return this.permissionsGranted;
  }

  /**
   * Check if permission was granted for a capability
   */
  hasPermission(capability: string): boolean {
    return this.permissionsGranted.has(capability);
  }

  /**
   * Get all permitted capabilities
   */
  getPermittedCapabilities(): string[] {
    return Array.from(this.permissionsGranted);
  }

  /**
   * Save permissions to file for future use
   */
  async savePermissions(filePath: string): Promise<void> {
    const fs = await import('fs');
    const data = {
      timestamp: new Date().toISOString(),
      permissions: Array.from(this.permissionsGranted)
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load permissions from file
   */
  async loadPermissions(filePath: string): Promise<void> {
    try {
      const fs = await import('fs');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (data.permissions && Array.isArray(data.permissions)) {
        this.permissionsGranted = new Set(data.permissions);
      }
    } catch {
      // File doesn't exist or is invalid, that's ok
    }
  }

  /**
   * Quick check if a specific tool is available and permitted
   */
  async canUse(tool: string): Promise<boolean> {
    const capability = await this.detectCommand(tool);
    return capability.available && this.hasPermission(tool);
  }

  /**
   * Generate tool availability report
   */
  generateReport(groups: CapabilityGroup[]): string {
    let report = '# System Capabilities Report\n\n';

    for (const group of groups) {
      report += `## ${group.category}\n\n`;

      for (const cap of group.capabilities) {
        const status = cap.available ? '✅' : '❌';
        const permission = this.hasPermission(cap.name) ? '🔓' : '🔒';
        const version = cap.version ? ` - ${cap.version}` : '';

        report += `${status} ${permission} **${cap.name}**${version}\n`;
      }

      report += '\n';
    }

    report += `\nTotal detected: ${groups.flatMap(g => g.capabilities).filter(c => c.available).length}\n`;
    report += `Permitted: ${this.permissionsGranted.size}\n`;

    return report;
  }
}
