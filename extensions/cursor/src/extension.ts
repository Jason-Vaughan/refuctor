import * as vscode from 'vscode';

// Use dynamic imports to avoid TypeScript issues
let DebtDetector: any;
let GamificationSystem: any;
let Accountant: any;
let Fixer: any;
let CommentKiller: any;
let ImportCleaner: any;

// Initialize imports
async function initializeRefuctorImports() {
  try {
    const refuctor = require('@puberty-labs/refuctor');
    DebtDetector = refuctor.DebtDetector;
    GamificationSystem = refuctor.GamificationSystem;
    
    // Import goons
    Accountant = require('@puberty-labs/refuctor/src/goons/accountant.js').Accountant;
    Fixer = require('@puberty-labs/refuctor/src/goons/fixer.js').Fixer;
    CommentKiller = require('@puberty-labs/refuctor/src/goons/comment-killer.js').CommentKiller;
    ImportCleaner = require('@puberty-labs/refuctor/src/goons/import-cleaner.js').ImportCleaner;
  } catch (error) {
    console.error('Failed to load Refuctor modules:', error);
  }
}

/**
 * Refuctor Cursor Extension
 * "The Debt Collector" - Comprehensive technical debt management for Cursor IDE
 */

let debtDetector: any;
let accountant: any;
let gamificationSystem: any;
let statusBarItems: { debtCount: vscode.StatusBarItem; creditScore: vscode.StatusBarItem };
let afterDarkClickCount = 0;
let isAfterDarkMode = false;

export async function activate(context: vscode.ExtensionContext) {
  
  // Initialize imports first
  await initializeRefuctorImports();
  
  // Initialize core components
  initializeRefuctorCore();
  
  // Setup status bar
  setupStatusBar(context);
  
  // Register commands
  registerCommands(context);
  
  // Setup providers
  setupProviders(context);
  
  // Start real-time monitoring if enabled
  startRealTimeMonitoring(context);
  
  // Show activation message
  showActivationMessage();
}

function initializeRefuctorCore() {
  debtDetector = new DebtDetector();
  accountant = new Accountant();
  gamificationSystem = new GamificationSystem();
}

function setupStatusBar(context: vscode.ExtensionContext) {
  // Debt count status bar item
  statusBarItems = {
    debtCount: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100),
    creditScore: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99)
  };
  
  statusBarItems.debtCount.command = 'refuctor.scanDebt';
  statusBarItems.debtCount.tooltip = 'Click to scan for technical debt';
  statusBarItems.debtCount.text = '$(search) Scanning...';
  
  statusBarItems.creditScore.command = 'refuctor.generateCreditScore';
  statusBarItems.creditScore.tooltip = 'Click to view developer credit score';
  statusBarItems.creditScore.text = '$(graph-line) Credit: --';
  
  statusBarItems.debtCount.show();
  statusBarItems.creditScore.show();
  
  context.subscriptions.push(statusBarItems.debtCount, statusBarItems.creditScore);
  
  // Initial scan
  updateStatusBar();
}

function registerCommands(context: vscode.ExtensionContext) {
  // Main debt scanning command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.scanDebt', async () => {
      await scanProjectDebt();
    })
  );
  
  // Auto-fix command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.fixDebt', async () => {
      await autoFixDebt();
    })
  );
  
  // Credit score command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.generateCreditScore', async () => {
      await generateCreditScore();
    })
  );
  
  // Dashboard command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.showDashboard', async () => {
      await showDashboard();
    })
  );
  
  // Goon deployment command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.deployGoon', async () => {
      await deployGoon();
    })
  );
  
  // Achievements command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.checkAchievements', async () => {
      await showAchievements();
    })
  );
  
  // MCP Server command
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.startMCPServer', async () => {
      await startMCPServer();
    })
  );
  
  // After Dark Mode command (easter egg)
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.showAfterDarkMode', async () => {
      await activateAfterDarkMode();
    })
  );
  
  // Click tracking for easter egg
  context.subscriptions.push(
    vscode.commands.registerCommand('refuctor.trackClick', () => {
      afterDarkClickCount++;
      if (afterDarkClickCount >= 69 && !isAfterDarkMode) {
        vscode.commands.executeCommand('refuctor.showAfterDarkMode');
      }
    })
  );
}

