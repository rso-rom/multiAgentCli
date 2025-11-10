import { MemoryManager } from '../memory/memory-manager';
import { eventBus, AgentIncompletePayload } from './event-system';

/**
 * Resume state for interrupted agent execution
 */
export interface ResumeState {
  agentName: string;
  partialOutput: string;
  remainingPrompt: string;
  context: Record<string, any>;
  reason: 'token_limit' | 'timeout' | 'error';
  timestamp: Date;
  attempts: number;
}

/**
 * Manager for handling auto-resume on token limits
 */
export class ResumeManager {
  private memory: MemoryManager;
  private maxAttempts: number;
  private enabled: boolean;
  private resumeStates: Map<string, ResumeState> = new Map();

  constructor(memory: MemoryManager, maxAttempts = 3, enabled = true) {
    this.memory = memory;
    this.maxAttempts = maxAttempts;
    this.enabled = enabled;

    if (this.enabled) {
      this.setupEventHandlers();
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    eventBus.onAgentIncomplete(async (payload: AgentIncompletePayload) => {
      await this.handleIncomplete(payload);
    });
  }

  /**
   * Handle incomplete agent execution
   */
  async handleIncomplete(payload: AgentIncompletePayload): Promise<void> {
    if (!this.enabled) return;

    const existing = this.resumeStates.get(payload.agent);
    const attempts = existing ? existing.attempts + 1 : 1;

    if (attempts > this.maxAttempts) {
      console.log(
        `❌ Agent ${payload.agent} exceeded max resume attempts (${this.maxAttempts})`
      );
      this.resumeStates.delete(payload.agent);
      return;
    }

    const state: ResumeState = {
      agentName: payload.agent,
      partialOutput: payload.partialOutput,
      remainingPrompt: payload.remainingPrompt,
      context: {},
      reason: payload.reason,
      timestamp: payload.timestamp,
      attempts
    };

    this.resumeStates.set(payload.agent, state);

    // Store in mid-term memory for persistence
    await this.memory.setMid(`resume:${payload.agent}`, JSON.stringify(state));

    console.log(
      `💾 Resume state saved for ${payload.agent} (attempt ${attempts}/${this.maxAttempts})`
    );
  }

  /**
   * Get resume state for agent
   */
  async getResumeState(agentName: string): Promise<ResumeState | null> {
    // Check in-memory first
    if (this.resumeStates.has(agentName)) {
      return this.resumeStates.get(agentName)!;
    }

    // Check persistent storage
    const stored = await this.memory.getMid(`resume:${agentName}`);
    if (stored) {
      const state = JSON.parse(stored as string) as ResumeState;
      state.timestamp = new Date(state.timestamp); // Deserialize Date
      this.resumeStates.set(agentName, state);
      return state;
    }

    return null;
  }

  /**
   * Clear resume state
   */
  async clearResumeState(agentName: string): Promise<void> {
    this.resumeStates.delete(agentName);
    await this.memory.setMid(`resume:${agentName}`, undefined as any);
  }

  /**
   * Check if agent can be resumed
   */
  async canResume(agentName: string): Promise<boolean> {
    const state = await this.getResumeState(agentName);
    return state !== null && state.attempts < this.maxAttempts;
  }

  /**
   * Build resume prompt
   */
  buildResumePrompt(state: ResumeState): string {
    return `Continue from where you left off. You previously output:\n\n${state.partialOutput}\n\nNow complete the remaining task:\n${state.remainingPrompt}`;
  }

  /**
   * Enable/disable auto-resume
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Create global resume manager
 */
export async function createResumeManager(memory: MemoryManager): Promise<ResumeManager> {
  const enabled = process.env.AUTO_RESUME_ENABLED !== 'false';
  const maxAttempts = parseInt(process.env.MAX_RESUME_ATTEMPTS || '3');
  return new ResumeManager(memory, maxAttempts, enabled);
}
