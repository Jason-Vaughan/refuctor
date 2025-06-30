const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

/**
 * TECHDEBT.md file management and debt tracking
 * Handles initialization, updates, and historical tracking
 */
class TechDebtManager {
  constructor() {
    this.templatePath = path.join(__dirname, '..', 'templates', 'TECHDEBT.md');
    this.debtFileName = 'TECHDEBT.md';
  }

  /**
   * Initialize debt tracking in a project
   * @param {string} projectPath - Path to project root
   * @param {boolean} force - Overwrite existing file
   * @returns {Object} Result of initialization
   */
  async initializeProject(projectPath, force = false) {
    const debtFilePath = path.join(projectPath, this.debtFileName);
    const exists = await fs.pathExists(debtFilePath);

    if (exists && !force) {
      return { exists: true, created: false };
    }

    // Create TECHDEBT.md from template
    const template = await this.getDebtTemplate();
    const initialContent = template
      .replace(/\[DATE\]/g, moment().format('YYYY-MM-DD'))
      .replace(/\[PROJECT_NAME\]/g, path.basename(projectPath));

    await fs.writeFile(debtFilePath, initialContent, 'utf8');

    return { exists: false, created: true, path: debtFilePath };
  }

  /**
   * Get debt tracking template
   */
  async getDebtTemplate() {
    try {
      // Try to read from templates directory first
      if (await fs.pathExists(this.templatePath)) {
        return await fs.readFile(this.templatePath, 'utf8');
      }
      
      // Fallback to embedded template
      return this.getEmbeddedTemplate();
    } catch (error) {
      return this.getEmbeddedTemplate();
    }
  }

  /**
   * Embedded TECHDEBT.md template
   */
  getEmbeddedTemplate() {
    return `# Technical Debt Tracker

> "Address technical debt the moment it's identified"

## 🎯 Philosophy

**IMMEDIATE TECH DEBT RESOLUTION** - No debt survives more than one session
without explicit prioritization and timeline. Every debt item gets timestamp,
priority, and accountability.

## 🚨 Active Debt (PRIORITY ORDER)

### P1 - Critical (Fix Immediately)

No critical debt items - maintaining clean codebase

### P2 - High (Fix This Session)

No high priority debt items - clean slate achieved

### P3 - Medium (Fix Next Session)

No medium priority debt items - excellent technical hygiene

### P4 - Low (Fix When Convenient)

No low priority debt items - zero debt status achieved

## ✅ Resolved Debt (Session History)

### Session [DATE] - Initial Setup

- [x] **TECHDEBT.md Template**: Deployed technical debt tracking system
- [x] **Refuctor Integration**: Automated debt detection configured
- [x] **Clean Slate**: Starting with zero technical debt

#### TOTAL DEBT ELIMINATED: 0 warnings (starting clean)

#### SESSION IMPACT: 100% technical debt prevention system deployed

## 🛠️ Automated Debt Detection Commands

### Comprehensive Scan (Run During Session Wrap)

\`\`\`bash
# Markdown linting
npx --yes markdownlint-cli "*.md"

# Spell checking
npx --yes cspell "**/*.{md,js,json,ts}" "*.mdc"

# Security audit (when package.json exists)
npm audit

# Refuctor comprehensive scan
refuctor scan --verbose
\`\`\`

### Real-time Monitoring

- **IDE Warning Count**: Monitor status bar indicators
- **Git Status**: \`git status --porcelain\` for uncommitted changes
- **File Count Growth**: Track project bloat via \`find . -type f | wc -l\`

## 📊 Debt Categories & Thresholds

### Automatic P1 (Critical) Triggers

- **Security vulnerabilities**: Any high/critical CVE
- **Linting errors**: >50 warnings in any single file
- **Broken builds**: Any compilation failures
- **Dead URLs**: Broken external links in documentation

### P2 (High) Triggers

- **Linting warnings**: 10-50 warnings per file
- **Spell check issues**: >5 unknown words (excluding project terminology)
- **TODO comments**: Any TODO without corresponding GitHub issue
- **Unused dependencies**: Dependencies in package.json but not imported

### P3 (Medium) Triggers

- **Code duplication**: Significant duplicate logic patterns
- **Performance warnings**: Bundle size >1MB, load time >3s
- **Documentation drift**: README older than 2 versions behind
- **Configuration inconsistency**: Conflicting settings across config files

### P4 (Low) Triggers

- **Minor style inconsistencies**: Non-critical formatting issues
- **Optimization opportunities**: Performance improvements with minimal impact
- **Nice-to-have refactoring**: Code cleanup that doesn't affect functionality

## 🔥 Session Wrap Integration

**MANDATORY EXECUTION:** Every session wrap MUST run debt detection and update
this file.

### New Debt Protocol

1. **DETECT**: Run \`refuctor scan\` and automated scanning commands
2. **CATEGORIZE**: Assign priority based on thresholds above
3. **LOG**: Add to appropriate priority section with timestamp
4. **COMMIT**: Include debt status in session wrap commit message

### Debt Resolution Protocol

1. **FIX**: Address debt items in priority order
2. **VERIFY**: Re-run \`refuctor scan\` to confirm resolution
3. **MOVE**: Transfer resolved items to "Resolved Debt" section
4. **TIMESTAMP**: Mark resolution session and impact

## 🎨 Debt Personality (Refuctor Style)

### Debt Shame Levels

- **P1 Critical**: *"This is fucking embarrassing. Fix it NOW."*
- **P2 High**: *"We're taking back the repo. Clean this today."*
- **P3 Medium**: *"A bit crusty. Handle it this sprint."*
- **P4 Low**: *"Minor blemish. But you'll pay later…"*

### Financial Metaphors

- **Foreclosure**: P1 critical debt that's blocking development
- **Repossession**: P2 high debt that needs immediate attention
- **Liens Filed**: P3 medium debt that's accumulating interest
- **Interest Accruing**: P4 low debt that's slowly growing

### Clean Slate Achievement

Zero debt, you magnificent developer!

---

## 📋 Current Status: ✅ ZERO TECHNICAL DEBT

**Last Updated**: [DATE]

**Debt-Free Sessions**: Starting fresh

**Total Debt Eliminated This Session**: 0 warnings (clean start)

**Status**: *"Clean slate, ready to build something beautiful."*

## 🚀 Next Session Goals

- Maintain zero debt status
- Implement automated debt prevention
- Configure project-specific spell checking
- Establish regular session wrap protocol

---

*"Built with Refuctor - The Debt Cleansing Syndicate"*

*"Because your code deserves better than being held hostage by technical debt."*`;
  }

