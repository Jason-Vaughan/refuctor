const fs = require('fs-extra');
const path = require('path');

// Color utilities for console output
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};
const glob = require('glob');
const moment = require('moment');
const { techDebtManager } = require('./techdebt-manager');
const { DebtIgnoreParser } = require('./debt-ignore-parser');
const SnarkySpellHandler = require('./snarky-spell-handler');

/**
 * Refuctor Automated Setup Wizard
 * Comprehensive project analysis and debt management infrastructure setup
 */
class SetupWizard {
  constructor() {
    this.projectAnalysis = null;
    this.setupResults = {
      techDebtCreated: false,
      spellCheckSetup: false,
      debtIgnoreCreated: false,
      workspaceConfigured: false,
      configsGenerated: []
    };
  }

  /**
   * Run the complete automated setup wizard
   * @param {string} projectPath - Path to project root
   * @param {Object} options - Setup options
   * @returns {Object} Setup results
   */
  async runSetupWizard(projectPath, options = {}) {
    this.projectAnalysis = await this.analyzeProject(projectPath);
    this.displayProjectAnalysis();

    await this.generateConfigurations(projectPath, options);

    await this.setupSpellChecking(projectPath, options);

    await this.setupDebtIgnore(projectPath, options);

    await this.setupIDEIntegration(projectPath, options);

    await this.setupTechDebtTracking(projectPath, options);

    return this.setupResults;
  }

  /**
   * Analyze project structure and detect frameworks/configurations
   * @param {string} projectPath - Path to project root
   * @returns {Object} Project analysis results
   */
  async analyzeProject(projectPath) {
    const analysis = {
      projectName: path.basename(projectPath),
      projectType: 'unknown',
      frameworks: [],
      languages: [],
      configs: [],
      files: {
        total: 0,
        code: [],
        docs: [],
        configs: []
      },
      hasGit: false,
      hasPackageJson: false,
      hasReadme: false,
      buildTools: [],
      dependencies: []
    };

    try {
      // Basic file detection
      const allFiles = glob.sync('**/*', { 
        cwd: projectPath, 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        nodir: true
      });

      analysis.files.total = allFiles.length;

      // Categorize files
      const codeFiles = allFiles.filter(file => /\.(js|ts|jsx|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|kt)$/i.test(file));
      const docFiles = allFiles.filter(file => /\.(md|rst|txt|doc|docx|pdf)$/i.test(file));
      const configFiles = allFiles.filter(file => /\.(json|yml|yaml|toml|ini|conf|config|xml)$/i.test(file));

      analysis.files.code = codeFiles;
      analysis.files.docs = docFiles;
      analysis.files.configs = configFiles;

      // Detect languages
      const jsFiles = codeFiles.filter(f => /\.(js|jsx)$/i.test(f));
      const tsFiles = codeFiles.filter(f => /\.(ts|tsx)$/i.test(f));
      const pyFiles = codeFiles.filter(f => /\.py$/i.test(f));
      const mdFiles = docFiles.filter(f => /\.md$/i.test(f));

      if (jsFiles.length > 0) analysis.languages.push('JavaScript');
      if (tsFiles.length > 0) analysis.languages.push('TypeScript');
      if (pyFiles.length > 0) analysis.languages.push('Python');
      if (mdFiles.length > 0) analysis.languages.push('Markdown');

      // Check for key files
      analysis.hasGit = await fs.pathExists(path.join(projectPath, '.git'));
      analysis.hasPackageJson = await fs.pathExists(path.join(projectPath, 'package.json'));
      analysis.hasReadme = allFiles.some(f => /^readme\.(md|txt|rst)$/i.test(f));

      // Analyze package.json if exists
      if (analysis.hasPackageJson) {
        try {
          const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
          analysis.projectName = packageJson.name || analysis.projectName;
          
          // Detect frameworks and build tools
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          if (deps.react || deps['@types/react']) {
            analysis.frameworks.push('React');
          }
          if (deps.vue || deps['@vue/cli']) {
            analysis.frameworks.push('Vue');
          }
          if (deps.angular || deps['@angular/cli']) {
            analysis.frameworks.push('Angular');
          }
          if (deps.next || deps.nuxt) {
            analysis.frameworks.push('Next.js/Nuxt');
          }
          if (deps.express || deps.fastify || deps.koa) {
            analysis.frameworks.push('Node.js Backend');
          }
          if (deps.webpack) {
            analysis.buildTools.push('Webpack');
          }
          if (deps.vite) {
            analysis.buildTools.push('Vite');
          }
          if (deps.parcel) {
            analysis.buildTools.push('Parcel');
          }
          if (deps.rollup) {
            analysis.buildTools.push('Rollup');
          }

          analysis.dependencies = Object.keys(deps);
        } catch (error) {
          console.warn('Warning: Could not parse package.json');
        }
      }

      // Detect config files
      const configFilePatterns = [
        '.eslintrc*', 'eslint.config.*',
        '.prettierrc*', 'prettier.config.*',
        'tsconfig.json', 'jsconfig.json',
        'webpack.config.*', 'vite.config.*',
        '.babelrc*', 'babel.config.*',
        'jest.config.*', 'vitest.config.*',
        'tailwind.config.*', 'postcss.config.*'
      ];

      for (const pattern of configFilePatterns) {
        const matches = glob.sync(pattern, { cwd: projectPath });
        if (matches.length > 0) {
          analysis.configs.push(...matches);
        }
      }

      // Determine project type
      if (analysis.frameworks.includes('React')) {
        analysis.projectType = 'React App';
      } else if (analysis.frameworks.includes('Vue')) {
        analysis.projectType = 'Vue App';
      } else if (analysis.frameworks.includes('Angular')) {
        analysis.projectType = 'Angular App';
      } else if (analysis.frameworks.includes('Node.js Backend')) {
        analysis.projectType = 'Node.js Server';
      } else if (analysis.languages.includes('TypeScript')) {
        analysis.projectType = 'TypeScript Project';
      } else if (analysis.languages.includes('JavaScript')) {
        analysis.projectType = 'JavaScript Project';
      } else if (analysis.languages.includes('Python')) {
        analysis.projectType = 'Python Project';
      } else if (analysis.files.docs.length > analysis.files.code.length) {
        analysis.projectType = 'Documentation Project';
      }

    } catch (error) {
      console.warn(`Project analysis warning: ${error.message}`);
    }

    return analysis;
  }

