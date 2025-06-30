const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('./debt-ignore-parser');

/**
 * Core debt detection engine for Refuctor
 * Integrates markdownlint, cspell, npm audit, and custom rules
 */
class DebtDetector {
  constructor() {
    this.debtThresholds = {
      mafia: { markdownWarnings: 100, spellErrors: 50, securityCritical: 3, extremeDebt: 75, daysOverdue: 3 }, // Mafia Takeover
      guido: { markdownWarnings: 200, spellErrors: 100, securityCritical: 5, extremeDebt: 150, vigorishDays: 2 }, // Guido Deployment
      p1: { markdownWarnings: 50, spellErrors: 20, securityHigh: 1 },
      p2: { markdownWarnings: 10, spellErrors: 5, securityMedium: 3 },
      p3: { markdownWarnings: 3, spellErrors: 2, unused: 5 },
      p4: { markdownWarnings: 1, spellErrors: 1, style: 10 }
    };
    this.ignoreParser = new DebtIgnoreParser();
    this.mafiaMessages = [
      "🕴️ Your debt has been purchased by... let's call them 'private investors'.",
      "💰 Congratulations! You now owe the family. VIGorish is 20% per day. Compounded.",
      "🎰 The house always wins, but your code? Your code NEVER wins.",
      "🍕 Tony says hi. He also says pay up before he sends his nephew.",
      "📞 *Ring ring* 'Is this about the debt?' 'What debt? We never had this conversation.'",
      "🚗 Nice development environment you got there. Shame if it suddenly... crashed.",
      "💼 Your debt collector quit. We bought the contract. Welcome to the big leagues.",
      "🔫 We don't break legs anymore. We break build pipelines. Much more effective."
    ];
    this.guidoMessages = [
      "🤌 Guido here. You owe me big time, capisce? Your fingers might 'accidentally' forget how to type...",
      "👨‍💼 *cracks knuckles* Nice coding setup you got here. Shame if something happened to it...",
      "🚬 Listen here, wise guy. The Debt Collection Agency? They're AMATEURS compared to what I do.",
      "💀 Your technical debt is so bad, even the grim reaper filed a complaint. Fix it or I fix YOU.",
      "🔨 I don't just break kneecaps - I break code compilation. Permanently.",
      "🎯 You think P1 Critical was bad? Wait till you meet P0 'Thumb Crusher' priority.",
      "🏚️ Your codebase is condemned. I'm here for the demolition... starting with your IDE.",
      "💸 The Collection Agency gave up on you. Now you deal with ME. Payment is due... in BLOOD... sugar. I'm diabetic.",
      "⚡ Your debt is so extreme, I had to come out of retirement. This better be worth my time.",
      "🎭 I've seen cleaner code in a dumpster fire. Actually, the dumpster fire had better documentation."
    ];
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
      guido: [], // Ultimate escalation - Thumb Crusher deployed
      mafia: [], // Loan shark level - debt sold to family, vigorish charged
      p1: [], // Critical - foreclosure imminent
      p2: [], // High - repossession notice  
      p3: [], // Medium - liens filed
      p4: [], // Low - interest accruing
      summary: {},
      ignoredFiles: verbose ? [] : null,
      ignoredDebt: verbose ? { total: 0, files: [] } : null,
      details: verbose ? {} : null,
      mafiaStatus: null, // Loan shark takeover status
      guidoAppearance: null // Thumb crusher deployment
    };

