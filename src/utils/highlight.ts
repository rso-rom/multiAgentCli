import Prism from 'prismjs';
import chalk from 'chalk';

// Load common languages
try {
  require('prismjs/components/prism-python');
  require('prismjs/components/prism-javascript');
  require('prismjs/components/prism-typescript');
  require('prismjs/components/prism-bash');
  require('prismjs/components/prism-go');
  require('prismjs/components/prism-cpp');
  require('prismjs/components/prism-c');
  require('prismjs/components/prism-java');
} catch {
  // Languages may not load in some environments
}

export function highlightCode(code: string, langHint = 'python'): string {
  try {
    const lang = (Prism.languages as any)[langHint] || (Prism.languages as any).python;
    if (lang) {
      // For terminal output, we'll use a simple approach with chalk
      // Advanced: use cli-highlight package for better terminal syntax highlighting
      return chalk.gray('--- CODE ---\n') + code + '\n' + chalk.gray('------------');
    }
  } catch {
    // Fallback to plain output
  }
  return chalk.gray('--- CODE ---\n') + code + '\n' + chalk.gray('------------');
}
