const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('./debt-ignore-parser');
const SnarkySpellHandler = require('./snarky-spell-handler');

/**
 * Core debt detection engine for Refuctor
 * Integrates markdownlint, cspell, npm audit, ESLint, TypeScript, and custom rules
 */
class DebtDetector {
  constructor() {
    this.debtThresholds = {
      mafia: { 
        markdownWarnings: 50, spellErrors: 25, securityCritical: 3, 
        eslintErrors: 75, tsErrors: 30, consoleLogs: 20, todos: 15,
        extremeDebt: 100, daysOverdue: 3 
      },
      guido: { 
        markdownWarnings: 100, spellErrors: 50, securityCritical: 5, 
        eslintErrors: 150, tsErrors: 50, consoleLogs: 40, todos: 30,
        extremeDebt: 200, vigorishDays: 2 
      },
      p1: { 
        markdownWarnings: 20, spellErrors: 10, securityHigh: 1,
        eslintErrors: 25, tsErrors: 10, consoleLogs: 8, todos: 8
      },
      p2: { 
        markdownWarnings: 5, spellErrors: 3, securityMedium: 3,
        eslintErrors: 10, tsErrors: 5, consoleLogs: 4, todos: 4
      },
      p3: { 
        markdownWarnings: 2, spellErrors: 1, unused: 5,
        eslintWarnings: 5, formatting: 10, deadCode: 3
      },
      p4: { 
        markdownWarnings: 1, spellErrors: 1, style: 10,
        eslintWarnings: 1, minorIssues: 5
      }
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
      guidoAppearance: null, // Thumb crusher deployment
      fileDebtMap: {},
      topHotspots: [],
      debtTrend: null
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
      
      // Run all debt detection methods with graceful fallbacks
      const markdownDebt = await this.detectMarkdownDebt(projectPath, verbose);
      const spellDebt = await this.detectSpellingDebt(projectPath);
      const securityDebt = await this.detectSecurityDebt(projectPath);
      const dependencyDebt = await this.detectDependencyDebt(projectPath);
      
      // Enhanced detection methods (with fallbacks for older versions)
      const eslintDebt = this.detectESLintDebt ? await this.detectESLintDebt(projectPath) : { total: 0, errors: 0, warnings: 0 };
      const typescriptDebt = this.detectTypeScriptDebt ? await this.detectTypeScriptDebt(projectPath) : { total: 0, errors: [] };
      const codeQualityDebt = this.detectCodeQualityDebt ? await this.detectCodeQualityDebt(projectPath) : { total: 0, consoleLogs: [], todos: [] };
      const formattingDebt = this.detectFormattingDebt ? await this.detectFormattingDebt(projectPath) : { total: 0, issues: [] };

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
      this.categorizeDebt(debtReport, 'eslint', eslintDebt);
      this.categorizeDebt(debtReport, 'typescript', typescriptDebt);
      this.categorizeDebt(debtReport, 'code-quality', codeQualityDebt);
      this.categorizeDebt(debtReport, 'formatting', formattingDebt);

      // Calculate totals - count actual issues, not categories
      debtReport.totalDebt = markdownDebt.total + spellDebt.total + securityDebt.total + dependencyDebt.total + 
                           eslintDebt.total + typescriptDebt.total + codeQualityDebt.total + formattingDebt.total;

      // Check for mafia takeover and Guido escalation
      await this.checkMafiaStatus(debtReport);
      this.checkForGuidoDeployment(debtReport);

      // Generate summary
      debtReport.summary = {
        markdown: markdownDebt.total,
        spelling: spellDebt.total,
        security: securityDebt.total,
        dependencies: dependencyDebt.total,
        eslint: eslintDebt.total,
        typescript: typescriptDebt.total,
        codeQuality: codeQualityDebt.total,
        formatting: formattingDebt.total,
        snarkyProcessed: spellDebt.snarkyProcessed || false,
        snarkyAdded: spellDebt.snarkyAdded || 0,
        debtLevel: this.calculateDebtLevel(debtReport),
        p1: debtReport.p1.length,
        p2: debtReport.p2.length,
        p3: debtReport.p3.length,
        p4: debtReport.p4.length,
        total: debtReport.totalDebt
      };

      // Generate heat map data for dashboard visualization
      debtReport.fileDebtMap = this.generateFileDebtMap(debtReport, {
        markdown: markdownDebt,
        spelling: spellDebt,
        security: securityDebt,
        dependencies: dependencyDebt,
        eslint: eslintDebt,
        typescript: typescriptDebt,
        codeQuality: codeQualityDebt,
        formatting: formattingDebt
      });

      debtReport.topHotspots = this.generateDebtHotspots(debtReport.fileDebtMap);
      debtReport.debtTrend = this.calculateDebtTrend(debtReport);

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
          dependencies: dependencyDebt,
          eslint: eslintDebt,
          typescript: typescriptDebt,
          codeQuality: codeQualityDebt,
          formatting: formattingDebt
        };
      }

