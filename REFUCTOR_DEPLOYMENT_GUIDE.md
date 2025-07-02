# 🏦 Refuctor Deployment Guide

## AI-Powered Technical Debt Cleansing Suite

*"Refactor or Be Repossessed" - No Bloat. No Debt. No Bullshit.*

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Refuctor Installation
```bash
# Check if Refuctor is available globally
refuctor --version

# If not installed, install it:
npm install -g @puberty-labs/refuctor
```

### Step 2: Initialize Debt Tracking
```bash
# Set up TECHDEBT.md tracking in your project
refuctor init

# This creates TECHDEBT.md with debt tracking infrastructure
```

### Step 3: Run Your First Debt Scan
```bash
# Comprehensive debt detection
refuctor scan

# For detailed breakdown
refuctor scan --verbose

# Save report to file
refuctor scan --output debt-report.json
```

### Step 4: Auto-Fix What's Safe
```bash
# Automatic safe fixes
refuctor fix

# Deploy specialized "goons" for specific issues
refuctor goon
```

---

## 📋 Complete Command Reference

### Core Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `refuctor scan` | Detect technical debt | Initial assessment |
| `refuctor init` | Set up debt tracking | First-time setup |
| `refuctor status` | Show debt overview | Check progress |
| `refuctor fix` | Auto-repair issues | Safe cleanup |
| `refuctor wrap` | Session wrap protocol | End-of-session |

### Advanced Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `refuctor scan --verbose` | Detailed debt breakdown | Deep analysis |
| `refuctor scan --output file.json` | Save report to file | Documentation |
| `refuctor goon` | Deploy specialized fixers | Targeted cleanup |
| `refuctor exterminate` | Aggressive debt elimination | Nuclear option |
| `refuctor shame` | Generate debt shaming report | Motivation |
| `refuctor serve` | Launch web dashboard | Visual monitoring |

### 🎯 Smart Snarky Language Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `refuctor snarky-scan` | Analyze spelling issues intelligently | Detect snarky vs typos |
| `refuctor snarky-scan --auto` | Auto-handle obvious cases | Hands-off cleanup |
| `refuctor snarky-add <words>` | Add terms to project dictionary | Whitelist snarky language |
| `refuctor snarky-fix` | Fix typos, preserve snarky terms | Smart spell checking |
| `refuctor snarky-fix --dry-run` | Preview typo fixes | Safe testing |

### Options & Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--verbose` | Show detailed breakdown | `refuctor scan --verbose` |
| `--output <file>` | Save report to file | `refuctor scan --output report.json` |
| `--force` | Overwrite existing files | `refuctor init --force` |

---

## 🎯 Typical Workflow

### 1. **Initial Assessment** (New Project)
```bash
# Set up debt tracking
refuctor init

# Run comprehensive scan
refuctor scan --verbose --output initial-debt-report.json

# Check what we're dealing with
refuctor status
```

### 2. **Daily Maintenance** (Ongoing)
```bash
# Quick daily scan
refuctor scan

# Auto-fix safe issues
refuctor fix

# Check progress
refuctor status
```

### 3. **Deep Clean** (Weekly/Monthly)
```bash
# Comprehensive analysis
refuctor scan --verbose

# Deploy specialized goons
refuctor goon

# Aggressive cleanup (if needed)
refuctor exterminate
```

### 4. **Session Wrap** (End of Work Session)
```bash
# Comprehensive session wrap
refuctor wrap

# This includes:
# - Session summary
# - Next priorities
# - Documentation updates
# - Git commit strategy
# - Handoff notes
```

---

## 🔍 What Refuctor Detects

### Priority Levels
- **🚨 P1 CRITICAL** - Foreclosure imminent (security, breaking issues)
- **⚠️ P2 HIGH** - Repossession notice (performance, major bugs)
- **📋 P3 MEDIUM** - Liens filed (code quality, documentation)
- **💰 P4 LOW** - Interest accruing (style, minor issues)

### Debt Categories
- **🤌 Guido Level** - Thumb crusher collection (critical issues)
- **🕴️ Mafia Level** - Family business (serious problems)
- **📦 Dependencies** - Missing or outdated packages
- **📝 Documentation** - Missing or outdated docs
- **🔤 Spelling** - Typos vs intentional snarky language (AI-powered detection)
- **🔒 Security** - Vulnerabilities and security issues
- **🧹 Code Quality** - Linting and style issues

---

## 🎯 Smart Snarky Language Detection