  /**
   * Display project analysis results
   */
  displayProjectAnalysis() {
    const analysis = this.projectAnalysis;
    
    console.log(`   📁 Files: ${analysis.files.total} total (${analysis.files.code.length} code, ${analysis.files.docs.length} docs)`);
    console.log(`   💬 Languages: ${analysis.languages.join(', ') || 'None detected'}`);
    console.log(`   🚀 Frameworks: ${analysis.frameworks.join(', ') || 'None detected'}`);
    console.log(`   🔧 Build Tools: ${analysis.buildTools.join(', ') || 'None detected'}`);
  }

  /**
   * Generate project-specific configurations
   */
  async generateConfigurations(projectPath, options) {
    // This is a placeholder for future config generation
    // Could include .cursorrules, .gitignore enhancements, etc.
    console.log('   📝 Configuration generation (future enhancement)');
  }

  /**
   * Setup intelligent spell checking with project-specific dictionary
   */
  async setupSpellChecking(projectPath, options) {
    try {
      const spellHandler = new SnarkySpellHandler();
      const configPath = path.join(projectPath, 'cspell.json');
      
      // Create base config if doesn't exist
      if (!await fs.pathExists(configPath)) {
        const projectSpecificWords = this.generateProjectSpecificWords();
        await spellHandler.updateProjectDictionary(projectPath, projectSpecificWords);
        
        this.setupResults.spellCheckSetup = true;
        this.setupResults.configsGenerated.push('cspell.json');
      } else {
        console.log(colors.gray('   📝 Spell check setup skipped (cspell.json already exists)'));
      }
      
    } catch (error) {
      console.error(colors.red(`❌ Spell check setup failed: ${error.message}`));
      this.setupResults.errors.push(`Spell check setup: ${error.message}`);
    }
  }

