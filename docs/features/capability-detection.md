# Capability Detection System

The capability detection system allows cacli to discover available tools on your system and request user permission before allowing AI agents to use them.

## Overview

When using agentic auto-configuration (`cacli configure backend <name>`), the system can leverage local system tools to research and configure new backends. For security and transparency, cacli:

1. **Scans** your system for available tools
2. **Asks permission** before allowing AI agents to use them
3. **Saves permissions** for future sessions
4. **Respects boundaries** - only uses permitted tools

## How It Works

### 1. System Scan

The capability detector scans for tools in these categories:

- **Development Tools**: code, vim, nano, emacs, make, cmake
- **Package Managers**: npm, yarn, pnpm, pip, pip3, cargo, go
- **Version Control**: git, gh, svn, hg
- **Container & VM**: docker, docker-compose, podman, kubectl
- **AI Models (Ollama)**: Dynamically detects installed Ollama models
- **Programming Languages**: node, python, python3, ruby, java, rustc, go
- **Build Tools**: webpack, vite, rollup, esbuild, tsc

For each tool, the detector checks:
- **Availability**: Is the tool installed? (using `which`)
- **Version**: What version is installed? (using `--version`)
- **Path**: Where is the tool located?

### 2. Permission Request

After scanning, you'll see a summary of detected tools:

```
📋 Detected System Capabilities:

Development Tools:
  ✅ vim (VIM - Vi IMproved 8.2)
  ✅ nano (GNU nano 5.4)

Package Managers:
  ✅ npm (9.6.7)
  ✅ pip3 (Python 3.10)

Version Control:
  ✅ git (git version 2.39.2)

Programming Languages:
  ✅ node (v18.16.0)
  ✅ python3 (Python 3.10.11)
```

You'll then be asked:

```
? Allow AI agents to use these tools?
  ✅ Allow all detected tools
  ⚙️  Select specific tools
  ❌ No, use only safe defaults
```

Options explained:
- **Allow all**: Grants permission to all detected tools
- **Select specific**: Choose which tools to allow individually
- **No**: Disables all system tools (safest option)

### 3. Permission Storage

Granted permissions are saved to `.cacli-permissions.json`:

```json
{
  "timestamp": "2025-11-23T10:30:00.000Z",
  "permissions": [
    "curl",
    "wget",
    "git",
    "npm",
    "node",
    "python3"
  ]
}
```

This file is used in future sessions to avoid asking repeatedly.

### 4. Runtime Enforcement

When an AI agent tries to use a tool:

```typescript
// Agent requests: [TOOL:curl:https://docs.example.com]

// System checks:
1. Is 'curl' available on the system? ✅
2. Did user grant permission for 'curl'? ✅
3. Execute the tool → Success

// If permission denied:
❌ Tool 'curl' is not available or permission was not granted
```

## CLI Commands

### Scan System

Show all available tools and current permissions:

```bash
cacli capabilities scan
# or
cacli caps scan
```

Output:
```
# System Capabilities Report

## Development Tools

✅ 🔓 **vim** - VIM - Vi IMproved 8.2
✅ 🔓 **nano** - GNU nano 5.4
❌ 🔒 **emacs**

## Package Managers

✅ 🔓 **npm** - 9.6.7
✅ 🔒 **yarn** - 1.22.19
❌ 🔒 **pnpm**

Total detected: 15
Permitted: 8
```

Legend:
- ✅ = Available on system
- ❌ = Not available
- 🔓 = Permission granted
- 🔒 = Permission not granted

### Grant Permissions

Interactively grant permissions:

```bash
cacli capabilities grant
```

This will:
1. Scan your system
2. Show detected tools
3. Ask which tools to allow
4. Save permissions to `.cacli-permissions.json`

### List Permissions

See currently granted permissions:

```bash
cacli capabilities list
```

Output:
```
📋 Granted Tool Permissions:

  ✅ curl
  ✅ wget
  ✅ git
  ✅ npm
  ✅ node
  ✅ python3

   Total: 6 tools
```

### Revoke Permissions

Remove all granted permissions:

```bash
cacli capabilities revoke
```

This deletes the `.cacli-permissions.json` file. The next auto-configuration will ask for permissions again.

## Integration with Auto-Configuration

### When Enabled

When you run auto-configuration with agentic tools:

```bash
cacli configure backend gemini
```

The system will:
1. **Detect capabilities** (if not already done)
2. **Request permissions** (if not already granted)
3. **Create ToolExecutor** with capability detector
4. **Allow LLM to use permitted tools** for research

Example workflow:
```
🔍 Detecting system capabilities...

📋 Detected System Capabilities:
[List of tools...]

? Allow AI agents to use these tools? ✅ Allow all detected tools

✅ Granted permission to use 12 tools
💾 Permissions saved to .cacli-permissions.json

🤖 Starting agentic research for gemini...
🔧 Executing tool: curl https://docs.gemini.ai/api...
✅ Tool executed successfully
```

### When Disabled

If you use `--no-agentic-tools`:

```bash
cacli configure backend gemini --no-agentic-tools
```

Capability detection is **skipped** entirely. The LLM will use:
- Web search (if enabled)
- Or pure LLM knowledge only

## Security Considerations

### What Tools Can Do

