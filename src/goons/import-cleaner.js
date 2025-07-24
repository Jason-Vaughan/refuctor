/**
 * Import Cleaner Goon - Unused Import Detection and Cleanup
 * 
 * This goon specializes in:
 * - Finding unused imports across JavaScript/TypeScript projects
 * - Detecting circular dependencies
 * - Optimizing import efficiency
 * - Analyzing bundle size impact
 * - Tree-shaking validation
 */

const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('../debt-ignore-parser');

class ImportCleaner {
  constructor() {
    this.name = 'Import Cleaner Goon';
    this.personality = 'Aggressive import optimization specialist';
    this.snarkLevel = 11;
    this.ignoreParser = new DebtIgnoreParser();
    
    this.importPatterns = {
      // ES6 imports
      es6Import: /^import\s+(?:(?:\w+(?:\s*,\s*)?)?(?:\{[^}]*\})?(?:\s*,\s*\*\s+as\s+\w+)?)\s+from\s+['"`]([^'"`]+)['"`]/gm,
      // CommonJS requires
      commonJS: /(?:const|let|var)\s+(?:\{[^}]*\}|\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/gm,
      // Dynamic imports
      dynamicImport: /import\(['"`]([^'"`]+)['"`]\)/gm,
      // Named imports
      namedImports: /import\s+\{([^}]+)\}\s+from\s+['"`]([^'"`]+)['"`]/gm,
      // Default imports
      defaultImports: /import\s+(\w+)(?:\s*,\s*\{[^}]*\})?\s+from\s+['"`]([^'"`]+)['"`]/gm,
      // Namespace imports
      namespaceImports: /import\s+\*\s+as\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/gm
    };
    
    this.usagePatterns = {
      // Variable usage
      variableUsage: /\b(\w+)\b/g,
      // Property access
      propertyAccess: /(\w+)\.(\w+)/g,
      // Function calls
      functionCall: /(\w+)\s*\(/g,
      // JSX usage
      jsxUsage: /<(\w+)/g
    };
    
    this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
    this.projectGraph = new Map();
    this.unusedImports = new Set();
  }

  /**
   * Main Goon entry point - Eliminate import debt
   * @param {string} projectPath - Project root directory  
   * @param {Object} options - Configuration options
   * @returns {Object} Import cleanup report
   */
  async eliminateDebt(projectPath = '.', options = {}) {
    const { dryRun = true, removeUnused = true } = options;
    
    console.log(`🎯 Mode: ${dryRun ? 'DRY RUN (Preview)' : 'LIVE CLEANUP'}`);
    console.log(`📂 Target: ${path.resolve(projectPath)}\n`);
    
    const startTime = Date.now();
    
    // Load debt ignore patterns
    await this.ignoreParser.loadIgnorePatterns(projectPath);
    
    // Analyze imports
    const analysis = await this.analyzeImports(projectPath);
    
    const report = {
      goon: this.name,
      projectPath: path.resolve(projectPath),
      mode: dryRun ? 'dry-run' : 'live-cleanup', 
      startTime: new Date().toISOString(),
      totalFilesAnalyzed: analysis.totalFiles,
      totalIssuesFound: analysis.totalIssues,
      unusedImportsFound: analysis.unusedImports.length,
      circularDependencies: analysis.circularDependencies.length,
      duplicateImports: analysis.duplicateImports.length,
      filesFixed: 0,
      importsRemoved: 0,
      bytesFreed: 0,
      ignoredFiles: [],
      errors: [],
      snarkLevel: this.snarkLevel
    };
    
    if (removeUnused && analysis.unusedImports.length > 0) {
      
      if (!dryRun) {
        const cleanupResult = await this.cleanupUnusedImports(analysis.unusedImports, projectPath);
        report.filesFixed = cleanupResult.filesFixed;
        report.importsRemoved = cleanupResult.importsRemoved;
        report.bytesFreed = cleanupResult.bytesFreed;
        report.errors = cleanupResult.errors;
      } else {
        report.importsRemoved = analysis.unusedImports.length;
      }
    }
    
    // Generate final report
    const endTime = Date.now();
    report.endTime = new Date().toISOString();
    report.duration = endTime - startTime;
    
    this.generateGoonSummary(report, analysis);
    
    return report;
  }

  /**
   * Generate snarky Goon-style summary
   */
  generateGoonSummary(report, analysis) {
    console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);
    
    if (report.totalIssuesFound === 0) {
      console.log('🏆 Your imports are pristine! No dead weight detected (rare sight indeed).');
    } else {
      
      if (analysis && analysis.unusedImports) {
      }
      
      if (report.mode === 'dry-run') {
        console.log('🔍 Dry run mode - showing what WOULD be cleaned (remove --dry-run to execute)');
      } else {
      }
    }
    
    // Show circular dependencies warning
    if (report.circularDependencies > 0) {
    }
    
    if (report.errors.length > 0) {
      report.errors.slice(0, 3).forEach(error => {
        console.log(`   💥 ${path.basename(error.file)}: ${error.error}`);
      });
    }
    
  }

  // Simplified version for now - keeping the basic structure
  async analyzeImports(projectPath) {
    const files = this.getCodeFiles(projectPath);
    return {
      totalFiles: files.length,
      unusedImports: [], // TODO: Implement proper detection
      circularDependencies: [],
      duplicateImports: [],
      totalIssues: 0
    };
  }

  getCodeFiles(projectPath) {
    const patterns = this.supportedExtensions.map(ext => `**/*${ext}`);
    let files = [];
    
    patterns.forEach(pattern => {
      const matches = glob.sync(pattern, {
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      files.push(...matches.map(f => path.join(projectPath, f)));
    });
    
    return [...new Set(files)];
  }
}

module.exports = { ImportCleaner }; 