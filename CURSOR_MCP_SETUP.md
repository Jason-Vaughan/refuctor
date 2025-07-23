# Refuctor MCP Setup for Cursor

## 🎯 Overview

Configure
Refuctor
as
an
MCP
(Model
Context
Protocol)
server in Cursor to enable AI-powered debt detection across all your workspaces.

## 🔧 Setup Instructions

### Step 1: Open Cursor Settings

1. Open Cursor
2. Go to **Settings** (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
3. Search for **"MCP"** in settings

### Step 2: Add Refuctor MCP Server

Add this configuration to your MCP servers:

```json
{
  "mcpServers": {
    "refuctor-debt-broker": {
      "command": "node",
      "args":
["/Users/jasonvaughan/Documents/Projects/Refuctor/src/refuctor-mcp-server.js"],
      "env": {},
      "cwd": "/Users/jasonvaughan/Documents/Projects/Refuctor"
    }
  }
}
```text
**⚠️ Important**:
Update the paths to match your actual Refuctor installation location.

### Step 3: Restart Cursor

Restart Cursor to load the new MCP server configuration.

## 🚀 Usage

Once configured, you can ask Cursor's AI assistant:

### Debt Scanning

```text
"Scan this project for technical debt"
"What's the debt level in this codebase?"
"Show me critical debt issues that need immediate attention"
```text
### Cross-Workspace Awareness

```text
"Compare debt levels across all my projects"
"Which of my workspaces has the most technical debt?"
"Broadcast this project's debt status to other workspaces"
```text
### Automated Fixes

```text
"Fix the markdown debt issues in this project"
"Clean up common debt problems automatically"
"Preview what debt fixes would be applied"
```text
### Debt Reports

```text
"Generate a shame report for this codebase"
"Show me debt trends over time"
"What's the health score of this project?"
```text
### Debt Management

```text
"Add build/ directory to debt ignore patterns"
"List current debt ignore patterns"
"Initialize debt tracking for this project"
```text
## 🔍 Available MCP Tools

Cursor's AI can use these 6 Refuctor tools:

1. **`scan_debt`** - Comprehensive debt detection (markdown, spelling, security, code quality)
2. **`get_debt_status`** - Debt trends and TECHDEBT.md analysis
3. **`fix_debt`** - Automated debt repair with dry-run support
4. **`get_shame_report`** - Humorous debt reports with financial metaphors
5. **`broadcast_debt_status`** - Cross-workspace debt broadcasting
6. **`manage_debt_ignore`** - .debtignore pattern management

## 🌐 Cross-Workspace Features

### Debt Broadcasting

- Share debt status between projects
- Team-wide debt visibility
- Collective accountability metrics

### Health Scoring

- 0-100 health score calculation
- Risk level assessment (MINIMAL → CRITICAL)
- Credit rating system for developers

### Broadcast Storage

Debt broadcasts are stored in: `~/.refuctor-broadcasts/`

Each workspace gets its own JSON file with:

- Total debt counts by priority (P1-P4)
- Health score and risk level
- Timestamp and project path
- Debt trend analysis

## 🔧 Troubleshooting

### MCP Server Not Starting

1. Verify Node.js is installed: `node --version`
2. Check Refuctor dependencies: `cd /path/to/refuctor && npm install`
3. Test MCP server directly: `node src/refuctor-mcp-server.js`

### Path Issues

- Ensure absolute paths in configuration
- Verify Refuctor installation location
- Check file permissions for MCP server script

### No Tools Available

- Restart Cursor after adding MCP configuration
- Check Cursor's MCP server logs
- Verify JSON configuration syntax

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Cursor AI responds to debt-related queries
- ✅ AI can scan projects for technical debt
- ✅ Cross-workspace debt coordination works
- ✅ Automated debt fixes are available via AI chat

---

**Built with Refuctor - The Debt Cleansing Syndicate**
*"Because your code deserves better than being held hostage by technical debt."*
