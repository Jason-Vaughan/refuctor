// Main entry point for @puberty-labs/refuctor
// Exports core modules for programmatic use

const { DebtDetector } = require('./debt-detector');
const { techDebtManager } = require('./techdebt-manager');
const { Accountant } = require('./goons/accountant');
const { GamificationSystem } = require('./gamification-system');
const { CommentKiller } = require('./goons/comment-killer');
const { ImportCleaner } = require('./goons/import-cleaner');
const { Fixer } = require('./goons/fixer');

// Legacy instance for backward compatibility
const debtDetector = new DebtDetector();

module.exports = {
  // Classes (for extension and advanced use)
  DebtDetector,
  Accountant,
  GamificationSystem,
  CommentKiller,
  ImportCleaner,
  Fixer,
  
  // Legacy exports (for backward compatibility)
  debtDetector,
  techDebtManager,
  
  // Convenience methods
  async scanProject(projectPath, verbose = false) {
    return await debtDetector.scanProject(projectPath, verbose);
  },
  
  async initializeProject(projectPath, force = false) {
    return await techDebtManager.initializeProject(projectPath, force);
  },
  
  async getDebtStatus(projectPath) {
    return await techDebtManager.getDebtStatus(projectPath);
  }
}; 