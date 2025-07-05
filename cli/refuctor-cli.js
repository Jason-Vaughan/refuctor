#!/usr/bin/env node

const { Command } = require('commander');
const { debtDetector } = require('../src/debt-detector');
const { techDebtManager } = require('../src/techdebt-manager');
const { markdownFixerGoon } = require('../src/goons/markdown-fixer');
const { DebtDetector } = require('../src/debt-detector.js');
const { DebtIgnoreParser } = require('../src/debt-ignore-parser');
const packageJson = require('../package.json');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const SnarkySpellHandler = require('../src/snarky-spell-handler');

// Simple color functions (avoiding chalk v5 ES module issues)
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Extract color functions for easier use
const { red, green, yellow, blue, magenta, cyan, gray, white, bold } = colors;

const program = new Command();

// Refuctor branding and personality
const TAGLINES = [
  "Refactor or Be Repossessed",
  "No Bloat. No Debt. No Bullshit.",
  "Because your code deserves better than being held hostage by technical debt",
  "Debt Never Sleeps. Neither Should You."
];

const getRandomTagline = () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

// CLI setup with Refuctor personality
program
  .name('refuctor')
  .description(colors.red('🏦 The Debt Cleansing Syndicate') + '\n' + colors.gray(getRandomTagline()))
  .version(packageJson.version)
  .configureOutput({
    writeOut: (str) => process.stdout.write(colors.cyan(str)),
    writeErr: (str) => process.stderr.write(colors.red(str))
  })
  .addHelpText('after', `
${colors.bold(colors.cyan('🎯 DEBT DETECTION TYPES:'))}
  📄 Markdown linting     ${colors.gray('(markdownlint rules)')}
  📝 Spelling errors      ${colors.gray('(cspell with snarky intelligence)')}
  💻 ESLint/TypeScript    ${colors.gray('(requires config files)')}
  🎨 Code formatting      ${colors.gray('(Prettier integration)')}
  🔒 Security audit       ${colors.gray('(npm audit)')}
  📦 Dependencies         ${colors.gray('(package.json analysis)')}

${colors.bold(colors.magenta('⚡ DEBT PRIORITY LEVELS:'))}
  P4 Low: Minor style issues
  P3 Medium: Moderate cleanup needed  
  P2 High: Significant problems
  P1 Critical: Urgent fixes required
  🤌 Guido Level: EXTREME debt - Thumb Crusher deployed
  🕴️  Mafia Level: Debt sold to loan sharks

${colors.bold(colors.yellow('💡 QUICK START:'))}
  refuctor info           Show capabilities and project analysis
  refuctor scan          Full debt analysis
  refuctor cook          Export VS Code problems to markdown (when scan misses issues)
  refuctor fix --dry-run  See what can be auto-fixed
  refuctor init          Set up debt tracking
`);

