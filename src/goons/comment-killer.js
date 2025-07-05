/**
 * Comment Killer Goon - Aggressive Comment and Dead Code Elimination
 * 
 * This goon specializes in:
 * - Finding and removing TODO comments without corresponding issues
 * - Identifying outdated documentation comments
 * - Removing commented-out code blocks
 * - Validating license headers
 * - Cleaning up debug comments
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('../debt-ignore-parser');

class CommentKiller {
  constructor() {
    this.ignoreParser = new DebtIgnoreParser();
    this.patterns = {
      todoComments: /(?:\/\/|\/\*|\#|<!--)\s*(?:TODO|FIXME|HACK|XXX|BUG)\s*:?\s*(.+?)(?:\*\/|-->|$)/gi,
      debugComments: /(?:\/\/|\/\*|\#|<!--)\s*(?:DEBUG|TEMP|TESTING|REMOVE)\s*:?\s*(.+?)(?:\*\/|-->|$)/gi,
      commentedCode: /^\s*(?:\/\/|\/\*|\#|<!--)\s*(?:console\.|print\(|debugger|alert\(|import\s|require\(|function\s|class\s|const\s|let\s|var\s|if\s*\(|for\s*\(|while\s*\()/gm,
      licenseHeader: /(?:\/\*[\s\S]*?copyright[\s\S]*?\*\/|\/\/.*copyright.*)/gi,
      emptyComments: /^\s*(?:\/\/|\/\*|\#|<!--)\s*(?:\*\/|-->)?$/gm
    };
    
    this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.php', '.rb', '.go'];
  }

  /**
   * Scan project for comment debt
   */
  async scanCommentDebt(projectPath) {
    await this.ignoreParser.loadIgnorePatterns(projectPath);
    
    const files = this.getFilesToScan(projectPath);
    const results = {
      todoComments: [],
      debugComments: [],
      commentedCode: [],
      licenseIssues: [],
      emptyComments: [],
      totalIssues: 0
    };
    
    for (const file of files) {
      if (this.ignoreParser.shouldIgnore(file)) {
        continue;
      }
      
      const fileResults = await this.scanFile(file);
      
      results.todoComments.push(...fileResults.todoComments);
      results.debugComments.push(...fileResults.debugComments);
      results.commentedCode.push(...fileResults.commentedCode);
      results.licenseIssues.push(...fileResults.licenseIssues);
      results.emptyComments.push(...fileResults.emptyComments);
    }
    
    results.totalIssues = results.todoComments.length + results.debugComments.length + 
                         results.commentedCode.length + results.licenseIssues.length + 
                         results.emptyComments.length;
    
    return results;
  }

  async scanFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    const results = {
      todoComments: [],
      debugComments: [],
      commentedCode: [],
      licenseIssues: [],
      emptyComments: []
    };
    
    // Scan each line
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // TODO/FIXME comments
      const todoMatches = [...line.matchAll(this.patterns.todoComments)];
      todoMatches.forEach(match => {
        results.todoComments.push({
          file: filePath,
          line: lineNumber,
          content: match[0].trim(),
          description: match[1] ? match[1].trim() : 'No description',
          severity: this.getTodoSeverity(match[0])
        });
      });
      
      // Debug comments
      const debugMatches = [...line.matchAll(this.patterns.debugComments)];
      debugMatches.forEach(match => {
        results.debugComments.push({
          file: filePath,
          line: lineNumber,
          content: match[0].trim(),
          description: match[1] ? match[1].trim() : 'Debug comment'
        });
      });
      
      // Commented-out code
      if (this.patterns.commentedCode.test(line)) {
        results.commentedCode.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          suspectedCode: this.identifyCommentedCode(line)
        });
      }
      
      // Empty comments
      if (this.patterns.emptyComments.test(line)) {
        results.emptyComments.push({
          file: filePath,
          line: lineNumber,
          content: line.trim()
        });
      }
    });
    
    // Check license header
    const licenseCheck = this.checkLicenseHeader(content, filePath);
    if (licenseCheck.hasIssue) {
      results.licenseIssues.push(licenseCheck);
    }
    
    return results;
  }

  getTodoSeverity(comment) {
    const upperComment = comment.toUpperCase();
    if (upperComment.includes('FIXME') || upperComment.includes('BUG')) return 'HIGH';
    if (upperComment.includes('HACK') || upperComment.includes('XXX')) return 'MEDIUM';
    return 'LOW';
  }

  identifyCommentedCode(line) {
    const trimmed = line.replace(/^\s*(?:\/\/|\/\*|\#|<!--)\s*/, '');
    
    if (trimmed.includes('console.') || trimmed.includes('print(')) return 'Debug statement';
    if (trimmed.includes('import ') || trimmed.includes('require(')) return 'Import statement';
    if (trimmed.includes('function ') || trimmed.includes('class ')) return 'Function/Class definition';
    if (trimmed.includes('if (') || trimmed.includes('for (') || trimmed.includes('while (')) return 'Control flow';
    if (trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var ')) return 'Variable declaration';
    
    return 'Suspected code';
  }

  checkLicenseHeader(content, filePath) {
    const ext = path.extname(filePath);
    
    // Skip non-code files
    if (!['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h'].includes(ext)) {
      return { hasIssue: false };
    }
    
    const firstLines = content.split('\n').slice(0, 20).join('\n');
    const hasLicense = this.patterns.licenseHeader.test(firstLines);
    
    if (!hasLicense) {
      return {
        hasIssue: true,
        file: filePath,
        issue: 'Missing license header',
        severity: 'LOW'
      };
    }
    
    return { hasIssue: false };
  }

  /**
   * Remove comment debt from project
   */
  async eliminateCommentDebt(projectPath, options = {}) {
    const {
      removeTodos = false,
      removeDebugComments = true,
      removeCommentedCode = true,
      removeEmptyComments = true,
      addLicenseHeaders = false,
      dryRun = false
    } = options;
    
    const scanResults = await this.scanCommentDebt(projectPath);
    const removalPlan = this.createRemovalPlan(scanResults, options);
    
    if (dryRun) {
      return {
        dryRun: true,
        scanResults,
        removalPlan,
        totalRemovals: removalPlan.totalRemovals,
        message: `Would remove ${removalPlan.totalRemovals} comment debt items`
      };
    }
    
    // Execute removals
    const removalResults = await this.executeRemovals(removalPlan);
    
    return {
      scanResults,
      removalResults,
      totalRemoved: removalResults.totalRemoved,
      message: `Eliminated ${removalResults.totalRemoved} comment debt items`
    };
  }

  createRemovalPlan(scanResults, options) {
    const plan = {
      filesToProcess: new Map(),
      totalRemovals: 0
    };
    
    // Group removals by file
    if (options.removeDebugComments) {
      scanResults.debugComments.forEach(item => {
        this.addToRemovalPlan(plan, item.file, item.line, 'debug_comment', item);
      });
    }
    
    if (options.removeCommentedCode) {
      scanResults.commentedCode.forEach(item => {
        this.addToRemovalPlan(plan, item.file, item.line, 'commented_code', item);
      });
    }
    
    if (options.removeEmptyComments) {
      scanResults.emptyComments.forEach(item => {
        this.addToRemovalPlan(plan, item.file, item.line, 'empty_comment', item);
      });
    }
    
    if (options.removeTodos) {
      // Only remove low-severity TODOs by default
      scanResults.todoComments
        .filter(item => item.severity === 'LOW')
        .forEach(item => {
          this.addToRemovalPlan(plan, item.file, item.line, 'todo_comment', item);
        });
    }
    
    return plan;
  }

  addToRemovalPlan(plan, filePath, lineNumber, type, item) {
    if (!plan.filesToProcess.has(filePath)) {
      plan.filesToProcess.set(filePath, {
        path: filePath,
        removals: []
      });
    }
    
    plan.filesToProcess.get(filePath).removals.push({
      line: lineNumber,
      type,
      item
    });
    
    plan.totalRemovals++;
  }

  async executeRemovals(removalPlan) {
    const results = {
      filesModified: 0,
      totalRemoved: 0,
      errors: []
    };
    
    for (const [filePath, fileData] of removalPlan.filesToProcess) {
      try {
        const modified = await this.processFileRemovals(filePath, fileData.removals);
        if (modified) {
          results.filesModified++;
          results.totalRemoved += fileData.removals.length;
        }
      } catch (error) {
        results.errors.push({
          file: filePath,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async processFileRemovals(filePath, removals) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Sort removals by line number (descending) to maintain line indices
    const sortedRemovals = removals.sort((a, b) => b.line - a.line);
    
    let modified = false;
    
    for (const removal of sortedRemovals) {
      const lineIndex = removal.line - 1;
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        // Verify the line still matches what we expect to remove
        if (this.shouldRemoveLine(lines[lineIndex], removal)) {
          lines.splice(lineIndex, 1);
          modified = true;
        }
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, lines.join('\n'), 'utf8');
    }
    
    return modified;
  }

  shouldRemoveLine(line, removal) {
    const { type, item } = removal;
    
    switch (type) {
      case 'debug_comment':
        return this.patterns.debugComments.test(line);
      case 'commented_code':
        return this.patterns.commentedCode.test(line);
      case 'empty_comment':
        return this.patterns.emptyComments.test(line);
      case 'todo_comment':
        return this.patterns.todoComments.test(line) && item.severity === 'LOW';
      default:
        return false;
    }
  }

  getFilesToScan(projectPath) {
    const patterns = this.supportedExtensions.map(ext => `**/*${ext}`);
    const globPattern = patterns.length === 1 ? patterns[0] : `**/*.{${this.supportedExtensions.map(e => e.slice(1)).join(',')}}`;
    
    return glob.sync(globPattern, {
      cwd: projectPath,
      ignore: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.next/**',
        '.nuxt/**'
      ],
      absolute: true
    });
  }

  /**
   * Generate snarky comment debt report
   */
  async generateSnarkyReport(projectPath) {
    const scanResults = await this.scanCommentDebt(projectPath);
    
    let report = `💀 **COMMENT KILLER ASSESSMENT**\n\n`;
    report += `📁 **PROJECT**: ${path.basename(projectPath)}\n`;
    report += `🎯 **TOTAL COMMENT DEBT**: ${scanResults.totalIssues} issues\n\n`;
    
    if (scanResults.totalIssues === 0) {
      report += `✅ **COMMENT CLEANLINESS ACHIEVED!**\n`;
      report += `Your comments are pristine. The Comment Killer has nothing to eliminate here.\n`;
      return report;
    }
    
    // Break down by category
    if (scanResults.todoComments.length > 0) {
      report += `📝 **TODO DEBT**: ${scanResults.todoComments.length} orphaned todos\n`;
      const highSeverity = scanResults.todoComments.filter(t => t.severity === 'HIGH').length;
      if (highSeverity > 0) {
        report += `   🚨 ${highSeverity} high-severity issues (FIXME/BUG)\n`;
      }
    }
    
    if (scanResults.commentedCode.length > 0) {
      report += `💻 **COMMENTED CODE**: ${scanResults.commentedCode.length} blocks of zombie code\n`;
      report += `   💀 These code corpses are haunting your repo\n`;
    }
    
    if (scanResults.debugComments.length > 0) {
      report += `🐛 **DEBUG COMMENTS**: ${scanResults.debugComments.length} debugging artifacts\n`;
      report += `   🧹 Leftover breadcrumbs from your debugging sessions\n`;
    }
    
    if (scanResults.emptyComments.length > 0) {
      report += `💨 **EMPTY COMMENTS**: ${scanResults.emptyComments.length} pointless comment lines\n`;
      report += `   🗑️  These comments say absolutely nothing\n`;
    }
    
    if (scanResults.licenseIssues.length > 0) {
      report += `⚖️  **LICENSE ISSUES**: ${scanResults.licenseIssues.length} files missing headers\n`;
      report += `   📜 Legal dept won't be happy about this\n`;
    }
    
    report += `\n💀 **EXTERMINATION PLAN**:\n`;
    report += `   🔫 Use 'comment-killer eliminate --remove-debug' for safe cleanup\n`;
    report += `   ⚠️  Use 'comment-killer eliminate --remove-todos' for TODO removal\n`;
    report += `   💣 Use 'comment-killer eliminate --aggressive' for full cleanup\n`;
    
    // Show worst offenders
    const fileStats = this.calculateFileStats(scanResults);
    if (fileStats.length > 0) {
      report += `\n🏆 **WORST OFFENDERS**:\n`;
      fileStats.slice(0, 5).forEach((stat, index) => {
        report += `   ${index + 1}. ${path.basename(stat.file)}: ${stat.issues} comment debt issues\n`;
      });
    }
    
    return report;
  }

  calculateFileStats(scanResults) {
    const fileMap = new Map();
    
    const allIssues = [
      ...scanResults.todoComments,
      ...scanResults.debugComments,
      ...scanResults.commentedCode,
      ...scanResults.emptyComments,
      ...scanResults.licenseIssues
    ];
    
    allIssues.forEach(issue => {
      const file = issue.file;
      if (!fileMap.has(file)) {
        fileMap.set(file, { file, issues: 0 });
      }
      fileMap.get(file).issues++;
    });
    
    return Array.from(fileMap.values())
      .sort((a, b) => b.issues - a.issues);
  }
}

module.exports = { CommentKiller }; 