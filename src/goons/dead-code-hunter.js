/**
 * Dead Code Hunter Goon - Identify Unused Functions, Variables, and Dead Code
 * 
 * This goon specializes in:
 * - Finding unused functions and methods
 * - Identifying unreferenced variables and constants
 * - Detecting unused imports and exports
 * - Locating dead code blocks and unreachable statements
 * - Analyzing code coverage and usage patterns
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('../debt-ignore-parser');

class DeadCodeHunter {
  constructor() {
    this.ignoreParser = new DebtIgnoreParser();
    this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
    this.patterns = {
      functionDeclaration: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\()/g,
      variableDeclaration: /(?:const|let|var)\s+(\w+)/g,
      importStatement: /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from/g,
      exportStatement: /export\s+(?:\{([^}]+)\}|(?:const|let|var|function|class)\s+(\w+))/g,
      usage: /\b(\w+)\b/g,
      deadCodePatterns: [
        /if\s*\(\s*false\s*\)\s*\{[\s\S]*?\}/g,      // if (false) blocks
        /if\s*\(\s*0\s*\)\s*\{[\s\S]*?\}/g,         // if (0) blocks
        /\/\*[\s\S]*?\*\//g,                         // Block comments
        /\/\/.*$/gm,                                 // Line comments
        /debugger;?/g,                               // Debugger statements
        /console\.(?:log|warn|error|info|debug)\([^)]*\);?/g // Console statements
      ]
    };
    
    this.codeDatabase = {
      functions: new Map(),
      variables: new Map(),
      imports: new Map(),
      exports: new Map(),
      usage: new Map(),
      files: new Map()
    };
  }

  /**
   * Hunt for dead code across the project
   */
  async huntDeadCode(projectPath, options = {}) {
    await this.ignoreParser.loadIgnorePatterns(projectPath);
    
    const { 
      dryRun = false, 
      aggressive = false,
      includeTestFiles = false,
      minUsageThreshold = 1,
      showProgress = false 
    } = options;
    
    if (showProgress) {
      console.log('🔍 Starting dead code analysis...');
    }
    
    // Phase 1: Build code database
    await this.buildCodeDatabase(projectPath, includeTestFiles);
    
    if (showProgress) {
      console.log('📊 Analyzing usage patterns...');
    }
    
    // Phase 2: Analyze usage patterns
    const deadCodeResults = this.analyzeDeadCode(minUsageThreshold);
    
    // Phase 3: Generate removal recommendations
    const removalPlan = this.generateRemovalPlan(deadCodeResults, aggressive);
    
    if (showProgress) {
      console.log(`💀 Found ${removalPlan.totalItems} dead code items`);
    }
    
    let executionResults = null;
    if (!dryRun && removalPlan.totalItems > 0) {
      executionResults = await this.executeRemovals(removalPlan);
    }
    
    return {
      analysis: deadCodeResults,
      plan: removalPlan,
      execution: executionResults,
      summary: this.generateSummary(deadCodeResults, executionResults),
      snarkyReport: await this.generateSnarkyReport(projectPath, deadCodeResults)
    };
  }

  /**
   * Build comprehensive code database
   */
  async buildCodeDatabase(projectPath, includeTestFiles) {
    const files = this.getFilesToAnalyze(projectPath, includeTestFiles);
    
    for (const file of files) {
      if (this.ignoreParser.shouldIgnore(file)) {
        continue;
      }
      
      try {
        const content = await fs.readFile(file, 'utf8');
        await this.analyzeFile(file, content);
      } catch (error) {
        console.warn(`Warning: Could not analyze ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Analyze individual file for code elements
   */
  async analyzeFile(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Extract functions
    const functions = this.extractFunctions(content);
    functions.forEach(func => {
      this.codeDatabase.functions.set(func.name, {
        ...func,
        file: relativePath,
        usageCount: 0
      });
    });
    
    // Extract variables
    const variables = this.extractVariables(content);
    variables.forEach(variable => {
      this.codeDatabase.variables.set(`${relativePath}:${variable.name}`, {
        ...variable,
        file: relativePath,
        usageCount: 0
      });
    });
    
    // Extract imports
    const imports = this.extractImports(content);
    imports.forEach(imp => {
      this.codeDatabase.imports.set(`${relativePath}:${imp.name}`, {
        ...imp,
        file: relativePath,
        usageCount: 0
      });
    });
    
    // Extract exports
    const exports = this.extractExports(content);
    exports.forEach(exp => {
      this.codeDatabase.exports.set(`${relativePath}:${exp.name}`, {
        ...exp,
        file: relativePath,
        usageCount: 0
      });
    });
    
    // Count all identifier usage
    this.countUsage(content, relativePath);
    
    this.codeDatabase.files.set(relativePath, {
      path: filePath,
      size: content.length,
      lines: content.split('\n').length,
      functions: functions.length,
      variables: variables.length,
      imports: imports.length,
      exports: exports.length
    });
  }

  /**
   * Extract function declarations
   */
  extractFunctions(content) {
    const functions = [];
    let match;
    
    // Function declarations
    const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\()/g;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      if (name && !this.isCommonUtilName(name)) {
        functions.push({
          name,
          type: match[1] ? 'declaration' : 'arrow',
          line: content.substring(0, match.index).split('\n').length,
          position: match.index
        });
      }
    }
    
    return functions;
  }

  /**
   * Extract variable declarations
   */
  extractVariables(content) {
    const variables = [];
    let match;
    
    const varRegex = /(?:const|let|var)\s+(\w+)/g;
    while ((match = varRegex.exec(content)) !== null) {
      const name = match[1];
      if (!this.isCommonUtilName(name)) {
        variables.push({
          name,
          line: content.substring(0, match.index).split('\n').length,
          position: match.index
        });
      }
    }
    
    return variables;
  }

  /**
   * Extract import statements
   */
  extractImports(content) {
    const imports = [];
    let match;
    
    const importRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from/g;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        // Named imports
        const namedImports = match[1].split(',').map(imp => imp.trim().split(' as ')[0]);
        namedImports.forEach(name => {
          if (name && !this.isCommonUtilName(name)) {
            imports.push({
              name: name.trim(),
              type: 'named',
              line: content.substring(0, match.index).split('\n').length
            });
          }
        });
      } else if (match[2] || match[3]) {
        // Namespace or default imports
        const name = match[2] || match[3];
        if (!this.isCommonUtilName(name)) {
          imports.push({
            name,
            type: match[2] ? 'namespace' : 'default',
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
    
    return imports;
  }

  /**
   * Extract export statements
   */
  extractExports(content) {
    const exports = [];
    let match;
    
    const exportRegex = /export\s+(?:\{([^}]+)\}|(?:const|let|var|function|class)\s+(\w+))/g;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        // Named exports
        const namedExports = match[1].split(',').map(exp => exp.trim().split(' as ')[0]);
        namedExports.forEach(name => {
          if (name && !this.isCommonUtilName(name)) {
            exports.push({
              name: name.trim(),
              type: 'named',
              line: content.substring(0, match.index).split('\n').length
            });
          }
        });
      } else if (match[2]) {
        // Direct exports
        const name = match[2];
        if (!this.isCommonUtilName(name)) {
          exports.push({
            name,
            type: 'direct',
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
    
    return exports;
  }

  /**
   * Count identifier usage across content
   */
  countUsage(content, filePath) {
    // Remove strings and comments to avoid false positives
    const cleanContent = content
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/`[^`]*`/g, '``')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    
    let match;
    const usageRegex = /\b(\w+)\b/g;
    
    while ((match = usageRegex.exec(cleanContent)) !== null) {
      const identifier = match[1];
      if (!this.isLanguageKeyword(identifier)) {
        const key = `${filePath}:${identifier}`;
        if (!this.codeDatabase.usage.has(key)) {
          this.codeDatabase.usage.set(key, 0);
        }
        this.codeDatabase.usage.set(key, this.codeDatabase.usage.get(key) + 1);
      }
    }
  }

  /**
   * Analyze dead code based on usage patterns
   */
  analyzeDeadCode(minUsageThreshold) {
    const results = {
      unusedFunctions: [],
      unusedVariables: [],
      unusedImports: [],
      unusedExports: [],
      statistics: {}
    };
    
    // Analyze functions
    for (const [name, func] of this.codeDatabase.functions) {
      const globalUsage = this.getGlobalUsage(name);
      if (globalUsage < minUsageThreshold) {
        results.unusedFunctions.push({
          ...func,
          globalUsage
        });
      }
    }
    
    // Analyze variables
    for (const [key, variable] of this.codeDatabase.variables) {
      const usage = this.codeDatabase.usage.get(key) || 0;
      if (usage < minUsageThreshold) {
        results.unusedVariables.push({
          ...variable,
          usage
        });
      }
    }
    
    // Analyze imports
    for (const [key, imp] of this.codeDatabase.imports) {
      const usage = this.codeDatabase.usage.get(key) || 0;
      if (usage < minUsageThreshold) {
        results.unusedImports.push({
          ...imp,
          usage
        });
      }
    }
    
    // Analyze exports (external usage is harder to detect)
    for (const [key, exp] of this.codeDatabase.exports) {
      const localUsage = this.codeDatabase.usage.get(key) || 0;
      const globalUsage = this.getGlobalUsage(exp.name);
      
      // Only flag exports as unused if they have very low usage
      if (localUsage === 0 && globalUsage < 2) {
        results.unusedExports.push({
          ...exp,
          localUsage,
          globalUsage
        });
      }
    }
    
    results.statistics = {
      totalFunctions: this.codeDatabase.functions.size,
      totalVariables: this.codeDatabase.variables.size,
      totalImports: this.codeDatabase.imports.size,
      totalExports: this.codeDatabase.exports.size,
      unusedFunctions: results.unusedFunctions.length,
      unusedVariables: results.unusedVariables.length,
      unusedImports: results.unusedImports.length,
      unusedExports: results.unusedExports.length
    };
    
    return results;
  }

  /**
   * Generate removal plan
   */
  generateRemovalPlan(deadCodeResults, aggressive) {
    const plan = {
      safeRemovals: [],
      aggressiveRemovals: [],
      warnings: [],
      totalItems: 0
    };
    
    // Safe removals
    plan.safeRemovals.push(...deadCodeResults.unusedImports.map(imp => ({
      type: 'import',
      ...imp,
      reason: 'Unused import statement',
      confidence: 'high'
    })));
    
    plan.safeRemovals.push(...deadCodeResults.unusedVariables.map(variable => ({
      type: 'variable',
      ...variable,
      reason: 'Unused variable declaration',
      confidence: 'medium'
    })));
    
    // Aggressive removals
    if (aggressive) {
      plan.aggressiveRemovals.push(...deadCodeResults.unusedFunctions.map(func => ({
        type: 'function',
        ...func,
        reason: 'Unused function declaration',
        confidence: 'low'
      })));
      
      plan.aggressiveRemovals.push(...deadCodeResults.unusedExports.map(exp => ({
        type: 'export',
        ...exp,
        reason: 'Potentially unused export',
        confidence: 'very-low'
      })));
    }
    
    plan.totalItems = plan.safeRemovals.length + plan.aggressiveRemovals.length;
    
    return plan;
  }

  /**
   * Execute removal plan
   */
  async executeRemovals(plan) {
    const results = {
      removed: [],
      failed: [],
      warnings: []
    };
    
    // Process safe removals first
    for (const removal of plan.safeRemovals) {
      try {
        await this.removeDeadCode(removal);
        results.removed.push(removal);
      } catch (error) {
        results.failed.push({ ...removal, error: error.message });
      }
    }
    
    // Process aggressive removals
    for (const removal of plan.aggressiveRemovals) {
      try {
        await this.removeDeadCode(removal);
        results.removed.push(removal);
      } catch (error) {
        results.failed.push({ ...removal, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Remove specific dead code item
   */
  async removeDeadCode(item) {
    // This is a simplified implementation
    // In a real scenario, you'd want more sophisticated AST manipulation
    
    if (!item || !item.file || !item.location) {
      throw new Error('Invalid dead code item provided');
    }
    
    // TODO: Implement AST-based code removal
    console.log(`🗑️  Would remove ${item.type} "${item.name}" from ${item.file}:${item.location.line}`);
    
    return {
      success: false,
      message: 'Dead code removal not yet implemented - requires AST manipulation',
      item
    };
  }

  /**
   * Generate summary
   */
  generateSummary(analysis, execution) {
    return {
      unusedFunctions: analysis.unusedFunctions.length,
      unusedVariables: analysis.unusedVariables.length,
      unusedImports: analysis.unusedImports.length,
      unusedExports: analysis.unusedExports.length,
      totalDeadCode: analysis.unusedFunctions.length + analysis.unusedVariables.length + 
                     analysis.unusedImports.length + analysis.unusedExports.length,
      removed: execution ? execution.removed.length : 0,
      failed: execution ? execution.failed.length : 0
    };
  }

  /**
   * Generate snarky report
   */
  async generateSnarkyReport(projectPath, analysis) {
    const stats = analysis.statistics;
    const unusedTotal = stats.unusedFunctions + stats.unusedVariables + 
                       stats.unusedImports + stats.unusedExports;
    
    if (unusedTotal === 0) {
      return "🎉 DEBT COLLECTION COMPLETE!\nYour code is cleaner than a crime scene after the cleanup crew. Every function, variable, and import is earning its keep!";
    }
    
    let report = "💀 DEAD CODE AUTOPSY REPORT 💀\n\n";
    
    if (stats.unusedFunctions > 0) {
      report += `🏴‍☠️ ZOMBIE FUNCTIONS: ${stats.unusedFunctions} functions are dead but still walking around your codebase\n`;
    }
    
    if (stats.unusedVariables > 0) {
      report += `💀 GHOST VARIABLES: ${stats.unusedVariables} variables haunt your code, serving no purpose\n`;
    }
    
    if (stats.unusedImports > 0) {
      report += `📦 ABANDONED CARGO: ${stats.unusedImports} imports arrived but nobody claimed them\n`;
    }
    
    if (stats.unusedExports > 0) {
      report += `🚢 SHIPS TO NOWHERE: ${stats.unusedExports} exports sailing to ports that don't exist\n`;
    }
    
    const codeHealthPercent = Math.round(((stats.totalFunctions + stats.totalVariables + stats.totalImports + stats.totalExports - unusedTotal) / (stats.totalFunctions + stats.totalVariables + stats.totalImports + stats.totalExports)) * 100);
    
    report += `\n💰 CODE HEALTH: ${codeHealthPercent}% - `;
    if (codeHealthPercent >= 95) {
      report += "You magnificent code curator!";
    } else if (codeHealthPercent >= 85) {
      report += "Mostly clean, but the goons found some stragglers.";
    } else if (codeHealthPercent >= 70) {
      report += "Time for some serious debt collection.";
    } else {
      report += "This codebase needs intensive care from the whole crew!";
    }
    
    return report;
  }

  /**
   * Get files to analyze
   */
  getFilesToAnalyze(projectPath, includeTestFiles) {
    const patterns = [
      path.join(projectPath, '**/*.js'),
      path.join(projectPath, '**/*.ts'),
      path.join(projectPath, '**/*.jsx'),
      path.join(projectPath, '**/*.tsx'),
      path.join(projectPath, '**/*.mjs'),
      path.join(projectPath, '**/*.cjs')
    ];
    
    const files = [];
    patterns.forEach(pattern => {
      const matches = glob.sync(pattern, { 
        ignore: [
          '**/node_modules/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          ...(includeTestFiles ? [] : ['**/*.test.*', '**/*.spec.*', '**/test/**', '**/tests/**'])
        ]
      });
      files.push(...matches);
    });
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Get global usage count for identifier
   */
  getGlobalUsage(identifier) {
    let totalUsage = 0;
    for (const [key, count] of this.codeDatabase.usage) {
      if (key.endsWith(`:${identifier}`)) {
        totalUsage += count;
      }
    }
    return totalUsage;
  }

  /**
   * Check if identifier is a common utility name that shouldn't be flagged
   */
  isCommonUtilName(name) {
    const commonNames = [
      'index', 'main', 'app', 'config', 'utils', 'helpers', 'constants',
      'i', 'j', 'k', 'x', 'y', 'z', 'e', 'err', 'error', 'result', 'data',
      'req', 'res', 'next', 'ctx', 'props', 'state', 'ref'
    ];
    return commonNames.includes(name.toLowerCase());
  }

  /**
   * Check if identifier is a JavaScript/TypeScript keyword
   */
  isLanguageKeyword(identifier) {
    const keywords = [
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
      'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
      'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      'let', 'static', 'enum', 'implements', 'interface', 'package', 'private',
      'protected', 'public', 'abstract', 'as', 'async', 'await', 'from', 'of'
    ];
    return keywords.includes(identifier.toLowerCase());
  }
}

module.exports = { DeadCodeHunter }; 