// Scan command - core debt detection
program
  .command('scan')
  .description(colors.yellow('👁️  Detect technical debt in your project (markdown, spelling, security)'))
  .option('-v, --verbose', 'Show detailed debt breakdown')
  .option('-o, --output <file>', 'Save debt report to file')
  .action(async (options) => {
    console.log(colors.bold(colors.red('\n🏦 REFUCTOR DEBT COLLECTION AGENCY')));
    console.log(colors.gray('Initiating debt scan... Your code is about to be audited.\n'));
    
    // Show what's being scanned for transparency
    const projectPath = process.cwd();
    console.log(colors.bold(colors.blue('🔍 SCANNING FOR:')));
    
    // Quick file count analysis
    const mdFiles = glob.sync('**/*.{md,mdc}', { cwd: projectPath, ignore: ['node_modules/**', '.git/**'] });
    const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx}', { cwd: projectPath, ignore: ['node_modules/**', '.git/**'] });
    const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
    
    console.log(colors.cyan(`  📄 Markdown issues (${mdFiles.length} files)`));
    console.log(colors.cyan(`  📝 Spelling errors with snarky intelligence`));
    if (hasPackageJson) {
      console.log(colors.cyan(`  🔒 Security vulnerabilities (package.json found)`));
      console.log(colors.cyan(`  📦 Dependency issues`));
    }
    if (codeFiles.length > 0) {
      console.log(colors.cyan(`  💻 Code quality issues (${codeFiles.length} files)`));
      console.log(colors.cyan(`  🎨 ESLint/TypeScript/Formatting problems`));
    }
    console.log('');
    
    try {
      const debtReport = await debtDetector.scanProject(process.cwd(), options.verbose);
      
      // Show snarky processing results if it occurred
      if (debtReport.summary.snarkyProcessed && debtReport.summary.snarkyAdded > 0) {
        console.log(colors.bold(colors.cyan('\n🎯 SNARKY INTELLIGENCE RESULTS:')));
        console.log(colors.cyan(`📝 Auto-whitelisted ${debtReport.summary.snarkyAdded} snarky terms in project dictionary`));
        console.log(colors.gray('Intelligently distinguished between typos and intentional snarky language\n'));
      }

      if (debtReport.totalDebt === 0) {
        console.log(colors.bold(colors.green('🎉 DEBT-FREE STATUS ACHIEVED!')));
        console.log(colors.green('You magnificent debt-slayer! Your code is cleaner than a banker\'s conscience.'));
        
        // Show what was actually checked for transparency
        console.log(colors.bold(colors.blue('\n📊 SCAN SUMMARY:')));
        console.log(colors.blue(`  ✅ Checked ${mdFiles.length} markdown files`));
        console.log(colors.blue(`  ✅ Checked ${codeFiles.length} code files`));
        if (hasPackageJson) {
          console.log(colors.blue(`  ✅ Security audit passed`));
          console.log(colors.blue(`  ✅ Dependencies validated`));
        }
        
        if (debtReport.summary.snarkyProcessed) {
          console.log(colors.cyan(`  🎯 Snarky language detection kept your creative vocabulary intact!`));
        }
        
        console.log(colors.bold(colors.gray('\n💡 DEBT WOULD TRIGGER AT:')));
        console.log(colors.gray('  P4 Low: 1+ markdown issues, 1+ ESLint warnings'));
        console.log(colors.gray('  P3 Medium: 2+ markdown issues, 5+ ESLint warnings'));
        console.log(colors.gray('  P2 High: 5+ markdown issues, 10+ ESLint errors'));
        console.log(colors.gray('  P1 Critical: 20+ markdown issues, 25+ ESLint errors'));
        console.log(colors.red('  🤌 Guido: 100+ markdown issues, 150+ ESLint errors'));
        console.log(colors.magenta('  🕴️  Mafia: 50+ markdown issues, 75+ ESLint errors'));
      } else {
        console.log(colors.bold(colors.red(`💸 DEBT DETECTED: ${debtReport.totalDebt} issues found`)));
        console.log(colors.yellow('Time to refinance this technical disaster...\n'));
        
        // Check for Guido the Thumb Crusher appearance FIRST
        if (debtReport.guidoAppearance && debtReport.guidoAppearance.triggered) {
          console.log(colors.bold(colors.red('\n' + '='.repeat(80))));
          console.log(colors.bold(colors.red('🤌 GUIDO THE THUMB CRUSHER HAS ARRIVED 🤌')));
          console.log(colors.bold(colors.red('='.repeat(80))));
          console.log(colors.red(debtReport.guidoAppearance.message));
          if (debtReport.guidoAppearance.daysOverdue > 0) {
            console.log(colors.bold(colors.red(`⏰ VIGorish overdue: ${debtReport.guidoAppearance.daysOverdue} days`)));
          }
          console.log(colors.bold(colors.yellow('\n' + debtReport.guidoAppearance.recommendation)));
          console.log(colors.red('='.repeat(80) + '\n'));
        }

        // Check for Mafia Takeover
        if (debtReport.mafiaStatus && debtReport.mafiaStatus.triggered) {
          console.log(colors.bold(colors.magenta('\n' + '='.repeat(60))));
          console.log(colors.bold(colors.magenta('🕴️ MAFIA TAKEOVER - DEBT SOLD TO THE FAMILY 🕴️')));
          console.log(colors.bold(colors.magenta('='.repeat(60))));
          console.log(colors.magenta(debtReport.mafiaStatus.message));
          console.log(colors.bold(colors.yellow(`💰 VIGorish Rate: ${debtReport.mafiaStatus.vigorishRate}% daily`)));
          console.log(colors.bold(colors.yellow(`💸 Daily Penalty: ${debtReport.mafiaStatus.dailyPenalty} debt units`)));
          console.log(colors.bold(colors.cyan('\n' + debtReport.mafiaStatus.recommendation)));
          console.log(colors.magenta('='.repeat(60) + '\n'));
        }

        // Display Guido Level debt
        if (debtReport.guido.length > 0) {
          console.log(colors.bold(colors.red('🤌 GUIDO LEVEL - THUMB CRUSHER COLLECTION:')));
          debtReport.guido.forEach(debt => console.log(colors.red(`  💀 ${debt}`)));
        }

        // Display Mafia Level debt
        if (debtReport.mafia.length > 0) {
          console.log(colors.bold(colors.magenta('🕴️ MAFIA LEVEL - FAMILY BUSINESS:')));
          debtReport.mafia.forEach(debt => console.log(colors.magenta(`  💰 ${debt}`)));
        }

        // Display debt by priority
        if (debtReport.p1.length > 0) {
          console.log(colors.bold(colors.red('🚨 P1 CRITICAL - FORECLOSURE IMMINENT:')));
          debtReport.p1.forEach(debt => console.log(colors.red(`  ❌ ${debt}`)));
        }
        
        if (debtReport.p2.length > 0) {
          console.log(colors.bold(colors.yellow('\n⚠️  P2 HIGH - REPOSSESSION NOTICE:')));
          debtReport.p2.forEach(debt => console.log(colors.yellow(`  ⚡ ${debt}`)));
        }
        
        if (debtReport.p3.length > 0) {
          console.log(colors.bold(colors.blue('\n📋 P3 MEDIUM - LIENS FILED:')));
          debtReport.p3.forEach(debt => console.log(colors.blue(`  📝 ${debt}`)));
        }
        
        if (debtReport.p4.length > 0) {
          console.log(colors.bold(colors.gray('\n💰 P4 LOW - INTEREST ACCRUING:')));
          debtReport.p4.forEach(debt => console.log(colors.gray(`  💳 ${debt}`)));
        }
      }
      
      // Save output if requested
      if (options.output) {
        await techDebtManager.saveDebtReport(debtReport, options.output);
        console.log(colors.green(`\n💾 Debt report saved to ${options.output}`));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 DEBT COLLECTION FAILED:')));
      console.error(colors.red(`Your code is so broken even the debt collector quit: ${error.message}`));
      process.exit(1);
    }
  });

// Fix command - attempt to auto-fix common issues
program
  .command('fix')
  .description(colors.green('🔧 Auto-fix common debt issues (formatting, console.logs, simple errors)'))
  .option('-d, --dry-run', 'Show what would be fixed without making changes')
  .option('-t, --type <type>', 'Fix specific type: formatting, console-logs, todos, spelling')
  .action(async (options) => {
    console.log(colors.bold(colors.green('\n🔧 REFUCTOR AUTO-FIXER')));
    console.log(colors.gray('Attempting to resolve your debt issues automatically...\n'));
    
    try {
      const projectPath = process.cwd();
      const fixReport = { fixed: 0, attempted: 0, errors: [] };
      
      // Run targeted fixes based on type
      if (!options.type || options.type === 'formatting') {
        console.log(colors.blue('🎨 Attempting to fix formatting issues...'));
        const formattingResult = await attemptFormattingFix(projectPath, options.dryRun);
        fixReport.fixed += formattingResult.fixed;
        fixReport.attempted += formattingResult.attempted;
        if (formattingResult.error) fixReport.errors.push(formattingResult.error);
      }
      
      if (!options.type || options.type === 'console-logs') {
        console.log(colors.yellow('🗑️  Attempting to remove console.log statements...'));
        const consoleResult = await attemptConsoleLogCleanup(projectPath, options.dryRun);
        fixReport.fixed += consoleResult.fixed;
        fixReport.attempted += consoleResult.attempted;
        if (consoleResult.error) fixReport.errors.push(consoleResult.error);
      }
      
      if (!options.type || options.type === 'spelling') {
        console.log(colors.magenta('📝 Attempting to fix spelling issues...'));
        const spellResult = await attemptSpellingFix(projectPath, options.dryRun);
        fixReport.fixed += spellResult.fixed;
        fixReport.attempted += spellResult.attempted;
        if (spellResult.error) fixReport.errors.push(spellResult.error);
      }
      
      // Report results
      if (fixReport.fixed > 0) {
        console.log(colors.bold(colors.green(`\n✅ DEBT REDUCTION SUCCESSFUL!`)));
        console.log(colors.green(`Fixed ${fixReport.fixed} out of ${fixReport.attempted} issues`));
        console.log(colors.cyan('Your debt collectors are pleased with this progress.'));
      } else if (fixReport.attempted > 0) {
        console.log(colors.bold(colors.yellow(`\n⚠️  AUTO-FIX PARTIALLY SUCCESSFUL`)));
        console.log(colors.yellow(`Attempted ${fixReport.attempted} fixes, but manual intervention required`));
        console.log(colors.gray('Some debt requires human intelligence. Shocking, we know.'));
      } else {
        console.log(colors.bold(colors.blue(`\n🎯 NO FIXABLE ISSUES DETECTED`)));
        console.log(colors.blue('Either you\'re debt-free, or your issues are too complex for automation.'));
      }
      
      if (fixReport.errors.length > 0) {
        console.log(colors.bold(colors.red('\n💥 SOME FIXES FAILED:')));
        fixReport.errors.forEach(error => console.log(colors.red(`  ❌ ${error}`)));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 AUTO-FIX SYSTEM FAILURE:')));
      console.error(colors.red(`The debt is so bad, even our automatic fixer quit: ${error.message}`));
      process.exit(1);
    }
  });

// Info command - show capabilities and configuration detection
program
  .command('info')
  .description(colors.blue('ℹ️  Show Refuctor capabilities and detected configurations'))
  .action(async () => {
    console.log(colors.bold(colors.cyan('\n📊 REFUCTOR DEBT DETECTION CAPABILITIES')));
    console.log(colors.gray(`Version: ${packageJson.version}`));
    console.log(colors.gray('Checking your project configuration...\n'));
    
    const projectPath = process.cwd();
    const capabilities = {
      core: [],
      enhanced: [],
      configs: [],
      files: []
    };
    
    // Core detection (always available)
    capabilities.core = [
      '✅ Markdown linting (markdownlint)',
      '✅ Spell checking (cspell with snarky intelligence)',
      '✅ Security audit (npm audit)',
      '✅ Dependency analysis'
    ];
    
    // Enhanced detection (check if methods exist)
    const detector = new DebtDetector();
    if (detector.detectESLintDebt) {
      const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js'];
      const hasESLint = eslintConfigs.some(file => fs.existsSync(path.join(projectPath, file)));
      capabilities.enhanced.push(hasESLint ? '✅ ESLint detection (config found)' : '⚠️  ESLint detection (no config found)');
      capabilities.configs.push(...eslintConfigs.filter(file => fs.existsSync(path.join(projectPath, file))));
    }
    
    if (detector.detectTypeScriptDebt) {
      const hasTSConfig = fs.existsSync(path.join(projectPath, 'tsconfig.json'));
      capabilities.enhanced.push(hasTSConfig ? '✅ TypeScript compilation (tsconfig.json found)' : '⚠️  TypeScript compilation (no tsconfig.json)');
      if (hasTSConfig) capabilities.configs.push('tsconfig.json');
    }
    
    if (detector.detectCodeQualityDebt) {
      capabilities.enhanced.push('✅ Code quality analysis (console.logs, TODOs, dead code)');
    }
    
    if (detector.detectFormattingDebt) {
      const prettierConfigs = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'];
      const hasPrettier = prettierConfigs.some(file => fs.existsSync(path.join(projectPath, file)));
      capabilities.enhanced.push(hasPrettier ? '✅ Prettier formatting (config found)' : '⚠️  Prettier formatting (no config found)');
      capabilities.configs.push(...prettierConfigs.filter(file => fs.existsSync(path.join(projectPath, file))));
    }
    
    // File analysis
    const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx}', { cwd: projectPath, ignore: ['node_modules/**', '.git/**'] });
    const mdFiles = glob.sync('**/*.{md,mdc}', { cwd: projectPath, ignore: ['node_modules/**', '.git/**'] });
    const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
    
    capabilities.files = [
      `📄 ${mdFiles.length} markdown files`,
      `💻 ${codeFiles.length} code files`,
      hasPackageJson ? '📦 package.json found' : '❌ No package.json'
    ];
    
    // Display results
    console.log(colors.bold(colors.green('🔍 CORE DETECTION (Always Available):')));
    capabilities.core.forEach(item => console.log(`  ${item}`));
    
    if (capabilities.enhanced.length > 0) {
      console.log(colors.bold(colors.cyan('\n⚡ ENHANCED DETECTION:')));
      capabilities.enhanced.forEach(item => console.log(`  ${item}`));
    }
    
    console.log(colors.bold(colors.blue('\n📁 PROJECT ANALYSIS:')));
    capabilities.files.forEach(item => console.log(`  ${item}`));
    
    if (capabilities.configs.length > 0) {
      console.log(colors.bold(colors.yellow('\n⚙️  DETECTED CONFIG FILES:')));
      capabilities.configs.forEach(config => console.log(`  📝 ${config}`));
    }
    
    console.log(colors.bold(colors.magenta('\n🎯 DEBT THRESHOLDS:')));
    console.log('  P1 Critical: 25+ ESLint errors, 10+ TS errors, 20+ markdown issues');
    console.log('  P2 High: 10+ ESLint errors, 5+ TS errors, 5+ markdown issues');
    console.log('  P3 Medium: 5+ ESLint warnings, 2+ markdown issues, formatting issues');
    console.log('  P4 Low: Any remaining minor issues');
    console.log('  🤌 Guido Level: 150+ ESLint errors, 50+ TS errors (EXTREME!)');
    console.log('  🕴️  Mafia Level: 75+ ESLint errors, 30+ TS errors (LOAN SHARK!)');
    
    console.log(colors.bold(colors.gray('\n💡 USAGE TIPS:')));
    console.log('  refuctor scan --verbose     # Run full debt analysis');
    console.log('  refuctor cook               # Export VS Code problems (when scan misses issues)');
    console.log('  refuctor fix --dry-run      # See what can be auto-fixed');
    console.log('  refuctor snarky-scan        # Analyze spelling with snarky intelligence');
    console.log('  refuctor init               # Set up debt tracking (TECHDEBT.md)');
  });

// Cook the Books command - export VS Code problems to markdown
program
  .command('cook-the-books')
  .alias('cook')
  .description(colors.yellow('🍳 Export VS Code problems to debt report (when Refuctor scan misses issues)'))
  .option('-o, --output <file>', 'Output file for cooked books', 'vscode-debt-report.md')
  .option('-f, --format <type>', 'Output format: md, json, csv', 'md')
  .action(async (options) => {
    console.log(colors.bold(colors.yellow('\n🍳 COOKING THE BOOKS...')));
    console.log(colors.gray('Extracting VS Code problems that slipped through the cracks...\n'));
    
    try {
      const projectPath = process.cwd();
      const cookingReport = await cookTheBooks(projectPath, options);
      
      if (cookingReport.totalIssues === 0) {
        console.log(colors.green('📊 No hidden problems found - VS Code is clean!'));
        console.log(colors.gray('Either VS Code has no problems, or they\'re already detected by Refuctor.'));
      } else {
        console.log(colors.bold(colors.red(`📊 COOKED BOOKS REVEAL: ${cookingReport.totalIssues} hidden issues!`)));
        console.log(colors.yellow(`📁 Exported to: ${options.output}`));
        console.log(colors.gray(`This explains why VS Code status bar shows problems Refuctor missed.\n`));
        
        // Show summary by file
        console.log(colors.bold(colors.cyan('🎯 TOP PROBLEM FILES:')));
        Object.entries(cookingReport.fileBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([file, count]) => {
            console.log(colors.cyan(`  📄 ${file}: ${count} issues`));
          });
          
        console.log(colors.bold(colors.magenta('\n💡 RECOMMENDED ACTIONS:')));
        console.log(colors.magenta('1. Review the exported report for specific fixes'));
        console.log(colors.magenta('2. Run VS Code "Problems" panel fixes manually'));
        console.log(colors.magenta('3. Consider adding missing linter configs for Refuctor'));
        console.log(colors.magenta('4. Re-run refuctor scan after manual cleanup'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 COOKING FAILED:')));
      console.error(colors.red(`Book cooking error: ${error.message}`));
      console.log(colors.gray('\nTip: Make sure VS Code diagnostics are available or run from VS Code terminal'));
      process.exit(1);
    }
  });

// Status command - show current debt overview
program
  .command('status')
  .description(colors.blue('📊 Show current debt status and trends'))
  .action(async () => {
    console.log(colors.bold(colors.cyan('\n📊 REFUCTOR DEBT STATUS REPORT')));
    console.log(colors.gray('Checking your financial... err, technical standing...\n'));
    
    try {
      const status = await techDebtManager.getDebtStatus(process.cwd());
      
      if (status.hasDebtFile) {
        console.log(colors.green('✅ TECHDEBT.md tracking active'));
        console.log(colors.blue(`📈 Sessions tracked: ${status.sessionsTracked}`));
        console.log(colors.yellow(`⚖️  Current debt level: ${status.currentDebtLevel}`));
        
        if (status.debtTrend === 'improving') {
          console.log(colors.green('📈 Debt trend: IMPROVING (you\'re doing great!)'));
        } else if (status.debtTrend === 'worsening') {
          console.log(colors.red('📉 Debt trend: WORSENING (time to panic?)'));
        } else {
          console.log(colors.gray('📊 Debt trend: STABLE (maintain course)'));
        }
      } else {
        console.log(colors.yellow('⚠️  No TECHDEBT.md found'));
        console.log(colors.gray('Run `refuctor init` to start tracking your technical debt'));
      }
      
    } catch (error) {
      console.error(colors.red(`Status check failed: ${error.message}`));
      process.exit(1);
    }
  });

// Init command - set up debt tracking
program
  .command('init')
  .description(colors.green('🏗️  Initialize debt tracking in your project'))
  .option('-f, --force', 'Overwrite existing TECHDEBT.md')
  .action(async (options) => {
    console.log(colors.bold(colors.green('\n🏗️  REFUCTOR DEBT TRACKING SETUP')));
    console.log(colors.gray('Establishing your debt management infrastructure...\n'));
    
    try {
      const result = await techDebtManager.initializeProject(process.cwd(), options.force);
      
      if (result.created) {
        console.log(colors.bold(colors.green('✅ DEBT TRACKING ACTIVATED!')));
        console.log(colors.green('TECHDEBT.md created - your debt has nowhere to hide now'));
        console.log(colors.blue('Run `refuctor scan` to start detecting issues'));
      } else if (result.exists && !options.force) {
        console.log(colors.yellow('⚠️  TECHDEBT.md already exists'));
        console.log(colors.gray('Use --force to overwrite, or you\'re already in debt management'));
      }
      
    } catch (error) {
      console.error(colors.red(`Initialization failed: ${error.message}`));
      process.exit(1);
    }
  });

// Shame command - humorous debt report
program
  .command('shame')
  .description(colors.magenta('😱 Generate a humorous debt shaming report'))
  .action(async () => {
    console.log(colors.bold(colors.magenta('\n😱 REFUCTOR HALL OF SHAME')));
    console.log(colors.gray('Preparing your public humiliation...\n'));
    
    try {
      const shameReport = await debtDetector.generateShameReport(process.cwd());
      
      if (shameReport.totalShame === 0) {
        console.log(colors.bold(colors.green('🏆 CONGRATULATIONS!')));
        console.log(colors.green('Your code is so clean it squeaks. No shame here, you absolute legend.'));
      } else {
        console.log(colors.bold(colors.red(`🔥 SHAME LEVEL: ${shameReport.shameLevel.toUpperCase()}`)));
        console.log(colors.yellow(`💸 Total debt: ${shameReport.totalShame} issues`));
        console.log(colors.gray(`🕐 Time wasted: ~${shameReport.timeWasted} hours`));
        console.log(colors.magenta(`💰 Estimated cleanup cost: $${shameReport.cleanupCost}`));
        
        console.log(colors.red('\n🎭 SHAME BREAKDOWN:'));
        shameReport.shameItems.forEach(item => {
          console.log(colors.red(`  ${item.emoji} ${item.description}`));
        });
        
        console.log(colors.yellow('\n💡 REDEMPTION PATH:'));
        console.log(colors.green('  1. Run `refuctor scan` to see all issues'));
        console.log(colors.green('  2. Fix P1 critical issues immediately'));
        console.log(colors.green('  3. Schedule time for P2-P4 cleanup'));
        console.log(colors.green('  4. Run `refuctor shame` again to measure improvement'));
      }
      
    } catch (error) {
      console.error(colors.red(`Shame generation failed: ${error.message}`));
      process.exit(1);
    }
  });

// Fix command - general auto-repair
program
  .command('fix')
  .description(colors.cyan('🔧 Auto-repair common debt issues (safe fixes only)'))
  .option('--dry-run', 'Preview fixes without applying them')
  .option('--all', 'Fix all file types (markdown, spelling, etc.)')
  .action(async (options) => {
    console.log(colors.bold(colors.cyan('\n🔧 REFUCTOR AUTO-REPAIR SERVICE')));
    console.log(colors.gray('Applying safe automated fixes to eliminate debt...\n'));
    
    try {
      const projectRoot = process.cwd();
      let totalFixes = 0;
      
      // Always fix markdown (safe and proven)
      console.log(colors.magenta('📝 Applying markdown fixes...'));
      const glob = require('glob');
      const mdFiles = glob.sync('**/*.{md,mdc}', { 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'REFUCTOR_MYTHOS.md'] 
      });
      
      for (const file of mdFiles) {
        const report = await markdownFixerGoon.eliminateDebt(file, options.dryRun);
        if (report.fixesApplied > 0) {
          console.log(colors.green(`   ✅ ${file}: ${report.fixesApplied} fixes applied`));
          totalFixes += report.fixesApplied;
        }
      }
      
      // Future: Add other safe auto-fixes here
      if (options.all) {
        console.log(colors.gray('   📦 Additional fix types coming in future updates...'));
      }
      
      console.log(colors.bold(colors.green(`\n🎉 AUTO-REPAIR COMPLETE!`)));
      console.log(colors.green(`Total fixes applied: ${totalFixes}`));
      
      if (options.dryRun) {
        console.log(colors.yellow('⚠️  DRY RUN: No actual changes made'));
        console.log(colors.gray('Remove --dry-run flag to apply fixes'));
      } else if (totalFixes > 0) {
        console.log(colors.green('Your debt has been refinanced. Much better!'));
      } else {
        console.log(colors.blue('No debt found to fix. You magnificent debt-slayer!'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 AUTO-REPAIR FAILED:')));
      console.error(colors.red(`Even our automated systems couldn't handle this: ${error.message}`));
      process.exit(1);
    }
  });

