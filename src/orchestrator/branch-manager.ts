import crypto from 'crypto';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationBranch {
  id: string;
  name: string;
  parentId?: string;
  messages: ConversationMessage[];
  createdAt: Date;
  isActive: boolean;
}

/**
 * Manages conversation branching for exploring alternative paths
 */
export class BranchManager {
  private branches: Map<string, ConversationBranch> = new Map();
  private activeBranchId: string;
  private mainBranchId: string;

  constructor() {
    // Create main branch
    this.mainBranchId = crypto.randomUUID();
    this.activeBranchId = this.mainBranchId;

    this.branches.set(this.mainBranchId, {
      id: this.mainBranchId,
      name: 'main',
      messages: [],
      createdAt: new Date(),
      isActive: true
    });
  }

  /**
   * Add a message to the active branch
   */
  addMessage(message: ConversationMessage): void {
    const branch = this.branches.get(this.activeBranchId);
    if (!branch) {
      throw new Error(`Active branch ${this.activeBranchId} not found`);
    }
    branch.messages.push(message);
  }

  /**
   * Create a new branch from the current active branch
   */
  createBranch(name: string, fromMessageIndex?: number): string {
    const parentBranch = this.branches.get(this.activeBranchId);
    if (!parentBranch) {
      throw new Error(`Parent branch ${this.activeBranchId} not found`);
    }

    const branchId = crypto.randomUUID();

    // Copy messages up to the specified index (or all if not specified)
    const messages = fromMessageIndex !== undefined
      ? parentBranch.messages.slice(0, fromMessageIndex + 1)
      : [...parentBranch.messages];

    this.branches.set(branchId, {
      id: branchId,
      name,
      parentId: this.activeBranchId,
      messages,
      createdAt: new Date(),
      isActive: false
    });

    console.log(`\n🌿 Created branch '${name}' from '${parentBranch.name}' (${messages.length} messages)`);
    return branchId;
  }

  /**
   * Switch to a different branch
   */
  switchBranch(branchIdOrName: string): void {
    // Try to find by ID first, then by name
    let branch = this.branches.get(branchIdOrName);
    if (!branch) {
      // Search by name
      for (const b of this.branches.values()) {
        if (b.name === branchIdOrName) {
          branch = b;
          break;
        }
      }
    }

    if (!branch) {
      throw new Error(`Branch '${branchIdOrName}' not found`);
    }

    // Deactivate current branch
    const currentBranch = this.branches.get(this.activeBranchId);
    if (currentBranch) {
      currentBranch.isActive = false;
    }

    // Activate new branch
    branch.isActive = true;
    this.activeBranchId = branch.id;

    console.log(`\n🔀 Switched to branch '${branch.name}' (${branch.messages.length} messages)`);
  }

  /**
   * Merge a branch into the active branch
   */
  mergeBranch(sourceBranchIdOrName: string): void {
    const targetBranch = this.branches.get(this.activeBranchId);
    if (!targetBranch) {
      throw new Error(`Target branch ${this.activeBranchId} not found`);
    }

    // Find source branch
    let sourceBranch = this.branches.get(sourceBranchIdOrName);
    if (!sourceBranch) {
      for (const b of this.branches.values()) {
        if (b.name === sourceBranchIdOrName) {
          sourceBranch = b;
          break;
        }
      }
    }

    if (!sourceBranch) {
      throw new Error(`Source branch '${sourceBranchIdOrName}' not found`);
    }

    // Find divergence point
    let divergenceIndex = 0;
    for (let i = 0; i < Math.min(targetBranch.messages.length, sourceBranch.messages.length); i++) {
      if (targetBranch.messages[i] !== sourceBranch.messages[i]) {
        break;
      }
      divergenceIndex = i + 1;
    }

    // Append only the new messages from source branch
    const newMessages = sourceBranch.messages.slice(divergenceIndex);
    targetBranch.messages.push(...newMessages);

    console.log(`\n🔗 Merged '${sourceBranch.name}' into '${targetBranch.name}' (+${newMessages.length} messages)`);
  }

  /**
   * Delete a branch
   */
  deleteBranch(branchIdOrName: string): void {
    if (branchIdOrName === this.mainBranchId || branchIdOrName === 'main') {
      throw new Error('Cannot delete main branch');
    }

    // Find branch
    let branchId: string | null = null;
    const branch = this.branches.get(branchIdOrName);
    if (branch) {
      branchId = branchIdOrName;
    } else {
      for (const [id, b] of this.branches.entries()) {
        if (b.name === branchIdOrName) {
          branchId = id;
          break;
        }
      }
    }

    if (!branchId) {
      throw new Error(`Branch '${branchIdOrName}' not found`);
    }

    if (branchId === this.activeBranchId) {
      throw new Error('Cannot delete active branch. Switch to another branch first.');
    }

    const deletedBranch = this.branches.get(branchId);
    this.branches.delete(branchId);
    console.log(`\n🗑️  Deleted branch '${deletedBranch?.name}'`);
  }

  /**
   * List all branches
   */
  listBranches(): ConversationBranch[] {
    return Array.from(this.branches.values());
  }

  /**
   * Get the active branch
   */
  getActiveBranch(): ConversationBranch {
    const branch = this.branches.get(this.activeBranchId);
    if (!branch) {
      throw new Error(`Active branch ${this.activeBranchId} not found`);
    }
    return branch;
  }

  /**
   * Get messages from the active branch
   */
  getMessages(): ConversationMessage[] {
    return this.getActiveBranch().messages;
  }

  /**
   * Get branch by ID or name
   */
  getBranch(branchIdOrName: string): ConversationBranch | undefined {
    const branch = this.branches.get(branchIdOrName);
    if (!branch) {
      for (const b of this.branches.values()) {
        if (b.name === branchIdOrName) {
          return b;
        }
      }
    }
    return branch;
  }

  /**
   * Get a visual tree of all branches
   */
  getBranchTree(): string {
    const lines: string[] = [];
    const visited = new Set<string>();

    const buildTree = (branchId: string, prefix: string, isLast: boolean) => {
      if (visited.has(branchId)) return;
      visited.add(branchId);

      const branch = this.branches.get(branchId);
      if (!branch) return;

      const marker = branch.id === this.activeBranchId ? '*' : ' ';
      const connector = isLast ? '└─' : '├─';
      lines.push(`${prefix}${connector} ${marker} ${branch.name} (${branch.messages.length} messages)`);

      // Find child branches
      const children = Array.from(this.branches.values()).filter(b => b.parentId === branchId);
      const childPrefix = prefix + (isLast ? '   ' : '│  ');

      children.forEach((child, index) => {
        buildTree(child.id, childPrefix, index === children.length - 1);
      });
    };

    buildTree(this.mainBranchId, '', true);
    return lines.join('\n');
  }
}

export const globalBranchManager = new BranchManager();
