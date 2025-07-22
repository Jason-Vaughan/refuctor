const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const { DebtIgnoreParser } = require('../debt-ignore-parser');

/**
 * Fix-Lint Goon - Aggressive code quality debt elimination
 * Part of the Refuctor Debt Collection Agency
 * 
 * "When your code is so broken even ESLint files for bankruptcy"
 */
class FixLintGoon {
  constructor() {
    this.name = 'Fix-Lint Goon';
    this.personality = 'Aggressive code quality enforcement specialist';
    this.fixCount = 0;
    this.snarkLevel = 12; // Even more aggressive than markdown fixer
    this.ignoreParser = new DebtIgnoreParser();
    
    // Supported file patterns and their fixers
    this.linters = {
      javascript: {
        patterns: ['**/*.js', '**/*.jsx'],
        fixer: 'eslint',
        command: 'npx eslint --fix'
      },
      typescript: {
        patterns: ['**/*.ts', '**/*.tsx'],
        fixer: 'eslint',
        command: 'npx eslint --fix'
      },
      json: {
        patterns: ['**/*.json'],
        fixer: 'prettier',
        command: 'npx prettier --write'
      }
    };
  }

  /**
   * Main entry point - Fix all linting violations in project or specific files
   * @param {string} projectPath - Project root directory
   * @param {Object} options - Configuration options
   * @returns {Object} Fix report with comprehensive metrics
   */
  async eliminateDebt(projectPath = '.', options = {}) {
    const { dryRun = true, filePattern = null, types = ['javascript', 'typescript', 'json'] } = options;
    
    console.log(`🔧 FIX-LINT GOON DEPLOYED`);
    console.log(`💀 ${this.personality}`);
    console.log(`🎯 Mode: ${dryRun ? 'DRY RUN (Preview)' : 'LIVE FIXES'}`);
    console.log(`📂 Target: ${path.resolve(projectPath)}\n`);
    
    // Load debt ignore patterns
    await this.ignoreParser.loadIgnorePatterns(projectPath);
    
    const report = {
      goon: this.name,
      projectPath: path.resolve(projectPath),
      mode: dryRun ? 'dry-run' : 'live-fixes',
      startTime: new Date().toISOString(),
      totalFilesProcessed: 0,
      totalFilesIgnored: 0,
      totalFixesApplied: 0,
      fixesByType: {},
      ignoredFiles: [],
      errors: [],
      snarkLevel: this.snarkLevel
    };

    // Process each linter type
    for (const linterType of types) {
      if (!this.linters[linterType]) {
        console.log(`⚠️  Unknown linter type: ${linterType}. Skipping...`);
        continue;
      }

      const linterReport = await this.processLinterType(projectPath, linterType, dryRun, filePattern);
      report.fixesByType[linterType] = linterReport;
      report.totalFilesProcessed += linterReport.filesProcessed;
      report.totalFilesIgnored += linterReport.filesIgnored;
      report.totalFixesApplied += linterReport.fixesApplied;
      report.ignoredFiles.push(...linterReport.ignoredFiles);
      report.errors.push(...linterReport.errors);
    }

    // Generate final report
    report.endTime = new Date().toISOString();
    report.duration = new Date(report.endTime) - new Date(report.startTime);
    
    this.generateSnarkySummary(report);
    
    return report;
  }

  /**
   * Process files for a specific linter type
   */
  async processLinterType(projectPath, linterType, dryRun, filePattern) {
    const linterConfig = this.linters[linterType];
    const report = {
      linterType,
      fixer: linterConfig.fixer,
      filesProcessed: 0,
      filesIgnored: 0,
      fixesApplied: 0,
      ignoredFiles: [],
      processedFiles: [],
      errors: []
    };

    console.log(`\n🎯 Processing ${linterType.toUpperCase()} files...`);
    
    // Find files matching patterns
    const patterns = filePattern ? [filePattern] : linterConfig.patterns;
    let allFiles = [];
    
    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      allFiles.push(...files);
    }
    
    // Remove duplicates
    allFiles = [...new Set(allFiles)];
    
    if (allFiles.length === 0) {
      console.log(`   📭 No ${linterType} files found to process`);
      return report;
    }

    console.log(`   📁 Found ${allFiles.length} ${linterType} files`);

    // Separate ignored vs processable files
    const filesToProcess = [];
    const ignoredFiles = [];
    
    for (const file of allFiles) {
      if (this.ignoreParser.shouldIgnore(file)) {
        ignoredFiles.push(file);
        console.log(`   🏖️ ${file} - ${this.ignoreParser.getDebtHolidayMessage(file)}`);
      } else {
        filesToProcess.push(file);
      }
    }
    
    report.filesIgnored = ignoredFiles.length;
    report.ignoredFiles = ignoredFiles;

    if (filesToProcess.length === 0) {
      console.log(`   🏝️ All ${linterType} files are on debt holiday!`);
      return report;
    }

    console.log(`   🔧 Processing ${filesToProcess.length} ${linterType} files...`);

