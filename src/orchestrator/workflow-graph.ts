export class WorkflowGraph {
  private nodes: Map<string, { status: 'pending' | 'running' | 'done'; duration?: number }> = new Map();

  addNode(name: string): void {
    this.nodes.set(name, { status: 'pending' });
  }

  updateNode(name: string, status: 'pending' | 'running' | 'done', duration?: number): void {
    this.nodes.set(name, { status, duration });
  }

  generateASCII(): string {
    let output = '\n';
    const entries = Array.from(this.nodes.entries());

    for (let i = 0; i < entries.length; i++) {
      const [name, node] = entries[i];
      const icon = node.status === 'done' ? '✅' : node.status === 'running' ? '🔄' : '⏳';
      const time = node.duration ? ` (${(node.duration / 1000).toFixed(1)}s)` : '';

      output += `  ┌─────────┐\n`;
      output += `  │ ${name.padEnd(7)} │ ${icon}${time}\n`;
      output += `  └────${i < entries.length - 1 ? '┬' : '─'}────┘\n`;
      if (i < entries.length - 1) {
        output += `       │\n`;
      }
    }
    return output;
  }
}
