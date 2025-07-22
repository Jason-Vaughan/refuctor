/**
 * Debt Mode Manager - Single Source of Truth for Project Debt Classification
 * 
 * Manages three distinct debt management modes:
 * - Dev Crew: Lenient, supportive for active development
 * - Beta Caporegime: Moderate, preparing for release  
 * - Prod Family: Strict, zero tolerance for production
 */

const fs = require('fs-extra');
const path = require('path');

class DebtModeManager {
  constructor() {
    this.modes = {
      DEV_CREW: {
        name: 'Dev Crew',
        emoji: '👥',
        description: 'Active development mode - supportive and lenient',
        personality: 'Supportive colleagues giving helpful feedback',
        thresholds: {
          // Very lenient - expects documentation work, debugging, iteration
          guido: { 
            markdownWarnings: 1000, spellErrors: 200, securityCritical: 10, 
            eslintErrors: 300, tsErrors: 100, consoleLogs: 2000, todos: 100
          },
          mafia: { 
            markdownWarnings: 2000, spellErrors: 500, securityCritical: 20, 
            eslintErrors: 500, tsErrors: 200, consoleLogs: 5000, todos: 200
          },
          p1: { 
            markdownWarnings: 500, spellErrors: 100, securityHigh: 5,
            eslintErrors: 150, tsErrors: 50, consoleLogs: 1000, todos: 50
          },
          p2: { 
            markdownWarnings: 200, spellErrors: 50, securityMedium: 10,
            eslintErrors: 75, tsErrors: 25, consoleLogs: 500, todos: 25
          },
          p3: { 
            markdownWarnings: 50, spellErrors: 20, unused: 20,
            eslintWarnings: 100, formatting: 50, deadCode: 15
          },
          p4: { 
            markdownWarnings: 10, spellErrors: 5, style: 50,
            eslintWarnings: 25, minorIssues: 20
          }
        },
        messages: {
          markdown: 'Documentation work in progress',
          spelling: 'Project terminology needs dictionary updates',
          console: 'Active debugging detected - normal for development',
          security: 'Security review needed before release',
          general: 'Development debt - address when convenient'
        }
      },
      
      BETA_CAPOREGIME: {
        name: 'Beta Caporegime',
        emoji: '🎖️',
        description: 'Pre-release mode - moderate standards for testing phase',
        personality: 'Demanding but fair supervisor preparing for release',
        thresholds: {
          // Moderate - time to clean up for release
          guido: { 
            markdownWarnings: 200, spellErrors: 75, securityCritical: 5, 
            eslintErrors: 200, tsErrors: 75, consoleLogs: 100, todos: 50
          },
          mafia: { 
            markdownWarnings: 300, spellErrors: 100, securityCritical: 8, 
            eslintErrors: 300, tsErrors: 100, consoleLogs: 150, todos: 75
          },
          p1: { 
            markdownWarnings: 50, spellErrors: 25, securityHigh: 2,
            eslintErrors: 75, tsErrors: 25, consoleLogs: 25, todos: 20
          },
          p2: { 
            markdownWarnings: 20, spellErrors: 10, securityMedium: 5,
            eslintErrors: 30, tsErrors: 15, consoleLogs: 10, todos: 10
          },
          p3: { 
            markdownWarnings: 10, spellErrors: 5, unused: 10,
            eslintWarnings: 15, formatting: 25, deadCode: 8
          },
          p4: { 
            markdownWarnings: 3, spellErrors: 2, style: 20,
            eslintWarnings: 5, minorIssues: 10
          }
        },
        messages: {
          markdown: 'Tighten up documentation for release',
          spelling: 'Users will see this - fix terminology',
          console: 'Debug logs should be removed before release',
          security: 'Security issues block release',
          general: 'Polish required for beta quality'
        }
      },
      
      PROD_FAMILY: {
        name: 'Prod Family',
        emoji: '🕴️',
        description: 'Production mode - zero tolerance enforcement',
        personality: 'Ruthless enforcers protecting production quality',
        thresholds: {
          // Strict - current aggressive thresholds
          guido: { 
            markdownWarnings: 100, spellErrors: 50, securityCritical: 5, 
            eslintErrors: 150, tsErrors: 50, consoleLogs: 40, todos: 30
          },
          mafia: { 
            markdownWarnings: 50, spellErrors: 25, securityCritical: 3, 
            eslintErrors: 75, tsErrors: 30, consoleLogs: 20, todos: 15
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
        },
        messages: {
          markdown: 'Production documentation must be perfect',
          spelling: 'Spell errors in production are unacceptable',
          console: 'Debug logs in production? Are you insane?',
          security: 'Security vulnerabilities in production = fired',
          general: 'This is production. No excuses.'
        }
      }
    };
  }

  /**
   * Auto-detect appropriate mode based on project indicators
   */
  async detectProjectMode(projectPath) {
    try {
      const indicators = await this.analyzeProjectIndicators(projectPath);
      
      // Check for production indicators
      if (indicators.hasProductionConfig || indicators.isStableRelease || indicators.hasProductionDomain) {
        return 'PROD_FAMILY';
      }
      
      // Check for beta/testing indicators  
      if (indicators.hasTestingFramework || indicators.hasReleaseBranch || indicators.hasCI) {
        return 'BETA_CAPOREGIME';
      }
      
      // Default to development mode
      return 'DEV_CREW';
    } catch (error) {
      console.warn('Mode detection failed, defaulting to DEV_CREW:', error.message);
      return 'DEV_CREW';
    }
  }

  /**
   * Analyze project to determine appropriate mode
   */
  async analyzeProjectIndicators(projectPath) {
    const indicators = {
      hasActiveRoadmap: false,
      hasDebugLogs: false,
      hasActiveCommits: false,
      hasTestingFramework: false,
      hasReleaseBranch: false,
      hasCI: false,
      hasProductionConfig: false,
      isStableRelease: false,
      hasProductionDomain: false
    };

    // Check for development indicators
    indicators.hasActiveRoadmap = await fs.pathExists(path.join(projectPath, 'REFUCTOR_ROADMAP.md'));
    indicators.hasActiveCommits = await fs.pathExists(path.join(projectPath, '.git'));
    
    // Check for console logs (indicates active development)
    try {
      const srcPath = path.join(projectPath, 'src');
      if (await fs.pathExists(srcPath)) {
        const files = await fs.readdir(srcPath);
        for (const file of files.slice(0, 5)) { // Sample a few files
          if (file.endsWith('.js')) {
            const content = await fs.readFile(path.join(srcPath, file), 'utf8');
            if (content.includes('console.log')) {
              indicators.hasDebugLogs = true;
              break;
            }
          }
        }
      }
    } catch (error) {
      // Ignore file reading errors
    }

    // Check for testing indicators
    const packagePath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packagePath)) {
      try {
        const pkg = await fs.readJson(packagePath);
        indicators.hasTestingFramework = !!(
          pkg.devDependencies?.jest || 
          pkg.devDependencies?.mocha || 
          pkg.dependencies?.jest
        );
        indicators.hasCI = !!(pkg.scripts?.test || pkg.scripts?.ci);
        
        // Check for production indicators
        indicators.hasProductionConfig = !!(
          pkg.scripts?.build || 
          pkg.scripts?.start ||
          pkg.engines
        );
        
        // Stable release indicated by version without beta/alpha
        if (pkg.version && !pkg.version.includes('beta') && !pkg.version.includes('alpha')) {
          indicators.isStableRelease = parseFloat(pkg.version) >= 1.0;
        }
      } catch (error) {
        // Ignore package.json reading errors
      }
    }