function setupProviders(context: vscode.ExtensionContext) {
  // Debt Explorer Tree Data Provider
  const debtExplorerProvider = new DebtExplorerProvider();
  vscode.window.registerTreeDataProvider('refuctorDebtExplorer', debtExplorerProvider);
  
  // Credit Score Provider
  const creditScoreProvider = new CreditScoreProvider();
  vscode.window.registerTreeDataProvider('refuctorCreditScore', creditScoreProvider);
  
  // Achievements Provider
  const achievementsProvider = new AchievementsProvider();
  vscode.window.registerTreeDataProvider('refuctorAchievements', achievementsProvider);
  
  // Diagnostic Provider for debt issues
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('refuctor');
  context.subscriptions.push(diagnosticCollection);
  
  // CodeLens Provider for inline debt metrics
  const codeLensProvider = new RefuctorCodeLensProvider();
  vscode.languages.registerCodeLensProvider(['javascript', 'typescript'], codeLensProvider);
}

function startRealTimeMonitoring(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('refuctor');
  
  if (config.get('enableRealTimeScanning', true)) {
    // Monitor file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,md}');
    
    fileWatcher.onDidChange(() => {
      updateStatusBar();
    });
    
    fileWatcher.onDidCreate(() => {
      updateStatusBar();
    });
    
    fileWatcher.onDidDelete(() => {
      updateStatusBar();
    });
    
    context.subscriptions.push(fileWatcher);
    
    // Monitor document changes
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.scheme === 'file') {
        debounce(() => updateStatusBar(), 1000)();
      }
    });
  }
}

async function scanProjectDebt() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found');
    return;
  }
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '🔍 Scanning for technical debt...',
    cancellable: false
  }, async (progress) => {
    try {
      progress.report({ increment: 0, message: 'Initializing debt detector...' });
      
      const projectPath = workspaceFolder.uri.fsPath;
      progress.report({ increment: 25, message: 'Analyzing project files...' });
      
      const scanResult = await debtDetector.scanProject(projectPath, true);
      progress.report({ increment: 75, message: 'Processing results...' });
      
      // Track achievement
      await gamificationSystem.trackActivity(projectPath, 'debt-scan');
      
      progress.report({ increment: 100, message: 'Scan complete!' });
      
      // Show results
      if (scanResult.totalDebt === 0) {
        vscode.window.showInformationMessage(
          '🎉 Debt-free status achieved! Your code is pristine.',
          'View Dashboard'
        ).then(selection => {
          if (selection === 'View Dashboard') {
            vscode.commands.executeCommand('refuctor.showDashboard');
          }
        });
      } else {
        const message = `💸 Found ${scanResult.totalDebt} debt issues (P1: ${scanResult.p1.length}, P2: ${scanResult.p2.length})`;
        const config = vscode.workspace.getConfiguration('refuctor');
        
        if (scanResult.p1.length > 0 && config.get('snarkyMode', true)) {
          vscode.window.showErrorMessage(
            `🚨 ${scanResult.p1.length} critical debt issues found! This is embarrassing.`,
            'Fix Now', 'View Details'
          ).then(selection => {
            if (selection === 'Fix Now') {
              vscode.commands.executeCommand('refuctor.fixDebt');
            } else if (selection === 'View Details') {
              vscode.commands.executeCommand('refuctor.showDashboard');
            }
          });
        } else {
          vscode.window.showWarningMessage(message, 'Fix Issues', 'View Dashboard').then(selection => {
            if (selection === 'Fix Issues') {
              vscode.commands.executeCommand('refuctor.fixDebt');
            } else if (selection === 'View Dashboard') {
              vscode.commands.executeCommand('refuctor.showDashboard');
            }
          });
        }
      }
      
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`Debt scan failed: ${error}`);
    }
  });
}

