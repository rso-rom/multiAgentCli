# Multi-Agent CLI Playground

This repository bundles three independent playgrounds:

- `claudecode/` – lightweight Python clone of the Claude Code CLI
- `codechat/` – extended Python CLI with backend adapters and edit loop
- `codeflow-pro/` – TypeScript/Node CLI with multi-agent orchestration, streaming output and layered memory

## Quick start (`codeflow-pro`)

```bash
cd codeflow-pro
npm install
npm run build
npx codeflow shell
```

Inside the shell you can run YAML workflows (`run path/to/workflow.yml`), address agents directly (`@coder write a function ...`) and inspect memory entries (`memory keys`).

The orchestrator provides:

- Streaming output for `ollama`, `openwebui`, `openai` or custom HTTP providers
- Hybrid memory (short-term in RAM, mid-term via LMDB, optional long-term via Qdrant)
- Tool context protocol with runtime checks and logging
- Interactive `ask-store` prompts that implement the chosen policy (C, C, B)

Have fun exploring the different folders for more details.
