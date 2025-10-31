import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { MemoryManager } from '../memory/MemoryManager';
import { ToolDescriptor } from '../types';

export async function checkAndInstallTool(tool: ToolDescriptor): Promise<boolean> {
  if (!tool.cli) {
    tool.available = true;
    return true;
  }
  try {
    execSync(process.platform === 'win32' ? `where ${tool.cli}` : `which ${tool.cli}`, { stdio: 'ignore' });
    tool.available = true;
    return true;
  } catch {
    tool.available = false;
  }

  const { install } = await inquirer.prompt<{ install: boolean }>([
    {
      type: 'confirm',
      name: 'install',
      message: `Tool ${tool.name} (${tool.cli}) is not available. Should I mark it as installed anyway so the agent can reference it?`,
      default: false,
    },
  ]);

  if (install) {
    console.log('[info] Please install the tool manually in your environment.');
    tool.available = true;
    return true;
  }

  return false;
}

export function buildToolContextPrompt(agentTools?: ToolDescriptor[]): string {
  if (!agentTools || agentTools.length === 0) return '';
  const available = agentTools.filter((t) => t.available);
  const unavailable = agentTools.filter((t) => t.available === false);

  const lines: string[] = ['[Agent Tool Context]'];
  if (available.length) {
    lines.push('Available tools:');
    lines.push(...available.map((t) => `- ${t.name}: ${t.usage} (${t.type})${t.version ? ` [${t.version}]` : ''}`));
  }
  if (unavailable.length) {
    lines.push('Unavailable tools:');
    lines.push(...unavailable.map((t) => `- ${t.name}${t.cli ? ` (${t.cli})` : ''}`));
  }
  return lines.join('\n') + '\n\n';
}

export async function logToolUsage(agentName: string, tool: ToolDescriptor, memory: MemoryManager) {
  const keyBase = `${agentName}:tool:${tool.name}`;
  const entry = { tool: tool.name, usage: tool.usage, timestamp: new Date().toISOString() };
  await memory.mid.set(`${keyBase}:${Date.now()}`, entry);

  const all = memory.mid.all();
  const usageCount = Object.keys(all).filter((k) => k.startsWith(keyBase)).length;
  if (usageCount > 2 && memory.long) {
    await memory.long.upsert(`${memory.projectId}::${agentName}::tool::${tool.name}`, JSON.stringify(entry));
  }
}