  /**
   * Setup debt ignore patterns based on project analysis
   */
  async setupDebtIgnore(projectPath, options) {
    try {
      const ignoreParser = new DebtIgnoreParser();
      const ignoreFilePath = path.join(projectPath, '.debtignore');
      
      if (!await fs.pathExists(ignoreFilePath)) {
        // Get base patterns
        const basePatterns = DebtIgnoreParser.getSampleContent();
        
        // Add project-specific patterns
        const projectPatterns = this.generateProjectSpecificIgnorePatterns();
        const combinedPatterns = basePatterns + '\n# Project-specific patterns\n' + projectPatterns.join('\n');
        
        await fs.writeFile(ignoreFilePath, combinedPatterns, 'utf8');
        
        this.setupResults.debtIgnoreCreated = true;
        this.setupResults.configsGenerated.push('.debtignore');
      } else {
        console.log(colors.gray('   🚫 Debt ignore setup skipped (.debtignore already exists)'));
      }
      
    } catch (error) {
      console.error(colors.red(`❌ Debt ignore setup failed: ${error.message}`));
      this.setupResults.errors.push(`Debt ignore setup: ${error.message}`);
    }
  }

  /**
   * Setup IDE integration (Cursor workspace configuration)
   */
  async setupIDEIntegration(projectPath, options) {
    try {
      // Check if this is a Cursor workspace
      const workspaceFile = glob.sync('*.code-workspace', { cwd: projectPath })[0];
      
      if (workspaceFile) {
        console.log('   💻 IDE integration ready (workspace detected)');
        this.setupResults.workspaceConfigured = true;
      } else {
        console.log(colors.gray('   💻 IDE integration setup skipped (no workspace file found)'));
      }
      
    } catch (error) {
      console.error(colors.red(`❌ IDE integration setup failed: ${error.message}`));
      this.setupResults.errors.push(`IDE integration setup: ${error.message}`);
    }
  }

  /**
   * Setup TECHDEBT.md with project-specific context
   */
  async setupTechDebtTracking(projectPath, options) {
    try {
      const result = await techDebtManager.initializeProject(projectPath, options.force);
      
      if (result.created) {
        // Enhance the TECHDEBT.md with project-specific context
        await this.enhanceTechDebtWithContext(projectPath);
        
        this.setupResults.techDebtCreated = true;
      } else if (result.exists) {
        console.log(colors.gray('   📋 Tech debt tracking setup skipped (TECHDEBT.md already exists)'));
      }
      
    } catch (error) {
      console.error(colors.red(`❌ Tech debt tracking setup failed: ${error.message}`));
      this.setupResults.errors.push(`Tech debt tracking setup: ${error.message}`);
    }
  }

  /**
   * Generate project-specific dictionary words
   */
  generateProjectSpecificWords() {
    const words = ['refuctor', 'refuctoring', 'techdebt']; // Base Refuctor terms
    
    // Add project-specific terms based on analysis
    if (this.projectAnalysis.frameworks.includes('React')) {
      words.push('jsx', 'tsx', 'useState', 'useEffect', 'componentDidMount');
    }
    if (this.projectAnalysis.frameworks.includes('Vue')) {
      words.push('vuex', 'nuxt', 'vue-router');
    }
    if (this.projectAnalysis.languages.includes('TypeScript')) {
      words.push('tsconfig', 'typeof', 'readonly', 'keyof');
    }
    if (this.projectAnalysis.buildTools.includes('Webpack')) {
      words.push('webpack', 'bundler', 'loaders');
    }
    if (this.projectAnalysis.buildTools.includes('Vite')) {
      words.push('vite', 'esm', 'hmr');
    }
    
    // Add project name as valid word
    if (this.projectAnalysis.projectName) {
      words.push(this.projectAnalysis.projectName.toLowerCase());
    }
    
    return words;
  }