  /**
   * Update TECHDEBT.md with new debt findings
   * @param {string} projectPath - Path to project root
   * @param {Object} debtReport - Report from debt detector
   * @returns {Object} Update result
   */
  async updateDebtFile(projectPath, debtReport, sessionNote = '') {
    const debtFilePath = path.join(projectPath, this.debtFileName);
    
    if (!await fs.pathExists(debtFilePath)) {
      throw new Error('TECHDEBT.md not found. Run `refuctor init` first.');
    }

    const content = await fs.readFile(debtFilePath, 'utf8');
    const timestamp = moment().format('YYYY-MM-DD HH:mm');
    
    // Parse existing content and add new debt items
    let updatedContent = content;
    
    // Add session entry to resolved debt section
    const sessionEntry = `
### Session ${timestamp}${sessionNote ? ` - ${sessionNote}` : ''}

- [x] **Debt Scan**: Detected ${debtReport.totalDebt} total issues
- [x] **P1 Critical**: ${debtReport.p1.length} foreclosure items
- [x] **P2 High**: ${debtReport.p2.length} repossession notices
- [x] **P3 Medium**: ${debtReport.p3.length} liens filed
- [x] **P4 Low**: ${debtReport.p4.length} interest accruing

#### TOTAL DEBT DETECTED: ${debtReport.totalDebt} issues

#### SESSION IMPACT: Debt level ${debtReport.summary.debtLevel}
`;

    // Insert before the "Current Status" section
    const statusIndex = updatedContent.indexOf('## 📋 Current Status:');
    if (statusIndex > -1) {
      updatedContent = updatedContent.slice(0, statusIndex) + sessionEntry + '\n' + updatedContent.slice(statusIndex);
    }

    // Update current status
    const currentStatus = debtReport.totalDebt === 0 
      ? '✅ ZERO TECHNICAL DEBT'
      : `⚠️ ${debtReport.totalDebt} DEBT ITEMS (${debtReport.summary.debtLevel})`;
    
    updatedContent = updatedContent.replace(
      /## 📋 Current Status: .+$/m,
      `## 📋 Current Status: ${currentStatus}`
    );

    // Update last updated timestamp
    updatedContent = updatedContent.replace(
      /\*\*Last Updated\*\*: .+$/m,
      `**Last Updated**: ${timestamp}`
    );

    await fs.writeFile(debtFilePath, updatedContent, 'utf8');

    return { updated: true, path: debtFilePath, timestamp };
  }

