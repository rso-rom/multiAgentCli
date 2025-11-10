import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { ToolDescriptor } from './tool-descriptor';
import { checkToolAvailability } from './tool-checker';

/**
 * Installation command for a tool
 */
export interface InstallCommand {
  packageManager: string;
  command: string;
  requiresSudo: boolean;
}

/**
 * Tool installer with interactive prompts
 */
export class ToolInstaller {
  private autoInstall: 'ask' | 'always' | 'never';

  constructor(autoInstall: 'ask' | 'always' | 'never' = 'ask') {
    this.autoInstall = autoInstall;
  }

  /**
   * Get installation command for a tool
   */
  getInstallCommand(tool: ToolDescriptor): InstallCommand | null {
    const commands: Record<string, InstallCommand> = {
      // Node.js tools
      'npm': { packageManager: 'node', command: 'npm install -g npm', requiresSudo: false },
      'eslint': { packageManager: 'npm', command: 'npm install -g eslint', requiresSudo: false },
      'prettier': { packageManager: 'npm', command: 'npm install -g prettier', requiresSudo: false },

      // Python tools
      'pip': { packageManager: 'python', command: 'python -m ensurepip --upgrade', requiresSudo: false },
      'black': { packageManager: 'pip', command: 'pip install black', requiresSudo: false },
      'pylint': { packageManager: 'pip', command: 'pip install pylint', requiresSudo: false },

      // Rust tools
      'rustfmt': { packageManager: 'cargo', command: 'rustup component add rustfmt', requiresSudo: false },
      'clippy': { packageManager: 'cargo', command: 'rustup component add clippy', requiresSudo: false }
    };

    return commands[tool.name] || null;
  }

  /**
   * Install missing tools interactively
   */
  async installMissingTools(tools: ToolDescriptor[]): Promise<void> {
    if (this.autoInstall === 'never') return;

    const missing = tools.filter(t => !t.available);
    if (missing.length === 0) return;

    const installable = missing.filter(t => this.getInstallCommand(t) !== null);
    if (installable.length === 0) {
      console.log(`⚠️  Missing tools: ${missing.map(t => t.name).join(', ')}`);
      console.log('   (No automatic installation available)');
      return;
    }

    if (this.autoInstall === 'ask') {
      const { shouldInstall } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldInstall',
        message: `Install missing tools: ${installable.map(t => t.name).join(', ')}?`,
        default: false
      }]);

      if (!shouldInstall) {
        console.log('⏭️  Skipping tool installation');
        return;
      }
    }

    for (const tool of installable) {
      await this.installTool(tool);
    }
  }

  /**
   * Install a single tool
   */
  async installTool(tool: ToolDescriptor): Promise<boolean> {
    const installCmd = this.getInstallCommand(tool);
    if (!installCmd) {
      console.log(`❌ No installation command for ${tool.name}`);
      return false;
    }

    console.log(`📦 Installing ${tool.name}...`);

    try {
      execSync(installCmd.command, {
        stdio: 'inherit',
        timeout: 120000 // 2 minutes
      });

      // Verify installation
      const installed = await checkToolAvailability(tool);
      if (installed) {
        console.log(`✅ ${tool.name} installed successfully`);
        tool.available = true;
        return true;
      } else {
        console.log(`❌ ${tool.name} installation verification failed`);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Failed to install ${tool.name}: ${error.message}`);
      return false;
    }
  }
}

/**
 * Create tool installer from environment
 */
export function createToolInstaller(): ToolInstaller {
  const mode = (process.env.AUTO_INSTALL_TOOLS || 'ask') as 'ask' | 'always' | 'never';
  return new ToolInstaller(mode);
}