    // Process each file
    for (const file of filesToProcess) {
      try {
        const filePath = path.join(projectPath, file);
        const fixResult = await this.fixSingleFile(filePath, linterConfig, dryRun);
        
        if (fixResult.fixesApplied > 0) {
          report.fixesApplied += fixResult.fixesApplied;
          report.processedFiles.push({
            file,
            fixes: fixResult.fixesApplied,
            issues: fixResult.issues || []
          });
          console.log(`   ✅ ${file}: ${fixResult.fixesApplied} fixes ${dryRun ? 'would be' : ''} applied`);
        } else {
          console.log(`   ✨ ${file}: Already clean (you magnificent developer!)`);
        }
        
        report.filesProcessed++;
        
      } catch (error) {
        report.errors.push({
          file,
          error: error.message
        });
        console.log(`   ❌ ${file}: Error - ${error.message}`);
      }
    }

    return report;
  }

  /**
   * Fix a single file using the appropriate linter
   */
  async fixSingleFile(filePath, linterConfig, dryRun) {
    const result = {
      filePath,
      fixesApplied: 0,
      issues: []
    };

    try {
      // Check current issues (before fix)
      const beforeIssues = await this.getLintIssues(filePath, linterConfig);
      
      if (beforeIssues.length === 0) {
        return result;
      }

      if (!dryRun) {
        // Apply fixes
        const fixCommand = `${linterConfig.command} "${filePath}"`;
        try {
          execSync(fixCommand, { 
            cwd: path.dirname(filePath),
            stdio: 'pipe'
          });
        } catch (fixError) {
          // ESLint/Prettier may exit with non-zero even when fixes are applied
          // This is normal behavior, so we continue to check the results
        }
      }

      // Check issues after fix (or simulate for dry run)
      const afterIssues = dryRun ? [] : await this.getLintIssues(filePath, linterConfig);
      
      result.fixesApplied = beforeIssues.length - afterIssues.length;
      result.issues = dryRun ? beforeIssues : afterIssues;
      
      return result;
      
    } catch (error) {
      throw new Error(`Failed to process ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get current lint issues for a file
   */
  async getLintIssues(filePath, linterConfig) {
    try {
      let checkCommand;
      
      switch (linterConfig.fixer) {
        case 'eslint':
          checkCommand = `npx eslint --format json "${filePath}"`;
          break;
        case 'prettier':
          checkCommand = `npx prettier --check "${filePath}"`;
          break;
        default:
          return [];
      }

      const output = execSync(checkCommand, {
        cwd: path.dirname(filePath),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse output based on linter type
      if (linterConfig.fixer === 'eslint') {
        const results = JSON.parse(output);
        return results[0]?.messages || [];
      } else if (linterConfig.fixer === 'prettier') {
        return []; // No issues if prettier check passes
      }

      return [];
      
    } catch (error) {
      // Linters exit with non-zero when issues found
      if (linterConfig.fixer === 'eslint' && error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return results[0]?.messages || [];
        } catch (parseError) {
          return [];
        }
      } else if (linterConfig.fixer === 'prettier') {
        // Prettier check failed = formatting issues
        return [{ message: 'Formatting issues detected' }];
      }
      
      return [];
    }
  }

  /**
   * Generate snarky summary with Refuctor personality
   */
  generateSnarkySummary(report) {
    console.log(`\n💀 FIX-LINT GOON SUMMARY 💀`);
    console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);
    console.log(`📁 Files Processed: ${report.totalFilesProcessed}`);
    console.log(`🏖️  Files on Debt Holiday: ${report.totalFilesIgnored}`);
    console.log(`🔧 Total Fixes Applied: ${report.totalFixesApplied}`);
    
    if (report.totalFixesApplied === 0 && report.totalFilesProcessed > 0) {
      console.log(`\n🏆 Holy shit, your code is actually clean! The Fix-Lint Goon is... impressed?`);
      console.log(`💎 No debt found. You magnificent code-slaying legend!`);
    } else if (report.totalFixesApplied > 0) {
      console.log(`\n💰 DEBT REFINANCED: ${report.totalFixesApplied} issues ${report.mode === 'dry-run' ? 'would be' : 'have been'} eliminated!`);
      console.log(`🎯 Your code just got a credit score boost!`);
    }

    // Show breakdown by type
    console.log(`\n📊 BREAKDOWN BY TYPE:`);
    for (const [type, typeReport] of Object.entries(report.fixesByType)) {
      console.log(`   ${type}: ${typeReport.fixesApplied} fixes (${typeReport.filesProcessed} files)`);
    }

    if (report.errors.length > 0) {
      console.log(`\n⚠️  ERRORS ENCOUNTERED: ${report.errors.length}`);
      report.errors.slice(0, 5).forEach(error => {
        console.log(`   ❌ ${error.file}: ${error.error}`);
      });
      if (report.errors.length > 5) {
        console.log(`   ... and ${report.errors.length - 5} more errors`);
      }
    }

    console.log(`\n🤌 Fix-Lint Goon: "Capisce? Your code is less embarrassing now."`);
  }
}

module.exports = FixLintGoon; 