  /**
   * Get current debt status from TECHDEBT.md
   * @param {string} projectPath - Path to project root
   * @returns {Object} Debt status information
   */
  async getDebtStatus(projectPath) {
    const debtFilePath = path.join(projectPath, this.debtFileName);
    const hasDebtFile = await fs.pathExists(debtFilePath);

    if (!hasDebtFile) {
      return {
        hasDebtFile: false,
        currentDebtLevel: 'UNKNOWN',
        sessionsTracked: 0,
        debtTrend: 'unknown'
      };
    }

    try {
      const content = await fs.readFile(debtFilePath, 'utf8');
      
      // Parse current status
      const statusMatch = content.match(/## 📋 Current Status: (.+)$/m);
      const currentDebtLevel = statusMatch ? statusMatch[1].trim() : 'UNKNOWN';
      
      // Count session entries
      const sessionMatches = content.match(/### Session \d{4}-\d{2}-\d{2}/g);
      const sessionsTracked = sessionMatches ? sessionMatches.length : 0;
      
      // Determine trend (simplified heuristic)
      const debtTrend = currentDebtLevel.includes('ZERO') ? 'improving' : 'stable';

      return {
        hasDebtFile: true,
        currentDebtLevel,
        sessionsTracked,
        debtTrend
      };

    } catch (error) {
      throw new Error(`Failed to read debt status: ${error.message}`);
    }
  }

  /**
   * Save debt report to file
   * @param {Object} debtReport - Debt report data
   * @param {string} outputPath - Where to save the report
   */
  async saveDebtReport(debtReport, outputPath) {
    const reportContent = this.formatDebtReport(debtReport);
    await fs.writeFile(outputPath, reportContent, 'utf8');
    return { saved: true, path: outputPath };
  }

  /**
   * Format debt report for file output
   */
  formatDebtReport(debtReport) {
    const timestamp = moment(debtReport.timestamp).format('YYYY-MM-DD HH:mm:ss');
    
    let report = `# Refuctor Debt Report
Generated: ${timestamp}
Project: ${debtReport.projectPath}
Total Debt: ${debtReport.totalDebt} issues
Debt Level: ${debtReport.summary.debtLevel}

## Summary
- Markdown Issues: ${debtReport.summary.markdown}
- Spelling Issues: ${debtReport.summary.spelling}  
- Security Issues: ${debtReport.summary.security}
- Dependency Issues: ${debtReport.summary.dependencies}

`;

    if (debtReport.p1.length > 0) {
      report += `## P1 Critical - Foreclosure Imminent\n`;
      debtReport.p1.forEach(item => report += `- ${item}\n`);
      report += '\n';
    }

    if (debtReport.p2.length > 0) {
      report += `## P2 High - Repossession Notice\n`;
      debtReport.p2.forEach(item => report += `- ${item}\n`);
      report += '\n';
    }

    if (debtReport.p3.length > 0) {
      report += `## P3 Medium - Liens Filed\n`;
      debtReport.p3.forEach(item => report += `- ${item}\n`);
      report += '\n';
    }

    if (debtReport.p4.length > 0) {
      report += `## P4 Low - Interest Accruing\n`;
      debtReport.p4.forEach(item => report += `- ${item}\n`);
      report += '\n';
    }

    if (debtReport.totalDebt === 0) {
      report += `## 🎉 Debt-Free Status Achieved!
Your code is cleaner than a banker's conscience.
Keep up the excellent work, you magnificent debt-slayer!
`;
    }

    report += `\n---\nGenerated by Refuctor - The Debt Cleansing Syndicate\n"Refactor or Be Repossessed"`;

    return report;
  }
}

// Export singleton instance
const techDebtManager = new TechDebtManager();
module.exports = { techDebtManager, TechDebtManager }; 