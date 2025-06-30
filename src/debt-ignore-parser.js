const fs = require('fs-extra');
const path = require('path');
const { minimatch } = require('minimatch');

/**
 * Debt Ignore Parser - Handle .debtignore files
 * Supports gitignore-style patterns for excluding files from debt tracking
 */
class DebtIgnoreParser {
  constructor() {
    this.patterns = [];
    this.ignoreFileName = '.debtignore';
  }

  /**
   * Load debt ignore patterns from .debtignore file
   * @param {string} projectPath - Project root path
   * @returns {Array} Array of ignore patterns
   */
  async loadIgnorePatterns(projectPath) {
    const ignoreFilePath = path.join(projectPath, this.ignoreFileName);
    
    // Default patterns (always ignored)
    this.patterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.tmp',
      '*.temp'
    ];

    // Load custom patterns from .debtignore
    if (await fs.pathExists(ignoreFilePath)) {
      try {
        const content = await fs.readFile(ignoreFilePath, 'utf8');
        const customPatterns = this.parseIgnoreFile(content);
        this.patterns.push(...customPatterns);
        console.log(`Loaded ${customPatterns.length} custom debt ignore patterns`);
      } catch (error) {
        console.warn(`Warning: Could not read ${this.ignoreFileName}: ${error.message}`);
      }
    }

    return this.patterns;
  }

  /**
   * Parse .debtignore file content into patterns
   * @param {string} content - File content
   * @returns {Array} Array of patterns
   */
  parseIgnoreFile(content) {
    const patterns = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Convert gitignore-style patterns
      let pattern = trimmed;
      
      // Handle directory patterns (ending with /)
      if (pattern.endsWith('/')) {
        pattern = pattern.slice(0, -1) + '/**';
      }
      
      // Handle root-relative patterns (starting with /)
      if (pattern.startsWith('/')) {
        pattern = pattern.slice(1);
      }

      patterns.push(pattern);
    }

    return patterns;
  }

  /**
   * Check if a file should be ignored based on loaded patterns
   * @param {string} filePath - File path to check (relative to project root)
   * @returns {boolean} True if file should be ignored
   */
  shouldIgnore(filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    return this.patterns.some(pattern => {
      return minimatch(normalizedPath, pattern, { 
        dot: true,        // Match dotfiles
        noglobstar: false // Allow ** patterns
      });
    });
  }

  /**
   * Get snarky debt holiday message for ignored files
   * @param {string} filePath - File path that's being ignored
   * @returns {string} Snarky message about debt holiday
   */
  getDebtHolidayMessage(filePath) {
    const holidayMessages = [
      `🏖️ ${filePath} is on a DEBT HOLIDAY - lucky bastard!`,
      `🎉 DEBT JUBILEE declared for ${filePath} - all sins forgiven!`,
      `😎 ${filePath} got a debt moratorium - must know someone important...`,
      `🏝️ ${filePath} is in the Debt Bahamas - no extradition treaties here!`,
      `🍹 ${filePath} declared debt amnesty - sipping mai-tais while you fix everything else`,
      `🎭 ${filePath} pleaded diplomatic immunity - debt collectors can't touch it!`,
      `🛡️ ${filePath} filed for debt sanctuary status - safe from the goons!`,
      `🦆 ${filePath} is a debt conscientious objector - refuses to participate!`
    ];
    
    return holidayMessages[Math.floor(Math.random() * holidayMessages.length)];
  }

  /**
   * Get debt status with snarky commentary for a file
   * @param {string} filePath - File path to check
   * @returns {Object} Status object with ignored flag and message
   */
  getDebtStatus(filePath) {
    const isIgnored = this.shouldIgnore(filePath);
    
    if (isIgnored) {
      return {
        ignored: true,
        message: this.getDebtHolidayMessage(filePath),
        status: 'DEBT_HOLIDAY'
      };
    }
    
    return {
      ignored: false,
      message: `💰 ${filePath} is subject to debt collection - pay up!`,
      status: 'DEBT_ACTIVE'
    };
  }

  /**
   * Filter an array of file paths, removing ignored files
   * @param {Array} filePaths - Array of file paths to filter
   * @returns {Array} Filtered array with ignored files removed
   */
  filterIgnored(filePaths) {
    return filePaths.filter(filePath => !this.shouldIgnore(filePath));
  }

  /**
   * Get current ignore patterns (for debugging)
   * @returns {Array} Current patterns
   */
  getPatterns() {
    return [...this.patterns];
  }

  /**
   * Add a pattern programmatically
   * @param {string} pattern - Pattern to add
   */
  addPattern(pattern) {
    if (!this.patterns.includes(pattern)) {
      this.patterns.push(pattern);
    }
  }

  /**
   * Remove a pattern programmatically
   * @param {string} pattern - Pattern to remove
   */
  removePattern(pattern) {
    const index = this.patterns.indexOf(pattern);
    if (index > -1) {
      this.patterns.splice(index, 1);
    }
  }

  /**
   * Create a sample .debtignore file
   * @param {string} projectPath - Project path
   * @returns {string} Sample content
   */
  static getSampleContent() {
    return `# Refuctor Debt Ignore - Debt Holiday & Jubilee Management
# Files and patterns to exclude from technical debt tracking
# 🏖️ Welcome to the Debt Bahamas - no extradition treaties here!

# WIP and brainstorming files (debt moratorium granted)
*-draft.md     # 🎭 Diplomatic immunity - still drafting excuses
*-notes.md     # 🦆 Conscientious objector status  
brainstorm/    # 😎 Creative sanctuary - goons can't touch inspiration

# Generated documentation (debt amnesty declared)
docs/generated/  # 🤖 Robots don't pay debt - they just generate more
api-docs/       # 📖 Documentation debt is an oxymoron anyway

# Legacy code in migration (debt holiday extended indefinitely)
legacy/         # 🏛️ Historical preservation society protection
deprecated/     # ⚰️ Already dead - can't collect from corpses

# Third-party or vendor files (not our debt to begin with)
vendor/         # 💸 Someone else's problem - we just borrowed it
third-party/    # 🤝 Joint liability - let them handle their own mess

# Experimental features (debt jubilee for innovation)
experiments/    # 🧪 Mad scientist exemption
prototypes/     # 🛠️ Proof of concept immunity

# Temporary files (too short-lived for debt collection)
*.tmp          # ⏰ Gone before the goons arrive
*.temp         # 🏃‍♂️ Faster than debt collectors
temp-*         # 🫥 What debt? I don't see any debt...

# Example specific files (customize your debt sanctuary):
# SPECIFIC_FILE.md    # 🛡️ Personal protection program
# another-file.js     # 🏖️ Permanent vacation status
`;
  }
}

module.exports = { DebtIgnoreParser }; 