      return debtReport;

    } catch (error) {
      console.warn(`Warning during debt detection: ${error.message}`);
      // Continue with partial results, ensure totalDebt is defined
      debtReport.totalDebt = 0; // Will be 0 since all individual debt totals will be 0 in error case
      debtReport.summary = {
        markdown: 0,
        spelling: 0,
        security: 0,
        dependencies: 0,
        eslint: 0,
        typescript: 0,
        codeQuality: 0,
        formatting: 0,
        snarkyProcessed: false,
        snarkyAdded: 0,
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
   * Detect spelling issues with integrated snarky intelligence
   */
  async detectSpellingDebt(projectPath) {
    const debt = { total: 0, issues: [], files: [], snarkyProcessed: false, snarkyAdded: 0 };
    
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
        const rawIssues = lines.map(line => {
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

        // 🎯 AUTOMATIC SNARKY INTELLIGENCE ACTIVATED!
        if (rawIssues.length > 0) {
          console.log(`🎯 Snarky Intelligence: Analyzing ${rawIssues.length} spelling issues...`);
          
          try {
            const snarkyHandler = new SnarkySpellHandler();
            const analysis = await snarkyHandler.analyzeSpellingIssues(projectPath, rawIssues);
            
            // Auto-add obvious snarky terms to dictionary
            if (analysis.likelySnarky.length > 0) {
              const dictResult = await snarkyHandler.updateProjectDictionary(
                projectPath, 
                analysis.likelySnarky.map(s => s.word)
              );
              console.log(`📝 Auto-added ${dictResult.wordsAdded} snarky terms to project dictionary`);
              debt.snarkyAdded = dictResult.wordsAdded;
              debt.snarkyProcessed = true;
            }

            // Only report definite typos and uncertain cases as actual debt
            const actualProblems = [...analysis.definiteTypos, ...analysis.unsure];
            debt.issues = actualProblems;
            debt.total = actualProblems.length;
            debt.files = [...new Set(actualProblems.map(i => i.file).filter(Boolean))];

            if (debt.snarkyAdded > 0) {
              console.log(`✅ Reduced spelling debt from ${rawIssues.length} to ${debt.total} (${debt.snarkyAdded} snarky terms whitelisted)`);
            }

          } catch (snarkyError) {
            // Fallback to original behavior if snarky analysis fails
            console.log(`⚠️ Snarky analysis failed, using basic spell check: ${snarkyError.message}`);
            debt.issues = rawIssues;
            debt.total = rawIssues.length;
            debt.files = [...new Set(rawIssues.map(i => i.file).filter(Boolean))];
          }
        }
        
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
   * Detect ESLint issues (JavaScript/TypeScript code quality)
   */
  async detectESLintDebt(projectPath) {
    const debt = { total: 0, errors: 0, warnings: 0, issues: [], files: [] };
    
    try {
      // Check if ESLint config exists
      const configFiles = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js'];
      const hasConfig = configFiles.some(file => fs.existsSync(path.join(projectPath, file)));
      
      // Check for JS/TS files
      const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      
      if (codeFiles.length === 0) {
        return debt; // No code files to lint
      }

      // Run ESLint
      const cmd = `npx --yes eslint ${codeFiles.join(' ')} --format json`;
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const eslintResults = JSON.parse(result);
      
      for (const fileResult of eslintResults) {
        if (fileResult.messages.length > 0) {
          debt.files.push(fileResult.filePath);
          
          for (const message of fileResult.messages) {
            debt.issues.push({
              file: fileResult.filePath,
              line: message.line,
              column: message.column,
              severity: message.severity, // 1 = warning, 2 = error
              rule: message.ruleId,
              message: message.message
            });
            
            if (message.severity === 2) {
              debt.errors++;
            } else {
              debt.warnings++;
            }
          }
        }
      }
      
      debt.total = debt.errors + debt.warnings;

    } catch (error) {
      // ESLint not available or no config - try basic syntax check
      if (error.status === 1 && error.stdout) {
        try {
          const eslintResults = JSON.parse(error.stdout);
          
          for (const fileResult of eslintResults) {
            if (fileResult.messages.length > 0) {
              debt.files.push(fileResult.filePath);
              
              for (const message of fileResult.messages) {
                debt.issues.push({
                  file: fileResult.filePath,
                  line: message.line,
                  column: message.column,
                  severity: message.severity,
                  rule: message.ruleId,
                  message: message.message
                });
                
                if (message.severity === 2) {
                  debt.errors++;
                } else {
                  debt.warnings++;
                }
              }
            }
          }
          
          debt.total = debt.errors + debt.warnings;
        } catch (parseError) {
          // If we can't parse, skip ESLint analysis
          debt.total = 0;
        }
      }
    }

    return debt;
  }

  /**
   * Detect TypeScript compilation errors
   */
  async detectTypeScriptDebt(projectPath) {
    const debt = { total: 0, errors: [], files: [] };
    
    try {
      // Check if TypeScript config exists
      if (!fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
        return debt; // No TypeScript project
      }

      // Check for TS files
      const tsFiles = glob.sync('**/*.{ts,tsx}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      
      if (tsFiles.length === 0) {
        return debt; // No TypeScript files
      }

      // Run TypeScript compiler check
      const cmd = 'npx --yes tsc --noEmit --skipLibCheck';
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // If we get here, no TS errors
      debt.total = 0;

    } catch (error) {
      // TypeScript errors found
      if (error.stdout) {
        const lines = error.stdout.trim().split('\n').filter(line => line.includes('error TS'));
        debt.total = lines.length;
        
        debt.errors = lines.map(line => {
          const match = line.match(/^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
          if (match) {
            return {
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              code: match[4],
              message: match[5]
            };
          }
          return { raw: line };
        });
        
        debt.files = [...new Set(debt.errors.map(e => e.file).filter(Boolean))];
      }
    }

    return debt;
  }

  /**
   * Detect code quality issues (console.logs, TODOs, dead code)
   */
  async detectCodeQualityDebt(projectPath) {
    const debt = { 
      total: 0, 
      consoleLogs: [], 
      todos: [], 
      deadCode: [],
      files: [] 
    };
    
    try {
      // Find all code files
      const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx,vue}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });

      for (const file of codeFiles) {
        const filePath = path.join(projectPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        
        let fileHasIssues = false;

        // Check for console.log statements
        lines.forEach((line, index) => {
          if (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) {
            debt.consoleLogs.push({
              file: file,
              line: index + 1,
              content: line.trim()
            });
            fileHasIssues = true;
          }
          
          // Check for TODO/FIXME comments
          if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
            debt.todos.push({
              file: file,
              line: index + 1,
              content: line.trim()
            });
            fileHasIssues = true;
          }
        });

        if (fileHasIssues) {
          debt.files.push(file);
        }
      }
      
      debt.total = debt.consoleLogs.length + debt.todos.length + debt.deadCode.length;

    } catch (error) {
      // Skip code quality analysis if it fails
      debt.total = 0;
    }

    return debt;
  }

  /**
   * Detect formatting and style issues
   */
  async detectFormattingDebt(projectPath) {
    const debt = { total: 0, issues: [], files: [] };
    
    try {
      // Check if Prettier config exists
      const prettierConfigs = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'];
      const hasPrettierConfig = prettierConfigs.some(file => fs.existsSync(path.join(projectPath, file)));
      
      if (!hasPrettierConfig) {
        return debt; // No Prettier config, skip formatting checks
      }

      // Find files to check
      const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx,json,css,scss,md}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });

      if (codeFiles.length === 0) {
        return debt;
      }

      // Check formatting with Prettier
      const cmd = `npx --yes prettier --check ${codeFiles.join(' ')}`;
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // If we get here, all files are properly formatted
      debt.total = 0;

    } catch (error) {
      // Prettier found formatting issues
      if (error.stdout) {
        const lines = error.stdout.trim().split('\n').filter(line => line.trim());
        debt.total = lines.length;
        debt.files = lines;
        debt.issues = lines.map(file => ({
          file: file,
          type: 'formatting',
          message: 'File needs formatting'
        }));
      }
    }

    return debt;
  }

  /**
   * Categorize debt into Mafia/Guido/P1-P4 priorities
   */
  categorizeDebt(debtReport, category, debtData) {
    const { total, issues = [], severity = {}, errors = 0, warnings = 0, consoleLogs = [], todos = [] } = debtData;
    
    if (total === 0) return;

    // Guido Level (ULTIMATE ESCALATION)
    if (category === 'markdown' && total >= this.debtThresholds.guido.markdownWarnings) {
      debtReport.guido.push(`${total} markdown errors - 🤌 Guido: "Capisce? Your documentation is DONE."`);
    } else if (category === 'spelling' && total >= this.debtThresholds.guido.spellErrors) {
      debtReport.guido.push(`${total} spelling errors - 🔨 Guido: "I've seen cleaner spelling in ransom notes."`);
    } else if (category === 'security' && severity.critical >= this.debtThresholds.guido.securityCritical) {
      debtReport.guido.push(`${severity.critical} critical security holes - 💀 Guido: "Your security is so bad, I'm embarrassed FOR you."`);
    } else if (category === 'eslint' && errors >= this.debtThresholds.guido.eslintErrors) {
      debtReport.guido.push(`${errors} ESLint errors - 🤌 Guido: "Your code is so broken, my compiler won't even LOOK at it."`);
    } else if (category === 'typescript' && total >= this.debtThresholds.guido.tsErrors) {
      debtReport.guido.push(`${total} TypeScript errors - 🔨 Guido: "TypeScript gave up on you. Even TYPES are embarrassed."`);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= this.debtThresholds.guido.consoleLogs) {
      debtReport.guido.push(`${consoleLogs.length} console.log statements - 💀 Guido: "Your debugging is PATHETIC. Clean it up!"`);
    } else if (category === 'code-quality' && todos && todos.length >= this.debtThresholds.guido.todos) {
      debtReport.guido.push(`${todos.length} TODO comments - 🤌 Guido: "TODO? More like TO-DON'T. Fix this shit!"`);
    }
    
    // Mafia Level (LOAN SHARK TAKEOVER)
    else if (category === 'markdown' && total >= this.debtThresholds.mafia.markdownWarnings) {
      debtReport.mafia.push(`${total} markdown errors - 🕴️ The Family owns this debt now. VIGorish starts today.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.mafia.spellErrors) {
      debtReport.mafia.push(`${total} spelling errors - 💰 Tony's dictionary says you owe us. With interest.`);
    } else if (category === 'security' && severity.critical >= this.debtThresholds.mafia.securityCritical) {
      debtReport.mafia.push(`${severity.critical} critical security holes - 🚗 Nice firewall. Shame if it 'malfunctioned'.`);
    } else if (category === 'eslint' && errors >= this.debtThresholds.mafia.eslintErrors) {
      debtReport.mafia.push(`${errors} ESLint errors - 🕴️ Your linter quit. We bought the contract. Fix it OR ELSE.`);
    } else if (category === 'typescript' && total >= this.debtThresholds.mafia.tsErrors) {
      debtReport.mafia.push(`${total} TypeScript errors - 💰 Your types are so wrong, we're charging interest on EACH ONE.`);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= this.debtThresholds.mafia.consoleLogs) {
      debtReport.mafia.push(`${consoleLogs.length} console.log statements - 🚗 Nice debug logs. Shame if they... disappeared.`);
    } else if (category === 'code-quality' && todos && todos.length >= this.debtThresholds.mafia.todos) {
      debtReport.mafia.push(`${todos.length} TODOs - 💰 The Family doesn't do TODOs. We do DONE or DEAD.`);
    }
    
    // P1 Critical thresholds
    else if (category === 'markdown' && total >= this.debtThresholds.p1.markdownWarnings) {
      debtReport.p1.push(`${total} markdown linting errors - This is fucking embarrassing. Fix it NOW.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.p1.spellErrors) {
      debtReport.p1.push(`${total} spelling errors - Your spell checker filed for bankruptcy.`);
    } else if (category === 'security' && (severity.critical > 0 || severity.high >= this.debtThresholds.p1.securityHigh)) {
      debtReport.p1.push(`${severity.critical || 0} critical + ${severity.high || 0} high security vulnerabilities - Call the cyber police.`);
    } else if (category === 'eslint' && errors >= this.debtThresholds.p1.eslintErrors) {
      debtReport.p1.push(`${errors} ESLint errors - Your code is in FORECLOSURE. Fix it before we repossess your IDE.`);
    } else if (category === 'typescript' && total >= this.debtThresholds.p1.tsErrors) {
      debtReport.p1.push(`${total} TypeScript errors - Your types are so fucked, TypeScript is considering therapy.`);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= this.debtThresholds.p1.consoleLogs) {
      debtReport.p1.push(`${consoleLogs.length} console.log statements - This is NOT production debugging. Clean this shit up!`);
    } else if (category === 'code-quality' && todos && todos.length >= this.debtThresholds.p1.todos) {
      debtReport.p1.push(`${todos.length} TODO comments - If it's TODO, then FUCKING DO IT. Stop procrastinating.`);
    }
    
    // P2 High thresholds  
    else if (category === 'markdown' && total >= this.debtThresholds.p2.markdownWarnings) {
      debtReport.p2.push(`${total} markdown linting errors - We're taking back the repo. Clean this today.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.p2.spellErrors) {
      debtReport.p2.push(`${total} spelling errors - Dictionary.com is judging you.`);
    } else if (category === 'security' && severity.medium >= this.debtThresholds.p2.securityMedium) {
      debtReport.p2.push(`${severity.medium} medium security vulnerabilities - Not great, Bob.`);
    } else if (category === 'eslint' && errors >= this.debtThresholds.p2.eslintErrors) {
      debtReport.p2.push(`${errors} ESLint errors - Your code quality is declining rapidly. Fix before it gets worse.`);
    } else if (category === 'typescript' && total >= this.debtThresholds.p2.tsErrors) {
      debtReport.p2.push(`${total} TypeScript errors - Your types are having an identity crisis.`);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= this.debtThresholds.p2.consoleLogs) {
      debtReport.p2.push(`${consoleLogs.length} console.log statements - Please clean up your debug statements.`);
    } else if (category === 'code-quality' && todos && todos.length >= this.debtThresholds.p2.todos) {
      debtReport.p2.push(`${todos.length} TODO comments - Some actual TODOs that need doing.`);
    }
    
    // P3 Medium thresholds
    else if (category === 'markdown' && total >= this.debtThresholds.p3.markdownWarnings) {
      debtReport.p3.push(`${total} markdown linting errors - A bit crusty. Handle it this sprint.`);
    } else if (category === 'spelling' && total >= this.debtThresholds.p3.spellErrors) {
      debtReport.p3.push(`${total} spelling errors - Autocorrect is crying.`);
    } else if (category === 'dependencies' && total > 0) {
      debtReport.p3.push(`${total} dependency issues - Your package.json needs therapy.`);
    } else if (category === 'eslint' && warnings >= this.debtThresholds.p3.eslintWarnings) {
      debtReport.p3.push(`${warnings} ESLint warnings - Code style could be cleaner.`);
    } else if (category === 'formatting' && total >= this.debtThresholds.p3.formatting) {
      debtReport.p3.push(`${total} formatting issues - Your code formatting is inconsistent.`);
    }
    
    // P4 Low (everything else)
    else if (total > 0) {
      if (category === 'eslint' && warnings > 0) {
        debtReport.p4.push(`${warnings} ESLint warnings - Minor style issues, but still matters.`);
      } else {
        debtReport.p4.push(`${total} ${category} issues - Minor blemish. But you'll pay later...`);
      }
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

  /**
   * Generate file-level debt mapping for heat map visualization
   */
  generateFileDebtMap(debtReport, debtData) {
    const fileMap = {};
    
    // Helper function to add debt to file map
    const addDebtToFile = (file, category, severity, count = 1) => {
      if (!fileMap[file]) {
        fileMap[file] = {
          count: 0,
          categories: {},
          severity: 'p4',
          issues: []
        };
      }
      
      fileMap[file].count += count;
      fileMap[file].categories[category] = (fileMap[file].categories[category] || 0) + count;
      
      // Update severity to highest priority found
      if (severity === 'p1' || severity === 'critical') {
        fileMap[file].severity = 'p1';
      } else if (severity === 'p2' && fileMap[file].severity !== 'p1') {
        fileMap[file].severity = 'p2';
      } else if (severity === 'p3' && !['p1', 'p2'].includes(fileMap[file].severity)) {
        fileMap[file].severity = 'p3';
      }
    };

    // Process markdown debt
    if (debtData.markdown && debtData.markdown.files) {
      debtData.markdown.files.forEach(file => {
        const fileIssues = debtData.markdown.issues.filter(issue => issue.file === file);
        const severity = fileIssues.length >= 10 ? 'p1' : fileIssues.length >= 5 ? 'p2' : 'p3';
        addDebtToFile(file, 'markdown', severity, fileIssues.length);
      });
    }

    // Process spelling debt
    if (debtData.spelling && debtData.spelling.files) {
      debtData.spelling.files.forEach(file => {
        const fileIssues = debtData.spelling.issues.filter(issue => issue.file === file);
        const severity = fileIssues.length >= 8 ? 'p1' : fileIssues.length >= 3 ? 'p2' : 'p3';
        addDebtToFile(file, 'spelling', severity, fileIssues.length);
      });
    }

    // Process ESLint debt
    if (debtData.eslint && debtData.eslint.files) {
      debtData.eslint.files.forEach(file => {
        const fileIssues = debtData.eslint.issues.filter(issue => issue.file === file);
        const errors = fileIssues.filter(issue => issue.severity === 2).length;
        const warnings = fileIssues.filter(issue => issue.severity === 1).length;
        
        if (errors > 0) {
          const severity = errors >= 5 ? 'p1' : errors >= 2 ? 'p2' : 'p3';
          addDebtToFile(file, 'eslint-errors', severity, errors);
        }
        if (warnings > 0) {
          addDebtToFile(file, 'eslint-warnings', 'p4', warnings);
        }
      });
    }

    // Process TypeScript debt
    if (debtData.typescript && debtData.typescript.files) {
      debtData.typescript.files.forEach(file => {
        const fileIssues = debtData.typescript.errors.filter(error => error.file === file);
        const severity = fileIssues.length >= 5 ? 'p1' : fileIssues.length >= 2 ? 'p2' : 'p3';
        addDebtToFile(file, 'typescript', severity, fileIssues.length);
      });
    }

    // Process code quality debt
    if (debtData.codeQuality && debtData.codeQuality.files) {
      debtData.codeQuality.files.forEach(file => {
        const consoleLogs = debtData.codeQuality.consoleLogs.filter(log => log.file === file);
        const todos = debtData.codeQuality.todos.filter(todo => todo.file === file);
        
        if (consoleLogs.length > 0) {
          const severity = consoleLogs.length >= 10 ? 'p2' : 'p3';
          addDebtToFile(file, 'console-logs', severity, consoleLogs.length);
        }
        if (todos.length > 0) {
          const severity = todos.length >= 5 ? 'p2' : 'p3';
          addDebtToFile(file, 'todos', severity, todos.length);
        }
      });
    }

    // Process formatting debt
    if (debtData.formatting && debtData.formatting.files) {
      debtData.formatting.files.forEach(file => {
        addDebtToFile(file, 'formatting', 'p4', 1);
      });
    }

    return fileMap;
  }

  /**
   * Generate top debt hotspots with temperature calculations
   */
  generateDebtHotspots(fileDebtMap) {
    const hotspots = [];
    
    Object.entries(fileDebtMap).forEach(([file, data]) => {
      const temperature = this.calculateFileTemperature(data);
      const priority = data.severity;
      
      hotspots.push({
        file: file.replace(/^.*[\\\/]/, ''), // Get filename only
        fullPath: file,
        debtCount: data.count,
        priority: priority,
        temperature: temperature,
        categories: data.categories,
        severity: data.severity
      });
    });
    
    // Sort by temperature (highest first) and return top 10
    return hotspots
      .sort((a, b) => b.temperature - a.temperature)
      .slice(0, 10);
  }

  /**
   * Calculate temperature for a file based on debt concentration
   */
  calculateFileTemperature(fileData) {
    let temperature = 0;
    
    // Base temperature from total debt count
    temperature += fileData.count * 10;
    
    // Severity multipliers
    switch (fileData.severity) {
      case 'p1':
        temperature *= 3;
        break;
      case 'p2':
        temperature *= 2;
        break;
      case 'p3':
        temperature *= 1.5;
        break;
      case 'p4':
        temperature *= 1;
        break;
    }
    
    // Category bonuses
    const categories = fileData.categories;
    if (categories['eslint-errors']) temperature += categories['eslint-errors'] * 15;
    if (categories['typescript']) temperature += categories['typescript'] * 12;
    if (categories['security']) temperature += categories['security'] * 20;
    if (categories['console-logs']) temperature += categories['console-logs'] * 5;
    
    return Math.round(temperature);
  }

  /**
   * Calculate debt trend (simplified for now)
   */
  calculateDebtTrend(debtReport) {
    const totalDebt = debtReport.totalDebt;
    const criticalDebt = debtReport.p1.length + debtReport.mafia.length + debtReport.guido.length;
    
    // Simple heuristic based on debt levels
    if (criticalDebt > 0) {
      return 'worsening';
    } else if (totalDebt === 0) {
      return 'improving';
    } else if (totalDebt < 10) {
      return 'stable';
    } else {
      return 'stable';
    }
  }
}

// Export singleton instance
const debtDetector = new DebtDetector();
module.exports = { debtDetector, DebtDetector }; 