async function autoFixDebt() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found');
    return;
  }
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '🔧 Auto-fixing debt issues...',
    cancellable: false
  }, async (progress) => {
    try {
      const projectPath = workspaceFolder.uri.fsPath;
      const fixer = new Fixer();
      
      progress.report({ increment: 0, message: 'Analyzing fixable issues...' });
      
      const fixResult = await fixer.emergencyFix(projectPath, {
        dryRun: false,
        fixTypes: ['syntax', 'formatting', 'imports']
      });
      
      progress.report({ increment: 100, message: 'Fixes applied!' });
      
      if (fixResult.fixesApplied > 0) {
        // Track achievement
        await gamificationSystem.trackActivity(projectPath, 'debt-fix', {
          fixesApplied: fixResult.fixesApplied,
          criticalIssues: fixResult.criticalIssuesResolved
        });
        
        vscode.window.showInformationMessage(
          `✅ Applied ${fixResult.fixesApplied} fixes to ${fixResult.filesModified} files!`,
          'View Changes'
        );
      } else {
        vscode.window.showInformationMessage('No auto-fixable issues found.');
      }
      
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`Auto-fix failed: ${error}`);
    }
  });
}

async function generateCreditScore() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found');
    return;
  }
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '💰 Calculating credit score...',
    cancellable: false
  }, async (progress) => {
    try {
      const projectPath = workspaceFolder.uri.fsPath;
      
      progress.report({ increment: 50, message: 'Analyzing code quality...' });
      const creditData = await accountant.calculateCreditScore(projectPath);
      
      progress.report({ increment: 100, message: 'Score calculated!' });
      
      // Track achievement
      await gamificationSystem.trackActivity(projectPath, 'tool-usage', { tool: 'accountant' });
      
      const panel = vscode.window.createWebviewPanel(
        'refuctorCreditScore',
        'Refuctor Credit Score',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      
      panel.webview.html = generateCreditScoreHTML(creditData);
      
      // Update status bar
      statusBarItems.creditScore.text = `$(graph-line) Credit: ${creditData.score}`;
      
    } catch (error) {
      vscode.window.showErrorMessage(`Credit score calculation failed: ${error}`);
    }
  });
}

