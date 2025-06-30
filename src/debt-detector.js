const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

/**
 * Core debt detection engine for Refuctor
 * Integrates markdownlint, cspell, npm audit, and custom rules
 */
class DebtDetector {
  constructor() {
    this.debtThresholds = {
      p1: { markdownWarnings: 50, spellErrors: 20, securityHigh: 1 },
      p2: { markdownWarnings: 10, spellErrors: 5, securityMedium: 3 },
      p3: { markdownWarnings: 3, spellErrors: 2, unused: 5 },
      p4: { markdownWarnings: 1, spellErrors: 1, style: 10 }
    };
  }

  /**
   * Main project scanning function
   * @param {string} projectPath - Path to project root
   * @param {boolean} verbose - Show detailed output
   * @returns {Object} Debt report with P1-P4 categorization
   */
  async scanProject(projectPath, verbose = false) {
    const debtReport = {
      timestamp: new Date().toISOString(),
      projectPath,
      totalDebt: 0,
      p1: [], // Critical - foreclosure imminent
      p2: [], // High - repossession notice  
      p3: [], // Medium - liens filed
      p4: [], // Low - interest accruing
      summary: {},
      details: verbose ? {} : null
    };

    try {
      // Run all debt detection methods
      const markdownDebt = await this.detectMarkdownDebt(projectPath);
      const spellDebt = await this.detectSpellingDebt(projectPath);
      const securityDebt = await this.detectSecurityDebt(projectPath);
      const dependencyDebt = await this.detectDependencyDebt(projectPath);

      // Categorize and merge results
      this.categorizeDebt(debtReport, 'markdown', markdownDebt);
      this.categorizeDebt(debtReport, 'spelling', spellDebt);  
      this.categorizeDebt(debtReport, 'security', securityDebt);
      this.categorizeDebt(debtReport, 'dependencies', dependencyDebt);

      // Calculate totals
      debtReport.totalDebt = debtReport.p1.length + debtReport.p2.length + 
                           debtReport.p3.length + debtReport.p4.length;

      // Generate summary
      debtReport.summary = {
        markdown: markdownDebt.total,
        spelling: spellDebt.total,
        security: securityDebt.total,
        dependencies: dependencyDebt.total,
        debtLevel: this.calculateDebtLevel(debtReport)
      };

      if (verbose) {
        debtReport.details = {
          markdown: markdownDebt,
          spelling: spellDebt,
          security: securityDebt,
          dependencies: dependencyDebt
        };
      }

      return debtReport;

    } catch (error) {
      throw new Error(`Debt detection failed: ${error.message}`);
    }
  }