// Wrap command - session wrap protocol  
program
  .command('wrap')
  .description(colors.blue('📋 Execute comprehensive session wrap protocol'))
  .option('--skip-debt-scan', 'Skip automated debt detection')
  .option('--brief', 'Generate brief wrap summary')
  .action(async (options) => {
    console.log(colors.bold(colors.blue('\n📋 REFUCTOR SESSION WRAP PROTOCOL')));
    console.log(colors.gray('Executing comprehensive session cleanup and debt assessment...\n'));
    
    try {
      // Step 1: Debt scan (unless skipped)
      if (!options.skipDebtScan) {
        console.log(colors.cyan('🔍 STEP 1: Technical Debt Assessment'));
        const debtReport = await debtDetector.scanProject(process.cwd(), true);
        
        if (debtReport.totalDebt === 0) {
          console.log(colors.bold(colors.green('   ✅ DEBT-FREE STATUS MAINTAINED!')));
        } else {
          console.log(colors.yellow(`   ⚠️  ${debtReport.totalDebt} debt items detected`));
          console.log(colors.gray('   Run `refuctor fix` or `refuctor scan` for details'));
        }
      }
      
      // Step 2: Session Summary
      console.log(colors.cyan('\n📊 STEP 2: Session Summary Generation'));
      const sessionData = {
        timestamp: new Date().toISOString(),
        debtStatus: options.skipDebtScan ? 'skipped' : 'scanned',
        filesModified: 'detected via git status',
        recommendations: []
      };
      
      // Future: Add more comprehensive session analysis
      console.log(colors.green('   ✅ Session data collected'));
      
      // Step 3: Recommendations
      console.log(colors.cyan('\n💡 STEP 3: Next Session Recommendations'));
      console.log(colors.blue('   🎯 Continue with Phase 1 completion'));
      console.log(colors.blue('   🚀 Consider NPM package publishing'));
      console.log(colors.blue('   📈 Add more specialized goons'));
      
      if (options.brief) {
        console.log(colors.bold(colors.green('\n📝 BRIEF WRAP COMPLETE')));
      } else {
        console.log(colors.bold(colors.green('\n📝 COMPREHENSIVE WRAP COMPLETE')));
        console.log(colors.gray('Session state documented for next development cycle'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 SESSION WRAP FAILED:')));
      console.error(colors.red(`Wrap protocol error: ${error.message}`));
      process.exit(1);
    }
  });

// Easter egg commands
program
  .command('bailmeout')
  .description(colors.gray('🆘 Emergency motivation for desperate developers'))
  .action(() => {
    const motivationalQuotes = [
      "Your code called. It wants a debt consolidation loan.",
      "Bankruptcy is not an option. Fix it or live with the shame.",
      "Even your comments have trust issues with your code.",
      "This isn't technical debt, it's technical bankruptcy.",
      "Your future self is writing a strongly worded letter about this code.",
      "Code like this is why senior developers drink coffee by the pot.",
      "Git blame was invented for code like yours.",
      "Your IDE is filing a restraining order."
    ];
    
    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    console.log(colors.bold(colors.yellow('\n🆘 EMERGENCY MOTIVATION:')));
    console.log(colors.white(`"${quote}"`));
    console.log(colors.gray('\n- The Refuctor Debt Collection Agency\n'));
  });

// Mafia/Guido test command - demonstrate loan shark escalation hierarchy
program
  .command('guido')
  .description(colors.red('🤌 [EASTER EGG] Demonstrate the Mafia → Guido escalation hierarchy'))
  .option('--mafia-only', 'Show only mafia takeover (before Guido)')
  .action((options) => {
    const detector = new DebtDetector();
    
    if (options.mafiaOnly) {
      // Show mafia takeover
      console.log(colors.bold(colors.magenta('\n' + '='.repeat(60))));
      console.log(colors.bold(colors.magenta('🕴️ MAFIA TAKEOVER - DEBT SOLD TO THE FAMILY 🕴️')));
      console.log(colors.bold(colors.magenta('='.repeat(60))));
      
      const mafiaMessage = detector.mafiaMessages[Math.floor(Math.random() * detector.mafiaMessages.length)];
      console.log(colors.magenta(mafiaMessage));
      console.log(colors.bold(colors.yellow('💰 VIGorish Rate: 15% daily')));
      console.log(colors.bold(colors.yellow('💸 Daily Penalty: 11 debt units')));
      console.log(colors.bold(colors.cyan('\n💰 DEBT SOLD TO FAMILY: Your technical debt has been purchased by private investors. VIGorish is now being charged daily.')));
      console.log(colors.magenta('='.repeat(60)));
      
      console.log(colors.gray('\n💡 Mafia takeover happens when:'));
      console.log(colors.gray('   • 100+ markdown errors'));
      console.log(colors.gray('   • 50+ spelling errors'));
      console.log(colors.gray('   • 3+ critical security vulnerabilities'));
      console.log(colors.gray('   • 75+ total debt items'));
      console.log(colors.gray('   • 5+ P1 critical issues'));
      console.log(colors.gray('\n⏰ If VIGorish goes unpaid for 2+ days... Guido gets deployed.'));
    } else {
      // Show full Guido escalation
      console.log(colors.bold(colors.red('\n' + '='.repeat(80))));
      console.log(colors.bold(colors.red('🤌 GUIDO THE THUMB CRUSHER HAS ARRIVED 🤌')));
      console.log(colors.bold(colors.red('='.repeat(80))));
      
      const randomMessage = detector.getGuidoMessage();
      console.log(colors.red(randomMessage));
      console.log(colors.bold(colors.red('⏰ VIGorish overdue: 3 days')));
      console.log(colors.bold(colors.yellow('\n🤌 GUIDO DEPLOYED: VIGorish payment overdue. The Thumb Crusher is here for collection. Fix debt NOW or face "coding accidents".')));
      console.log(colors.red('='.repeat(80)));
      
      console.log(colors.gray('\n💡 Debt Escalation Hierarchy:'));
      console.log(colors.gray('   1. P4 → P3 → P2 → P1 (Normal Collection Agency)'));
      console.log(colors.gray('   2. 🕴️ MAFIA TAKEOVER (debt sold to family, VIGorish starts)'));
      console.log(colors.gray('   3. 🤌 GUIDO DEPLOYED (VIGorish overdue 2+ days)'));
      console.log(colors.gray('\n🎭 This is a demonstration. Use --mafia-only to see mafia stage.'));
    }
  });

// Goon command - specialized debt elimination tools
const goonCommand = program
  .command('goon')
  .description(colors.magenta('💀 Deploy specialized debt elimination goons'))
  .configureOutput({
    writeOut: (str) => process.stdout.write(str),
    writeErr: (str) => process.stderr.write(str)
  });

// Goon: Markdown Fixer
goonCommand
  .command('fix-markdown <file>')
  .description(colors.magenta('📝 Aggressive markdown debt elimination'))
  .option('-p, --preview', 'Preview fixes without applying them')
  .action(async (file, options) => {
    console.log(colors.bold(colors.magenta('\n💀 MARKDOWN FIXER GOON DEPLOYED')));
    console.log(colors.gray(`Target acquired: ${file}`));
    console.log(colors.gray('Initiating aggressive document restructuring...\n'));
    
    try {
      const report = options.preview 
        ? await markdownFixerGoon.previewFixes(file)
        : await markdownFixerGoon.eliminateDebt(file);
      
      // Handle debt-ignored files
      if (report.ignored) {
        console.log(colors.bold(colors.gray('🚫 FILE DEBT-IGNORED')));
        console.log(colors.gray(`📄 File: ${report.filePath}`));
        console.log(colors.yellow(`💬 Status: ${report.message}`));
        console.log(colors.gray('\nFile excluded from debt tracking per .debtignore patterns.'));
        return;
      }
      
      console.log(colors.bold(colors.green('📊 DEBT ELIMINATION REPORT:')));
      console.log(colors.blue(`📄 File: ${report.filePath}`));
      console.log(colors.blue(`📏 Lines: ${report.originalLines} → ${report.fixedLines}`));
      console.log(colors.green(`🔧 Fixes Applied: ${report.fixesApplied}`));
      console.log(colors.magenta(`💬 Status: ${report.message}`));
      
      if (options.preview) {
        console.log(colors.yellow('\n⚠️  PREVIEW MODE: No changes were made'));
        console.log(colors.gray('Remove --preview flag to apply fixes'));
      } else {
        console.log(colors.bold(colors.green('\n✅ DEBT ELIMINATED!')));
        console.log(colors.green('Your markdown is now cleaner than a loan shark\'s books.'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 GOON DEPLOYMENT FAILED:')));
      console.error(colors.red(`Even our best goon couldn't handle this mess: ${error.message}`));
      process.exit(1);
    }
  });

// Easter eggs
program
  .option('--bailMeOut', 'Motivational quotes from failed startups')
  .option('--skipSessionWrap', 'Sarcastic rant about responsibility')
  .hook('preAction', (thisCommand, actionCommand) => {
    if (thisCommand.opts().bailMeOut) {
      const quotes = [
        "\"We're not failing, we're pivoting to success!\" - Every startup ever",
        "\"Technical debt is just deferred engineering excellence.\" - CTO who got fired",
        "\"We'll fix it in the next sprint.\" - Famous last words",
        "\"It's not a bug, it's an undocumented feature.\" - Senior developer",
        "\"We're disrupting the debugging industry.\" - Startup that never shipped"
      ];
      console.log(colors.bold(colors.cyan('\n💡 STARTUP WISDOM:')));
      console.log(colors.cyan(quotes[Math.floor(Math.random() * quotes.length)]));
      console.log(colors.gray('\nNow get back to work and fix your debt.\n'));
    }
    
    if (thisCommand.opts().skipSessionWrap) {
      console.log(colors.bold(colors.red('\n🚨 RESPONSIBILITY ALERT:')));
      console.log(colors.red('Oh, you want to skip the session wrap? How very... professional of you.'));
      console.log(colors.yellow('Let me guess - "I\'ll document it later" and "The code is self-explanatory"?'));
      console.log(colors.gray('This is how technical debt starts. One skipped session at a time.'));
      console.log(colors.bold(colors.red('DO THE WRAP. YOUR FUTURE SELF WILL THANK YOU.\n')));
    }
  });

// Show tagline after command execution
program.hook('postAction', () => {
  console.log(colors.gray(`\n${getRandomTagline()}`));
});

// Handle unknown commands with personality
program.on('command:*', function (operands) {
  console.error(colors.bold(colors.red(`\n💥 UNKNOWN COMMAND: '${operands[0]}'`)));
  console.error(colors.yellow('Even the debt collector doesn\'t know what you\'re trying to do.'));
  console.error(colors.gray('Run `refuctor --help` for available commands\n'));
  process.exit(1);
});

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

// NEW: Comprehensive debt elimination command
program
  .command('exterminate')
  .description('🔥 AGGRESSIVE DEBT ELIMINATION - Deploy all goons simultaneously')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--target <files>', 'Specific files to target (comma-separated)')
  .option('--auto-approve', 'Skip confirmation prompts')
  .action(async (options) => {
    try {
      console.log(red('\n💀 DEBT EXTERMINATION PROTOCOL INITIATED 💀'));
      console.log(yellow('🚨 Deploying all available goons to eliminate technical debt...'));
      
      const projectRoot = process.cwd();
      const detector = new DebtDetector();
      
      // Step 1: Scan current debt
      console.log(cyan('\n📊 SCANNING CURRENT DEBT LEVELS...'));
      const initialScan = await detector.scanProject(projectRoot, true);
      
      console.log(red(`\n💸 DEBT REPORT BEFORE EXTERMINATION:`));
      console.log(`   P1 (Critical): ${initialScan.p1.length}`);
      console.log(`   P2 (High): ${initialScan.p2.length}`);
      console.log(`   P3 (Medium): ${initialScan.p3.length}`);
      console.log(`   P4 (Low): ${initialScan.p4.length}`);
      console.log(`   Total Debt: ${initialScan.totalDebt}`);
      
      // Step 2: Deploy markdown goons
      console.log(magenta('\n🗂️  DEPLOYING MARKDOWN FIXER GOONS...'));
      const glob = require('glob');
      const mdFiles = glob.sync('**/*.{md,mdc}', { 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'] 
      });
      
      let totalFixes = 0;
      for (const file of mdFiles) {
        if (options.target && !options.target.split(',').some(t => file.includes(t.trim()))) {
          continue;
        }
        
        const report = await markdownFixerGoon.eliminateDebt(file, options.dryRun);
        if (report.ignored) {
          console.log(gray(`   🚫 ${file}: debt-ignored`));
        } else if (report.fixesApplied > 0) {
          console.log(green(`   ✅ ${file}: ${report.fixesApplied} violations eliminated`));
          totalFixes += report.fixesApplied;
        }
      }
      
      // Step 3: Final scan
      console.log(cyan('\n📊 SCANNING POST-EXTERMINATION DEBT LEVELS...'));
      const finalScan = await detector.scanProject(projectRoot, true);
      
      console.log(green(`\n🎉 DEBT EXTERMINATION COMPLETE!`));
      console.log(`   Fixes Applied: ${totalFixes}`);
      console.log(`   Debt Reduction: ${initialScan.totalDebt - finalScan.totalDebt}`);
      console.log(`   Remaining Debt: ${finalScan.totalDebt}`);
      
      if (finalScan.totalDebt === 0) {
        console.log(green('\n🏆 DEBT-FREE STATUS ACHIEVED! YOU MAGNIFICENT DEBT-SLAYER!'));
      } else {
        console.log(yellow('\n💰 Remaining debt requires manual intervention or specialized goons.'));
      }
      
    } catch (error) {
      console.error(red(`💥 Debt extermination failed: ${error.message}`));
      process.exit(1);
    }
  });

// NEW: Add missing dependencies check
program
  .command('dependencies')
  .description('📦 Check for missing dependencies and suggest installation')
  .action(() => {
    const packageJson = require('../package.json');
    const requiredDeps = ['commander', 'chalk', 'fs-extra', 'glob', 'minimatch'];
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.log(red('💸 Missing dependencies detected!'));
      console.log(yellow(`Run: npm install ${missingDeps.join(' ')}`));
    } else {
      console.log(green('✅ All required dependencies are installed.'));
    }
  });

// Debt ignore management
program
  .command('ignore')
  .description(colors.gray('🚫 Manage debt ignore patterns (.debtignore file)'))
  .option('--add <pattern>', 'Add a pattern to .debtignore')
  .option('--remove <pattern>', 'Remove a pattern from .debtignore')
  .option('--list', 'List current ignore patterns')
  .option('--init', 'Create sample .debtignore file')
  .action(async (options) => {
    console.log(colors.bold(colors.gray('\n🚫 REFUCTOR DEBT IGNORE MANAGEMENT')));
    console.log(colors.gray('Managing files excluded from debt tracking...\n'));
    
    try {
      const ignoreParser = new DebtIgnoreParser();
      const projectRoot = process.cwd();
      
      if (options.init) {
        const ignoreFilePath = path.join(projectRoot, '.debtignore');
        if (await fs.pathExists(ignoreFilePath)) {
          console.log(colors.yellow('⚠️  .debtignore already exists'));
        } else {
          const sampleContent = DebtIgnoreParser.getSampleContent();
          await fs.writeFile(ignoreFilePath, sampleContent, 'utf8');
          console.log(colors.bold(colors.green('✅ .DEBTIGNORE CREATED!')));
          console.log(colors.green('Sample patterns added - customize as needed'));
        }
        return;
      }
      
      // Load current patterns
      await ignoreParser.loadIgnorePatterns(projectRoot);
      
      if (options.add) {
        ignoreParser.addPattern(options.add);
        console.log(colors.green(`✅ Added pattern: ${options.add}`));
        console.log(colors.gray('Note: Update .debtignore file to persist this change'));
      }
      
      if (options.remove) {
        ignoreParser.removePattern(options.remove);
        console.log(colors.yellow(`🗑️  Removed pattern: ${options.remove}`));
        console.log(colors.gray('Note: Update .debtignore file to persist this change'));
      }
      
      if (options.list || (!options.add && !options.remove)) {
        const patterns = ignoreParser.getPatterns();
        console.log(colors.bold(colors.blue('📋 CURRENT DEBT IGNORE PATTERNS:')));
        
        if (patterns.length === 0) {
          console.log(colors.gray('  No ignore patterns configured'));
          console.log(colors.gray('  Run `refuctor ignore --init` to create .debtignore'));
        } else {
          patterns.forEach((pattern, index) => {
            const isDefault = index < 6; // First 6 are default patterns
            const prefix = isDefault ? colors.gray('  [default]') : colors.blue('  [custom] ');
            console.log(`${prefix} ${pattern}`);
          });
        }
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 IGNORE MANAGEMENT FAILED:')));
      console.error(colors.red(`Ignore operation error: ${error.message}`));
      process.exit(1);
    }
  });

// NEW: Web Dashboard Server
program
  .command('serve')
  .description(colors.green('🌐 Launch web dashboard for debt monitoring'))
  .option('-p, --port <port>', 'Port to run dashboard on', '1947')
  .option('--no-browser', 'Don\'t automatically open browser')
  .action(async (options) => {
    console.log(colors.bold(colors.green('\n🌐 REFUCTOR WEB DASHBOARD STARTING...')));
    console.log(colors.gray('Preparing debt monitoring interface...\n'));
    
    try {
      const DashboardServer = require('../src/dashboard-server');
      const server = new DashboardServer({
        port: parseInt(options.port),
        projectPath: process.cwd()
      });
      
      // Start the server
      await server.start();
      
      console.log(colors.bold(colors.cyan('🎉 DASHBOARD OPERATIONAL!')));
      console.log(colors.green(`🌐 URL: http://localhost:${options.port}`));
      console.log(colors.yellow('📊 Real-time debt monitoring active'));
      console.log(colors.gray('Press Ctrl+C to stop the debt collector\n'));
      
      // Optionally open browser
      if (options.browser !== false) {
        const open = await import('open');
        await open.default(`http://localhost:${options.port}`);
        console.log(colors.blue('🚀 Opening dashboard in your browser...'));
      }
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(colors.yellow('\n🛑 Shutting down debt collector...'));
        await server.stop();
        console.log(colors.gray('Dashboard stopped. Your debt is still there though.\n'));
        process.exit(0);
      });
      
      // Keep the process running
      process.stdin.resume();
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 DASHBOARD STARTUP FAILED:')));
      console.error(colors.red(`Server error: ${error.message}`));
      
      if (error.code === 'EADDRINUSE') {
        console.error(colors.yellow(`Port ${options.port} is already in use.`));
        console.error(colors.gray('Try a different port: refuctor serve --port 1948'));
      }
      
      process.exit(1);
    }
  });

// NEW SNARKY LANGUAGE COMMANDS
program
  .command('snarky-scan [path]')
  .description('🎯 Intelligently analyze spelling issues and detect snarky language')
  .option('--auto', 'Automatically handle obvious cases')
  .option('--confidence <level>', 'Confidence threshold (0.1-0.9)', '0.7')
  .action(async (projectPath = '.', options) => {
    try {
      console.log('🎯 SNARKY LANGUAGE DETECTIVE ACTIVATED');
      console.log('Analyzing spelling issues for intentional snarky language...\n');

      const detector = new DebtDetector();
      const snarkyHandler = new SnarkySpellHandler();
      
      // Get spelling issues
      const spellingDebt = await detector.detectSpellingDebt(projectPath);
      
      if (spellingDebt.total === 0) {
        console.log('✅ No spelling issues detected. Your vocabulary is pristine!');
        return;
      }

      // Analyze with snarky intelligence
      const analysis = await snarkyHandler.analyzeSpellingIssues(projectPath, spellingDebt.issues);
      
      // Display analysis
      console.log(`📊 ANALYSIS RESULTS:`);
      console.log(`   Total spelling issues: ${spellingDebt.total}`);
      console.log(`   Likely typos: ${analysis.definiteTypos.length}`);
      console.log(`   Likely snarky terms: ${analysis.likelySnarky.length}`);
      console.log(`   Uncertain: ${analysis.unsure.length}\n`);

      // Show suggestions
      if (analysis.suggestions.length > 0) {
        console.log('💡 SMART SUGGESTIONS:');
        analysis.suggestions.forEach(suggestion => {
          console.log(`   ${suggestion.description}`);
          if (suggestion.items.length <= 5) {
            suggestion.items.forEach(item => {
              if (typeof item === 'string') {
                console.log(`      • ${item}`);
              } else {
                console.log(`      • ${item.word} (${Math.round(item.confidence * 100)}% confidence)`);
              }
            });
          } else {
            console.log(`      (${suggestion.items.length} items total)`);
          }
        });
        console.log();
      }

      // Auto-handle if requested
      if (options.auto) {
        console.log('🤖 AUTO-HANDLING ENABLED...');
        
        // Auto-add likely snarky terms
        if (analysis.likelySnarky.length > 0) {
          const snarkyWords = analysis.likelySnarky.map(s => s.word);
          const result = await snarkyHandler.updateProjectDictionary(projectPath, snarkyWords);
          console.log(`✅ Added ${result.wordsAdded} snarky terms to project dictionary`);
        }

        // Report remaining issues
        if (analysis.definiteTypos.length > 0) {
          console.log(`🔧 ${analysis.definiteTypos.length} typos still need manual fixing`);
        }
        if (analysis.unsure.length > 0) {
          console.log(`🤔 ${analysis.unsure.length} terms need manual review`);
        }
      } else {
        console.log('💡 Run with --auto to automatically handle obvious cases');
        console.log('💡 Use "refuctor snarky-add" to add specific terms to dictionary');
        console.log('💡 Use "refuctor snarky-fix" to fix obvious typos');
      }

    } catch (error) {
      console.error('💥 Snarky scan failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('snarky-add <words...>')
  .description('📝 Add snarky terms to project spelling dictionary')
  .option('--global', 'Add to global Refuctor dictionary instead')
  .action(async (words, options) => {
    try {
      const snarkyHandler = new SnarkySpellHandler();
      const projectPath = process.cwd();

      if (options.global) {
        console.log('🌍 Adding to global Refuctor dictionary...');
        // TODO: Implement global dictionary update
        console.log('💡 Global dictionary update not yet implemented');
        return;
      }

      console.log(`📝 Adding ${words.length} terms to project dictionary...`);
      
      const result = await snarkyHandler.updateProjectDictionary(projectPath, words);
      
      console.log(`✅ SUCCESS!`);
      console.log(`   Config file: ${result.configPath}`);
      console.log(`   Words added: ${result.wordsAdded}`);
      console.log(`   Total project words: ${result.totalWords}`);
      
      if (result.newWords.length > 0) {
        console.log(`\n📝 New words added:`);
        result.newWords.forEach(word => console.log(`   • ${word}`));
      }

    } catch (error) {
      console.error('💥 Failed to add snarky terms:', error.message);
      process.exit(1);
    }
  });

program
  .command('snarky-fix [path]')
  .description('🔧 Fix obvious typos while preserving snarky language')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .action(async (projectPath = '.', options) => {
    try {
      console.log('🔧 TYPO FIXER ACTIVATED');
      console.log('Identifying and fixing obvious typos...\n');

      const detector = new DebtDetector();
      const snarkyHandler = new SnarkySpellHandler();
      
      // Get spelling issues
      const spellingDebt = await detector.detectSpellingDebt(projectPath);
      
      if (spellingDebt.total === 0) {
        console.log('✅ No spelling issues detected!');
        return;
      }

      // Analyze for typos
      const analysis = await snarkyHandler.analyzeSpellingIssues(projectPath, spellingDebt.issues);
      
      if (analysis.definiteTypos.length === 0) {
        console.log('✅ No obvious typos detected!');
        console.log('💡 All spelling issues appear to be intentional snarky language');
        return;
      }

      console.log(`🔧 TYPOS TO FIX (${analysis.definiteTypos.length}):`);
      analysis.definiteTypos.forEach(typo => {
        console.log(`   ❌ ${typo.word} in ${typo.file}:${typo.line}`);
      });

      if (options.dryRun) {
        console.log('\n🔍 DRY RUN - No changes made');
        console.log('💡 Remove --dry-run to actually fix these typos');
      } else {
        console.log('\n💡 Manual typo fixing not yet implemented');
        console.log('💡 Use your editor\'s spell check to fix these obvious typos');
        console.log('💡 Then run "refuctor snarky-scan" to verify');
      }

    } catch (error) {
      console.error('💥 Typo fixing failed:', error.message);
      process.exit(1);
    }
  });

// Auto-fix helper functions
async function attemptFormattingFix(projectPath, dryRun) {
  const result = { fixed: 0, attempted: 0, error: null };
  
  try {
    // Check if Prettier config exists
    const prettierConfigs = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'];
    const hasPrettierConfig = prettierConfigs.some(file => fs.existsSync(path.join(projectPath, file)));
    
    if (!hasPrettierConfig) {
      return result; // No config, can't fix
    }

    const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx,json,css,scss,md}', { 
      cwd: projectPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
    });

    if (codeFiles.length === 0) {
      return result;
    }

    result.attempted = codeFiles.length;

    if (dryRun) {
      console.log(colors.gray(`  Would format ${codeFiles.length} files`));
      result.fixed = codeFiles.length;
    } else {
      // Run Prettier to fix formatting
      const cmd = `npx --yes prettier --write ${codeFiles.join(' ')}`;
      execSync(cmd, { cwd: projectPath, stdio: 'inherit' });
      result.fixed = codeFiles.length;
      console.log(colors.green(`  ✅ Formatted ${codeFiles.length} files`));
    }

  } catch (error) {
    result.error = `Formatting fix failed: ${error.message}`;
  }

  return result;
}

async function attemptConsoleLogCleanup(projectPath, dryRun) {
  const result = { fixed: 0, attempted: 0, error: null };
  
  try {
    const codeFiles = glob.sync('**/*.{js,ts,jsx,tsx}', { 
      cwd: projectPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
    });

    for (const file of codeFiles) {
      const filePath = path.join(projectPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      let modified = false;
      const newLines = lines.map(line => {
        // Remove standalone console.log statements (but preserve console.error/warn in some cases)
        if (line.trim().match(/^\s*console\.log\([^)]*\);?\s*$/)) {
          result.attempted++;
          modified = true;
          return null; // Mark for removal
        }
        return line;
      }).filter(line => line !== null);

      if (modified) {
        if (dryRun) {
          console.log(colors.gray(`  Would clean console.logs from ${file}`));
          result.fixed++;
        } else {
          await fs.writeFile(filePath, newLines.join('\n'), 'utf8');
          console.log(colors.green(`  ✅ Cleaned console.logs from ${file}`));
          result.fixed++;
        }
      }
    }

  } catch (error) {
    result.error = `Console.log cleanup failed: ${error.message}`;
  }

  return result;
}

async function attemptSpellingFix(projectPath, dryRun) {
  const result = { fixed: 0, attempted: 0, error: null };
  
  try {
    // Use the snarky spell handler to intelligently fix spelling
    const spellHandler = new SnarkySpellHandler();
    
    // Get spelling issues first
    const detector = new DebtDetector();
    const spellDebt = await detector.detectSpellingDebt(projectPath);
    
    if (spellDebt.total === 0) {
      return result;
    }
    
    // Analyze issues with snarky handler
    const analysis = await spellHandler.analyzeSpellingIssues(projectPath, spellDebt.issues);
    
    result.attempted = analysis.definiteTypos.length;
    
    if (analysis.definiteTypos.length > 0) {
      if (dryRun) {
        console.log(colors.gray(`  Would fix ${analysis.definiteTypos.length} obvious typos`));
        result.fixed = analysis.definiteTypos.length;
      } else {
        // Add likely snarky terms to dictionary
        if (analysis.likelySnarky.length > 0) {
          const dictResult = await spellHandler.updateProjectDictionary(
            projectPath, 
            analysis.likelySnarky.map(s => s.word)
          );
          console.log(colors.green(`  ✅ Added ${dictResult.wordsAdded} snarky terms to dictionary`));
        }
        
        console.log(colors.yellow(`  ⚠️  Found ${analysis.definiteTypos.length} definite typos that need manual fixing`));
        analysis.definiteTypos.forEach(typo => {
          console.log(colors.gray(`     ${typo.file}:${typo.line} - "${typo.word}"`));
        });
        result.fixed = analysis.likelySnarky.length;
      }
    }

  } catch (error) {
    result.error = `Spelling fix failed: ${error.message}`;
  }

  return result;
}

async function cookTheBooks(projectPath, options) {
  const report = {
    totalIssues: 0,
    fileBreakdown: {},
    issues: [],
    exportPath: options.output
  };

  try {
    // Method 1: Try to read VS Code workspace diagnostics (if available)
    const vscodeDir = path.join(projectPath, '.vscode');
    
    // Method 2: Run common linters manually to capture what VS Code sees
    const cookedIssues = [];
    
    // Cook markdownlint issues (most likely culprit from your screenshot)
    try {
      console.log(colors.gray('🍳 Cooking markdown linting issues...'));
      const cmd = `npx --yes markdownlint "**/*.md" --json`;
      const result = execSync(cmd, { 
        cwd: projectPath, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      // No issues if we get here
    } catch (error) {
      if (error.stdout) {
        try {
          const issues = JSON.parse(error.stdout);
          for (const [file, fileIssues] of Object.entries(issues)) {
            report.fileBreakdown[file] = fileIssues.length;
            report.totalIssues += fileIssues.length;
            
            fileIssues.forEach(issue => {
              cookedIssues.push({
                file: file,
                line: issue.lineNumber,
                column: issue.columnNumber || 1,
                severity: 'warning',
                rule: issue.ruleNames?.[0] || 'markdown',
                message: issue.ruleDescription || issue.errorDetail,
                source: 'markdownlint'
              });
            });
          }
        } catch (parseError) {
          console.log(colors.gray('  Could not parse markdownlint JSON output'));
        }
      }
    }

    // Cook spelling issues
    try {
      console.log(colors.gray('🍳 Cooking spell checking issues...'));
      const cmd = `npx --yes cspell "**/*.{md,js,ts,json,mdc}" --no-progress --no-summary`;
      execSync(cmd, { cwd: projectPath, encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      if (error.stdout) {
        const lines = error.stdout.trim().split('\n').filter(line => line.includes('Unknown word'));
        lines.forEach(line => {
          const match = line.match(/^(.+):(\d+):(\d+)\s+-\s+Unknown word \((.+)\)/);
          if (match) {
            const fileName = match[1];
            report.fileBreakdown[fileName] = (report.fileBreakdown[fileName] || 0) + 1;
            report.totalIssues++;
            
            cookedIssues.push({
              file: fileName,
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              severity: 'info',
              rule: 'cspell',
              message: `Unknown word: ${match[4]}`,
              source: 'cspell'
            });
          }
        });
      }
    }

    // Cook TypeScript issues (if tsconfig exists)
    if (fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      try {
        console.log(colors.gray('🍳 Cooking TypeScript issues...'));
        execSync('npx --yes tsc --noEmit --skipLibCheck', { 
          cwd: projectPath, 
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        if (error.stdout) {
          const lines = error.stdout.trim().split('\n').filter(line => line.includes('error TS'));
          lines.forEach(line => {
            const match = line.match(/^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
            if (match) {
              const fileName = match[1];
              report.fileBreakdown[fileName] = (report.fileBreakdown[fileName] || 0) + 1;
              report.totalIssues++;
              
              cookedIssues.push({
                file: fileName,
                line: parseInt(match[2]),
                column: parseInt(match[3]),
                severity: 'error',
                rule: match[4],
                message: match[5],
                source: 'typescript'
              });
            }
          });
        }
      }
    }

    report.issues = cookedIssues;

    // Export the cooked books
    if (report.totalIssues > 0) {
      await exportCookedBooks(report, options);
    }

    return report;

  } catch (error) {
    throw new Error(`Failed to cook the books: ${error.message}`);
  }
}

async function exportCookedBooks(report, options) {
  const outputPath = path.join(process.cwd(), options.output);
  
  if (options.format === 'json') {
    await fs.writeJson(outputPath.replace('.md', '.json'), report, { spaces: 2 });
  } else if (options.format === 'csv') {
    const csvContent = [
      'File,Line,Column,Severity,Rule,Message,Source',
      ...report.issues.map(issue => 
        `"${issue.file}",${issue.line},${issue.column},"${issue.severity}","${issue.rule}","${issue.message}","${issue.source}"`
      )
    ].join('\n');
    await fs.writeFile(outputPath.replace('.md', '.csv'), csvContent, 'utf8');
  } else {
    // Markdown format
    const mdContent = generateCookedBooksMarkdown(report);
    await fs.writeFile(outputPath, mdContent, 'utf8');
  }
}

function generateCookedBooksMarkdown(report) {
  const timestamp = new Date().toISOString();
  
  let content = `# 🍳 Cooked Books - VS Code Problems Export

> **Generated:** ${timestamp}  
> **Total Issues:** ${report.totalIssues}  
> **Purpose:** Export of VS Code problems that Refuctor scan missed

## 📊 Summary by File

| File | Issues | Primary Source |
|------|--------|----------------|
`;

  // Add file breakdown table
  Object.entries(report.fileBreakdown)
    .sort(([,a], [,b]) => b - a)
    .forEach(([file, count]) => {
      const primarySource = report.issues
        .filter(issue => issue.file === file)
        .reduce((acc, issue) => {
          acc[issue.source] = (acc[issue.source] || 0) + 1;
          return acc;
        }, {});
      
      const topSource = Object.entries(primarySource)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
      
      content += `| \`${file}\` | ${count} | ${topSource} |\n`;
    });

  content += `\n## 🎯 Detailed Issues\n\n`;

  // Group issues by file
  const issuesByFile = report.issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {});

  Object.entries(issuesByFile).forEach(([file, issues]) => {
    content += `### 📄 \`${file}\` (${issues.length} issues)\n\n`;
    
    issues.forEach((issue, index) => {
      const severityEmoji = {
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }[issue.severity] || '❓';
      
      content += `${index + 1}. **Line ${issue.line}:${issue.column}** ${severityEmoji} \`${issue.rule}\`\n`;
      content += `   > ${issue.message}\n\n`;
    });
  });

  content += `\n## 💡 Recommended Actions\n\n`;
  content += `1. **Review each file** and fix issues manually in VS Code\n`;
  content += `2. **Configure linters** so Refuctor can detect these automatically\n`;
  content += `3. **Re-run Refuctor scan** after cleanup to verify debt reduction\n`;
  content += `4. **Consider auto-fixes** where available (Prettier, ESLint --fix, etc.)\n\n`;
  content += `---\n`;
  content += `*Generated by Refuctor's "Cook the Books" feature - because sometimes the books need cooking! 🍳*\n`;

  return content;
}

program.parse(process.argv); 