async function showDashboard() {
  const panel = vscode.window.createWebviewPanel(
    'refuctorDashboard',
    'Refuctor Dashboard',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  
  panel.webview.html = generateDashboardHTML();
}

async function deployGoon() {
  const goonOptions = [
    { label: '💀 Comment Killer', description: 'Eliminate dead comments and TODOs', value: 'comment-killer' },
    { label: '📦 Import Cleaner', description: 'Clean up unused imports', value: 'import-cleaner' },
    { label: '🔧 The Fixer', description: 'Emergency syntax repairs', value: 'fixer' },
    { label: '💰 The Accountant', description: 'Financial debt analysis', value: 'accountant' }
  ];
  
  const selection = await vscode.window.showQuickPick(goonOptions, {
    placeHolder: 'Select a goon to deploy',
    title: '💀 Deploy Specialized Goon'
  });
  
  if (!selection) return;
  
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;
  
  const projectPath = workspaceFolder.uri.fsPath;
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Deploying ${selection.label}...`,
    cancellable: false
  }, async (progress) => {
    try {
      switch (selection.value) {
        case 'comment-killer':
          const commentKiller = new CommentKiller();
          const commentResult = await commentKiller.eliminateCommentDebt(projectPath, {
            removeDebugComments: true,
            removeCommentedCode: true,
            removeEmptyComments: true,
            dryRun: false
          });
          vscode.window.showInformationMessage(`💀 Comment Killer eliminated ${commentResult.totalRemoved} comment debt items!`);
          break;
          
        case 'import-cleaner':
          const importCleaner = new ImportCleaner();
          const importResult = await importCleaner.cleanUnusedImports(projectPath, { dryRun: false });
          vscode.window.showInformationMessage(`📦 Import Cleaner removed ${importResult.totalRemoved} unused imports!`);
          break;
          
        case 'fixer':
          vscode.commands.executeCommand('refuctor.fixDebt');
          return;
          
        case 'accountant':
          vscode.commands.executeCommand('refuctor.generateCreditScore');
          return;
      }
      
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`Goon deployment failed: ${error}`);
    }
  });
}

async function showAchievements() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;
  
  const projectPath = workspaceFolder.uri.fsPath;
  const dashboard = await gamificationSystem.generateUserDashboard(projectPath);
  
  const panel = vscode.window.createWebviewPanel(
    'refuctorAchievements',
    'Refuctor Achievements',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  
  panel.webview.html = generateAchievementsHTML(dashboard);
}

async function startMCPServer() {
  const terminal = vscode.window.createTerminal('Refuctor MCP Server');
  terminal.sendText('refuctor mcp-server');
  terminal.show();
  
  vscode.window.showInformationMessage(
    '📡 MCP Debt Broker server started in terminal',
    'View Terminal'
  ).then(selection => {
    if (selection === 'View Terminal') {
      terminal.show();
    }
  });
}

async function activateAfterDarkMode() {
  if (isAfterDarkMode) return;
  
  const config = vscode.workspace.getConfiguration('refuctor');
  if (!config.get('enableAfterDarkMode', true)) {
    vscode.window.showInformationMessage('After Dark Mode is disabled in settings');
    return;
  }
  
  isAfterDarkMode = true;
  
  // Track easter egg achievement
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    await gamificationSystem.trackActivity(workspaceFolder.uri.fsPath, 'easter-egg', { easterEgg: 'after-dark' });
  }
  
  const panel = vscode.window.createWebviewPanel(
    'refuctorAfterDark',
    '🌙 After Dark Mode',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  
  panel.webview.html = generateAfterDarkHTML();
  
  panel.onDidDispose(() => {
    isAfterDarkMode = false;
  });
  
  vscode.window.showInformationMessage('🌙 Welcome to After Dark Mode... where debt cleanup gets intimate 💋');
}

async function updateStatusBar() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;
  
  try {
    const projectPath = workspaceFolder.uri.fsPath;
    const scanResult = await debtDetector.scanProject(projectPath, false);
    
    // Update debt count
    if (scanResult.totalDebt === 0) {
      statusBarItems.debtCount.text = '$(check) Debt-Free';
      statusBarItems.debtCount.color = '#00ff00';
    } else {
      statusBarItems.debtCount.text = `$(warning) ${scanResult.totalDebt} debt`;
      statusBarItems.debtCount.color = scanResult.p1.length > 0 ? '#ff0000' : '#ffff00';
    }
    
    // Update credit score periodically
    if (Math.random() < 0.1) { // 10% chance to avoid constant calculation
      const creditData = await accountant.calculateCreditScore(projectPath);
      statusBarItems.creditScore.text = `$(graph-line) Credit: ${creditData.score}`;
      statusBarItems.creditScore.color = creditData.score >= 700 ? '#00ff00' : 
                                         creditData.score >= 600 ? '#ffff00' : '#ff0000';
    }
  } catch (error) {
    statusBarItems.debtCount.text = '$(error) Scan Error';
    statusBarItems.debtCount.color = '#ff0000';
  }
}

function showActivationMessage() {
  const config = vscode.workspace.getConfiguration('refuctor');
  if (config.get('snarkyMode', true)) {
    vscode.window.showInformationMessage(
      '🏦 The Debt Collector has arrived! Your code\'s financial status is about to be audited.',
      'Scan Now', 'Configure'
    ).then(selection => {
      if (selection === 'Scan Now') {
        vscode.commands.executeCommand('refuctor.scanDebt');
      } else if (selection === 'Configure') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'refuctor');
      }
    });
  } else {
    vscode.window.showInformationMessage(
      'Refuctor extension activated. Ready to detect technical debt.',
      'Scan Project'
    ).then(selection => {
      if (selection === 'Scan Project') {
        vscode.commands.executeCommand('refuctor.scanDebt');
      }
    });
  }
}

// Utility function for debouncing
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// HTML generation functions
function generateCreditScoreHTML(creditData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #fff; }
        .score { font-size: 3em; color: #00ff00; text-align: center; }
        .breakdown { margin: 20px 0; }
        .category { margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>💰 Developer Credit Score</h1>
      <div class="score">${creditData.score}/850</div>
      <p><strong>Classification:</strong> ${creditData.classification}</p>
      <p><strong>Interest Rate:</strong> ${creditData.interestRate}% APR</p>
      
      <div class="breakdown">
        <h2>Score Breakdown</h2>
        <div class="category">Code Quality: ${creditData.breakdown.codeQuality}/100</div>
        <div class="category">Payment History: ${creditData.breakdown.paymentHistory}/100</div>
        <div class="category">Debt Load: ${creditData.breakdown.debtLoad}/100</div>
        <div class="category">Patterns: ${creditData.breakdown.patterns}/100</div>
      </div>
    </body>
    </html>
  `;
}

function generateDashboardHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #fff; }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: #2d2d30; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>🏦 Refuctor Dashboard</h1>
      <div class="dashboard">
        <div class="card">
          <h2>Debt Summary</h2>
          <p>Loading debt analysis...</p>
        </div>
        <div class="card">
          <h2>Credit Score</h2>
          <p>Loading credit score...</p>
        </div>
        <div class="card">
          <h2>Recent Activity</h2>
          <p>Loading activity...</p>
        </div>
        <div class="card">
          <h2>Achievements</h2>
          <p>Loading achievements...</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAchievementsHTML(dashboard: any): string {
  const achievementsList = dashboard.achievements.recent
    .map((achievement: any) => `
      <div class="achievement">
        <span class="icon">${achievement.icon}</span>
        <div class="info">
          <h3>${achievement.title}</h3>
          <p>${achievement.description}</p>
          <small>Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}</small>
        </div>
      </div>
    `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #fff; }
        .achievement { display: flex; align-items: center; margin: 10px 0; padding: 15px; background: #2d2d30; border-radius: 8px; }
        .icon { font-size: 2em; margin-right: 15px; }
        .info h3 { margin: 0; color: #00ff00; }
        .info p { margin: 5px 0; }
        .info small { color: #ccc; }
      </style>
    </head>
    <body>
      <h1>🏆 Achievements</h1>
      <p>Total: ${dashboard.achievements.total} achievements unlocked</p>
      <p>Level: ${dashboard.user.level} - ${dashboard.user.title}</p>
      <p>Experience: ${dashboard.user.xp} XP</p>
      
      <h2>Recent Achievements</h2>
      ${achievementsList || '<p>No achievements yet. Start scanning for debt to earn your first achievement!</p>'}
    </body>
    </html>
  `;
}

function generateAfterDarkHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #e94560); 
          color: #fff; 
          text-align: center;
        }
        .sultry-title { font-size: 3em; color: #ff6b9d; text-shadow: 0 0 20px rgba(233, 69, 96, 0.5); }
        .quote { font-size: 1.5em; font-style: italic; margin: 30px 0; color: #ff9aa2; }
      </style>
    </head>
    <body>
      <h1 class="sultry-title">🌙 After Dark Mode 🌙</h1>
      <p>Where debt cleanup gets... intimate</p>
      
      <div class="quote">
        "Your code is so clean... it's making me hot 🔥"
      </div>
      
      <p>💋 Welcome to the sultry side of technical debt management</p>
      <p>🌹 Let's make this codebase... passionate</p>
      
      <div style="margin-top: 50px;">
        <p>— The Debt Collector, After Hours ✨</p>
      </div>
    </body>
    </html>
  `;
}

// Tree Data Providers
class DebtExplorerProvider implements vscode.TreeDataProvider<any> {
  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }
  
  getChildren(element?: any): Thenable<any[]> {
    // Return debt items grouped by priority
    return Promise.resolve([
      new vscode.TreeItem('P1 Critical Issues', vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem('P2 High Issues', vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem('P3 Medium Issues', vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem('P4 Low Issues', vscode.TreeItemCollapsibleState.Expanded)
    ]);
  }
}

class CreditScoreProvider implements vscode.TreeDataProvider<any> {
  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }
  
  getChildren(element?: any): Thenable<any[]> {
    return Promise.resolve([
      new vscode.TreeItem('Score: Loading...', vscode.TreeItemCollapsibleState.None),
      new vscode.TreeItem('Classification: --', vscode.TreeItemCollapsibleState.None),
      new vscode.TreeItem('Interest Rate: --%', vscode.TreeItemCollapsibleState.None)
    ]);
  }
}

class AchievementsProvider implements vscode.TreeDataProvider<any> {
  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }
  
  getChildren(element?: any): Thenable<any[]> {
    return Promise.resolve([
      new vscode.TreeItem('🏆 Recent Achievements', vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem('🎯 Next Achievements', vscode.TreeItemCollapsibleState.Expanded)
    ]);
  }
}

class RefuctorCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    
    // Add debt metrics at the top of files
    const range = new vscode.Range(0, 0, 0, 0);
    const command: vscode.Command = {
      title: '📊 Scan Debt',
      command: 'refuctor.scanDebt'
    };
    
    codeLenses.push(new vscode.CodeLens(range, command));
    
    return codeLenses;
  }
}

export function deactivate() {
} 