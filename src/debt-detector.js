const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('./debt-ignore-parser');
const { DebtModeManager } = require('./debt-mode-manager');
const SnarkySpellHandler = require('./snarky-spell-handler');

/**
 * Core debt detection engine for Refuctor
 * Integrates markdownlint, cspell, npm audit, ESLint, TypeScript, and custom rules
 */
class DebtDetector {
  constructor() {
    // Mode-based thresholds managed by DebtModeManager (SSOT)
    this.modeManager = new DebtModeManager();
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
      const codeQualityDebt = this.detectCodeQualityDebt ? await this.detectCodeQualityDebt(projectPath, verbose) : { total: 0, consoleLogs: [], todos: [] };
      const formattingDebt = this.detectFormattingDebt ? await this.detectFormattingDebt(projectPath) : { total: 0, issues: [] };

      // Store ignored file information if verbose
      if (verbose) {
        debtReport.ignoredFiles = markdownDebt.ignoredFiles || [];
        debtReport.ignoredDebt = markdownDebt.ignoredDebt || { total: 0, files: [] };
      }

      // Categorize and merge results (mode-aware)
      await this.categorizeDebt(debtReport, 'markdown', markdownDebt, projectPath);
      await this.categorizeDebt(debtReport, 'spelling', spellDebt, projectPath);  
      await this.categorizeDebt(debtReport, 'security', securityDebt, projectPath);
      await this.categorizeDebt(debtReport, 'dependencies', dependencyDebt, projectPath);
      await this.categorizeDebt(debtReport, 'eslint', eslintDebt, projectPath);
      await this.categorizeDebt(debtReport, 'typescript', typescriptDebt, projectPath);
      await this.categorizeDebt(debtReport, 'code-quality', codeQualityDebt, projectPath);
      await this.categorizeDebt(debtReport, 'formatting', formattingDebt, projectPath);

      // Calculate totals - count actual issues, not categories
      // DEBT IGNORE RESPECT: Subtract ignored debt from total
      const rawTotalDebt = markdownDebt.total + spellDebt.total + securityDebt.total + dependencyDebt.total + 
                           eslintDebt.total + typescriptDebt.total + codeQualityDebt.total + formattingDebt.total;
      
      const totalIgnoredDebt = (markdownDebt.ignoredDebt?.total || 0) + 
                              (spellDebt.ignoredDebt?.total || 0) + 
                              (eslintDebt.ignoredDebt?.total || 0) + 
                              (typescriptDebt.ignoredDebt?.total || 0) + 
                              (codeQualityDebt.ignoredDebt?.total || 0) + 
                              (formattingDebt.ignoredDebt?.total || 0);
      
      debtReport.totalDebt = rawTotalDebt - totalIgnoredDebt;
      debtReport.totalIgnoredDebt = totalIgnoredDebt;

      // Check for mafia takeover and Guido escalation
              await this.checkMafiaStatus(debtReport, projectPath);
        await this.checkForGuidoDeployment(debtReport, projectPath);

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
        debtLevel: await this.calculateDebtLevel(debtReport, projectPath),
        p1: debtReport.p1.length,
        p2: debtReport.p2.length,
        p3: debtReport.p3.length,
        p4: debtReport.p4.length,
        total: debtReport.totalDebt,
        totalIgnored: debtReport.totalIgnoredDebt || 0,
        rawTotal: rawTotalDebt
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
        console.log(`   Ignored files: ${debtReport.ignoredFiles.join(', ')}`);
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
        for (const file of ignoredFiles) {
          try {
            const cmd = `npx --yes markdownlint-cli "${file}"`;
            execSync(cmd, { 
              cwd: projectPath, 
              encoding: 'utf8',
              stdio: 'pipe'
            });
            // No issues found in this ignored file
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

    return debt;
  }

  /**
   * Detect spelling issues with integrated snarky intelligence
   */
  async detectSpellingDebt(projectPath) {
    const debt = { total: 0, issues: [], files: [], snarkyProcessed: false, snarkyAdded: 0, ignoredFiles: [], ignoredDebt: { total: 0, files: [] } };
    
    try {
      // Check if cspell config exists
      const configFiles = ['cspell.json', '.cspell.json', 'cspell.config.js'];
      const hasConfig = configFiles.some(file => fs.existsSync(path.join(projectPath, file)));
      
      // Get all files that could have spelling issues
      const allSpellFiles = glob.sync('**/*.{md,js,ts,json,mdc}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**']  // Basic ignore only
      });
      
      // Separate ignored and non-ignored files (like markdown detection does)
      const spellFiles = [];
      const ignoredFiles = [];
      
      for (const file of allSpellFiles) {
        if (this.ignoreParser.shouldIgnore(file)) {
          ignoredFiles.push(file);
        } else {
          spellFiles.push(file);
        }
      }
      
      debt.ignoredFiles = ignoredFiles;
      
      // Check ignored files for debt (for reporting purposes)
      if (ignoredFiles.length > 0) {
        for (const file of ignoredFiles) {
          try {
            const cmd = `npx --yes cspell "${file}" --no-progress --no-summary`;
            const result = execSync(cmd, { 
              cwd: projectPath, 
              encoding: 'utf8',
              stdio: 'pipe'
            });
            // No issues found in this ignored file
          } catch (error) {
            if (error.status === 1 && error.stdout) {
              const lines = error.stdout.trim().split('\n').filter(line => line.includes('Unknown word'));
              debt.ignoredDebt.total += lines.length;
              if (!debt.ignoredDebt.files.includes(file)) {
                debt.ignoredDebt.files.push(file);
              }
            }
          }
        }
      }

      if (spellFiles.length === 0) {
        return debt;
      }

      // Run cspell only on non-ignored files
      const cmd = `npx --yes cspell "${spellFiles.join('" "')}" --no-progress --no-summary`;
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
          
          try {
            const snarkyHandler = new SnarkySpellHandler();
            const analysis = await snarkyHandler.analyzeSpellingIssues(projectPath, rawIssues);
            
            // Auto-add obvious snarky terms to dictionary
            if (analysis.likelySnarky.length > 0) {
              const dictResult = await snarkyHandler.updateProjectDictionary(
                projectPath, 
                analysis.likelySnarky.map(s => s.word)
              );
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
    const debt = { total: 0, errors: 0, warnings: 0, issues: [], files: [], ignoredFiles: [], ignoredDebt: { total: 0, files: [] } };
    
    try {
      // Check if ESLint config exists
      const configFiles = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js'];
      const hasConfig = configFiles.some(file => fs.existsSync(path.join(projectPath, file)));
      
      // Get all JS/TS files with basic ignore only (like other detection methods)
      const allCodeFiles = glob.sync('**/*.{js,ts,jsx,tsx}', { 
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**']  // Basic ignore only
      });
      
      // Separate ignored and non-ignored files (like markdown/spelling detection)
      const codeFiles = [];
      const ignoredFiles = [];
      
      for (const file of allCodeFiles) {
        if (this.ignoreParser.shouldIgnore(file)) {
          ignoredFiles.push(file);
        } else {
          codeFiles.push(file);
        }
      }
      
      debt.ignoredFiles = ignoredFiles;
      
      if (codeFiles.length === 0) {
        return debt; // No code files to lint after filtering
      }

      // Run ESLint on filtered files only (respects .debtignore)
      // Use --max-warnings 0 to ensure warnings trigger exit code 1 for proper error handling
      const cmd = `npx --yes eslint ${codeFiles.join(' ')} --format json --max-warnings 0`;
      
      let eslintOutput;
      try {
        eslintOutput = execSync(cmd, { 
          cwd: projectPath, 
          encoding: 'utf8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer to handle large ESLint output
        });
      } catch (error) {
        // ESLint found issues (exit code 1) - get output from error.stdout
        if (error.status === 1 && error.stdout) {
          eslintOutput = error.stdout;
        } else {
          // Real error (missing ESLint, config issues, etc.)
          throw error;
        }
      }

      // Parse ESLint JSON results (whether from success or error.stdout)
      const eslintResults = JSON.parse(eslintOutput);
      
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
      // ESLint not available, config issues, or other real errors
      console.warn(`ESLint detection failed: ${error.message}`);
      debt.total = 0;
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
  async detectCodeQualityDebt(projectPath, verbose = false) {
    const debt = { 
      total: 0, 
      consoleLogs: [], 
      todos: [], 
      deadCode: [],
      files: [],
      ignoredFiles: [],
      ignoredDebt: { total: 0, files: [] },
      smartConsoleProcessed: false,
      debugConsoleLogsFound: 0,
      interfaceConsoleLogsIgnored: 0
    };
    
    try {
      // Find all code files (properly exclude ALL node_modules)
      const allCodeFiles = glob.sync('**/*.{js,ts,jsx,tsx,vue}', { 
        cwd: projectPath,
        ignore: ['**/node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**']
      });

      // Separate ignored and non-ignored files (like markdown detection does)
      const codeFiles = [];
      const ignoredFiles = [];
      
      for (const file of allCodeFiles) {
        if (this.ignoreParser.shouldIgnore(file)) {
          ignoredFiles.push(file);
        } else {
          codeFiles.push(file);
        }
      }
      
      debt.ignoredFiles = ignoredFiles;

      // Add verbose logging like markdown detection
      if (verbose && ignoredFiles.length > 0) {
        console.log(`\n🚫 Ignoring ${ignoredFiles.length} code files: ${ignoredFiles.join(', ')}`);
      }
      
      if (verbose && codeFiles.length > 0) {
        console.log(`💻 Scanning ${codeFiles.length} code files for quality issues: ${codeFiles.join(', ')}`);
      }

      let totalDebugConsoles = 0;
      let totalInterfaceConsoles = 0;

      // Process only non-ignored files
      for (const file of codeFiles) {
        const filePath = path.join(projectPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        
        let fileHasIssues = false;

        // Smart console.log detection with context analysis
        lines.forEach((line, index) => {
          if (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) {
            const consoleStatement = {
              file: file,
              line: index + 1,
              content: line.trim(),
              context: this.getLineContext(lines, index, 3) // Get 3 lines of context
            };
            
            // 🧠 SMART DETECTION: Is this a debug statement or intentional UI output?
            if (this.isActualDebugStatement(consoleStatement, file, content)) {
              debt.consoleLogs.push(consoleStatement);
              fileHasIssues = true;
              totalDebugConsoles++;
            } else {
              // This is intentional UI output - ignore it
              totalInterfaceConsoles++;
              if (verbose) {
                console.log(`   ℹ️  Interface console.log detected (ignored): ${consoleStatement.content}`);
              }
            }
          }
          
          // Smart TODO/FIXME/HACK detection with context analysis
          if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
            const todoStatement = {
              file: file,
              line: index + 1,
              content: line.trim(),
              context: this.getLineContext(lines, index, 3)
            };
            
            // 🧠 SMART TODO DETECTION: Is this an actual TODO comment or just documentation/code about TODOs?
            if (this.isActualTodoComment(todoStatement, file, content)) {
              debt.todos.push(todoStatement);
              fileHasIssues = true;
            }
          }
        });

        if (fileHasIssues) {
          debt.files.push(file);
        }
      }
      
      debt.total = debt.consoleLogs.length + debt.todos.length + debt.deadCode.length;
      debt.smartConsoleProcessed = true;
      debt.debugConsoleLogsFound = totalDebugConsoles;
      debt.interfaceConsoleLogsIgnored = totalInterfaceConsoles;

      if (verbose && totalInterfaceConsoles > 0) {
        console.log(`✅ Smart console.log detection: ${totalDebugConsoles} debug statements (debt), ${totalInterfaceConsoles} UI outputs (ignored)`);
      }

    } catch (error) {
      // Skip code quality analysis if it fails
      debt.total = 0;
    }

    return debt;
  }

  /**
   * 🧠 SMART CONSOLE.LOG DETECTION: Determine if a console statement is debug code (debt) or intentional UI output
   * @param {Object} consoleStatement - Console statement with file, line, content, and context
   * @param {string} file - File path for additional context
   * @param {string} fileContent - Full file content for broader analysis
   * @returns {boolean} - True if this is a debug statement (should count as debt)
   */
  isActualDebugStatement(consoleStatement, file, fileContent) {
    const { content, context, line } = consoleStatement;
    const lowerContent = content.toLowerCase();
    
    // 1. DEFINITE UI OUTPUT PATTERNS (NOT debt)
    // Setup wizards, CLI output, user-facing messages
    if (this.isDefiniteUIOutput(content, file, context)) {
      return false; // Not debt - intentional UI
    }
    
    // 2. DEFINITE DEBUG PATTERNS (IS debt)
    if (this.isDefiniteDebugStatement(content, context)) {
      return true; // Definitely debt
    }
    
    // 3. CONTEXT ANALYSIS - Check surrounding code
    if (this.isDebugContext(context, file)) {
      return true; // Likely debug code
    }
    
    // 4. FILE TYPE ANALYSIS
    if (this.isUIFile(file) && this.hasUIPatterns(content)) {
      return false; // UI file with UI patterns - not debt
    }
    
    // 5. MESSAGE CONTENT ANALYSIS
    if (this.hasDebugMessagePatterns(content)) {
      return true; // Debug-style message content
    }
    
    // 6. DEFAULT: If uncertain, lean towards NOT counting as debt
    // Better to miss some debug statements than flag legitimate UI output
    return false;
  }

  /**
   * Check if this is definitely intentional UI output
   */
  isDefiniteUIOutput(content, file, context) {
    const lowerContent = content.toLowerCase();
    
    // CLI/Setup wizard patterns
    const uiPatterns = [
      'refuctor',
      'debt collector',
      'setup wizard',
      'installation',
      'scanning',
      'processing',
      'analyzing',
      'welcome to',
      'configuration',
      'initializing',
      'creating',
      'installing',
      'detected',
      'found',
      'completed',
      'success',
      'error:',
      'warning:',
      'step',
      'press any key',
      'choose',
      'select',
      'enter',
      'would you like',
      'do you want'
    ];
    
    for (const pattern of uiPatterns) {
      if (lowerContent.includes(pattern)) {
        return true;
      }
    }
    
    // CLI files are usually UI output
    if (file.includes('cli') || file.includes('setup') || file.includes('wizard')) {
      return true;
    }
    
    // Professional error messages
    if (content.includes('Error:') || content.includes('Warning:') || content.includes('Info:')) {
      return true;
    }
    
    // Formatted output with emojis or special characters
    const emojiPattern = /[\u{1F4CB}\u{1F6AB}\u{1F4BB}\u{2705}\u{26A0}\u{1F3AF}\u{1F4DD}]/u;
    if (emojiPattern.test(content)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if this is definitely a debug statement
   */
  isDefiniteDebugStatement(content, context) {
    const lowerContent = content.toLowerCase();
    
    // Debug keywords
    const debugPatterns = [
      'debug',
      'testing',
      'temp',
      'todo',
      'fixme',
      'hack',
      'wtf',
      'xxx',
      'remove this',
      'delete this',
      'placeholder',
      'test123',
      'hello world'
    ];
    
    for (const pattern of debugPatterns) {
      if (lowerContent.includes(pattern)) {
        return true;
      }
    }
    
    // Random values or test data
    if (/console\.log\(['"`]\w{1,3}['"`]\)/.test(content)) { // Single words like 'hi', 'test'
      return true;
    }
    
    // Variable dumps without context
    if (/console\.log\(\w+\)$/.test(content.trim())) { // Just logging a variable
      return true;
    }
    
    // Multiple console.logs in sequence (debugging pattern)
    const contextLines = context.before.concat(context.after);
    const nearbyConsoleLogs = contextLines.filter(line => 
      line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')
    ).length;
    
    if (nearbyConsoleLogs >= 2) { // Multiple console statements nearby
      return true;
    }
    
    return false;
  }

  /**
   * Analyze context lines for debug patterns
   */
  isDebugContext(context, file) {
    const allContextLines = context.before.concat(context.after);
    const contextText = allContextLines.join(' ').toLowerCase();
    
    // Debug function or method names
    const debugContextPatterns = [
      'debug',
      'test',
      'temp',
      'experiment',
      'try',
      'check',
      'validate'
    ];
    
    for (const pattern of debugContextPatterns) {
      if (contextText.includes(pattern)) {
        return true;
      }
    }
    
    // Comments indicating debug code
    if (contextText.includes('//') && (
      contextText.includes('debug') ||
      contextText.includes('test') ||
      contextText.includes('remove') ||
      contextText.includes('temp')
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if this is a UI-focused file
   */
  isUIFile(file) {
    const uiFilePatterns = [
      'cli',
      'setup',
      'wizard',
      'interface',
      'ui',
      'dashboard',
      'server',
      'app',
      'main'
    ];
    
    const lowerFile = file.toLowerCase();
    return uiFilePatterns.some(pattern => lowerFile.includes(pattern));
  }

  /**
   * Check if content has UI patterns
   */
  hasUIPatterns(content) {
    // Professional message formatting
    return content.includes('`') || // Template literals
           content.includes('${') || // String interpolation
           /console\.(log|warn|error)\(['"`][A-Z]/.test(content) || // Capitalized messages
           content.length > 80; // Long descriptive messages
  }

  /**
   * Check for debug-style message patterns
   */
  hasDebugMessagePatterns(content) {
    // Short, cryptic messages
    if (content.length < 30 && /console\.log\(['"`]\w{1,10}['"`]\)/.test(content)) {
      return true;
    }
    
    // Variable names or values
    if (/console\.log\(\w+[,\s]*\w*\)/.test(content)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get context lines around a specific line
   */
  getLineContext(lines, lineIndex, contextSize = 3) {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length, lineIndex + contextSize + 1);
    
    return {
      before: lines.slice(start, lineIndex),
      current: lines[lineIndex],
      after: lines.slice(lineIndex + 1, end)
    };
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
  async categorizeDebt(debtReport, category, debtData, projectPath) {
    const { total, issues = [], severity = {}, errors = 0, warnings = 0, consoleLogs = [], todos = [] } = debtData;
    
    if (total === 0) return;

    // Get mode-specific thresholds and messages
    const thresholds = await this.modeManager.getThresholds(projectPath);
    const messages = await this.modeManager.getMessages(projectPath);
    const currentMode = thresholds.mode;
    const modeConfig = this.modeManager.getModeConfig(currentMode);

    // Mode-aware debt level classification (replaces rigid Guido/Mafia)
    if (category === 'markdown' && total >= thresholds.guido.markdownWarnings) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "${messages.markdown}" (${total} markdown issues)`;
      debtReport.guido.push(message);
    } else if (category === 'spelling' && total >= thresholds.guido.spellErrors) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "${messages.spelling}" (${total} spelling issues)`;
      debtReport.guido.push(message);
    } else if (category === 'security' && severity.critical >= thresholds.guido.securityCritical) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "${messages.security}" (${severity.critical} security issues)`;
      debtReport.guido.push(message);
    } else if (category === 'eslint' && errors >= thresholds.guido.eslintErrors) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "Code quality needs attention" (${errors} ESLint errors)`;
      debtReport.guido.push(message);
    } else if (category === 'typescript' && total >= thresholds.guido.tsErrors) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "Type safety review needed" (${total} TypeScript errors)`;
      debtReport.guido.push(message);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= thresholds.guido.consoleLogs) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "${messages.console}" (${consoleLogs.length} console.log statements)`;
      debtReport.guido.push(message);
    } else if (category === 'code-quality' && todos && todos.length >= thresholds.guido.todos) {
      const message = modeConfig.emoji + ' ' + modeConfig.name + `: "Task tracking in progress" (${todos.length} TODO comments)`;
      debtReport.guido.push(message);
    }
    
    // Mafia Level (LOAN SHARK TAKEOVER) - mode-aware
    else if (category === 'markdown' && total >= thresholds.mafia.markdownWarnings) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} markdown issues - 👥 Dev Crew: "Documentation refinement needed"` :
        `${total} markdown errors - 🕴️ The Family owns this debt now. VIGorish starts today.`;
      debtReport.mafia.push(message);
    } else if (category === 'spelling' && total >= thresholds.mafia.spellErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} spelling issues - 👥 Dev Crew: "Dictionary updates recommended"` :
        `${total} spelling errors - 💰 Tony's dictionary says you owe us. With interest.`;
      debtReport.mafia.push(message);
    } else if (category === 'security' && severity.critical >= thresholds.mafia.securityCritical) {
      const message = currentMode === 'DEV_CREW' ? 
        `${severity.critical} security issues - 👥 Dev Crew: "Security review in progress"` :
        `${severity.critical} critical security holes - 🚗 Nice firewall. Shame if it 'malfunctioned'.`;
      debtReport.mafia.push(message);
    } else if (category === 'eslint' && errors >= thresholds.mafia.eslintErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${errors} ESLint errors - 👥 Dev Crew: "Code quality improvements needed"` :
        `${errors} ESLint errors - 🕴️ Your linter quit. We bought the contract. Fix it OR ELSE.`;
      debtReport.mafia.push(message);
    } else if (category === 'typescript' && total >= thresholds.mafia.tsErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} TypeScript errors - 👥 Dev Crew: "Type safety improvements needed"` :
        `${total} TypeScript errors - Your types are so wrong, we're charging interest on EACH ONE.`;
      debtReport.mafia.push(message);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= thresholds.mafia.consoleLogs) {
      const message = currentMode === 'DEV_CREW' ? 
        `${consoleLogs.length} console.log statements - 👥 Dev Crew: "Debug logging cleanup scheduled"` :
        `${consoleLogs.length} console.log statements - 🚗 Nice debug logs. Shame if they... disappeared.`;
      debtReport.mafia.push(message);
    } else if (category === 'code-quality' && todos && todos.length >= thresholds.mafia.todos) {
      const message = currentMode === 'DEV_CREW' ? 
        `${todos.length} TODOs - 👥 Dev Crew: "Task completion in progress"` :
        `${todos.length} TODOs - 💰 The Family doesn't do TODOs. We do DONE or DEAD.`;
      debtReport.mafia.push(message);
    }
    
    // P1 Critical thresholds - mode-aware
    else if (category === 'markdown' && total >= thresholds.p1.markdownWarnings) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} markdown issues - 👥 Dev Crew: "Documentation formatting needs attention"` :
        `${total} markdown linting errors - This is fucking embarrassing. Fix it NOW.`;
      debtReport.p1.push(message);
    } else if (category === 'spelling' && total >= thresholds.p1.spellErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} spelling issues - 👥 Dev Crew: "Terminology review needed"` :
        `${total} spelling errors - Your spell checker filed for bankruptcy.`;
      debtReport.p1.push(message);
    } else if (category === 'security' && (severity.critical > 0 || severity.high >= thresholds.p1.securityHigh)) {
      const message = currentMode === 'DEV_CREW' ? 
        `${severity.critical || 0} critical + ${severity.high || 0} high security issues - 👥 Dev Crew: "Security review scheduled"` :
        `${severity.critical || 0} critical + ${severity.high || 0} high security vulnerabilities - Call the cyber police.`;
      debtReport.p1.push(message);
    } else if (category === 'eslint' && errors >= thresholds.p1.eslintErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${errors} ESLint errors - 👥 Dev Crew: "Code quality improvements in progress"` :
        `${errors} ESLint errors - Your code is in FORECLOSURE. Fix it before we repossess your IDE.`;
      debtReport.p1.push(message);
    } else if (category === 'typescript' && total >= thresholds.p1.tsErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} TypeScript errors - 👥 Dev Crew: "Type checking improvements needed"` :
        `${total} TypeScript errors - Your types are so fucked, TypeScript is considering therapy.`;
      debtReport.p1.push(message);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= thresholds.p1.consoleLogs) {
      const message = currentMode === 'DEV_CREW' ? 
        `${consoleLogs.length} console.log statements - 👥 Dev Crew: "Debug cleanup on roadmap"` :
        `${consoleLogs.length} console.log statements - This is NOT production debugging. Clean this shit up!`;
      debtReport.p1.push(message);
    } else if (category === 'code-quality' && todos && todos.length >= thresholds.p1.todos) {
      const message = currentMode === 'DEV_CREW' ? 
        `${todos.length} TODO comments - 👥 Dev Crew: "Task completion in progress"` :
        `${todos.length} TODO comments - If it's TODO, then FUCKING DO IT. Stop procrastinating.`;
      debtReport.p1.push(message);
    }
    
    // P2 High thresholds - mode-aware
    else if (category === 'markdown' && total >= thresholds.p2.markdownWarnings) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} markdown issues - 👥 Dev Crew: "Documentation polish recommended"` :
        `${total} markdown linting errors - We're taking back the repo. Clean this today.`;
      debtReport.p2.push(message);
    } else if (category === 'spelling' && total >= thresholds.p2.spellErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} spelling issues - 👥 Dev Crew: "Terminology consistency needed"` :
        `${total} spelling errors - Dictionary.com is judging you.`;
      debtReport.p2.push(message);
    } else if (category === 'security' && severity.medium >= thresholds.p2.securityMedium) {
      const message = currentMode === 'DEV_CREW' ? 
        `${severity.medium} medium security issues - 👥 Dev Crew: "Security improvements planned"` :
        `${severity.medium} medium security vulnerabilities - Not great, Bob.`;
      debtReport.p2.push(message);
    } else if (category === 'eslint' && errors >= thresholds.p2.eslintErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${errors} ESLint errors - 👥 Dev Crew: "Code quality review scheduled"` :
        `${errors} ESLint errors - Your code quality is declining rapidly. Fix before it gets worse.`;
      debtReport.p2.push(message);
    } else if (category === 'typescript' && total >= thresholds.p2.tsErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} TypeScript errors - 👥 Dev Crew: "Type improvements in progress"` :
        `${total} TypeScript errors - Your types are having an identity crisis.`;
      debtReport.p2.push(message);
    } else if (category === 'code-quality' && consoleLogs && consoleLogs.length >= thresholds.p2.consoleLogs) {
      const message = currentMode === 'DEV_CREW' ? 
        `${consoleLogs.length} console.log statements - 👥 Dev Crew: "Debug cleanup scheduled"` :
        `${consoleLogs.length} console.log statements - Please clean up your debug statements.`;
      debtReport.p2.push(message);
    } else if (category === 'code-quality' && todos && todos.length >= thresholds.p2.todos) {
      const message = currentMode === 'DEV_CREW' ? 
        `${todos.length} TODO comments - 👥 Dev Crew: "Task tracking active"` :
        `${todos.length} TODO comments - Some actual TODOs that need doing.`;
      debtReport.p2.push(message);
    }
    
    // P3 Medium thresholds - mode-aware
    else if (category === 'markdown' && total >= thresholds.p3.markdownWarnings) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} markdown issues - 👥 Dev Crew: "Documentation refinement recommended"` :
        `${total} markdown linting errors - A bit crusty. Handle it this sprint.`;
      debtReport.p3.push(message);
    } else if (category === 'spelling' && total >= thresholds.p3.spellErrors) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} spelling issues - 👥 Dev Crew: "Terminology cleanup when convenient"` :
        `${total} spelling errors - Autocorrect is crying.`;
      debtReport.p3.push(message);
    } else if (category === 'dependencies' && total > 0) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} dependency issues - 👥 Dev Crew: "Package review scheduled"` :
        `${total} dependency issues - Your package.json needs therapy.`;
      debtReport.p3.push(message);
    } else if (category === 'eslint' && warnings >= thresholds.p3.eslintWarnings) {
      const message = currentMode === 'DEV_CREW' ? 
        `${warnings} ESLint warnings - 👥 Dev Crew: "Style consistency improvements"` :
        `${warnings} ESLint warnings - Code style could be cleaner.`;
      debtReport.p3.push(message);
    } else if (category === 'formatting' && total >= thresholds.p3.formatting) {
      const message = currentMode === 'DEV_CREW' ? 
        `${total} formatting issues - 👥 Dev Crew: "Formatting improvements planned"` :
        `${total} formatting issues - Your code formatting is inconsistent.`;
      debtReport.p3.push(message);
    }
    
    // P4 Low (everything else) - mode-aware
    else if (total > 0) {
      if (category === 'eslint' && warnings > 0) {
        const message = currentMode === 'DEV_CREW' ? 
          `${warnings} ESLint warnings - 👥 Dev Crew: "Style improvements when time allows"` :
          `${warnings} ESLint warnings - Minor style issues, but still matters.`;
        debtReport.p4.push(message);
      } else {
        const message = currentMode === 'DEV_CREW' ? 
          `${total} ${category} issues - 👥 Dev Crew: "Low priority improvements"` :
          `${total} ${category} issues - Minor blemish. But you'll pay later...`;
        debtReport.p4.push(message);
      }
    }
  }

  /**
   * Calculate overall debt level with context awareness
   */
  async calculateDebtLevel(debtReport, projectPath = '.') {
    // ENHANCED: Context-aware debt classification for development projects
    const isDevProject = await this.isDevelopmentProject(projectPath);
    const projectContext = await this.analyzeProjectMaturity(projectPath);
    
    if (isDevProject && projectContext.isWellManaged) {
      // Well-managed development projects get more lenient classification
      return this.calculateDevelopmentProjectDebtLevel(debtReport, projectContext);
    }
    
    // Original classification for production or poorly managed projects
    if (debtReport.guido.length > 0) return 'GUIDO_DEPLOYED';
    if (debtReport.mafia.length > 0) return 'MAFIA_TAKEOVER';
    if (debtReport.p1.length > 0) return 'CRITICAL';
    if (debtReport.p2.length > 0) return 'HIGH';  
    if (debtReport.p3.length > 0) return 'MEDIUM';
    if (debtReport.p4.length > 0) return 'LOW';
    return 'CLEAN';
  }

  /**
   * Context-aware debt level calculation for development projects
   */
  calculateDevelopmentProjectDebtLevel(debtReport, projectContext) {
    const totalDebt = debtReport.totalDebt;
    const markdownDebt = debtReport.summary?.markdown || 0;
    const spellingDebt = debtReport.summary?.spelling || 0;
    const codeQualityDebt = debtReport.summary?.codeQuality || 0;
    
    // Calculate debt composition ratios
    const documentationRatio = markdownDebt / totalDebt;
    const realCodeIssueRatio = (totalDebt - markdownDebt - spellingDebt) / totalDebt;
    
    // For well-managed development projects, classification is based on REAL issues, not docs
    if (realCodeIssueRatio > 0.7 && codeQualityDebt > 500) {
      return 'HIGH'; // Significant code quality issues
    } else if (realCodeIssueRatio > 0.5 && codeQualityDebt > 200) {
      return 'MEDIUM'; // Moderate code quality issues
    } else if (documentationRatio > 0.8) {
      return 'DOCUMENTATION_HEAVY'; // Mostly docs, not critical
    } else if (totalDebt > 2000) {
      return 'HIGH'; // Genuinely high debt
    } else if (totalDebt > 1000) {
      return 'MEDIUM'; // Moderate debt
    } else {
      return 'LOW'; // Manageable debt for development
    }
  }

  /**
   * Determine if this is a development project
   */
  async isDevelopmentProject(projectPath) {
    try {
      const fs = require('fs-extra');
      const path = require('path');
      
      // Check for development indicators
      const indicators = [
        'ROADMAP.md',
        'IMPLEMENTATION_LOG.md', 
        'TECHDEBT.md',
        '.git',
        'src/',
        'development'
      ];
      
      for (const indicator of indicators) {
        if (await fs.pathExists(path.join(projectPath, indicator))) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze project maturity and management quality
   */
  async analyzeProjectMaturity(projectPath) {
    try {
      const fs = require('fs-extra');
      const path = require('path');
      
      let maturityScore = 0;
      let indicators = [];
      
      // Check for project management indicators
      if (await fs.pathExists(path.join(projectPath, 'REFUCTOR_ROADMAP.md'))) {
        const roadmap = await fs.readFile(path.join(projectPath, 'REFUCTOR_ROADMAP.md'), 'utf8');
        if (roadmap.length > 10000) { // Comprehensive roadmap
          maturityScore += 30;
          indicators.push('comprehensive-roadmap');
        }
      }
      
      if (await fs.pathExists(path.join(projectPath, 'TECHDEBT.md'))) {
        maturityScore += 20;
        indicators.push('active-debt-tracking');
      }
      
      if (await fs.pathExists(path.join(projectPath, '.debtignore'))) {
        maturityScore += 15;
        indicators.push('debt-management-system');
      }
      
      if (await fs.pathExists(path.join(projectPath, 'refuctorrulesclone.txt'))) {
        maturityScore += 10;
        indicators.push('development-standards');
      }
      
      // Check for comprehensive documentation
      const mdFiles = ['README.md', 'IMPLEMENTATION_LOG.md', 'MCP_TESTING_LOG.md'];
      let documentationCount = 0;
      for (const file of mdFiles) {
        if (await fs.pathExists(path.join(projectPath, file))) {
          documentationCount++;
        }
      }
      if (documentationCount >= 2) {
        maturityScore += 15;
        indicators.push('comprehensive-documentation');
      }
      
      return {
        score: maturityScore,
        isWellManaged: maturityScore >= 50, // 50+ indicates well-managed project
        indicators,
        classification: maturityScore >= 70 ? 'EXCELLENT' : maturityScore >= 50 ? 'WELL_MANAGED' : maturityScore >= 25 ? 'DEVELOPING' : 'BASIC'
      };
    } catch (error) {
      return { score: 0, isWellManaged: false, indicators: [], classification: 'UNKNOWN' };
    }
  }

  /**
   * Check for mafia takeover (debt sold to loan sharks)
   */
  async checkMafiaStatus(debtReport, projectPath = '.') {
    // Get mode-aware thresholds
    const thresholds = await this.modeManager.getThresholds(projectPath);
    
    const totalDebt = debtReport.totalDebt;
    const hasMafiaDebt = debtReport.mafia.length > 0;
    const extremeP1 = debtReport.p1.length >= 5; // 5+ critical issues
    const projectFailing = totalDebt >= (thresholds.mafia.extremeDebt || 100);

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
  async checkForGuidoDeployment(debtReport, projectPath = '.') {
    // Get mode-aware thresholds
    const thresholds = await this.modeManager.getThresholds(projectPath);
    
    const hasGuidoDebt = debtReport.guido.length > 0;
    const mafiaOverdue = debtReport.mafiaStatus && debtReport.mafiaStatus.debtAge >= (thresholds.guido.vigorishDays || 2);
    const extremeTotal = debtReport.totalDebt >= (thresholds.guido.extremeDebt || 200);

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
    // For now, return random age for demonstration
    return Math.floor(Math.random() * 7); // 0-6 days
  }

  /**
   * Generate humorous shame report with context-aware cost calculation
   */
  async generateShameReport(projectPath) {
    const debtReport = await this.scanProject(projectPath, true);
    
    // Use the Accountant's context-aware cost calculation instead of naive estimates
    const { Accountant } = require('./goons/accountant');
    const accountant = new Accountant();
    const debtAnalysis = await accountant.analyzeDebtCosts(projectPath);
    
    const shameReport = {
      totalShame: debtReport.totalDebt,
      shameLevel: await this.getContextAwareShameLevel(debtReport, projectPath),
      timeWasted: debtAnalysis.estimatedHours, // Context-aware time calculation
      cleanupCost: debtAnalysis.estimatedCost, // Context-aware cost calculation
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
   * Get context-aware shame level for development projects
   */
  async getContextAwareShameLevel(debtReport, projectPath) {
    const debtLevel = await this.calculateDebtLevel(debtReport, projectPath);
    
    // Map context-aware debt levels to appropriate shame levels
    switch (debtLevel) {
      case 'CLEAN':
        return 'spotless';
      case 'LOW':
        return 'mild embarrassment';
      case 'MEDIUM':
        return 'professional responsibility';
      case 'HIGH':
        return 'needs attention';
      case 'DOCUMENTATION_HEAVY':
        return 'documentation focused'; // Not shameful for dev projects
      case 'CRITICAL':
        return 'career ending';
      case 'MAFIA_TAKEOVER':
        return 'guido territory';
      case 'GUIDO_DEPLOYED':
        return 'guido territory';
      default:
        // Fallback to original naive calculation
        return this.calculateShameLevel(debtReport.totalDebt);
    }
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
        file: file.replace(/^.*[\\//]/, ''), // Get filename only
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

  /**
   * 🧠 SMART TODO DETECTION: Determine if a line is an actual TODO comment (debt) or just documentation/code about TODOs
   * @param {Object} todoStatement - TODO statement with file, line, content, and context
   * @param {string} file - File path for additional context
   * @param {string} fileContent - Full file content for broader analysis
   * @returns {boolean} - True if this is an actual TODO comment (should count as debt)
   */
  isActualTodoComment(todoStatement, file, fileContent) {
    const { content, context } = todoStatement;
    const lowerContent = content.toLowerCase();
    
    // 1. DEFINITE TODO COMMENT PATTERNS (IS debt)
    // Proper TODO comments that need action
    if (this.isDefiniteTodoComment(content)) {
      return true; // Definitely debt
    }
    
    // 2. DEFINITE NON-TODO PATTERNS (NOT debt)
    // Documentation, patterns, UI text about TODOs
    if (this.isDefiniteNonTodoReference(content, file)) {
      return false; // Not debt - just documentation/code about TODOs
    }
    
    // 3. CONTEXT ANALYSIS - Check surrounding code
    if (this.isTodoImplementationCode(context, file)) {
      return false; // Code that handles TODOs, not actual TODOs
    }
    
    // 4. DEFAULT: If uncertain, lean towards NOT counting as debt
    // Better to miss some TODOs than flag documentation as debt
    return false;
  }

  /**
   * Check if this is definitely an actual TODO comment
   */
  isDefiniteTodoComment(content) {
    // Real TODO comment patterns
    const actualTodoPatterns = [
      /^\/\/\s*TODO:/i,           // // TODO: description
      /^\/\/\s*FIXME:/i,          // // FIXME: description  
      /^\/\/\s*HACK:/i,           // // HACK: description
      /^\/\*\s*TODO:/i,           // /* TODO: description */
      /^\/\/\s*TODO\s+[A-Z]/i,    // // TODO Something with description
      /^\/\/\s*FIXME\s+[A-Z]/i,   // // FIXME Something with description
    ];
    
    for (const pattern of actualTodoPatterns) {
      if (pattern.test(content.trim())) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if this is definitely not a TODO comment (documentation/code about TODOs)
   */
  isDefiniteNonTodoReference(content, file) {
    const lowerContent = content.toLowerCase();
    
    // Documentation patterns about TODOs
    const nonTodoPatterns = [
      'todo comments',
      'todo debt',
      'todo items',
      'todo without',
      'todo removal',
      'todos that',
      'todos -',
      'eliminate dead comments and todos',
      'console.log statements, todos',
      'finding and removing todo',
      'todo/fixme comments',
      '${todos.length}',
      'todos.length',
      '.todos',
      'todocomments',
      'case \'todos\'',
      'todos": {',
      'scanresults.todocomments',
      'if.*includes.*todo',
      'regex.*todo',
      'pattern.*todo',
      'description.*todo'
    ];
    
    for (const pattern of nonTodoPatterns) {
      if (lowerContent.includes(pattern)) {
        return true;
      }
    }
    
    // UI/Documentation files
    if (file.includes('components/') || file.includes('App.js') || file.includes('README') || file.includes('DOCS')) {
      return true;
    }
    
    // Code that processes TODOs (like goons)
    if (file.includes('comment-killer') || file.includes('goon') || file.includes('debt-detector')) {
      // Only actual TODO comments in these files should count, not the implementation
      return !this.isDefiniteTodoComment(content);
    }
    
    return false;
  }

  /**
   * Check if this is code that implements TODO handling (not actual TODOs)
   */
  isTodoImplementationCode(context, file) {
    const allContextLines = context.before.concat(context.after);
    const contextText = allContextLines.join(' ').toLowerCase();
    
    // Code patterns that handle TODOs
    const implementationPatterns = [
      'function',
      'class',
      'method',
      'regex',
      'pattern',
      'filter',
      'map',
      'foreach',
      'includes',
      'match',
      'replace',
      'search',
      'detect',
      'scan',
      'process'
    ];
    
    for (const pattern of implementationPatterns) {
      if (contextText.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }
}

// Export singleton instance
const debtDetector = new DebtDetector();
module.exports = { debtDetector, DebtDetector }; 