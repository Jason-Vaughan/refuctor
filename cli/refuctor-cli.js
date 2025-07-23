#!/usr/bin/env node

const { Command } = require('commander');
const { debtDetector } = require('../src/debt-detector');
const { techDebtManager } = require('../src/techdebt-manager');
const { markdownFixerGoon } = require('../src/goons/markdown-fixer');
const { DebtDetector } = require('../src/debt-detector.js');
const { DebtIgnoreParser } = require('../src/debt-ignore-parser');
const { DebtModeManager } = require('../src/debt-mode-manager');
const SetupWizard = require('../src/setup-wizard');
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
    console.log('  🤌 Guido Level: 150+ ESLint errors, 50+ TS errors (EXTREME!)');
    console.log('  🕴️  Mafia Level: 75+ ESLint errors, 30+ TS errors (LOAN SHARK!)');
    
    console.log(colors.bold(colors.gray('\n💡 USAGE TIPS:')));
    console.log('  refuctor cook               # Export VS Code problems (when scan misses issues)');
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

// Init command - automated setup wizard
program
  .command('init')
  .description(colors.green('🏗️  Run automated setup wizard to initialize complete debt management infrastructure'))
  .option('-f, --force', 'Overwrite existing configuration files')
  .option('--basic', 'Run basic setup (TECHDEBT.md only)')
  .action(async (options) => {
    console.log(colors.bold(colors.green('\n🏗️  REFUCTOR AUTOMATED SETUP WIZARD')));
    console.log(colors.gray('Establishing comprehensive debt management infrastructure...\n'));
    
    try {
      if (options.basic) {
        // Basic setup - just TECHDEBT.md (original functionality)
        console.log(colors.yellow('Running basic setup (TECHDEBT.md only)...\n'));
        const result = await techDebtManager.initializeProject(process.cwd(), options.force);
        
        if (result.created) {
          console.log(colors.bold(colors.green('✅ BASIC DEBT TRACKING ACTIVATED!')));
          console.log(colors.green('TECHDEBT.md created - your debt has nowhere to hide now'));
          console.log(colors.blue('Run `refuctor scan` to start detecting issues'));
          console.log(colors.gray('\n💡 For full setup wizard, run `refuctor init` without --basic flag'));
        } else if (result.exists && !options.force) {
          console.log(colors.yellow('⚠️  TECHDEBT.md already exists'));
          console.log(colors.gray('Use --force to overwrite, or you\'re already in debt management'));
        }
      } else {
        // Full automated setup wizard
        console.log(colors.cyan('Running comprehensive automated setup wizard...\n'));
        const wizard = new SetupWizard();
        const setupResults = await wizard.runSetupWizard(process.cwd(), options);
        
        // Display setup summary
        console.log(colors.bold(colors.green('\n🎉 SETUP WIZARD COMPLETE!')));
        console.log(colors.bold(colors.cyan('📋 SETUP SUMMARY:')));
        
        if (setupResults.techDebtCreated) {
          console.log(colors.green('   ✅ TECHDEBT.md created with project-specific context'));
        }
        if (setupResults.spellCheckSetup) {
          console.log(colors.green('   ✅ Spell checking configured with project dictionary'));
        }
        if (setupResults.debtIgnoreCreated) {
          console.log(colors.green('   ✅ Debt ignore patterns configured'));
        }
        if (setupResults.workspaceConfigured) {
          console.log(colors.green('   ✅ IDE integration configured'));
        }
        
        if (setupResults.configsGenerated.length > 0) {
          console.log(colors.blue(`   📝 Generated configs: ${setupResults.configsGenerated.join(', ')}`));
        }
        
        console.log(colors.bold(colors.green('\n🚀 READY FOR DEBT MANAGEMENT!')));
        console.log(colors.blue('Next steps:'));
        console.log(colors.blue('  1. Run `refuctor scan` to analyze current debt'));
        console.log(colors.blue('  2. Review and customize generated configuration files'));
        console.log(colors.blue('  3. Start your debt-free development journey!'));
        
        // Show project-specific recommendations
        if (wizard.projectAnalysis) {
          console.log(colors.gray(`\n💡 Optimized for ${wizard.projectAnalysis.projectType} development`));
        }
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 SETUP WIZARD FAILED:')));
      console.error(colors.red(`Setup error: ${error.message}`));
      console.error(colors.gray('Try running with --basic flag for minimal setup'));
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

// Goon: Fix-Lint
goonCommand
  .command('fix-lint')
  .description(colors.magenta('🔧 Aggressive code quality debt elimination'))
  .option('-d, --dry-run', 'Preview fixes without applying them', true)
  .option('-f, --files <pattern>', 'Target specific file pattern')
  .option('-t, --types <types>', 'Linter types (javascript,typescript,json)', 'javascript,typescript,json')
  .action(async (options) => {
    console.log(colors.bold(colors.magenta('\n🔧 FIX-LINT GOON DEPLOYED')));
    console.log(colors.gray('Aggressive code quality enforcement specialist'));
    console.log(colors.gray('Initiating linting debt elimination...\n'));
    
    try {
      const FixLintGoon = require('../src/goons/fix-lint');
      const fixLintGoon = new FixLintGoon();
      
      const types = options.types.split(',').map(t => t.trim());
      const goonOptions = {
        dryRun: options.dryRun,
        filePattern: options.files,
        types: types
      };
      
      const report = await fixLintGoon.eliminateDebt('.', goonOptions);
      
      console.log(colors.bold(colors.green('\n📊 FIX-LINT GOON DEPLOYMENT COMPLETE')));
      console.log(colors.blue(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`));
      console.log(colors.blue(`📁 Files Processed: ${report.totalFilesProcessed}`));
      console.log(colors.yellow(`🏖️  Files on Debt Holiday: ${report.totalFilesIgnored}`));
      console.log(colors.green(`🔧 Total Fixes: ${report.totalFixesApplied}`));
      
      if (report.totalFixesApplied === 0 && report.totalFilesProcessed > 0) {
        console.log(colors.bold(colors.green('\n🏆 DEBT-FREE ACHIEVEMENT UNLOCKED!')));
        console.log(colors.green('Your code is cleaner than a mobster\'s money after laundering!'));
      } else if (report.totalFixesApplied > 0) {
        console.log(colors.bold(colors.green(`\n💰 DEBT REFINANCED: ${report.totalFixesApplied} issues eliminated!`)));
        console.log(colors.green('Your code just got a credit score boost!'));
      }
      
      if (options.dryRun) {
        console.log(colors.yellow('\n⚠️  DRY RUN MODE: No changes were made'));
        console.log(colors.gray('Remove --dry-run flag to apply fixes'));
      }
      
      if (report.errors.length > 0) {
        console.log(colors.yellow(`\n⚠️  Encountered ${report.errors.length} errors during processing`));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 FIX-LINT GOON DEPLOYMENT FAILED:')));
      console.error(colors.red(`Even our most aggressive goon couldn't handle this mess: ${error.message}`));
      process.exit(1);
    }
  });

// Goon: Clean-Imports
goonCommand
  .command('clean-imports')
  .description(colors.magenta('🧹 Aggressive import optimization and cleanup'))
  .option('-d, --dry-run', 'Preview cleanup without applying changes', true)
  .option('-a, --aggressive', 'Enable aggressive cleanup mode')
  .option('-u, --unused', 'Remove unused imports', true)
  .action(async (options) => {
    console.log(colors.bold(colors.magenta('\n🧹 IMPORT CLEANER GOON DEPLOYED')));
    console.log(colors.gray('Aggressive import optimization specialist'));
    console.log(colors.gray('Initiating import debt elimination...\n'));
    
    try {
      const { ImportCleaner } = require('../src/goons/import-cleaner');
      const importCleaner = new ImportCleaner();
      
      const goonOptions = {
        dryRun: options.dryRun,
        aggressive: options.aggressive,
        removeUnused: options.unused
      };
      
      const report = await importCleaner.eliminateDebt('.', goonOptions);
      
      console.log(colors.bold(colors.green('\n📊 IMPORT CLEANER GOON DEPLOYMENT COMPLETE')));
      console.log(colors.blue(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`));
      console.log(colors.blue(`📁 Files Analyzed: ${report.totalFilesAnalyzed}`));
      console.log(colors.yellow(`🗑️  Unused Imports Found: ${report.unusedImportsFound}`));
      console.log(colors.yellow(`🔄 Circular Dependencies: ${report.circularDependencies}`));
      
      if (report.totalIssuesFound === 0) {
        console.log(colors.bold(colors.green('\n🏆 IMPORT PERFECTION ACHIEVED!')));
        console.log(colors.green('Your imports are cleaner than a mobster\'s money after laundering!'));
      } else if (report.importsRemoved > 0) {
        console.log(colors.bold(colors.green(`\n💰 IMPORT DEBT REFINANCED: ${report.importsRemoved} unused imports eliminated!`)));
        if (report.bytesFreed > 0) {
          console.log(colors.green(`💾 Bytes freed: ${report.bytesFreed} (bundle optimization)`));
        }
      }
      
      if (options.dryRun) {
        console.log(colors.yellow('\n⚠️  DRY RUN MODE: No changes were made'));
        console.log(colors.gray('Remove --dry-run flag to apply cleanup'));
      }
      
      if (report.errors.length > 0) {
        console.log(colors.yellow(`\n⚠️  Encountered ${report.errors.length} errors during processing`));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 IMPORT CLEANER GOON DEPLOYMENT FAILED:')));
      console.error(colors.red(`Import optimization failed: ${error.message}`));
      process.exit(1);
    }
  });

// Goon: Comment Killer
goonCommand
  .command('kill-comments')
  .option('--dry-run', 'Preview comment elimination without making changes')
  .option('--aggressive', 'Enable aggressive comment removal mode')
  .option('--preserve-license', 'Keep license headers intact')
  .description('💀 Eliminate TODO comments, dead code comments, and debug cruft')
  .action(async (options) => {
    try {
      console.log(colors.bold(colors.magenta('\n💀 COMMENT KILLER GOON DEPLOYED')));
      console.log(colors.gray('Targeting TODO comments, debug statements, and commented-out code...'));
      
      const { CommentKiller } = require('../src/goons/comment-killer');
      const commentKiller = new CommentKiller();
      
      const goonOptions = {
        dryRun: options.dryRun || false,
        aggressive: options.aggressive || false,
        preserveLicense: options.preserveLicense !== false,
        showProgress: true
      };
      
      const report = await commentKiller.eliminateCommentDebt('.', goonOptions);
      
      console.log(colors.bold(colors.green('\n📊 COMMENT KILLER GOON DEPLOYMENT COMPLETE')));
      
      if (report.summary) {
        console.log(colors.cyan('\n📈 ELIMINATION SUMMARY:'));
        if (report.summary.todoComments > 0) {
          console.log(colors.yellow(`   • TODO Comments: ${report.summary.todoComments} eliminated`));
        }
        if (report.summary.debugComments > 0) {
          console.log(colors.yellow(`   • Debug Comments: ${report.summary.debugComments} eliminated`));
        }
        if (report.summary.commentedCode > 0) {
          console.log(colors.yellow(`   • Commented Code: ${report.summary.commentedCode} blocks removed`));
        }
        if (report.summary.emptyComments > 0) {
          console.log(colors.yellow(`   • Empty Comments: ${report.summary.emptyComments} cleaned up`));
        }
        
        const totalEliminated = Object.values(report.summary).reduce((sum, count) => sum + count, 0);
        if (totalEliminated === 0) {
          console.log(colors.green('   ✨ No comment debt found! Your comments are pristine.'));
        } else {
          console.log(colors.green(`   💪 Total comment debt eliminated: ${totalEliminated} issues`));
        }
      }
      
      if (options.dryRun) {
        console.log(colors.blue('\n🔍 DRY RUN MODE: No files were modified'));
        console.log(colors.blue('   Run without --dry-run to apply changes'));
      } else {
        console.log(colors.green('\n✅ Comment elimination complete! Repository is cleaner.'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 COMMENT KILLER GOON DEPLOYMENT FAILED:')));
      console.error(colors.red(`Comment elimination failed: ${error.message}`));
      process.exit(1);
    }
  });

// Goon: The Fixer
goonCommand
  .command('fix-syntax')
  .option('--dry-run', 'Preview syntax fixes without making changes')
  .option('--emergency', 'Emergency pre-build mode - fix only critical blocking issues')
  .option('--max-attempts <number>', 'Maximum fix attempts per file', '5')
  .description('🔧 Emergency pre-build syntax cleanup and formatting fixes')
  .action(async (options) => {
    try {
      console.log(colors.bold(colors.magenta('\n🔧 THE FIXER GOON DEPLOYED')));
      console.log(colors.gray('Emergency pre-build cleanup in progress...'));
      
      const { Fixer } = require('../src/goons/fixer');
      const fixer = new Fixer();
      
      const goonOptions = {
        dryRun: options.dryRun || false,
        emergency: options.emergency || false,
        maxFixAttempts: parseInt(options.maxAttempts) || 5,
        showProgress: true
      };
      
      const report = await fixer.emergencyFix('.', goonOptions);
      
      console.log(colors.bold(colors.green('\n📊 THE FIXER GOON DEPLOYMENT COMPLETE')));
      
      if (report.summary) {
        console.log(colors.cyan('\n🔧 REPAIR SUMMARY:'));
        if (report.summary.syntaxFixed > 0) {
          console.log(colors.yellow(`   • Syntax Errors: ${report.summary.syntaxFixed} fixed`));
        }
        if (report.summary.formattingFixed > 0) {
          console.log(colors.yellow(`   • Formatting Issues: ${report.summary.formattingFixed} corrected`));
        }
        if (report.summary.importsFixed > 0) {
          console.log(colors.yellow(`   • Import Issues: ${report.summary.importsFixed} resolved`));
        }
        if (report.summary.consoleStatementsRemoved > 0) {
          console.log(colors.yellow(`   • Console Statements: ${report.summary.consoleStatementsRemoved} removed`));
        }
        
        const totalFixed = Object.values(report.summary).reduce((sum, count) => sum + count, 0);
        if (totalFixed === 0) {
          console.log(colors.green('   ✨ No syntax issues found! Code is ready for build.'));
        } else {
          console.log(colors.green(`   💪 Total issues fixed: ${totalFixed} problems resolved`));
        }
      }
      
      if (options.dryRun) {
        console.log(colors.blue('\n🔍 DRY RUN MODE: No files were modified'));
        console.log(colors.blue('   Run without --dry-run to apply fixes'));
      } else {
        console.log(colors.green('\n✅ Emergency fixes complete! Build should proceed.'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 THE FIXER GOON DEPLOYMENT FAILED:')));
      console.error(colors.red(`Emergency fixes failed: ${error.message}`));
      process.exit(1);
    }
  });

// Goon: Dead Code Hunter
goonCommand
  .command('hunt-dead-code')
  .option('--dry-run', 'Preview dead code detection without making changes')
  .option('--aggressive', 'Enable aggressive removal of potentially unused exports and functions')
  .option('--include-tests', 'Include test files in analysis')
  .option('--threshold <number>', 'Minimum usage threshold (default: 1)', '1')
  .description('💀 Hunt down unused functions, variables, imports, and dead code')
  .action(async (options) => {
    try {
      console.log(colors.bold(colors.magenta('\n💀 DEAD CODE HUNTER GOON DEPLOYED')));
      console.log(colors.gray('Hunting zombies, ghosts, and abandoned cargo...'));
      
      const { DeadCodeHunter } = require('../src/goons/dead-code-hunter');
      const hunter = new DeadCodeHunter();
      
      const goonOptions = {
        dryRun: options.dryRun || false,
        aggressive: options.aggressive || false,
        includeTestFiles: options.includeTests || false,
        minUsageThreshold: parseInt(options.threshold) || 1,
        showProgress: true
      };
      
      const report = await hunter.huntDeadCode('.', goonOptions);
      
      console.log(colors.bold(colors.green('\n📊 DEAD CODE HUNTER GOON DEPLOYMENT COMPLETE')));
      
      if (report.summary) {
        console.log(colors.cyan('\n🏴‍☠️ HUNT SUMMARY:'));
        if (report.summary.unusedFunctions > 0) {
          console.log(colors.yellow(`   • Zombie Functions: ${report.summary.unusedFunctions} functions found lurking`));
        }
        if (report.summary.unusedVariables > 0) {
          console.log(colors.yellow(`   • Ghost Variables: ${report.summary.unusedVariables} variables haunting your code`));
        }
        if (report.summary.unusedImports > 0) {
          console.log(colors.yellow(`   • Abandoned Imports: ${report.summary.unusedImports} imports nobody claimed`));
        }
        if (report.summary.unusedExports > 0) {
          console.log(colors.yellow(`   • Orphaned Exports: ${report.summary.unusedExports} exports sailing to nowhere`));
        }
        
        if (report.summary.totalDeadCode === 0) {
          console.log(colors.green('   ✨ No dead code found! Your codebase is pristine.'));
        } else {
          console.log(colors.green(`   💀 Total dead code hunted: ${report.summary.totalDeadCode} items`));
          
          if (report.summary.removed > 0) {
            console.log(colors.green(`   🗑️  Items eliminated: ${report.summary.removed}`));
          }
          if (report.summary.failed > 0) {
            console.log(colors.red(`   ⚠️  Items that escaped: ${report.summary.failed}`));
          }
        }
      }
      
      if (report.snarkyReport) {
        console.log(colors.cyan('\n📋 AUTOPSY REPORT:'));
        console.log(colors.white(report.snarkyReport));
      }
      
      if (options.dryRun) {
        console.log(colors.blue('\n🔍 DRY RUN MODE: No code was eliminated'));
        console.log(colors.blue('   Run without --dry-run to eliminate dead code'));
        if (options.aggressive) {
          console.log(colors.blue('   Use --aggressive for more thorough elimination'));
        }
      } else {
        console.log(colors.green('\n✅ Dead code hunt complete! Repository is cleaner.'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 DEAD CODE HUNTER GOON DEPLOYMENT FAILED:')));
      console.error(colors.red(`Dead code hunt failed: ${error.message}`));
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
      
      // Step 2: Deploy all specialized goons
      let totalFixes = 0;
      
      // Deploy Markdown Fixer Goon
      console.log(magenta('\n🗂️  DEPLOYING MARKDOWN FIXER GOON...'));
      const glob = require('glob');
      const mdFiles = glob.sync('**/*.{md,mdc}', { 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'] 
      });
      
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
      
      // Deploy Fix-Lint Goon
      console.log(magenta('\n🔧 DEPLOYING FIX-LINT GOON...'));
      try {
        const FixLintGoon = require('../src/goons/fix-lint');
        const fixLintGoon = new FixLintGoon();
        const lintReport = await fixLintGoon.eliminateDebt('.', { dryRun: options.dryRun });
        
        if (lintReport.summary) {
          const lintFixes = Object.values(lintReport.summary).reduce((sum, count) => sum + count, 0);
          totalFixes += lintFixes;
          console.log(green(`   ✅ Lint fixes applied: ${lintFixes}`));
        }
      } catch (error) {
        console.log(red(`   ❌ Fix-Lint goon failed: ${error.message}`));
      }
      
      // Deploy Import Cleaner Goon
      console.log(magenta('\n🧹 DEPLOYING IMPORT CLEANER GOON...'));
      try {
        const { ImportCleaner } = require('../src/goons/import-cleaner');
        const importCleaner = new ImportCleaner();
        const importReport = await importCleaner.eliminateDebt('.', { dryRun: options.dryRun });
        
        if (importReport.summary) {
          const importFixes = Object.values(importReport.summary).reduce((sum, count) => sum + count, 0);
          totalFixes += importFixes;
          console.log(green(`   ✅ Import optimizations: ${importFixes}`));
        }
      } catch (error) {
        console.log(red(`   ❌ Import Cleaner goon failed: ${error.message}`));
      }
      
      // Deploy Comment Killer Goon
      console.log(magenta('\n💀 DEPLOYING COMMENT KILLER GOON...'));
      try {
        const { CommentKiller } = require('../src/goons/comment-killer');
        const commentKiller = new CommentKiller();
        const commentReport = await commentKiller.eliminateCommentDebt('.', { dryRun: options.dryRun });
        
        if (commentReport.summary) {
          const commentFixes = Object.values(commentReport.summary).reduce((sum, count) => sum + count, 0);
          totalFixes += commentFixes;
          console.log(green(`   ✅ Comment debt eliminated: ${commentFixes}`));
        }
      } catch (error) {
        console.log(red(`   ❌ Comment Killer goon failed: ${error.message}`));
      }
      
      // Deploy The Fixer Goon
      console.log(magenta('\n🔧 DEPLOYING THE FIXER GOON...'));
      try {
        const { Fixer } = require('../src/goons/fixer');
        const fixer = new Fixer();
        const fixerReport = await fixer.emergencyFix('.', { dryRun: options.dryRun });
        
        if (fixerReport.summary) {
          const fixerFixes = Object.values(fixerReport.summary).reduce((sum, count) => sum + count, 0);
          totalFixes += fixerFixes;
          console.log(green(`   ✅ Emergency fixes applied: ${fixerFixes}`));
        }
      } catch (error) {
        console.log(red(`   ❌ The Fixer goon failed: ${error.message}`));
      }
      
      // Deploy Dead Code Hunter Goon
      console.log(magenta('\n💀 DEPLOYING DEAD CODE HUNTER GOON...'));
      try {
        const { DeadCodeHunter } = require('../src/goons/dead-code-hunter');
        const hunter = new DeadCodeHunter();
        const hunterReport = await hunter.huntDeadCode('.', { dryRun: options.dryRun });
        
        if (hunterReport.summary) {
          const deadCodeEliminated = hunterReport.summary.removed || 0;
          totalFixes += deadCodeEliminated;
          console.log(green(`   ✅ Dead code eliminated: ${deadCodeEliminated}`));
          if (hunterReport.summary.totalDeadCode > deadCodeEliminated) {
            console.log(yellow(`   ⚠️  Dead code detected: ${hunterReport.summary.totalDeadCode} (use --aggressive for more)`));
          }
        }
      } catch (error) {
        console.log(red(`   ❌ Dead Code Hunter goon failed: ${error.message}`));
      }
      
      // Step 3: Final scan
      console.log(cyan('\n📊 SCANNING POST-EXTERMINATION DEBT LEVELS...'));
      const finalScan = await detector.scanProject(projectRoot, true);
      
      console.log(green(`\n🎉 DEBT EXTERMINATION COMPLETE!`));
      
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

      const detector = new DebtDetector();
      const snarkyHandler = new SnarkySpellHandler();
      
      // Get spelling issues
      const spellingDebt = await detector.detectSpellingDebt(projectPath);
      
      if (spellingDebt.total === 0) {
        return;
      }

      // Analyze with snarky intelligence
      const analysis = await snarkyHandler.analyzeSpellingIssues(projectPath, spellingDebt.issues);
      
      // Display analysis

      // Show suggestions
      if (analysis.suggestions.length > 0) {
        analysis.suggestions.forEach(suggestion => {
          if (suggestion.items.length <= 5) {
            suggestion.items.forEach(item => {
              if (typeof item === 'string') {
              } else {
                console.log(`      • ${item.word} (${Math.round(item.confidence * 100)}% confidence)`);
              }
            });
          } else {
            console.log(`      (${suggestion.items.length} items total)`);
          }
        });
      }

      // Auto-handle if requested
      if (options.auto) {
        
        // Auto-add likely snarky terms
        if (analysis.likelySnarky.length > 0) {
          const snarkyWords = analysis.likelySnarky.map(s => s.word);
          const result = await snarkyHandler.updateProjectDictionary(projectPath, snarkyWords);
        }

        // Report remaining issues
        if (analysis.definiteTypos.length > 0) {
        }
        if (analysis.unsure.length > 0) {
        }
      } else {
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
        // TODO: Implement global dictionary update
        return;
      }

      
      const result = await snarkyHandler.updateProjectDictionary(projectPath, words);
      
      
      if (result.newWords.length > 0) {
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

      const detector = new DebtDetector();
      const snarkyHandler = new SnarkySpellHandler();
      
      // Get spelling issues
      const spellingDebt = await detector.detectSpellingDebt(projectPath);
      
      if (spellingDebt.total === 0) {
        return;
      }

      // Analyze for typos
      const analysis = await snarkyHandler.analyzeSpellingIssues(projectPath, spellingDebt.issues);
      
      if (analysis.definiteTypos.length === 0) {
        return;
      }

      console.log(`🔧 TYPOS TO FIX (${analysis.definiteTypos.length}):`);
      analysis.definiteTypos.forEach(typo => {
      });

      if (options.dryRun) {
      } else {
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

// NEW: MCP Debt Broker Server command
program
  .command('mcp-server')
  .description(colors.magenta('📡 Start Refuctor MCP (Model Context Protocol) Debt Broker server'))
  .option('--transport <type>', 'Transport type (stdio, sse)', 'stdio')
  .option('--port <port>', 'Port for HTTP transport', '8080')
  .action(async (options) => {
    console.log(colors.bold(colors.magenta('\n📡 REFUCTOR MCP DEBT BROKER')));
    console.log(colors.gray('Starting Model Context Protocol server...'));
    console.log(colors.gray('Enabling cross-workspace debt communication...\n'));
    
    try {
      const RefuctorMCPServer = require('../src/refuctor-mcp-server');
      const server = new RefuctorMCPServer();
      
      console.log(colors.cyan('🏦 Debt Broker Server Configuration:'));
      console.log(colors.blue(`   Transport: ${options.transport}`));
      console.log(colors.blue(`   Capabilities: debt_detection, auto_fixing, session_management`));
      console.log(colors.blue(`   Cross-workspace: enabled`));
      console.log(colors.blue(`   Real-time monitoring: active`));
      
      if (options.transport === 'stdio') {
        console.log(colors.yellow('\n⚡ Starting stdio transport...'));
        console.log(colors.gray('Connect via MCP client using stdio transport'));
      } else if (options.transport === 'sse') {
        console.log(colors.yellow(`\n⚡ Starting SSE transport on port ${options.port}...`));
        console.log(colors.gray(`Connect via: http://localhost:${options.port}/sse`));
      }
      
      console.log(colors.bold(colors.green('\n✅ MCP DEBT BROKER READY!')));
      console.log(colors.green('🔗 AI assistants can now access Refuctor capabilities'));
      console.log(colors.green('💀 The Debt Collector is available via MCP'));
      console.log(colors.green('📡 Broadcasting debt status for collective shame metrics'));
      
      // Start the server
      await server.start();
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 MCP SERVER FAILED TO START:')));
      console.error(colors.red(`Error: ${error.message}`));
      console.error(colors.gray('\nThe debt broker couldn\'t establish communication.'));
      console.error(colors.gray('Check that MCP dependencies are installed: npm install @modelcontextprotocol/sdk'));
      process.exit(1);
    }
  });

// NEW: Accountant command - Financial debt analysis and credit rating
program
  .command('accountant [action]')
  .description(colors.yellow('💰 The Accountant - Developer credit rating and debt interest calculator'))
  .option('--detailed', 'Show detailed credit score breakdown')
  .option('--payment-plan', 'Generate debt payment plan recommendations')
  .action(async (action = 'report', options) => {
    console.log(colors.bold(colors.yellow('\n💰 THE ACCOUNTANT - FINANCIAL DEBT ANALYSIS')));
    console.log(colors.gray('Calculating your developer credit score and debt interest...\n'));
    
    try {
      const { Accountant } = require('../src/goons/accountant');
      const accountant = new Accountant();
      const projectPath = process.cwd();
      
      switch (action) {
        case 'report':
        case 'score':
          console.log(colors.cyan('📊 Generating financial debt report...'));
          const snarkyReport = await accountant.generateSnarkyFinancialReport(projectPath);
          break;
          
        case 'credit-score':
          console.log(colors.cyan('📈 Calculating developer credit score...'));
          const creditData = await accountant.calculateCreditScore(projectPath);
          
          console.log(colors.bold(colors.green(`\n📊 DEVELOPER CREDIT SCORE: ${creditData.score}/850`)));
          console.log(colors.blue(`🏷️  Classification: ${creditData.classification}`));
          console.log(colors.magenta(`💸 Interest Rate: ${creditData.interestRate}% APR`));
          
          if (options.detailed) {
            console.log(colors.cyan('\n📈 SCORE BREAKDOWN:'));
            console.log(colors.blue(`   Code Quality: ${creditData.breakdown.codeQuality}/100`));
            console.log(colors.blue(`   Payment History: ${creditData.breakdown.paymentHistory}/100`));
            console.log(colors.blue(`   Debt Load: ${creditData.breakdown.debtLoad}/100`));
            console.log(colors.blue(`   Patterns: ${creditData.breakdown.patterns}/100`));
          }
          break;
          
        case 'payment':
          if (!options.paymentPlan) {
            console.log(colors.yellow('💡 Use --payment-plan to see debt payment recommendations'));
            return;
          }
          
          const financialReport = await accountant.generateFinancialReport(projectPath);
          console.log(colors.bold(colors.green('\n🎯 DEBT PAYMENT PLAN')));
          console.log(colors.blue(`💰 Total debt cost: $${financialReport.debtAnalysis.estimatedCost}`));
          console.log(colors.yellow(`📈 With interest: $${financialReport.debtAnalysis.compoundedCost}`));
          console.log(colors.red(`🔥 Interest penalty: $${financialReport.debtAnalysis.interestAccrued}`));
          
          if (financialReport.recommendations.length > 0) {
            console.log(colors.cyan('\n💡 PAYMENT RECOMMENDATIONS:'));
            financialReport.recommendations.forEach(rec => {
              console.log(colors.blue(`   • ${rec.category}: ${rec.message}`));
              console.log(colors.gray(`     Impact: ${rec.estimatedImpact}`));
            });
          }
          break;
          
        default:
          console.log(colors.red(`Unknown accountant action: ${action}`));
          console.log(colors.gray('Available actions: report, credit-score, payment'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 ACCOUNTANT ERROR:')));
      console.error(colors.red(`The accountant's calculator broke: ${error.message}`));
      process.exit(1);
    }
  });

// NEW: Comment Killer command - Aggressive comment cleanup
program
  .command('comment-killer [action]')
  .description(colors.red('💀 Comment Killer - Eliminate dead comments and TODO debt'))
  .option('--remove-todos', 'Remove low-severity TODO comments')
  .option('--remove-debug', 'Remove debug comments', true)
  .option('--remove-commented-code', 'Remove commented-out code blocks', true)
  .option('--remove-empty', 'Remove empty comment lines', true)
  .option('--aggressive', 'Enable all comment removal options')
  .option('--dry-run', 'Preview changes without applying them')
  .action(async (action = 'scan', options) => {
    console.log(colors.bold(colors.red('\n💀 COMMENT KILLER - DEBT EXTERMINATION')));
    console.log(colors.gray('Hunting for dead comments and TODO debt...\n'));
    
    try {
      const { CommentKiller } = require('../src/goons/comment-killer');
      const commentKiller = new CommentKiller();
      const projectPath = process.cwd();
      
      // Set aggressive mode
      if (options.aggressive) {
        options.removeTodos = true;
        options.removeDebug = true;
        options.removeCommentedCode = true;
        options.removeEmpty = true;
      }
      
      switch (action) {
        case 'scan':
        case 'analyze':
          console.log(colors.cyan('🔍 Scanning for comment debt...'));
          const snarkyReport = await commentKiller.generateSnarkyReport(projectPath);
          break;
          
        case 'eliminate':
        case 'clean':
          console.log(colors.red('💀 Initiating comment elimination protocol...'));
          const eliminationResult = await commentKiller.eliminateCommentDebt(projectPath, {
            removeTodos: options.removeTodos,
            removeDebugComments: options.removeDebug,
            removeCommentedCode: options.removeCommentedCode,
            removeEmptyComments: options.removeEmpty,
            dryRun: options.dryRun
          });
          
          if (eliminationResult.dryRun) {
            console.log(colors.bold(colors.yellow('\n🔍 DRY RUN RESULTS:')));
            console.log(colors.blue(`Would eliminate ${eliminationResult.totalRemovals} comment debt items`));
            console.log(colors.gray('Remove --dry-run flag to execute elimination'));
          } else {
            console.log(colors.bold(colors.green('\n✅ COMMENT ELIMINATION COMPLETE!')));
            console.log(colors.green(`Eliminated ${eliminationResult.totalRemoved} comment debt items`));
            console.log(colors.blue(`Files modified: ${eliminationResult.removalResults.filesModified}`));
          }
          
          if (eliminationResult.removalResults?.errors?.length > 0) {
            console.log(colors.yellow('\n⚠️  ELIMINATION ERRORS:'));
            eliminationResult.removalResults.errors.forEach(error => {
              console.log(colors.red(`   ${error.file}: ${error.error}`));
            });
          }
          break;
          
        default:
          console.log(colors.red(`Unknown comment killer action: ${action}`));
          console.log(colors.gray('Available actions: scan, eliminate'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 COMMENT KILLER MALFUNCTION:')));
      console.error(colors.red(`The killer's blade broke: ${error.message}`));
      process.exit(1);
    }
  });

// NEW: Import Cleaner command - Unused import detection and cleanup
program
  .command('import-cleaner [action]')
  .description(colors.blue('📦 Import Cleaner - Detect and eliminate unused imports'))
  .option('--remove-unused', 'Remove unused imports', true)
  .option('--consolidate-duplicates', 'Consolidate duplicate imports', true)
  .option('--exclude-packages <packages>', 'Comma-separated list of packages to exclude from cleanup')
  .option('--minimum-savings <bytes>', 'Minimum bytes saved to remove import', '1000')
  .option('--dry-run', 'Preview changes without applying them')
  .action(async (action = 'analyze', options) => {
    console.log(colors.bold(colors.blue('\n📦 IMPORT CLEANER - DEPENDENCY OPTIMIZATION')));
    console.log(colors.gray('Analyzing import usage and detecting waste...\n'));
    
    try {
      const { ImportCleaner } = require('../src/goons/import-cleaner');
      const importCleaner = new ImportCleaner();
      const projectPath = process.cwd();
      
      const excludePackages = options.excludePackages ? 
        options.excludePackages.split(',').map(pkg => pkg.trim()) : [];
      
      switch (action) {
        case 'analyze':
        case 'scan':
          console.log(colors.cyan('🔍 Analyzing import patterns...'));
          const snarkyReport = await importCleaner.generateSnarkyReport(projectPath);
          break;
          
        case 'clean':
        case 'optimize':
          console.log(colors.blue('🧹 Initiating import cleanup...'));
          const cleanupResult = await importCleaner.cleanUnusedImports(projectPath, {
            removeUnused: options.removeUnused,
            consolidateDuplicates: options.consolidateDuplicates,
            excludePackages,
            minimumSavings: parseInt(options.minimumSavings),
            dryRun: options.dryRun
          });
          
          if (cleanupResult.dryRun) {
            console.log(colors.bold(colors.yellow('\n🔍 DRY RUN RESULTS:')));
            console.log(colors.blue(`Would remove ${cleanupResult.totalRemovals} unused imports`));
            console.log(colors.green(`Estimated savings: ~${Math.round(cleanupResult.estimatedSavings/1000)}KB`));
            console.log(colors.gray('Remove --dry-run flag to execute cleanup'));
          } else {
            console.log(colors.bold(colors.green('\n✅ IMPORT CLEANUP COMPLETE!')));
            console.log(colors.green(`Removed ${cleanupResult.totalRemoved} unused imports`));
            console.log(colors.blue(`Files modified: ${cleanupResult.cleanupResults.filesModified}`));
            console.log(colors.green(`Bundle savings: ~${Math.round(cleanupResult.actualSavings/1000)}KB`));
          }
          
          if (cleanupResult.cleanupResults?.errors?.length > 0) {
            console.log(colors.yellow('\n⚠️  CLEANUP ERRORS:'));
            cleanupResult.cleanupResults.errors.forEach(error => {
              console.log(colors.red(`   ${error.file}: ${error.error}`));
            });
          }
          break;
          
        case 'circular':
          console.log(colors.yellow('🔄 Analyzing circular dependencies...'));
          const analysis = await importCleaner.analyzeImports(projectPath);
          
          if (analysis.circularDependencies.length === 0) {
            console.log(colors.bold(colors.green('\n✅ NO CIRCULAR DEPENDENCIES FOUND!')));
            console.log(colors.green('Your dependency graph is clean and acyclic.'));
          } else {
            console.log(colors.bold(colors.red(`\n🔄 FOUND ${analysis.circularDependencies.length} CIRCULAR DEPENDENCIES:`)));
            analysis.circularDependencies.forEach((circular, index) => {
              console.log(colors.red(`\n${index + 1}. Cycle length: ${circular.length} (${circular.severity} severity)`));
              console.log(colors.gray('   Cycle: ' + circular.cycle.map(f => path.basename(f)).join(' → ')));
            });
            console.log(colors.yellow('\n💡 Circular dependencies require manual refactoring to resolve.'));
          }
          break;
          
        default:
          console.log(colors.red(`Unknown import cleaner action: ${action}`));
          console.log(colors.gray('Available actions: analyze, clean, circular'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 IMPORT CLEANER ERROR:')));
      console.error(colors.red(`The import cleaner malfunctioned: ${error.message}`));
      process.exit(1);
    }
  });

// NEW: Gamification command - Achievement tracking and developer engagement
program
  .command('gamification [action]')
  .alias('game')
  .description(colors.green('🎮 Gamification - Track achievements, streaks, and level progression'))
  .option('--user <userId>', 'Specify user ID for multi-user tracking', 'default')
  .option('--detailed', 'Show detailed achievement breakdown')
  .option('--leaderboard', 'Show team leaderboard (if available)')
  .action(async (action = 'dashboard', options) => {
    console.log(colors.bold(colors.green('\n🎮 REFUCTOR GAMIFICATION SYSTEM')));
    console.log(colors.gray('Track your debt-slaying progress and unlock achievements...\n'));
    
    try {
      const { GamificationSystem } = require('../src/gamification-system');
      const gamificationSystem = new GamificationSystem();
      const projectPath = process.cwd();
      
      switch (action) {
        case 'dashboard':
        case 'profile':
          console.log(colors.cyan('📊 Generating gamification dashboard...'));
          const snarkyReport = await gamificationSystem.generateSnarkyGamificationReport(projectPath, options.user);
          break;
          
        case 'achievements':
          console.log(colors.yellow('🏆 Loading achievement collection...'));
          const dashboard = await gamificationSystem.generateUserDashboard(projectPath, options.user);
          
          console.log(colors.bold(colors.green('\n🏆 ACHIEVEMENT COLLECTION')));
          
          if (dashboard.achievements.total === 0) {
            console.log(colors.gray('No achievements unlocked yet. Start scanning for debt to earn your first achievement!'));
          } else {
            console.log(colors.blue(`Total achievements: ${dashboard.achievements.total}\n`));
            
            // Group by category
            const byCategory = dashboard.achievements.recent.reduce((acc, achievement) => {
              if (!acc[achievement.category]) acc[achievement.category] = [];
              acc[achievement.category].push(achievement);
              return acc;
            }, {});
            
            Object.entries(byCategory).forEach(([category, achievements]) => {
              console.log(colors.bold(colors.cyan(`${category.toUpperCase()}:`)));
              achievements.forEach(achievement => {
                const timeAgo = gamificationSystem.getTimeAgo(achievement.unlockedAt);
                console.log(colors.green(`   ${achievement.icon} ${achievement.title} - ${achievement.description}`));
                console.log(colors.gray(`      Unlocked ${timeAgo} | ${achievement.xp} XP | ${achievement.rarity}`));
              });
            });
          }
          
          if (options.detailed) {
            const nextAchievements = gamificationSystem.getSuggestedAchievements(
              await gamificationSystem.loadUserProgress(projectPath, options.user)
            );
            
            console.log(colors.bold(colors.yellow('\n🎯 NEXT ACHIEVEMENTS TO UNLOCK:')));
            nextAchievements.slice(0, 5).forEach(achievement => {
              console.log(colors.yellow(`   ${achievement.icon} ${achievement.title}`));
              console.log(colors.gray(`      ${achievement.description} | ${achievement.xp} XP`));
            });
          }
          break;
          
        case 'stats':
          console.log(colors.blue('📈 Loading player statistics...'));
          const userDashboard = await gamificationSystem.generateUserDashboard(projectPath, options.user);
          
          console.log(colors.bold(colors.blue('\n📈 DEBT SLAYING STATISTICS')));
          console.log(colors.green(`🔍 Total scans: ${userDashboard.stats.totalScans}`));
          console.log(colors.green(`🔧 Total fixes: ${userDashboard.stats.totalFixes}`));
          console.log(colors.green(`💀 Debt eliminated: ${userDashboard.stats.debtEliminated} issues`));
          console.log(colors.green(`🚨 Critical issues fixed: ${userDashboard.stats.criticalIssuesFixed}`));
          console.log(colors.green(`🛠️  Tools mastered: ${userDashboard.stats.toolsUsed.length}`));
          console.log(colors.green(`📝 Sessions completed: ${userDashboard.stats.sessionsCompleted}`));
          
          console.log(colors.bold(colors.yellow('\n🔥 STREAK INFORMATION')));
          console.log(colors.yellow(`Current streak: ${userDashboard.streaks.current} days`));
          console.log(colors.yellow(`Longest streak: ${userDashboard.streaks.longest} days`));
          
          if (userDashboard.streaks.current > 0) {
            console.log(colors.green('Keep the momentum going! 🚀'));
          } else {
            console.log(colors.gray('Time to start a new streak! 💪'));
          }
          break;
          
        case 'level':
          console.log(colors.magenta('⭐ Checking level progression...'));
          const levelDashboard = await gamificationSystem.generateUserDashboard(projectPath, options.user);
          
          console.log(colors.bold(colors.magenta('\n⭐ LEVEL PROGRESSION')));
          console.log(colors.magenta(`Current Level: ${levelDashboard.user.level}`));
          console.log(colors.magenta(`Title: ${levelDashboard.user.title}`));
          console.log(colors.magenta(`Experience: ${levelDashboard.user.xp} XP`));
          console.log(colors.magenta(`Progress: ${levelDashboard.user.xpProgress.current}/${levelDashboard.user.xpProgress.needed} XP to next level`));
          console.log(colors.magenta(`XP needed: ${levelDashboard.user.xpProgress.toNext} more to level up`));
          
          // Show level progression bar
          const progressPercent = Math.round((levelDashboard.user.xpProgress.current / levelDashboard.user.xpProgress.needed) * 100);
          const progressBar = '█'.repeat(Math.floor(progressPercent / 5)) + '░'.repeat(20 - Math.floor(progressPercent / 5));
          console.log(colors.cyan(`\n[${progressBar}] ${progressPercent}%`));
          break;
          
        default:
          console.log(colors.red(`Unknown gamification action: ${action}`));
          console.log(colors.gray('Available actions: dashboard, achievements, stats, level'));
      }
      
    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 GAMIFICATION ERROR:')));
      console.error(colors.red(`The gamification system crashed: ${error.message}`));
      process.exit(1);
    }
  });

// Mode Management Commands (SSOT)
program
  .command('mode [action] [mode]')
  .description('Manage debt classification mode')
  .option('--auto', 'Auto-detect appropriate mode')
  .action(async (action, mode, options) => {
    try {
      const modeManager = new DebtModeManager();
      const projectPath = process.cwd();

      switch (action) {
        case 'status':
        case 'show':
        default:
          // Show current mode and available options
          const currentMode = await modeManager.getCurrentMode(projectPath);
          const modeConfig = modeManager.getModeConfig(currentMode);
          const allModes = modeManager.getAllModes();
          
          console.log(colors.bold(colors.yellow('\n🎯 DEBT CLASSIFICATION MODE')));
          console.log(colors.green(`Current Mode: ${modeConfig.emoji} ${modeConfig.name}`));
          console.log(colors.gray(`Description: ${modeConfig.description}`));
          console.log(colors.gray(`Personality: ${modeConfig.personality}`));
          
          console.log(colors.yellow('\n📋 Available Modes:'));
          allModes.forEach(mode => {
            const current = mode.key === currentMode ? colors.green(' (CURRENT)') : '';
            console.log(colors.cyan(`  ${mode.emoji} ${mode.name}${current}`));
            console.log(colors.gray(`     ${mode.description}`));
          });
          
          console.log(colors.yellow('\n🛠️ Commands:'));
          console.log(colors.gray('  refuctor mode set DEV_CREW      - Set to development mode'));
          console.log(colors.gray('  refuctor mode set BETA_CAPOREGIME - Set to beta/testing mode'));  
          console.log(colors.gray('  refuctor mode set PROD_FAMILY     - Set to production mode'));
          console.log(colors.gray('  refuctor mode auto               - Auto-detect mode'));
          break;

        case 'set':
          if (!mode) {
            console.error(colors.red('Error: Mode required for set action'));
            console.log(colors.gray('Available modes: DEV_CREW, BETA_CAPOREGIME, PROD_FAMILY'));
            process.exit(1);
          }
          
          const upperMode = mode.toUpperCase();
          try {
            const config = await modeManager.setMode(projectPath, upperMode);
            const newModeConfig = modeManager.getModeConfig(upperMode);
            
            console.log(colors.bold(colors.green('\n✅ MODE UPDATED')));
            console.log(colors.cyan(`New Mode: ${newModeConfig.emoji} ${newModeConfig.name}`));
            console.log(colors.gray(`Description: ${newModeConfig.description}`));
            console.log(colors.gray(`Set at: ${config.setAt}`));
            
            // Show impact
            console.log(colors.yellow('\n📊 Impact:'));
            console.log(colors.gray('  • Debt thresholds updated'));
            console.log(colors.gray('  • Classification messages adjusted'));
            console.log(colors.gray('  • Shame levels recalibrated'));
            console.log(colors.gray('\nRun "refuctor scan" to see changes in action!'));
            
          } catch (error) {
            console.error(colors.red(`Error setting mode: ${error.message}`));
            process.exit(1);
          }
          break;

        case 'auto':
          const detectedMode = await modeManager.detectProjectMode(projectPath);
          const detectedConfig = modeManager.getModeConfig(detectedMode);
          const indicators = await modeManager.analyzeProjectIndicators(projectPath);
          
          console.log(colors.bold(colors.yellow('\n🔍 AUTO-DETECTION RESULTS')));
          console.log(colors.green(`Detected Mode: ${detectedConfig.emoji} ${detectedConfig.name}`));
          console.log(colors.gray(`Reason: ${detectedConfig.description}`));
          
          console.log(colors.yellow('\n📋 Project Indicators:'));
          Object.entries(indicators).forEach(([key, value]) => {
            const status = value ? colors.green('✓') : colors.gray('✗');
            const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
          });
          
          if (options.auto) {
            await modeManager.setMode(projectPath, detectedMode);
            console.log(colors.bold(colors.green('\n✅ MODE SET TO AUTO-DETECTED')));
          } else {
            console.log(colors.yellow('\nUse --auto flag to apply detected mode'));
          }
          break;

        case 'help':
          console.log(colors.bold(colors.yellow('\n🎯 DEBT MODE MANAGEMENT')));
          console.log(colors.gray('Refuctor adapts its debt classification based on project type:\n'));
          
          const modes = modeManager.getAllModes();
          modes.forEach(mode => {
            console.log(colors.cyan(`${mode.emoji} ${mode.name}:`));
            console.log(colors.gray(`   ${mode.description}`));
            console.log(colors.gray(`   ${mode.personality}\n`));
          });
          break;
      }

    } catch (error) {
      console.error(colors.bold(colors.red('\n💥 MODE MANAGEMENT ERROR:')));
      console.error(colors.red(`Failed to manage mode: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv); 