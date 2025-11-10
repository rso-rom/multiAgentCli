---
name: quickstart
description: Quick development workflow - architect and coder only
execution_mode: sequential
agents:
  - name: architect
    role: Software Architect
    backend: ollama
    model: llama3.2:3b
  - name: coder
    role: Full-Stack Developer
    backend: ollama
    model: llama3.2:3b
---

# Quick Start Development

## Architect: Design

Create a simple architecture for: **$TASK**

Focus on:
- Core components
- Technology stack
- Basic API design

Keep it simple and practical.

---

## Coder: Implementation

Implement: **$TASK**

Based on the architecture:
```
{architect}
```

Deliverables:
- Working code (backend + frontend if needed)
- Basic README
- Quick setup instructions
