// Main entry point for @puberty-labs/refuctor
// Exports core modules for programmatic use

const { debtDetector } = require('./debt-detector');
const { techDebtManager } = require('./techdebt-manager');

module.exports = {
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