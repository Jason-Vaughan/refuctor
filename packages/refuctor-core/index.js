/**
 * @puberty-labs/refuctor-core
 * Core debt detection and credit rating engine
 */

// Core debt detection
const { DebtDetector } = require('./src/debt-detector');
const { techDebtManager } = require('./src/techdebt-manager');
const { DebtIgnoreParser } = require('./src/debt-ignore-parser');

// Credit rating and gamification
const { Accountant } = require('./src/goons/accountant');
const { GamificationSystem } = require('./src/gamification-system');

// Specialized goons
const { CommentKiller } = require('./src/goons/comment-killer');
const { ImportCleaner } = require('./src/goons/import-cleaner');
const { Fixer } = require('./src/goons/fixer');

// MCP Server
const RefuctorMCPServer = require('./src/refuctor-mcp-server');

// Utilities
const SnarkySpellHandler = require('./src/snarky-spell-handler');

module.exports = {
  // Primary Classes
  DebtDetector,
  techDebtManager,
  DebtIgnoreParser,
  
  // Financial & Gamification
  Accountant,
  GamificationSystem,
  
  // Specialized Tools
  CommentKiller,
  ImportCleaner,
  Fixer,
  
  // MCP Integration
  RefuctorMCPServer,
  
  // Utilities
  SnarkySpellHandler,
  
  // Constants
  VERSION: require('./package.json').version,
  
  // Helper functions
  createDebtDetector: () => new DebtDetector(),
  createAccountant: () => new Accountant(),
  createGamificationSystem: () => new GamificationSystem(),
  
  // Quick access methods
  async scanProject(projectPath, options = {}) {
    const detector = new DebtDetector();
    return await detector.scanProject(projectPath, options.verbose || false);
  },
  
  async generateCreditScore(projectPath) {
    const accountant = new Accountant();
    return await accountant.calculateCreditScore(projectPath);
  },
  
  async trackAchievement(projectPath, activityType, data = {}) {
    const gamification = new GamificationSystem();
    return await gamification.trackActivity(projectPath, activityType, data);
  }
}; 