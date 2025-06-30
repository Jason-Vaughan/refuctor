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
    return `# Refuctor Debt Ignore
# Files and patterns to exclude from technical debt tracking

# WIP and brainstorming files
*-draft.md
*-notes.md
brainstorm/

# Generated documentation
docs/generated/
api-docs/

# Legacy code in migration
legacy/
deprecated/

# Third-party or vendor files
vendor/
third-party/

# Experimental features
experiments/
prototypes/

# Temporary files
*.tmp
*.temp
temp-*

# Example specific files:
# SPECIFIC_FILE.md
# another-file.js
`;
  }
}

module.exports = { DebtIgnoreParser }; 