### How It Works
Refuctor uses AI-powered pattern recognition to distinguish between:
- **🔧 Genuine typos** (teh, recieve, seperate) → Auto-fix
- **🎭 Intentional snarky language** (refuctoring, bitchuation, snarkified) → Add to dictionary
- **🤔 Uncertain terms** → Ask for human review

### Confidence Levels
- **90%+ Confident** → Definitely snarky (auto-add with `--auto`)
- **70-89%** → Probably snarky (suggest adding)
- **30-69%** → Uncertain (manual review)
- **10-29%** → Probably typo (suggest fixing)
- **<10%** → Definitely typo (auto-fix with `--auto`)

### Pattern Recognition
Refuctor recognizes snarky patterns like:
- **Financial metaphors**: foreclosure, repossession, bailout
- **Tech slang compounds**: refuctoring, configurable, apiified
- **Portmanteau words**: bitchuation, relationshipify, codepocalypse
- **Intentional misspellings**: with numbers/symbols

### Example Workflow
```bash
# 1. Scan for spelling issues with intelligence
refuctor snarky-scan

# Output shows:
# 📊 ANALYSIS RESULTS:
#    Total spelling issues: 15
#    Likely typos: 3
#    Likely snarky terms: 8
#    Uncertain: 4

# 2. Auto-handle obvious cases
refuctor snarky-scan --auto
# ✅ Added 8 snarky terms to project dictionary
# 🔧 3 typos still need manual fixing

# 3. Add specific terms manually
refuctor snarky-add "bitchuation" "refuctorize" "codegasm"

# 4. Fix obvious typos
refuctor snarky-fix
# Shows: ❌ teh in README.md:42
#        ❌ recieve in docs/api.md:15
```

### Project Dictionary
Creates/updates `cspell.json` in your project:
```json
{
  "version": "0.2",
  "words": [
    "bitchuation",
    "refuctoring", 
    "snarkified"
  ],
  "_snarkyLanguageSupport": {
    "description": "This project uses intentional snarky language",
    "addedBy": "Refuctor Debt Collection Agency"
  }
}
```

---

## 🎨 Cursor Rules Generation

### Step 1: Analyze Project Patterns
```bash
# Run detailed scan to understand project structure
refuctor scan --verbose
```

### Step 2: Create .cursorrules File
Based on the scan results, create a `.cursorrules` file in your project root:

```markdown
# Cursor Rules for [Project Name]

## Project Overview
- **Type**: [Web App/CLI Tool/Library/etc.]
- **Language**: [JavaScript/TypeScript/Python/etc.]
- **Framework**: [React/Vue/Express/etc.]

## Code Style Guidelines
- Use consistent naming conventions
- Prefer descriptive variable names
- Keep functions under 50 lines
- Add JSDoc comments for public APIs

## File Organization
- Group related files in directories
- Use index files for clean imports
- Keep configuration in dedicated files

## Testing Requirements
- Write unit tests for new features
- Maintain 80%+ test coverage
- Use descriptive test names

## Documentation Standards
- Update README.md for new features
- Include usage examples
- Document breaking changes

## Performance Guidelines
- Optimize bundle size
- Use lazy loading where appropriate
- Monitor memory usage

## Security Practices
- Validate all user inputs
- Use environment variables for secrets
- Keep dependencies updated
```

### Step 3: Customize Based on Scan Results
Look at the `refuctor scan` output and add specific rules for:
- **Common patterns** found in your codebase
- **Frequent issues** that need attention
- **Project-specific conventions**
- **Team preferences** and standards

---

## 🛠️ Integration with Development Workflow

### Pre-commit Hook
Add to your `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Run Refuctor scan before commits
refuctor scan
if [ $? -ne 0 ]; then
    echo "❌ Debt scan failed. Fix issues before committing."
    exit 1
fi
echo "✅ Debt scan passed. Proceeding with commit."
```

### CI/CD Pipeline
Add to your CI configuration:
```yaml
# Example for GitHub Actions
- name: Run Refuctor Debt Scan
  run: |
    npm install -g @puberty-labs/refuctor
    refuctor scan --output debt-report.json
    
- name: Upload Debt Report
  uses: actions/upload-artifact@v2
  with:
    name: debt-report
    path: debt-report.json
```

### VS Code Integration
Add to your VS Code settings:
```json
{
  "terminal.integrated.env.osx": {
    "REFUCTOR_ENABLED": "true"
  },
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Refuctor Scan",
        "type": "shell",
        "command": "refuctor",
        "args": ["scan", "--verbose"],
        "group": "build",
        "presentation": {
          "echo": true,
          "reveal": "always",
          "focus": false,
          "panel": "shared"
        }
      }
    ]
  }
}
```

---

## 📊 Monitoring & Reporting