  /**
   * Detect markdown linting issues
   */
  async detectMarkdownDebt(projectPath) {
    const debt = { total: 0, issues: [], files: [] };
    
    try {
      const markdownFiles = glob.sync('**/*.{md,mdc}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });

      if (markdownFiles.length === 0) {
        return debt;
      }

      // Run markdownlint
      const cmd = `npx --yes markdownlint-cli "${markdownFiles.join('" "')}"`;
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // If we get here, no linting errors (markdownlint exits 0 for no errors)
      debt.total = 0;

    } catch (error) {
      // markdownlint exits with code 1 when issues found
      if (error.status === 1 && error.stdout) {
        const lines = error.stdout.trim().split('\n');
        debt.total = lines.length;
        debt.issues = lines.map(line => {
          const match = line.match(/^(.+):(\d+):?\d*\s+(.+)\s+(.+)$/);
          if (match) {
            return {
              file: match[1],
              line: parseInt(match[2]),
              rule: match[4],
              message: match[3]
            };
          }
          return { raw: line };
        });
        
        debt.files = [...new Set(debt.issues.map(i => i.file).filter(Boolean))];
      } else {
        throw error;
      }
    }

    return debt;
  }

  /**
   * Detect spelling issues
   */
  async detectSpellingDebt(projectPath) {
    const debt = { total: 0, issues: [], files: [] };
    
    try {
      // Check if cspell config exists
      const configFiles = ['cspell.json', '.cspell.json', 'cspell.config.js'];
      const hasConfig = configFiles.some(file => fs.existsSync(path.join(projectPath, file)));
      
      // Run cspell
      const cmd = `npx --yes cspell "**/*.{md,js,ts,json,mdc}" --no-progress --no-summary`;
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // If we get here, no spelling errors
      debt.total = 0;

    } catch (error) {
      // cspell exits with code 1 when issues found
      if (error.status === 1 && error.stdout) {
        const lines = error.stdout.trim().split('\n').filter(line => line.includes('Unknown word'));
        debt.total = lines.length;
        debt.issues = lines.map(line => {
          const match = line.match(/^(.+):(\d+):(\d+)\s+-\s+Unknown word \((.+)\)/);
          if (match) {
            return {
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              word: match[4]
            };
          }
          return { raw: line };
        });
        
        debt.files = [...new Set(debt.issues.map(i => i.file).filter(Boolean))];
      } else if (!error.stdout || error.stdout.trim() === '') {
        // No output usually means no issues
        debt.total = 0;
      } else {
        throw error;
      }
    }

    return debt;
  }

  /**
   * Detect security vulnerabilities
   */
  async detectSecurityDebt(projectPath) {
    const debt = { total: 0, issues: [], severity: {} };
    
    try {
      // Check if package.json exists
      if (!fs.existsSync(path.join(projectPath, 'package.json'))) {
        return debt;
      }

      // Run npm audit
      const cmd = 'npm audit --json';
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(result);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
          debt.issues.push({
            package: pkg,
            severity: vuln.severity,
            title: vuln.title,
            range: vuln.range
          });
          
          debt.severity[vuln.severity] = (debt.severity[vuln.severity] || 0) + 1;
        });
        
        debt.total = debt.issues.length;
      }

    } catch (error) {
      // npm audit can exit with non-zero for vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          if (auditData.vulnerabilities) {
            Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
              debt.issues.push({
                package: pkg,
                severity: vuln.severity,
                title: vuln.title || 'Security vulnerability',
                range: vuln.range
              });
              
              debt.severity[vuln.severity] = (debt.severity[vuln.severity] || 0) + 1;
            });
            
            debt.total = debt.issues.length;
          }
        } catch (parseError) {
          // If we can't parse JSON, skip security scan for now
          debt.total = 0;
        }
      }
    }

    return debt;
  }

  /**
   * Detect dependency issues
   */
  async detectDependencyDebt(projectPath) {
    const debt = { total: 0, unused: [], outdated: [] };
    
    try {
      // Check if package.json exists
      const packagePath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packagePath)) {
        return debt;
      }

      // For now, we'll implement basic dependency checking
      // Future: integrate with tools like depcheck or npm-check
      const packageJson = await fs.readJson(packagePath);
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Simple heuristic: if package.json has deps but no node_modules, flag it
      const hasNodeModules = fs.existsSync(path.join(projectPath, 'node_modules'));
      
      if (Object.keys(dependencies).length > 0 && !hasNodeModules) {
        debt.unused.push('Dependencies defined but node_modules missing - run npm install');
        debt.total = 1;
      }

    } catch (error) {
      // Skip dependency analysis if it fails
      debt.total = 0;
    }

    return debt;
  }

  /**
   * Categorize debt into P1-P4 priorities
   */
  categorizeDebt(debtReport, category, debtData) {
    const { total, issues = [], severity = {} } = debtData;
    
    if (total === 0) return;

    // P1 Critical thresholds
    if (category === 'markdown' && total >= this.debtThresholds.p1.markdownWarnings) {
      debtReport.p1.push(`${total} markdown linting errors - This is fucking embarrassing. Fix it NOW.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.p1.spellErrors) {
      debtReport.p1.push(`${total} spelling errors - Your spell checker filed for bankruptcy.`);
    } else if (category === 'security' && (severity.critical > 0 || severity.high >= this.debtThresholds.p1.securityHigh)) {
      debtReport.p1.push(`${severity.critical || 0} critical + ${severity.high || 0} high security vulnerabilities - Call the cyber police.`);
    }
    
    // P2 High thresholds  
    else if (category === 'markdown' && total >= this.debtThresholds.p2.markdownWarnings) {
      debtReport.p2.push(`${total} markdown linting errors - We're taking back the repo. Clean this today.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.p2.spellErrors) {
      debtReport.p2.push(`${total} spelling errors - Dictionary.com is judging you.`);
    } else if (category === 'security' && severity.medium >= this.debtThresholds.p2.securityMedium) {
      debtReport.p2.push(`${severity.medium} medium security vulnerabilities - Not great, Bob.`);
    }
    
    // P3 Medium thresholds
    else if (category === 'markdown' && total >= this.debtThresholds.p3.markdownWarnings) {
      debtReport.p3.push(`${total} markdown linting errors - A bit crusty. Handle it this sprint.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.p3.spellErrors) {
      debtReport.p3.push(`${total} spelling errors - Autocorrect is crying.`);
    } else if (category === 'dependencies' && total > 0) {
      debtReport.p3.push(`${total} dependency issues - Your package.json needs therapy.`);
    }
    
    // P4 Low (everything else)
    else if (total > 0) {
      debtReport.p4.push(`${total} ${category} issues - Minor blemish. But you'll pay later...`);
    }
  }

  /**
   * Calculate overall debt level
   */
  calculateDebtLevel(debtReport) {
    if (debtReport.p1.length > 0) return 'CRITICAL';
    if (debtReport.p2.length > 0) return 'HIGH';  
    if (debtReport.p3.length > 0) return 'MEDIUM';
    if (debtReport.p4.length > 0) return 'LOW';
    return 'CLEAN';
  }

  /**
   * Generate humorous shame report
   */
  async generateShameReport(projectPath) {
    const debtReport = await this.scanProject(projectPath, true);
    
    const shameReport = {
      totalShame: debtReport.totalDebt,
      shameLevel: this.calculateShameLevel(debtReport.totalDebt),
      timeWasted: Math.round(debtReport.totalDebt * 0.5), // 30 minutes per issue
      cleanupCost: Math.round(debtReport.totalDebt * 75), // $75 per issue
      shameItems: []
    };

    // Generate shame items based on debt
    if (debtReport.p1.length > 0) {
      shameReport.shameItems.push({
        emoji: '🚨',
        description: 'Your code is in foreclosure. Even the bank won\'t take it.'
      });
    }
    
    if (debtReport.summary.spelling > 10) {
      shameReport.shameItems.push({
        emoji: '📚', 
        description: 'Your spelling is so bad, autocorrect gave up and moved out.'
      });
    }
    
    if (debtReport.summary.security > 0) {
      shameReport.shameItems.push({
        emoji: '🔒',
        description: 'Your security holes are so big, hackers are leaving thank you notes.'
      });
    }

    if (debtReport.totalDebt === 0) {
      shameReport.shameItems.push({
        emoji: '🏆',
        description: 'No shame detected. You are the chosen one.'
      });
    }

    return shameReport;
  }

  /**
   * Calculate shame level based on total debt
   */
  calculateShameLevel(totalDebt) {
    if (totalDebt === 0) return 'spotless';
    if (totalDebt < 5) return 'mild embarrassment';
    if (totalDebt < 15) return 'public humiliation';
    if (totalDebt < 30) return 'professional disgrace';
    return 'career ending';
  }
}

// Export singleton instance
const debtDetector = new DebtDetector();
module.exports = { debtDetector, DebtDetector }; 