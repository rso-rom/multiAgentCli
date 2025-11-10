/**
 * Task for the queue
 */
export interface Task {
  id: string;
  agentName: string;
  input: string;
  priority: number;
  context?: Record<string, any>;
  createdAt: Date;
}

/**
 * Task queue for managing agent execution
 */
export class TaskQueue {
  private queue: Task[] = [];
  private processing = false;
  private taskCounter = 0;

  /**
   * Add a task to the queue
   */
  enqueue(
    agentName: string,
    input: string,
    priority = 0,
    context?: Record<string, any>
  ): string {
    const task: Task = {
      id: `task_${++this.taskCounter}`,
      agentName,
      input,
      priority,
      context,
      createdAt: new Date()
    };

    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

    return task.id;
  }

  /**
   * Get next task from queue
   */
  dequeue(): Task | undefined {
    return this.queue.shift();
  }

  /**
   * Peek at next task without removing
   */
  peek(): Task | undefined {
    return this.queue[0];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return [...this.queue];
  }

  /**
   * Remove a specific task by ID
   */
  removeTask(taskId: string): boolean {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set processing state
   */
  setProcessing(processing: boolean): void {
    this.processing = processing;
  }

  /**
   * Check if queue is being processed
   */
  isProcessing(): boolean {
    return this.processing;
  }
}

/**
 * Global task queue instance
 */
export const globalTaskQueue = new TaskQueue();
