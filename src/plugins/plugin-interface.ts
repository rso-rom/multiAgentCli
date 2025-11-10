import { ToolDescriptor } from '../orchestrator/tool-descriptor';
import { AgentStartPayload } from '../orchestrator/event-system';

export interface Plugin {
  name: string;
  version: string;
  init(): Promise<void>;
  registerTools?(): ToolDescriptor[];
  onAgentStart?(payload: AgentStartPayload): void;
  onAgentComplete?(payload: any): void;
}
