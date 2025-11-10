import { Plugin } from './plugin-interface';
import { ToolDescriptor } from '../orchestrator/tool-descriptor';
import { AgentStartPayload } from '../orchestrator/event-system';
import fs from 'fs/promises';
import path from 'path';

/**
 * Example plugin that logs agent execution to a file
 */
export default class LoggerPlugin implements Plugin {
  name = 'logger-plugin';
  version = '1.0.0';
  private logFile: string = '';

  async init(): Promise<void> {
    this.logFile = path.join(process.cwd(), 'agent-execution.log');
    console.log(`[LoggerPlugin] Initialized. Logging to: ${this.logFile}`);
  }

  registerTools(): ToolDescriptor[] {
    return [
      {
        name: 'view_logs',
        type: 'logging',
        description: 'View recent agent execution logs',
        usage: 'View agent execution logs',
        parameters: {
          lines: {
            type: 'number',
            description: 'Number of recent log lines to show',
            default: 10
          }
        },
        execute: async (args: any) => {
          try {
            const content = await fs.readFile(this.logFile, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            const count = args.lines || 10;
            return lines.slice(-count).join('\n');
          } catch (err) {
            return 'No logs available yet.';
          }
        }
      }
    ];
  }

  onAgentStart(payload: AgentStartPayload): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] AGENT_START: ${payload.agent} - ${payload.input.substring(0, 50)}...\n`;

    fs.appendFile(this.logFile, logLine).catch(err => {
      console.error('[LoggerPlugin] Failed to write log:', err);
    });
  }

  onAgentComplete(payload: any): void {
    const timestamp = new Date().toISOString();
    const duration = payload.duration ? ` (${(payload.duration / 1000).toFixed(2)}s)` : '';
    const logLine = `[${timestamp}] AGENT_COMPLETE: ${payload.agent}${duration}\n`;

    fs.appendFile(this.logFile, logLine).catch(err => {
      console.error('[LoggerPlugin] Failed to write log:', err);
    });
  }
}
