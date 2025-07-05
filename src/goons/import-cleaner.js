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

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { DebtIgnoreParser } = require('../debt-ignore-parser');

class ImportCleaner {
  constructor() {
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
   * Analyze project for import issues
   */
  async analyzeImports(projectPath) {
    await this.ignoreParser.loadIgnorePatterns(projectPath);
    
    const files = this.getCodeFiles(projectPath);
    const analysis = {
      totalFiles: files.length,
      unusedImports: [],
      circularDependencies: [],
      duplicateImports: [],
      packageAnalysis: {
        totalPackages: 0,
        unusedPackages: [],
        devDependencies: [],
        potentialSavings: 0
      },
      bundleImpact: {
        estimatedSize: 0,
        unnecessaryBytes: 0
      },
      totalIssues: 0
    };
    
    // Build dependency graph
    await this.buildDependencyGraph(files);
    
    // Analyze each file
    for (const file of files) {
      if (this.ignoreParser.shouldIgnore(file)) {
        continue;
      }
      
      const fileAnalysis = await this.analyzeFile(file);
      
      analysis.unusedImports.push(...fileAnalysis.unusedImports);
      analysis.duplicateImports.push(...fileAnalysis.duplicateImports);
    }
    
    // Detect circular dependencies
    analysis.circularDependencies = this.detectCircularDependencies();
    
    // Analyze package.json if available
    const packageAnalysis = await this.analyzePackageJson(projectPath);
    analysis.packageAnalysis = packageAnalysis;
    
    // Calculate totals
    analysis.totalIssues = analysis.unusedImports.length + 
                          analysis.circularDependencies.length + 
                          analysis.duplicateImports.length;
    
    return analysis;
  }

  async buildDependencyGraph(files) {
    this.projectGraph.clear();
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const imports = this.extractImports(content);
        const exports = this.extractExports(content);
        
        this.projectGraph.set(file, {
          imports,
          exports,
          content
        });
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }

  extractImports(content) {
    const imports = [];
    
    // ES6 imports
    const es6Matches = [...content.matchAll(this.importPatterns.es6Import)];
    es6Matches.forEach(match => {
      imports.push({
        type: 'es6',
        source: match[1],
        raw: match[0],
        specifiers: this.parseImportSpecifiers(match[0])
      });
    });
    
    // CommonJS requires
    const cjsMatches = [...content.matchAll(this.importPatterns.commonJS)];
    cjsMatches.forEach(match => {
      imports.push({
        type: 'commonjs',
        source: match[1],
        raw: match[0],
        specifiers: this.parseRequireSpecifiers(match[0])
      });
    });
    
    // Dynamic imports
    const dynamicMatches = [...content.matchAll(this.importPatterns.dynamicImport)];
    dynamicMatches.forEach(match => {
      imports.push({
        type: 'dynamic',
        source: match[1],
        raw: match[0],
        specifiers: []
      });
    });
    
    return imports;
  }

  extractExports(content) {
    const exports = [];
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      /export\s+\{([^}]+)\}/g,
      /export\s+\*\s+from\s+['"`]([^'"`]+)['"`]/g
    ];
    
    exportPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        exports.push({
          type: 'export',
          name: match[1],
          raw: match[0]
        });
      });
    });
    
    return exports;
  }

  parseImportSpecifiers(importStatement) {
    const specifiers = [];
    
    // Default import
    const defaultMatch = importStatement.match(/import\s+(\w+)/);
    if (defaultMatch) {
      specifiers.push({
        type: 'default',
        name: defaultMatch[1],
        alias: defaultMatch[1]
      });
    }
    
    // Named imports
    const namedMatch = importStatement.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(s => s.trim());
      names.forEach(name => {
        const [original, alias] = name.split(' as ').map(s => s.trim());
        specifiers.push({
          type: 'named',
          name: original,
          alias: alias || original
        });
      });
    }
    
    // Namespace import
    const namespaceMatch = importStatement.match(/\*\s+as\s+(\w+)/);
    if (namespaceMatch) {
      specifiers.push({
        type: 'namespace',
        name: '*',
        alias: namespaceMatch[1]
      });
    }
    
    return specifiers;
  }

  parseRequireSpecifiers(requireStatement) {
    const specifiers = [];
    
    // Destructured require
    const destructureMatch = requireStatement.match(/\{([^}]+)\}/);
    if (destructureMatch) {
      const names = destructureMatch[1].split(',').map(s => s.trim());
      names.forEach(name => {
        const [original, alias] = name.split(':').map(s => s.trim());
        specifiers.push({
          type: 'destructured',
          name: original,
          alias: alias || original
        });
      });
    } else {
      // Direct require
      const directMatch = requireStatement.match(/(?:const|let|var)\s+(\w+)\s*=/);
      if (directMatch) {
        specifiers.push({
          type: 'direct',
          name: 'default',
          alias: directMatch[1]
        });
      }
    }
    
    return specifiers;
  }

  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const imports = this.extractImports(content);
    
    const analysis = {
      file: filePath,
      unusedImports: [],
      duplicateImports: [],
      imports: imports.length
    };
    
    // Check for unused imports
    for (const importData of imports) {
      for (const specifier of importData.specifiers) {
        if (!this.isImportUsed(content, specifier, filePath)) {
          analysis.unusedImports.push({
            file: filePath,
            import: importData.raw,
            specifier: specifier.alias,
            source: importData.source,
            type: importData.type,
            estimatedSavings: this.estimateImportSize(importData.source)
          });
        }
      }
    }
    
    // Check for duplicate imports
    const sourceMap = new Map();
    imports.forEach(imp => {
      if (sourceMap.has(imp.source)) {
        analysis.duplicateImports.push({
          file: filePath,
          source: imp.source,
          imports: [sourceMap.get(imp.source), imp.raw]
        });
      } else {
        sourceMap.set(imp.source, imp.raw);
      }
    });
    
    return analysis;
  }

  isImportUsed(content, specifier, filePath) {
    const alias = specifier.alias;
    
    // Remove the import statement itself to avoid false positives
    const contentWithoutImports = content.replace(/^import\s+.*$/gm, '');
    
    // Check for various usage patterns
    const usagePatterns = [
      new RegExp(`\\b${alias}\\b`, 'g'),          // Direct usage
      new RegExp(`${alias}\\.`, 'g'),             // Property access
      new RegExp(`${alias}\\(`, 'g'),             // Function call
      new RegExp(`<${alias}`, 'g'),               // JSX component
      new RegExp(`typeof\\s+${alias}`, 'g'),      // typeof checks
      new RegExp(`${alias}\\[`, 'g')              // Array/object access
    ];
    
    return usagePatterns.some(pattern => pattern.test(contentWithoutImports));
  }

  estimateImportSize(source) {
    // Estimate bundle size impact (very rough approximation)
    if (source.startsWith('.')) return 100; // Local file ~100 bytes
    
    const heavyPackages = ['lodash', 'moment', 'react', 'vue', 'angular'];
    const mediumPackages = ['axios', 'express', 'redux', 'mobx'];
    
    if (heavyPackages.some(pkg => source.includes(pkg))) return 50000; // ~50KB
    if (mediumPackages.some(pkg => source.includes(pkg))) return 20000; // ~20KB
    
    return 5000; // Default ~5KB
  }

  detectCircularDependencies() {
    const circular = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (file, path = []) => {
      if (recursionStack.has(file)) {
        // Found circular dependency
        const cycleStart = path.indexOf(file);
        const cycle = path.slice(cycleStart).concat([file]);
        circular.push({
          cycle,
          length: cycle.length - 1,
          severity: cycle.length > 3 ? 'HIGH' : 'MEDIUM'
        });
        return;
      }
      
      if (visited.has(file)) return;
      
      visited.add(file);
      recursionStack.add(file);
      
      const fileData = this.projectGraph.get(file);
      if (fileData) {
        for (const importData of fileData.imports) {
          if (importData.source.startsWith('.')) {
            const resolvedPath = this.resolveRelativeImport(file, importData.source);
            if (resolvedPath && this.projectGraph.has(resolvedPath)) {
              dfs(resolvedPath, [...path, file]);
            }
          }
        }
      }
      
      recursionStack.delete(file);
    };
    
    for (const file of this.projectGraph.keys()) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }
    
    return circular;
  }

  resolveRelativeImport(fromFile, importPath) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, importPath);
    
    // Try different extensions
    for (const ext of this.supportedExtensions) {
      const withExt = resolved + ext;
      if (this.projectGraph.has(withExt)) {
        return withExt;
      }
    }
    
    // Try index files
    for (const ext of this.supportedExtensions) {
      const indexFile = path.join(resolved, `index${ext}`);
      if (this.projectGraph.has(indexFile)) {
        return indexFile;
      }
    }
    
    return null;
  }

  async analyzePackageJson(projectPath) {
    const packagePath = path.join(projectPath, 'package.json');
    
    if (!(await fs.pathExists(packagePath))) {
      return {
        totalPackages: 0,
        unusedPackages: [],
        devDependencies: [],
        potentialSavings: 0
      };
    }
    
    const packageData = await fs.readJson(packagePath);
    const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
    const usedPackages = new Set();
    
    // Collect all imported packages
    for (const [file, data] of this.projectGraph) {
      for (const importData of data.imports) {
        if (!importData.source.startsWith('.')) {
          const packageName = this.extractPackageName(importData.source);
          usedPackages.add(packageName);
        }
      }
    }
    
    const unusedPackages = [];
    let potentialSavings = 0;
    
    for (const [packageName, version] of Object.entries(dependencies)) {
      if (!usedPackages.has(packageName)) {
        const estimatedSize = this.estimatePackageSize(packageName);
        unusedPackages.push({
          name: packageName,
          version,
          estimatedSize,
          isDev: !!packageData.devDependencies?.[packageName]
        });
        potentialSavings += estimatedSize;
      }
    }
    
    return {
      totalPackages: Object.keys(dependencies).length,
      unusedPackages,
      devDependencies: Object.keys(packageData.devDependencies || {}),
      potentialSavings
    };
  }

  extractPackageName(importPath) {
    if (importPath.startsWith('@')) {
      // Scoped package
      const parts = importPath.split('/');
      return `${parts[0]}/${parts[1]}`;
    } else {
      // Regular package
      return importPath.split('/')[0];
    }
  }

  estimatePackageSize(packageName) {
    // Very rough estimates based on common packages
    const sizeMap = {
      'lodash': 70000,
      'moment': 67000,
      'react': 42000,
      'vue': 35000,
      'angular': 130000,
      'express': 25000,
      'axios': 15000,
      'redux': 8000,
      'mobx': 20000
    };
    
    return sizeMap[packageName] || 10000; // Default 10KB
  }

  /**
   * Clean unused imports from project
   */
  async cleanUnusedImports(projectPath, options = {}) {
    const {
      removeUnused = true,
      consolidateDuplicates = true,
      dryRun = false,
      excludePackages = [],
      minimumSavings = 1000 // Only remove if saves at least 1KB
    } = options;
    
    const analysis = await this.analyzeImports(projectPath);
    const cleanupPlan = this.createCleanupPlan(analysis, options);
    
    if (dryRun) {
      return {
        dryRun: true,
        analysis,
        cleanupPlan,
        totalRemovals: cleanupPlan.totalRemovals,
        estimatedSavings: cleanupPlan.estimatedSavings,
        message: `Would remove ${cleanupPlan.totalRemovals} unused imports (saving ~${Math.round(cleanupPlan.estimatedSavings/1000)}KB)`
      };
    }
    
    // Execute cleanup
    const cleanupResults = await this.executeCleanup(cleanupPlan);
    
    return {
      analysis,
      cleanupResults,
      totalRemoved: cleanupResults.totalRemoved,
      actualSavings: cleanupResults.actualSavings,
      message: `Cleaned ${cleanupResults.totalRemoved} unused imports (saved ~${Math.round(cleanupResults.actualSavings/1000)}KB)`
    };
  }

  createCleanupPlan(analysis, options) {
    const plan = {
      filesToProcess: new Map(),
      totalRemovals: 0,
      estimatedSavings: 0
    };
    
    // Plan unused import removals
    if (options.removeUnused) {
      analysis.unusedImports
        .filter(item => item.estimatedSavings >= options.minimumSavings)
        .filter(item => !options.excludePackages.includes(item.source))
        .forEach(item => {
          this.addToCleanupPlan(plan, item.file, 'unused_import', item);
          plan.estimatedSavings += item.estimatedSavings;
        });
    }
    
    // Plan duplicate consolidation
    if (options.consolidateDuplicates) {
      analysis.duplicateImports.forEach(item => {
        this.addToCleanupPlan(plan, item.file, 'duplicate_import', item);
      });
    }
    
    return plan;
  }

  addToCleanupPlan(plan, filePath, type, item) {
    if (!plan.filesToProcess.has(filePath)) {
      plan.filesToProcess.set(filePath, {
        path: filePath,
        cleanups: []
      });
    }
    
    plan.filesToProcess.get(filePath).cleanups.push({
      type,
      item
    });
    
    plan.totalRemovals++;
  }

  async executeCleanup(cleanupPlan) {
    const results = {
      filesModified: 0,
      totalRemoved: 0,
      actualSavings: 0,
      errors: []
    };
    
    for (const [filePath, fileData] of cleanupPlan.filesToProcess) {
      try {
        const { modified, savings } = await this.processFileCleanup(filePath, fileData.cleanups);
        if (modified) {
          results.filesModified++;
          results.totalRemoved += fileData.cleanups.length;
          results.actualSavings += savings;
        }
      } catch (error) {
        results.errors.push({
          file: filePath,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async processFileCleanup(filePath, cleanups) {
    const content = await fs.readFile(filePath, 'utf8');
    let modifiedContent = content;
    let savings = 0;
    
    // Process cleanups (unused imports first, then duplicates)
    const sortedCleanups = cleanups.sort((a, b) => a.type === 'unused_import' ? -1 : 1);
    
    for (const cleanup of sortedCleanups) {
      if (cleanup.type === 'unused_import') {
        const { item } = cleanup;
        modifiedContent = this.removeUnusedImport(modifiedContent, item.import);
        savings += item.estimatedSavings;
      } else if (cleanup.type === 'duplicate_import') {
        modifiedContent = this.consolidateDuplicateImports(modifiedContent, cleanup.item);
      }
    }
    
    const modified = content !== modifiedContent;
    
    if (modified) {
      await fs.writeFile(filePath, modifiedContent, 'utf8');
    }
    
    return { modified, savings };
  }

  removeUnusedImport(content, importStatement) {
    // Remove the entire import line
    const escaped = importStatement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^.*${escaped}.*$`, 'gm');
    return content.replace(regex, '').replace(/\n\n+/g, '\n\n');
  }

  consolidateDuplicateImports(content, duplicateInfo) {
    // This is a simplified consolidation - just remove one of the duplicates
    const [first, second] = duplicateInfo.imports;
    return this.removeUnusedImport(content, second);
  }

  getCodeFiles(projectPath) {
    const patterns = this.supportedExtensions.map(ext => `**/*${ext}`);
    const globPattern = `**/*.{${this.supportedExtensions.map(e => e.slice(1)).join(',')}}`;
    
    return glob.sync(globPattern, {
      cwd: projectPath,
      ignore: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.next/**',
        '.nuxt/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      absolute: true
    });
  }

  /**
   * Generate snarky import analysis report
   */
  async generateSnarkyReport(projectPath) {
    const analysis = await this.analyzeImports(projectPath);
    
    let report = `📦 **IMPORT CLEANER ASSESSMENT**\n\n`;
    report += `📁 **PROJECT**: ${path.basename(projectPath)}\n`;
    report += `📊 **FILES ANALYZED**: ${analysis.totalFiles}\n`;
    report += `🎯 **TOTAL IMPORT ISSUES**: ${analysis.totalIssues}\n\n`;
    
    if (analysis.totalIssues === 0) {
      report += `✅ **IMPORT PERFECTION ACHIEVED!**\n`;
      report += `Your imports are cleaner than a medical operating room. Nothing to optimize here.\n`;
      return report;
    }
    
    // Unused imports
    if (analysis.unusedImports.length > 0) {
      const totalSavings = analysis.unusedImports.reduce((sum, imp) => sum + imp.estimatedSavings, 0);
      report += `🗑️  **UNUSED IMPORTS**: ${analysis.unusedImports.length} imports going to waste\n`;
      report += `   💰 Potential savings: ~${Math.round(totalSavings/1000)}KB\n`;
      report += `   💸 You're importing stuff you don't even use!\n`;
    }
    
    // Circular dependencies
    if (analysis.circularDependencies.length > 0) {
      report += `🔄 **CIRCULAR DEPENDENCIES**: ${analysis.circularDependencies.length} dependency loops\n`;
      const highSeverity = analysis.circularDependencies.filter(c => c.severity === 'HIGH').length;
      if (highSeverity > 0) {
        report += `   🚨 ${highSeverity} high-severity circular dependencies\n`;
      }
      report += `   🌀 Your modules are playing ring-around-the-rosie\n`;
    }
    
    // Duplicate imports
    if (analysis.duplicateImports.length > 0) {
      report += `📋 **DUPLICATE IMPORTS**: ${analysis.duplicateImports.length} redundant imports\n`;
      report += `   🤦 Importing the same thing multiple times? Really?\n`;
    }
    
    // Package analysis
    if (analysis.packageAnalysis.unusedPackages.length > 0) {
      const savings = Math.round(analysis.packageAnalysis.potentialSavings / 1000);
      report += `📦 **UNUSED PACKAGES**: ${analysis.packageAnalysis.unusedPackages.length} packages collecting dust\n`;
      report += `   💰 Bundle size savings: ~${savings}KB\n`;
      report += `   📦 Clean up your package.json, it's not a hoarding contest\n`;
    }
    
    report += `\n🧹 **CLEANUP RECOMMENDATIONS**:\n`;
    report += `   🗑️  Use 'import-cleaner clean --dry-run' to see what can be removed\n`;
    report += `   ⚡ Use 'import-cleaner clean' to eliminate unused imports\n`;
    report += `   🔄 Review circular dependencies manually - they need architect-level attention\n`;
    
    // Show worst offenders
    const fileStats = this.calculateImportStats(analysis);
    if (fileStats.length > 0) {
      report += `\n🏆 **WORST IMPORT OFFENDERS**:\n`;
      fileStats.slice(0, 5).forEach((stat, index) => {
        report += `   ${index + 1}. ${path.basename(stat.file)}: ${stat.issues} import issues\n`;
      });
    }
    
    return report;
  }

  calculateImportStats(analysis) {
    const fileMap = new Map();
    
    const allIssues = [
      ...analysis.unusedImports,
      ...analysis.duplicateImports
    ];
    
    allIssues.forEach(issue => {
      const file = issue.file;
      if (!fileMap.has(file)) {
        fileMap.set(file, { file, issues: 0 });
      }
      fileMap.get(file).issues++;
    });
    
    return Array.from(fileMap.values())
      .sort((a, b) => b.issues - a.issues);
  }
}

module.exports = { ImportCleaner }; 