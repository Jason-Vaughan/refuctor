#!/usr/bin/env node

const { Command } = require('commander');
const { debtDetector } = require('../src/debt-detector');
const { techDebtManager } = require('../src/techdebt-manager');
const { markdownFixerGoon } = require('../src/goons/markdown-fixer');
const packageJson = require('../package.json');

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
  });

// Scan command - core debt detection
program
  .command('scan')
  .description(colors.yellow('👁️  Detect technical debt in your project (markdown, spelling, security)'))
  .option('-v, --verbose', 'Show detailed debt breakdown')
  .option('-o, --output <file>', 'Save debt report to file')
  .action(async (options) => {
    console.log(colors.bold(colors.red('\n🏦 REFUCTOR DEBT COLLECTION AGENCY')));
    console.log(colors.gray('Initiating debt scan... Your code is about to be audited.\n'));
    
    try {
      const debtReport = await debtDetector.scanProject(process.cwd(), options.verbose);
      
      if (debtReport.totalDebt === 0) {
        console.log(colors.bold(colors.green('🎉 DEBT-FREE STATUS ACHIEVED!')));
        console.log(colors.green('You magnificent debt-slayer! Your code is cleaner than a banker\'s conscience.'));
      } else {
        console.log(colors.bold(colors.red(`💸 DEBT DETECTED: ${debtReport.totalDebt} issues found`)));
        console.log(colors.yellow('Time to refinance this technical disaster...\n'));
        
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

program.parse(process.argv); 