    try {
      // Load debt ignore patterns first
      await this.ignoreParser.loadIgnorePatterns(projectPath);
      
      if (verbose) {
        console.log(`\n📋 Ignore patterns loaded: ${this.ignoreParser.getPatterns().length}`);
        const customPatterns = this.ignoreParser.getPatterns().slice(6); // Skip default patterns
        if (customPatterns.length > 0) {
          console.log(`🚫 Custom ignore patterns: ${customPatterns.join(', ')}`);
        }
      }
      
      // Run all debt detection methods
      const markdownDebt = await this.detectMarkdownDebt(projectPath, verbose);
      const spellDebt = await this.detectSpellingDebt(projectPath);
      const securityDebt = await this.detectSecurityDebt(projectPath);
      const dependencyDebt = await this.detectDependencyDebt(projectPath);

      // Store ignored file information if verbose
      if (verbose) {
        debtReport.ignoredFiles = markdownDebt.ignoredFiles || [];
        debtReport.ignoredDebt = markdownDebt.ignoredDebt || { total: 0, files: [] };
      }

      // Categorize and merge results
      this.categorizeDebt(debtReport, 'markdown', markdownDebt);
      this.categorizeDebt(debtReport, 'spelling', spellDebt);  
      this.categorizeDebt(debtReport, 'security', securityDebt);
      this.categorizeDebt(debtReport, 'dependencies', dependencyDebt);

      // Calculate totals
      debtReport.totalDebt = debtReport.guido.length + debtReport.mafia.length + debtReport.p1.length + 
                           debtReport.p2.length + debtReport.p3.length + debtReport.p4.length;

      // Check for mafia takeover and Guido escalation
      await this.checkMafiaStatus(debtReport);
      this.checkForGuidoDeployment(debtReport);

      // Generate summary
      debtReport.summary = {
        markdown: markdownDebt.total,
        spelling: spellDebt.total,
        security: securityDebt.total,
        dependencies: dependencyDebt.total,
        debtLevel: this.calculateDebtLevel(debtReport)
      };

      // Show ignored debt summary if verbose
      if (verbose && debtReport.ignoredDebt && debtReport.ignoredDebt.total > 0) {
        console.log(`\n🚫 IGNORED DEBT DETECTED:`);
        console.log(`   Files with ignored issues: ${debtReport.ignoredDebt.files.length}`);
        console.log(`   Total ignored debt items: ${debtReport.ignoredDebt.total}`);
        console.log(`   Ignored files: ${debtReport.ignoredFiles.join(', ')}`);
        console.log(`   💡 These files have issues but are excluded from debt tracking`);
      }

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
      console.warn(`Warning during debt detection: ${error.message}`);
      // Continue with partial results, ensure totalDebt is defined
      debtReport.totalDebt = debtReport.guido.length + debtReport.mafia.length + debtReport.p1.length + 
                           debtReport.p2.length + debtReport.p3.length + debtReport.p4.length;
      debtReport.summary = {
        markdown: 0,
        spelling: 0,
        security: 0,
        dependencies: 0,
        debtLevel: 'unknown'
      };
      
      return debtReport;
    }
  }

  /**
   * Detect markdown linting issues
   */
  async detectMarkdownDebt(projectPath, verbose = false) {
    const debt = { total: 0, issues: [], files: [], ignoredFiles: [], ignoredDebt: { total: 0, files: [] } };
    
    try {
      const allMarkdownFiles = glob.sync('**/*.{md,mdc}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**']  // Basic ignore only
      });
      
      // Separate ignored and non-ignored files
      const markdownFiles = [];
      const ignoredFiles = [];
      
      for (const file of allMarkdownFiles) {
        if (this.ignoreParser.shouldIgnore(file)) {
          ignoredFiles.push(file);
        } else {
          markdownFiles.push(file);
        }
      }
      
      debt.ignoredFiles = ignoredFiles;
      
      if (verbose && ignoredFiles.length > 0) {
        console.log(`\n🚫 Ignoring ${ignoredFiles.length} markdown files: ${ignoredFiles.join(', ')}`);
      }
      
      if (verbose && markdownFiles.length > 0) {
        console.log(`📝 Scanning ${markdownFiles.length} markdown files: ${markdownFiles.join(', ')}`);
      }

      // Check ignored files for debt (for reporting purposes)
      if (verbose && ignoredFiles.length > 0) {
        console.log(`\n🔍 Checking ignored files for debt issues...`);
        for (const file of ignoredFiles) {
          try {
            const cmd = `npx --yes markdownlint-cli "${file}"`;
            execSync(cmd, { 
              cwd: projectPath, 
              encoding: 'utf8',
              stdio: 'pipe'
            });
            // No issues found in this ignored file
            console.log(`   ✅ ${file} - no issues`);
          } catch (error) {
            if (error.status === 1 && (error.stdout || error.stderr)) {
              // markdownlint sends output to stderr, not stdout
              const output = error.stderr || error.stdout;
              const lines = output.trim().split('\n');
              debt.ignoredDebt.total += lines.length;
              if (!debt.ignoredDebt.files.includes(file)) {
                debt.ignoredDebt.files.push(file);
              }
              console.log(`   🚫 ${file} - ${lines.length} issues (ignored)`);
            }
          }
        }
      }

      if (markdownFiles.length === 0) {
        return debt;
      }

      // Run markdownlint on non-ignored files
      const cmd = `npx --yes markdownlint-cli "${markdownFiles.join('" "')}"`;
      try {
        const result = execSync(cmd, { 
          cwd: projectPath, 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        // If we get here, no linting errors (markdownlint exits 0 for no errors)
        debt.total = 0;
      } catch (error) {
        // markdownlint exits with code 1 when issues found
        if (error.status === 1 && (error.stdout || error.stderr)) {
          // markdownlint sends output to stderr, not stdout
          const output = error.stderr || error.stdout;
          const lines = output.trim().split('\n');
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

    } catch (error) {
      throw error;
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
   * Categorize debt into Mafia/Guido/P1-P4 priorities
   */
  categorizeDebt(debtReport, category, debtData) {
    const { total, issues = [], severity = {} } = debtData;
    
    if (total === 0) return;

    // Guido Level (ULTIMATE ESCALATION)
    if (category === 'markdown' && total >= this.debtThresholds.guido.markdownWarnings) {
      debtReport.guido.push(`${total} markdown errors - 🤌 Guido: "Capisce? Your documentation is DONE."`);
    } else if (category === 'spelling' && total >= this.debtThresholds.guido.spellErrors) {
      debtReport.guido.push(`${total} spelling errors - 🔨 Guido: "I've seen cleaner spelling in ransom notes."`);
    } else if (category === 'security' && severity.critical >= this.debtThresholds.guido.securityCritical) {
      debtReport.guido.push(`${severity.critical} critical security holes - 💀 Guido: "Your security is so bad, I'm embarrassed FOR you."`);
    }
    
    // Mafia Level (LOAN SHARK TAKEOVER)
    else if (category === 'markdown' && total >= this.debtThresholds.mafia.markdownWarnings) {
      debtReport.mafia.push(`${total} markdown errors - 🕴️ The Family owns this debt now. VIGorish starts today.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.mafia.spellErrors) {
      debtReport.mafia.push(`${total} spelling errors - 💰 Tony's dictionary says you owe us. With interest.`);
    } else if (category === 'security' && severity.critical >= this.debtThresholds.mafia.securityCritical) {
      debtReport.mafia.push(`${severity.critical} critical security holes - 🚗 Nice firewall. Shame if it 'malfunctioned'.`);
    }
    
    // P1 Critical thresholds
    else if (category === 'markdown' && total >= this.debtThresholds.p1.markdownWarnings) {
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
    if (debtReport.guido.length > 0) return 'GUIDO_DEPLOYED';
    if (debtReport.mafia.length > 0) return 'MAFIA_TAKEOVER';
    if (debtReport.p1.length > 0) return 'CRITICAL';
    if (debtReport.p2.length > 0) return 'HIGH';  
    if (debtReport.p3.length > 0) return 'MEDIUM';
    if (debtReport.p4.length > 0) return 'LOW';
    return 'CLEAN';
  }

  /**
   * Check for mafia takeover (debt sold to loan sharks)
   */
  async checkMafiaStatus(debtReport) {
    const totalDebt = debtReport.totalDebt;
    const hasMafiaDebt = debtReport.mafia.length > 0;
    const extremeP1 = debtReport.p1.length >= 5; // 5+ critical issues
    const projectFailing = totalDebt >= this.debtThresholds.mafia.extremeDebt;

    // Check if debt should be sold to mafia
    if (hasMafiaDebt || extremeP1 || projectFailing) {
      const debtAge = await this.getDebtAge(debtReport.projectPath);
      const vigorishRate = this.calculateVigorish(totalDebt);
      
      debtReport.mafiaStatus = {
        triggered: true,
        reason: hasMafiaDebt ? 'MAFIA_DEBT_DETECTED' : 
                extremeP1 ? 'MASSIVE_P1_DEBT' : 
                'PROJECT_FAILING',
        message: this.mafiaMessages[Math.floor(Math.random() * this.mafiaMessages.length)],
        vigorishRate: vigorishRate,
        debtAge: debtAge,
        dailyPenalty: Math.round(totalDebt * (vigorishRate / 100)),
        recommendation: '💰 DEBT SOLD TO FAMILY: Your technical debt has been purchased by private investors. VIGorish is now being charged daily.'
      };
    }
  }

  /**
   * Check if Guido the Thumb Crusher should be deployed
   */
  checkForGuidoDeployment(debtReport) {
    const hasGuidoDebt = debtReport.guido.length > 0;
    const mafiaOverdue = debtReport.mafiaStatus && debtReport.mafiaStatus.debtAge >= this.debtThresholds.guido.vigorishDays;
    const extremeTotal = debtReport.totalDebt >= this.debtThresholds.guido.extremeDebt;

    // Guido appears when vigorish goes unpaid or extreme debt reached
    if (hasGuidoDebt || mafiaOverdue || extremeTotal) {
      const randomMessage = this.guidoMessages[Math.floor(Math.random() * this.guidoMessages.length)];
      
      debtReport.guidoAppearance = {
        triggered: true,
        reason: hasGuidoDebt ? 'GUIDO_DEBT_DETECTED' : 
                mafiaOverdue ? 'VIGORISH_OVERDUE' : 
                'EXTREME_TOTAL_DEBT',
        message: randomMessage,
        threatLevel: 'THUMB_CRUSHER',
        daysOverdue: debtReport.mafiaStatus ? debtReport.mafiaStatus.debtAge : 0,
        recommendation: '🤌 GUIDO DEPLOYED: VIGorish payment overdue. The Thumb Crusher is here for collection. Fix debt NOW or face "coding accidents".'
      };
    }
  }

  /**
   * Calculate VIGorish rate based on debt level
   */
  calculateVigorish(totalDebt) {
    if (totalDebt >= 150) return 25; // 25% daily for extreme debt
    if (totalDebt >= 100) return 20; // 20% daily for high debt
    if (totalDebt >= 50) return 15;  // 15% daily for moderate debt
    return 10; // 10% daily minimum vigorish
  }

  /**
   * Get debt age in days (mock implementation for now)
   */
  async getDebtAge(projectPath) {
    // TODO: Implement proper debt age tracking via TECHDEBT.md timestamps
    // For now, return random age for demonstration
    return Math.floor(Math.random() * 7); // 0-6 days
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
    if (totalDebt < 150) return 'career ending';
    return 'guido territory'; // Beyond career ending - loan shark level
  }

  /**
   * Get a random Guido threat message
   */
  getGuidoMessage() {
    return this.guidoMessages[Math.floor(Math.random() * this.guidoMessages.length)];
  }
}

// Export singleton instance
const debtDetector = new DebtDetector();
module.exports = { debtDetector, DebtDetector }; 