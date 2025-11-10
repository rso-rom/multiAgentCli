import { execSync } from 'child_process';
import { ToolDescriptor } from './tool-descriptor';

/**
 * Check if a tool is available on the system
 */
export async function checkToolAvailability(tool: ToolDescriptor): Promise<boolean> {
  if (!tool.cli) {
    // Tool doesn't have a CLI command, assume available
    return true;
  }

  try {
    // Try to find the command using 'which' on Unix or 'where' on Windows
    const command = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${command} ${tool.cli}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check availability of multiple tools
 */
export async function checkToolsAvailability(tools: ToolDescriptor[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const tool of tools) {
    const available = await checkToolAvailability(tool);
    results.set(tool.name, available);
    tool.available = available;
  }

  return results;
}

/**
 * Get tool version if available
 */
export async function getToolVersion(tool: ToolDescriptor): Promise<string | null> {
  if (!tool.cli || !tool.available) {
    return null;
  }

  try {
    // Common version flags
    const versionFlags = ['--version', '-v', 'version'];

    for (const flag of versionFlags) {
      try {
        const output = execSync(`${tool.cli} ${flag}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 3000
        });
        return output.trim().split('\n')[0];
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Format tool status for display
 */
export function formatToolStatus(tool: ToolDescriptor, includeVersion = true): string {
  const status = tool.available ? '✅' : '❌';
  let info = `${status} ${tool.name} (${tool.type})`;

  if (includeVersion && tool.version) {
    info += ` - v${tool.version}`;
  }

  if (!tool.available) {
    info += ' - Not installed';
  }

  return info;
}