    return indicators;
  }

  /**
   * Get current mode from config file
   */
  async getCurrentMode(projectPath) {
    const configPath = path.join(projectPath, '.refuctor', 'mode-config.json');
    
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        if (config.mode && this.modes[config.mode]) {
          return config.mode;
        }
      }
    } catch (error) {
      console.warn('Failed to read mode config:', error.message);
    }
    
    // Auto-detect if no config exists
    return await this.detectProjectMode(projectPath);
  }

  /**
   * Set project mode (SSOT persistence)
   */
  async setMode(projectPath, mode) {
    if (!this.modes[mode]) {
      throw new Error(`Invalid mode: ${mode}. Valid modes: ${Object.keys(this.modes).join(', ')}`);
    }

    const configDir = path.join(projectPath, '.refuctor');
    const configPath = path.join(configDir, 'mode-config.json');
    
    await fs.ensureDir(configDir);
    
    const config = {
      mode,
      setAt: new Date().toISOString(),
      autoDetected: false,
      description: this.modes[mode].description
    };
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    return config;
  }

  /**
   * Get mode configuration
   */
  getModeConfig(mode) {
    return this.modes[mode] || null;
  }

  /**
   * Get all available modes
   */
  getAllModes() {
    return Object.keys(this.modes).map(key => ({
      key,
      ...this.modes[key]
    }));
  }

  /**
   * Get mode-specific thresholds for debt detection
   */
  async getThresholds(projectPath) {
    const currentMode = await this.getCurrentMode(projectPath);
    const modeConfig = this.getModeConfig(currentMode);
    
    return {
      mode: currentMode,
      ...modeConfig.thresholds
    };
  }

  /**
   * Get mode-specific messages
   */
  async getMessages(projectPath) {
    const currentMode = await this.getCurrentMode(projectPath);
    const modeConfig = this.getModeConfig(currentMode);
    
    return {
      mode: currentMode,
      ...modeConfig.messages
    };
  }
}

module.exports = { DebtModeManager }; 