  /**
   * Generate project-specific ignore patterns
   */
  generateProjectSpecificIgnorePatterns() {
    const patterns = [];
    
    // Add patterns based on detected frameworks and build tools
    if (this.projectAnalysis.frameworks.includes('React')) {
      patterns.push('build/**', 'dist/**', '.next/**');
    }
    if (this.projectAnalysis.frameworks.includes('Vue')) {
      patterns.push('dist/**', '.nuxt/**');
    }
    if (this.projectAnalysis.buildTools.includes('Webpack')) {
      patterns.push('dist/**', 'build/**');
    }
    if (this.projectAnalysis.buildTools.includes('Vite')) {
      patterns.push('dist/**', '.vite/**');
    }
    if (this.projectAnalysis.languages.includes('TypeScript')) {
      patterns.push('*.d.ts', 'lib/**');
    }
    
    // Add common patterns for detected project types
    if (this.projectAnalysis.projectType === 'Node.js Server') {
      patterns.push('logs/**', 'tmp/**', 'uploads/**');
    }
    if (this.projectAnalysis.projectType === 'Documentation Project') {
      patterns.push('_site/**', '.jekyll-cache/**');
    }
    
    return patterns;
  }

  /**
   * Enhance TECHDEBT.md with project-specific context
   */
  async enhanceTechDebtWithContext(projectPath) {
    const techDebtPath = path.join(projectPath, 'TECHDEBT.md');
    
    try {
      let content = await fs.readFile(techDebtPath, 'utf8');
      
      // Add project-specific context section
      const projectContext = `
## 🏗️ Project Context (Auto-Generated)

**Project Type**: ${this.projectAnalysis.projectType}
**Languages**: ${this.projectAnalysis.languages.join(', ')}
**Frameworks**: ${this.projectAnalysis.frameworks.join(', ') || 'None detected'}
**Build Tools**: ${this.projectAnalysis.buildTools.join(', ') || 'None detected'}
**Total Files**: ${this.projectAnalysis.files.total} (${this.projectAnalysis.files.code.length} code files)
**Setup Date**: ${moment().format('YYYY-MM-DD HH:mm:ss')}

### 🎯 Project-Specific Debt Monitoring

${this.generateProjectSpecificDebtMonitoring()}

---
`;
      
      // Insert project context after the philosophy section
      const philosophyEnd = content.indexOf('## 🚨 Active Debt');
      if (philosophyEnd > -1) {
        content = content.slice(0, philosophyEnd) + projectContext + content.slice(philosophyEnd);
        await fs.writeFile(techDebtPath, content, 'utf8');
      }
      
    } catch (error) {
      console.warn(`Could not enhance TECHDEBT.md: ${error.message}`);
    }
  }

  /**
   * Generate project-specific debt monitoring recommendations
   */
  generateProjectSpecificDebtMonitoring() {
    const recommendations = [];
    
    if (this.projectAnalysis.languages.includes('JavaScript') || this.projectAnalysis.languages.includes('TypeScript')) {
      recommendations.push('- **Console.log Detection**: Monitor for forgotten console.log statements');
      recommendations.push('- **ESLint Integration**: Ensure ESLint rules are properly configured');
    }
    
    if (this.projectAnalysis.frameworks.includes('React')) {
      recommendations.push('- **React Hooks**: Watch for improper dependency arrays and lifecycle issues');
      recommendations.push('- **Component Complexity**: Monitor component size and prop drilling');
    }
    
    if (this.projectAnalysis.hasPackageJson) {
      recommendations.push('- **Dependency Audit**: Regular `npm audit` for security vulnerabilities');
      recommendations.push('- **Bundle Size**: Monitor for unnecessary dependencies bloating bundle');
    }
    
    if (this.projectAnalysis.files.docs.length > 0) {
      recommendations.push('- **Documentation Drift**: Ensure docs stay current with code changes');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- **General Monitoring**: Follow standard debt detection practices');
    }
    
    return recommendations.join('\n');
  }
}

module.exports = SetupWizard; 