Permitted tools can:
- ✅ Fetch web pages (curl, wget)
- ✅ Clone public repositories (git clone HTTPS only)
- ✅ Query npm registry (npm info)
- ✅ Read files in working directory
- ✅ Execute safe commands (ls, pwd, date, etc.)

### Built-in Protections

Even with permissions granted, tools have security restrictions:

1. **Command Sanitization**: Removes dangerous shell characters (`;`, `|`, `` ` ``, etc.)
2. **Path Restrictions**: Blocks access to `/etc`, `/root`, `..` paths
3. **HTTPS Only**: Git clone only allows HTTPS URLs (no SSH, no local paths)
4. **Timeouts**: All commands have execution timeouts (10-30 seconds)
5. **Output Limiting**: Output truncated to prevent memory issues
6. **Whitelisting**: Only specific commands allowed in shell tool

### What's NOT Allowed

❌ Writing files outside working directory
❌ Modifying system files
❌ Running arbitrary code with eval/exec
❌ Accessing credentials or secrets
❌ Installing packages globally
❌ Running destructive commands (rm, mv, etc.)

## Example Use Cases

### Auto-Configure Gemini Backend

```bash
# First time - will ask for permissions
cacli configure backend gemini

# Output:
🔍 Detecting system capabilities...
? Allow AI agents to use these tools? ✅ Allow all detected tools
🤖 Starting agentic research for gemini...
🔧 Executing tool: curl https://docs.gemini.ai/api-reference
✅ Found API documentation
✅ Research complete!
```

### Use Specific Tools Only

```bash
cacli capabilities grant

# Output:
? Allow AI agents to use these tools? ⚙️ Select specific tools
? Select tools to allow:
  ✅ curl
  ✅ wget
  ✅ git
  ❌ npm
  ❌ node
  ❌ python3

✅ Granted permission to use 3 tools
```

### Reset Everything

```bash
# Revoke all permissions
cacli capabilities revoke

# Next auto-configuration will ask again
cacli configure backend mistral
```

## Advanced Configuration

### Pre-grant Permissions

Create `.cacli-permissions.json` manually:

```json
{
  "timestamp": "2025-11-23T10:00:00.000Z",
  "permissions": [
    "curl",
    "wget",
    "git",
    "npm"
  ]
}
```

The next auto-configuration will use these permissions without asking.

### Disable for Single Run

Use `--no-agentic-tools` to skip capability detection for one command:

```bash
cacli configure backend cohere --no-agentic-tools
```

### Check Tool Availability

Use the scan command to see what's available:

```bash
cacli capabilities scan > capabilities-report.md
```

This creates a markdown report of all system capabilities.

## Troubleshooting

### "No tools permitted" Warning

**Cause**: You selected "No, use only safe defaults"

**Solution**: Grant permissions:
```bash
cacli capabilities grant
```

### Tool Permission Denied

**Cause**: Tool was detected but permission not granted

**Solution**: Re-grant permissions and select the tool:
```bash
cacli capabilities revoke
cacli capabilities grant
```

### Tool Not Detected

**Cause**: Tool not in PATH or not installed

**Solution**: Install the tool or add to PATH:
```bash
# Example: Install curl
sudo apt-get install curl  # Ubuntu/Debian
brew install curl          # macOS
```

### Permission File Corrupted

**Cause**: `.cacli-permissions.json` has invalid format

**Solution**: Delete and re-grant:
```bash
rm .cacli-permissions.json
cacli capabilities grant
```

## Implementation Details

### CapabilityDetector Class

Location: `src/utils/capability-detector.ts`

Key methods:
- `detectAll()`: Scan all tool categories
- `detectCommand(cmd)`: Check if single command available
- `requestPermissions(capabilities)`: Interactive permission UI
- `hasPermission(tool)`: Check if tool permitted
- `savePermissions(path)`: Save to JSON file
- `loadPermissions(path)`: Load from JSON file
- `canUse(tool)`: Combined availability + permission check

### ToolExecutor Integration

Location: `src/utils/tool-executor.ts`

```typescript
// Tool executor checks permissions before execution
const executor = new ToolExecutor(capabilityDetector);

// Automatically checks:
// 1. Tool exists
// 2. Permission granted
// 3. Execute safely
await executor.executeTool('curl', 'https://example.com');
```

### AutoConfigurator Integration

Location: `src/setup/auto-configurator.ts`

```typescript
// Auto-configuration workflow
1. setupCapabilities()    // Detect and request permissions
2. researchBackend()       // LLM uses permitted tools
3. generateBackendCode()   // Generate implementation
4. Configure and test      // Complete setup
```

## Best Practices

### For Users

1. **Review detected tools** before granting permissions
2. **Use "Select specific"** if you want fine-grained control
3. **Grant minimal permissions** needed for your use case
4. **Revoke after use** if you're concerned about security
5. **Check scan report** periodically to see what's available

### For Development

1. **Always use CapabilityDetector** when creating tool executors
2. **Check permissions** before tool execution
3. **Add new tools** to appropriate category in detector
4. **Sanitize inputs** even for permitted tools
5. **Respect user choices** - never bypass permission checks

## Related Documentation

- [Agentic Auto-Configuration](./agentic-auto-configuration.md) - How LLMs use tools
- [Auto-Configuration](./auto-configuration.md) - Self-configuring backends
- [Adding New Backend](../development/adding-new-backend.md) - Manual setup guide