### Daily Check-in
```bash
# Quick status check
refuctor status

# Should show:
# ✅ TECHDEBT.md tracking active
# 📈 Sessions tracked: X
# ⚖️ Current debt level: [Low/Medium/High/Critical]
# 📈 Debt trend: [Improving/Worsening/Stable]
```

### Weekly Review
```bash
# Generate comprehensive report
refuctor scan --verbose --output weekly-report.json

# Review trends
refuctor status

# Plan next week's debt reduction
```

### Monthly Deep Dive
```bash
# Full project audit
refuctor scan --verbose --output monthly-audit.json

# Aggressive cleanup
refuctor exterminate

# Update documentation
refuctor wrap
```

---

## 🎭 Refuctor Personality

Refuctor uses financial metaphors and snarky humor:

- **"Debt Never Sleeps"** - Continuous monitoring
- **"Foreclosure Imminent"** - Critical issues
- **"Repossession Notice"** - High priority issues
- **"Guido the Thumb Crusher"** - Critical debt collector
- **"Mafia Takeover"** - Serious technical debt
- **"VIGorish Rate"** - Daily debt accumulation

### Motivational Features
```bash
# Get motivated when debt is high
refuctor shame

# Emergency motivation
refuctor bailmeout

# Easter egg demonstration
refuctor guido
```

---

## 🔧 Troubleshooting

### Common Issues

**"Command not found: refuctor"**
```bash
# Install globally
npm install -g @puberty-labs/refuctor

# Or use npx
npx @puberty-labs/refuctor scan
```

**"Permission denied"**
```bash
# Fix npm permissions
sudo npm install -g @puberty-labs/refuctor

# Or use nvm
nvm use stable
npm install -g @puberty-labs/refuctor
```

**"Scan failed"**
```bash
# Check Node.js version (requires 18+)
node --version

# Update if needed
nvm install 18
nvm use 18
```

### Getting Help
```bash
# Show all commands
refuctor --help

# Show specific command help
refuctor scan --help

# Check version
refuctor --version
```

---

## 📈 Success Metrics

### Track These KPIs
- **Debt Level**: Low → Medium → High → Critical
- **Debt Trend**: Improving → Stable → Worsening
- **Sessions Tracked**: Number of debt management sessions
- **Issues Resolved**: P1, P2, P3, P4 issues fixed
- **Time to Resolution**: How quickly issues are addressed

### Goal Setting
- **Daily**: Keep debt level stable or improving
- **Weekly**: Resolve 80% of P1 and P2 issues
- **Monthly**: Achieve "Low" debt level
- **Quarterly**: Maintain "Low" debt level for 3 months

---

## 🎯 Best Practices

### 1. **Start Small**
- Begin with `refuctor init` and `refuctor scan`
- Focus on P1 and P2 issues first
- Build debt management into your routine

### 2. **Be Consistent**
- Run scans regularly (daily/weekly)
- Use session wraps for accountability
- Track progress over time

### 3. **Automate Everything**
- Add pre-commit hooks
- Integrate with CI/CD
- Set up automated monitoring

### 4. **Team Adoption**
- Share debt reports in team meetings
- Celebrate debt reduction milestones
- Make debt management part of code reviews

### 5. **Continuous Improvement**
- Review and update cursor rules regularly
- Adjust priorities based on project needs
- Learn from debt patterns

---

## 🏁 Quick Reference Card

### Essential Commands
```bash
refuctor init          # Set up debt tracking
refuctor scan          # Detect debt
refuctor fix           # Auto-fix issues
refuctor status        # Check progress
refuctor wrap          # Session wrap
```

### Advanced Commands
```bash
refuctor scan --verbose --output report.json
refuctor goon          # Deploy specialized fixers
refuctor exterminate   # Aggressive cleanup
refuctor shame         # Generate shaming report
refuctor serve         # Web dashboard
```

### Daily Workflow
```bash
# Morning
refuctor status

# During development
refuctor scan
refuctor fix

# End of day
refuctor wrap
```

---

## 🎉 You're Ready!

**Next Steps:**
1. Run `refuctor init` to set up debt tracking
2. Run `refuctor scan` to see what you're dealing with
3. Create your `.cursorrules` file based on the scan results
4. Integrate Refuctor into your daily workflow
5. Watch your technical debt disappear! 🚀

**Remember:** *"Debt Never Sleeps. Neither Should You."* 

But with Refuctor, you'll be sleeping soundly knowing your code is clean and debt-free! 😴✨

---

*Built with ❤️ by Puberty Labs - Because your code deserves better than being held hostage by technical debt.* 