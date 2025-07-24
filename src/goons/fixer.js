/**
 * The Fixer - Pre-build Preparation & Emergency Syntax Cleanup
 * 
 * This goon specializes in:
 * - Fixing blocking syntax errors before builds
 * - Emergency pre-compilation cleanup
 * - Test environment preparation
 * - Quick fixes for common build failures
 * - Automated formatting and basic repairs
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');
const { DebtIgnoreParser } = require('../debt-ignore-parser');

class Fixer {
  constructor() {
    this.ignoreParser = new DebtIgnoreParser();
    this.fixers = [
      { name: 'syntax', priority: 1, description: 'Fix basic syntax errors' },
      { name: 'formatting', priority: 2, description: 'Fix formatting issues' },
      { name: 'imports', priority: 3, description: 'Fix import/export issues' },
      { name: 'console', priority: 4, description: 'Remove console statements' },
      { name: 'semicolons', priority: 5, description: 'Add missing semicolons' },
      { name: 'quotes', priority: 6, description: 'Standardize quote usage' }
    ];
    
    this.syntaxPatterns = {
      // Common syntax issues
      missingSemicolon: /^(.+[^;{}\s])(\s*)$/gm,
      trailingComma: /,(\s*[}\]])/g,
      inconsistentQuotes: /([^\\])'([^']*)'([^'])/g,
      consoleStatements: /^\s*console\.(log|warn|error|info|debug)\(.*\);?\s*$/gm,
      unusedVariables: /^\s*(?:const|let|var)\s+(\w+)\s*=.*$/gm,
      missingImports: /(\w+)\s+is\s+not\s+defined/g
    };
    
    this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
  }

  /**
   * Emergency pre-build fix - fix critical issues that block builds
   */
  async emergencyFix(projectPath, options = {}) {
    const {
      dryRun = false,
      fixTypes = ['syntax', 'imports'],
      maxFixAttempts = 5
    } = options;
    
    
    await this.ignoreParser.loadIgnorePatterns(projectPath);
    
    const results = {
      totalAttempts: 0,
      fixesApplied: 0,
      filesModified: 0,
      criticalIssuesResolved: 0,
      buildStatus: 'unknown',
      fixes: []
    };
    
    // Get initial build status
    const initialBuildStatus = await this.checkBuildStatus(projectPath);
    
    if (initialBuildStatus.success) {
      return { ...results, buildStatus: 'passing' };
    }
    
    // Extract error information
    const buildErrors = this.parseBuildErrors(initialBuildStatus.error);
    
    // Attempt fixes
    for (let attempt = 1; attempt <= maxFixAttempts; attempt++) {
      results.totalAttempts = attempt;
      
      const fixResult = await this.applyEmergencyFixes(projectPath, buildErrors, {
        dryRun,
        fixTypes
      });
      
      results.fixesApplied += fixResult.fixesApplied;
      results.filesModified += fixResult.filesModified;
      results.fixes.push(...fixResult.fixes);
      
      if (dryRun) {
        break;
      }
      
      // Test build after fixes
      const buildStatus = await this.checkBuildStatus(projectPath);
      
      if (buildStatus.success) {
        results.buildStatus = 'fixed';
        results.criticalIssuesResolved = buildErrors.length;
        break;
      } else {
        // Update build errors for next iteration
        const newBuildErrors = this.parseBuildErrors(buildStatus.error);
        if (newBuildErrors.length < buildErrors.length) {
          buildErrors.splice(0, buildErrors.length, ...newBuildErrors);
        }
      }
    }
    
    if (results.buildStatus !== 'fixed') {
      results.buildStatus = 'partially_fixed';
    }
    
    return results;
  }

  async checkBuildStatus(projectPath) {
    try {
      // Try different build commands based on what's available
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageData = await fs.readJson(packageJsonPath);
        const scripts = packageData.scripts || {};
        
        // Prefer build script, fallback to type checking
        if (scripts.build) {
          execSync('npm run build', { 
            cwd: projectPath, 
            stdio: 'pipe',
            timeout: 30000 // 30 second timeout
          });
        } else if (scripts['type-check']) {
          execSync('npm run type-check', { 
            cwd: projectPath, 
            stdio: 'pipe',
            timeout: 15000
          });
        } else {
          // Try TypeScript compilation if tsconfig exists
          const tsconfigPath = path.join(projectPath, 'tsconfig.json');
          if (await fs.pathExists(tsconfigPath)) {
            execSync('npx tsc --noEmit', { 
              cwd: projectPath, 
              stdio: 'pipe',
              timeout: 20000
            });
          }
        }
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || error.stdout?.toString() || error.stderr?.toString() 
      };
    }
  }

  parseBuildErrors(errorOutput) {
    if (!errorOutput) return [];
    
    const errors = [];
    const lines = errorOutput.split('\n');
    
    for (const line of lines) {
      // TypeScript errors
      const tsMatch = line.match(/(.+\.tsx?)\((\d+),(\d+)\):\s*error\s+TS(\d+):\s*(.+)/);
      if (tsMatch) {
        errors.push({
          type: 'typescript',
          file: tsMatch[1],
          line: parseInt(tsMatch[2]),
          column: parseInt(tsMatch[3]),
          code: tsMatch[4],
          message: tsMatch[5],
          severity: 'error'
        });
        continue;
      }
      
      // Syntax errors
      const syntaxMatch = line.match(/SyntaxError:\s*(.+)/);
      if (syntaxMatch) {
        errors.push({
          type: 'syntax',
          message: syntaxMatch[1],
          severity: 'error'
        });
        continue;
      }
      
      // Import errors
      const importMatch = line.match(/Module not found:\s*(.+)/);
      if (importMatch) {
        errors.push({
          type: 'import',
          message: importMatch[1],
          severity: 'error'
        });
        continue;
      }
    }
    
    return errors;
  }

  async applyEmergencyFixes(projectPath, buildErrors, options) {
    const results = {
      fixesApplied: 0,
      filesModified: 0,
      fixes: []
    };
    
    const filesToFix = new Set();
    
    // Group errors by file
    const fileErrors = new Map();
    buildErrors.forEach(error => {
      if (error.file) {
        const fullPath = path.resolve(projectPath, error.file);
        if (!fileErrors.has(fullPath)) {
          fileErrors.set(fullPath, []);
        }
        fileErrors.get(fullPath).push(error);
        filesToFix.add(fullPath);
      }
    });
    
    // Also scan common problematic files
    const commonFiles = this.getCommonProblematicFiles(projectPath);
    commonFiles.forEach(file => filesToFix.add(file));
    
    // Apply fixes to each file
    for (const filePath of filesToFix) {
      if (this.ignoreParser.shouldIgnore(filePath)) {
        continue;
      }
      
      const fileErrors = fileErrors.get(filePath) || [];
      const fixResult = await this.fixFile(filePath, fileErrors, options);
      
      if (fixResult.modified) {
        results.filesModified++;
        results.fixesApplied += fixResult.fixesApplied;
        results.fixes.push(...fixResult.fixes);
      }
    }
    
    return results;
  }

  getCommonProblematicFiles(projectPath) {
    const patterns = [
      '**/*.{js,ts,jsx,tsx}',
      '!node_modules/**',
      '!dist/**',
      '!build/**'
    ];
    
    return glob.sync(patterns.join('|'), {
      cwd: projectPath,
      absolute: true
    }).slice(0, 50); // Limit to 50 files for emergency fixing
  }

  async fixFile(filePath, fileErrors = [], options = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let modifiedContent = content;
      const fixes = [];
      
      // Apply fixes in priority order
      for (const fixer of this.fixers) {
        if (!options.fixTypes.includes(fixer.name)) continue;
        
        const fixResult = this.applyFix(modifiedContent, fixer.name, fileErrors);
        if (fixResult.modified) {
          modifiedContent = fixResult.content;
          fixes.push({
            type: fixer.name,
            description: fixer.description,
            changes: fixResult.changes
          });
        }
      }
      
      const modified = content !== modifiedContent;
      
      if (modified && !options.dryRun) {
        await fs.writeFile(filePath, modifiedContent, 'utf8');
      }
      
      return {
        modified,
        fixesApplied: fixes.length,
        fixes
      };
    } catch (error) {
      return {
        modified: false,
        fixesApplied: 0,
        fixes: [],
        error: error.message
      };
    }
  }

  applyFix(content, fixType, fileErrors = []) {
    let modifiedContent = content;
    const changes = [];
    
    switch (fixType) {
      case 'syntax': {
        // Fix missing semicolons (conservative approach)
        const semicolonFixes = modifiedContent.replace(
          /^(\s*(?:const|let|var|return|throw|break|continue)\s+[^;{}\n]+)(\s*)$/gm,
          (match, statement, whitespace) => {
            if (!statement.trim().endsWith(';') && !statement.trim().endsWith('{')) {
              changes.push('Added missing semicolon');
              return statement + ';' + whitespace;
            }
            return match;
          }
        );
        modifiedContent = semicolonFixes;
        break;
      }
        
      case 'formatting':
        // Fix trailing commas in objects/arrays
        modifiedContent = modifiedContent.replace(
          /,(\s*[}\]])/g,
          (match, bracket) => {
            changes.push('Removed trailing comma');
            return bracket;
          }
        );
        break;
        
      case 'console':
        // Remove console statements
        const consoleBefore = modifiedContent.split('\n').length;
        modifiedContent = modifiedContent.replace(
          this.syntaxPatterns.consoleStatements,
          ''
        );
        const consoleAfter = modifiedContent.split('\n').length;
        if (consoleBefore !== consoleAfter) {
          changes.push(`Removed ${consoleBefore - consoleAfter} console statements`);
        }
        break;
        
      case 'quotes':
        // Standardize to double quotes (conservative)
        modifiedContent = modifiedContent.replace(
          /([^\\])'([^'\\]*(?:\\.[^'\\]*)*)'(?=[^a-zA-Z])/g,
          (match, before, content) => {
            if (!content.includes('"')) {
              changes.push('Standardized quote usage');
              return before + '"' + content + '"';
            }
            return match;
          }
        );
        break;
        
      case 'imports':
        // Basic import cleanup (remove duplicate imports)
        const importLines = modifiedContent.split('\n');
        const seenImports = new Set();
        const cleanedLines = importLines.filter(line => {
          const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
          if (importMatch) {
            const module = importMatch[1];
            if (seenImports.has(module)) {
              changes.push(`Removed duplicate import: ${module}`);
              return false;
            }
            seenImports.add(module);
          }
          return true;
        });
        modifiedContent = cleanedLines.join('\n');
        break;
    }
    
    return {
      modified: content !== modifiedContent,
      content: modifiedContent,
      changes
    };
  }

  /**
   * Prepare test environment
   */
  async prepareTestEnvironment(projectPath, options = {}) {
    const {
      clearCache = true,
      installDependencies = false,
      generateTestFiles = false
    } = options;
    
    
    const results = {
      cacheCleared: false,
      dependenciesInstalled: false,
      testFilesGenerated: false,
      errors: []
    };
    
    try {
      // Clear cache
      if (clearCache) {
        await this.clearBuildCache(projectPath);
        results.cacheCleared = true;
      }
      
      // Install dependencies if requested
      if (installDependencies) {
        await this.installDependencies(projectPath);
        results.dependenciesInstalled = true;
      }
      
      // Generate basic test files if requested
      if (generateTestFiles) {
        await this.generateBasicTestFiles(projectPath);
        results.testFilesGenerated = true;
      }
      
      
    } catch (error) {
      results.errors.push(error.message);
      console.error(`❌ Error preparing test environment: ${error.message}`);
    }
    
    return results;
  }

  async clearBuildCache(projectPath) {
    const cachePaths = [
      'node_modules/.cache',
      '.next',
      'dist',
      'build',
      '.nuxt',
      '.turbo'
    ];
    
    for (const cachePath of cachePaths) {
      const fullPath = path.join(projectPath, cachePath);
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
      }
    }
  }

  async installDependencies(projectPath) {
    return new Promise((resolve, reject) => {
      execSync('npm install', {
        cwd: projectPath,
        stdio: 'inherit',
        timeout: 120000 // 2 minute timeout
      });
      resolve();
    });
  }

  async generateBasicTestFiles(projectPath) {
    const testDir = path.join(projectPath, '__tests__');
    await fs.ensureDir(testDir);
    
    const basicTestContent = `// Basic test file generated by The Fixer
describe('Basic tests', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });
});
`;
    
    await fs.writeFile(path.join(testDir, 'basic.test.js'), basicTestContent);
  }

  /**
   * Generate snarky fixer report
   */
  async generateSnarkyReport(projectPath) {
    let report = `🔧 **THE FIXER ASSESSMENT**\n\n`;
    report += `📁 **PROJECT**: ${path.basename(projectPath)}\n`;
    
    // Check build status
    const buildStatus = await this.checkBuildStatus(projectPath);
    
    if (buildStatus.success) {
      report += `✅ **BUILD STATUS**: PASSING\n`;
      report += `🎉 Your build is clean! The Fixer has nothing urgent to fix.\n\n`;
      report += `💡 **PREVENTIVE MAINTENANCE AVAILABLE**:\n`;
      report += `   🧹 Run format cleanup to prevent future issues\n`;
      report += `   📦 Clear build cache for fresh environment\n`;
      report += `   🧪 Prepare test environment\n`;
    } else {
      const errors = this.parseBuildErrors(buildStatus.error);
      report += `❌ **BUILD STATUS**: FAILING\n`;
      report += `🚨 **CRITICAL ISSUES**: ${errors.length} build-blocking problems\n\n`;
      
      if (errors.length > 0) {
        report += `🔍 **ERROR BREAKDOWN**:\n`;
        const errorTypes = errors.reduce((acc, err) => {
          acc[err.type] = (acc[err.type] || 0) + 1;
          return acc;
        }, {});
        
        Object.entries(errorTypes).forEach(([type, count]) => {
          report += `   ${this.getErrorEmoji(type)} ${type}: ${count} issues\n`;
        });
      }
      
      report += `\n🚨 **EMERGENCY PROTOCOL**:\n`;
      report += `   💊 Run 'fixer emergency' for automated crisis resolution\n`;
      report += `   🏥 The Fixer will attempt to revive your build\n`;
      report += `   ⚡ Emergency fixes target critical syntax and import errors\n`;
    }
    
    return report;
  }

  getErrorEmoji(errorType) {
    const emojis = {
      typescript: '📘',
      syntax: '⚠️',
      import: '📦',
      runtime: '🔥',
      test: '🧪'
    };
    return emojis[errorType] || '❌';
  }
}

module.exports = { Fixer }; 