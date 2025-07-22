/**
 * The Accountant - Debt Interest Calculator & Credit Rating System
 * 
 * This goon handles the financial aspects of technical debt:
 * - Developer credit rating system (300-850 score)
 * - Interest rate calculations based on coding behavior
 * - Payment history tracking
 * - Debt-to-income ratio analysis
 * - ROI calculations for debt cleanup
 */

const fs = require('fs-extra');
const path = require('path');
const { DebtDetector } = require('../debt-detector');

class Accountant {
  constructor() {
    this.debtDetector = new DebtDetector();
    this.creditHistory = new Map();
    this.interestRates = {
      PRIME_DEVELOPER: 2.5,      // 2.5% APR - Clean coder
      STANDARD: 8.9,             // 8.9% APR - Average developer
      SUBPRIME: 15.9,            // 15.9% APR - Messy coder
      VIBE_CODER: 24.9           // 24.9% APR - Chaotic evil
    };
  }

  /**
   * Calculate developer credit score (300-850)
   * ENHANCED: Context-aware algorithm that recognizes project maturity and debt context
   * Algorithm: Code quality (40%), payment history (35%), debt load (15%), patterns (10%)
   */
  async calculateCreditScore(projectPath) {
    const metrics = await this.gatherCreditMetrics(projectPath);
    
    // NEW: Analyze project maturity and context
    const projectContext = await this.analyzeProjectContext(projectPath, metrics);
    
    // Code Quality Score (40% weight) - Now context-aware
    const codeQualityScore = this.calculateContextAwareCodeQualityScore(metrics, projectContext);
    
    // Payment History Score (35% weight)
    const paymentHistoryScore = this.calculatePaymentHistoryScore(metrics);
    
    // Debt Load Score (15% weight) - Fixed scoring logic
    const debtLoadScore = this.calculateFixedDebtLoadScore(metrics, projectContext);
    
    // Pattern Recognition Score (10% weight) - Enhanced with project maturity
    const patternScore = this.calculateEnhancedPatternScore(metrics, projectContext);
    
    // Weighted calculation
    const rawScore = (
      (codeQualityScore * 0.40) +
      (paymentHistoryScore * 0.35) +
      (debtLoadScore * 0.15) +
      (patternScore * 0.10)
    );
    
    // Convert to 300-850 scale
    const creditScore = Math.round(300 + (rawScore / 100) * 550);
    
    return {
      score: Math.max(300, Math.min(850, creditScore)),
      breakdown: {
        codeQuality: Math.round(codeQualityScore),
        paymentHistory: Math.round(paymentHistoryScore),
        debtLoad: Math.round(debtLoadScore),
        patterns: Math.round(patternScore)
      },
      classification: this.classifyDeveloper(creditScore),
      interestRate: this.calculateInterestRate(creditScore),
      projectContext, // Include context for transparency
      metrics
    };
  }

  async gatherCreditMetrics(projectPath) {
    const scanResult = await this.debtDetector.scanProject(projectPath, true);
    const historyPath = path.join(projectPath, '.refuctor', 'credit-history.json');
    
    let creditHistory = {};
    if (await fs.pathExists(historyPath)) {
      try {
        creditHistory = await fs.readJson(historyPath);
      } catch (error) {
        console.warn('Warning: Could not read credit history, starting fresh');
      }
    }
    
    return {
      currentDebt: scanResult,
      totalDebt: scanResult.totalDebt,
      p1Count: scanResult.p1.length,
      p2Count: scanResult.p2.length,
      p3Count: scanResult.p3.length,
      p4Count: scanResult.p4.length,
      creditHistory,
      projectPath,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENHANCED: Analyze project context and maturity indicators
   * Now detects: cursor rules, code docs, testing, CI/CD, architecture quality, etc.
   */
  async analyzeProjectContext(projectPath, metrics) {
    const context = {
      maturityIndicators: [],
      excellenceScore: 0,
      debtCategories: {
        development: 0,
        documentation: 0,
        critical: 0,
        maintenance: 0
      },
      projectType: 'unknown',
      qualityIndicators: {
        documentation: 0,
        architecture: 0,
        tooling: 0,
        testing: 0,
        cicd: 0
      }
    };

    try {
      // === DOCUMENTATION EXCELLENCE ===
      
      // Check for comprehensive roadmap/planning
      const roadmapFiles = ['REFUCTOR_ROADMAP.md', 'ROADMAP.md', 'PROJECT_ROADMAP.md'];
      for (const roadmapFile of roadmapFiles) {
        const roadmapPath = path.join(projectPath, roadmapFile);
        if (await fs.pathExists(roadmapPath)) {
          try {
            const stats = await fs.stat(roadmapPath);
            if (stats.isFile()) {
              const roadmapContent = await fs.readFile(roadmapPath, 'utf8');
              if (roadmapContent.length > 500) {
                context.maturityIndicators.push('comprehensive-roadmap');
                context.excellenceScore += 25; // Major bonus for detailed planning
                context.qualityIndicators.documentation += 25;
                break;
              }
            }
          } catch (error) {
            // Skip files we can't read
            continue;
          }
        }
      }

      // Check for detailed README
      const readmeFiles = ['README.md', 'readme.md', 'Readme.md'];
      for (const readmeFile of readmeFiles) {
        const readmePath = path.join(projectPath, readmeFile);
        if (await fs.pathExists(readmePath)) {
          try {
            const stats = await fs.stat(readmePath);
            if (stats.isFile()) {
              const readmeContent = await fs.readFile(readmePath, 'utf8');
              if (readmeContent.length > 1000) {
                context.maturityIndicators.push('comprehensive-readme');
                context.excellenceScore += 20;
                context.qualityIndicators.documentation += 20;
              } else if (readmeContent.length > 300) {
                context.maturityIndicators.push('detailed-documentation');
                context.excellenceScore += 15;
                context.qualityIndicators.documentation += 15;
              }
              break;
            }
          } catch (error) {
            // Skip files we can't read
            continue;
          }
        }
      }

      // Check for active debt management
      const debtFiles = ['TECHDEBT.md', 'TECHNICAL_DEBT.md', 'DEBT.md'];
      for (const debtFile of debtFiles) {
        const debtPath = path.join(projectPath, debtFile);
        if (await fs.pathExists(debtPath)) {
          try {
            const stats = await fs.stat(debtPath);
            if (stats.isFile()) {
              const debtContent = await fs.readFile(debtPath, 'utf8');
              if (debtContent.length > 500) {
                context.maturityIndicators.push('active-debt-tracking');
                context.excellenceScore += 20; // Bonus for active debt management
                context.qualityIndicators.documentation += 20;
              }
              break;
            }
          } catch (error) {
            // Skip files we can't read
            continue;
          }
        }
      }

      // === CURSOR RULES & DEVELOPMENT TOOLING ===
      
      // Check for Cursor rules (multiple possible locations)
      const cursorRuleFiles = [
        '.cursorrules', 'cursorrules', '.cursor/rules', 
        'refuctorrulesclone.txt', 'cursor-rules.md', 'CURSOR_RULES.md'
      ];
      for (const ruleFile of cursorRuleFiles) {
        const rulePath = path.join(projectPath, ruleFile);
        if (await fs.pathExists(rulePath)) {
          try {
            const stats = await fs.stat(rulePath);
            if (stats.isFile()) {
              const ruleContent = await fs.readFile(rulePath, 'utf8');
              if (ruleContent.length > 200) {
                context.maturityIndicators.push('cursor-rules-defined');
                context.excellenceScore += 15; // Bonus for AI development standards
                context.qualityIndicators.tooling += 15;
                break;
              }
            }
          } catch (error) {
            // Skip files we can't read
            continue;
          }
        }
      }

      // Check for development configuration files
      const configFiles = [
        '.eslintrc.js', '.eslintrc.json', 'eslint.config.js',
        '.prettier.config.js', '.prettierrc', 'prettier.config.js',
        'tsconfig.json', 'jsconfig.json',
        '.gitignore', '.debtignore',
        'package.json'
      ];
      
      let configCount = 0;
      for (const configFile of configFiles) {
        if (await fs.pathExists(path.join(projectPath, configFile))) {
          configCount++;
        }
      }
      
      if (configCount >= 5) {
        context.maturityIndicators.push('comprehensive-tooling');
        context.excellenceScore += 15;
        context.qualityIndicators.tooling += 15;
      } else if (configCount >= 3) {
        context.maturityIndicators.push('standard-tooling');
        context.excellenceScore += 8;
        context.qualityIndicators.tooling += 8;
      }

      // === CODE DOCUMENTATION QUALITY ===
      
      // Analyze JavaScript/TypeScript files for documentation
      const codeFiles = [];
      if (await fs.pathExists(path.join(projectPath, 'src'))) {
        try {
          const srcFiles = await this.getCodeFiles(path.join(projectPath, 'src'));
          codeFiles.push(...srcFiles);
        } catch (error) {
          console.warn('Could not analyze src directory:', error.message);
        }
      }

      if (codeFiles.length > 0) {
        const docQuality = await this.analyzeCodeDocumentation(codeFiles);
        context.excellenceScore += docQuality.score;
        context.qualityIndicators.documentation += docQuality.score;
        
        if (docQuality.hasJSDoc) {
          context.maturityIndicators.push('jsdoc-documentation');
        }
        if (docQuality.wellCommented) {
          context.maturityIndicators.push('well-commented-code');
        }
      }

      // === TESTING & QUALITY ASSURANCE ===
      
      // Check for testing setup
      const testIndicators = [
        'test/', 'tests/', '__tests__/', 'spec/',
        'jest.config.js', 'vitest.config.js', 'test.config.js',
        'cypress.config.js', 'playwright.config.js'
      ];
      
      let testingScore = 0;
      for (const testPath of testIndicators) {
        if (await fs.pathExists(path.join(projectPath, testPath))) {
          testingScore += 5;
        }
      }
      
      if (testingScore >= 10) {
        context.maturityIndicators.push('comprehensive-testing');
        context.excellenceScore += 15;
        context.qualityIndicators.testing += 15;
      } else if (testingScore >= 5) {
        context.maturityIndicators.push('basic-testing');
        context.excellenceScore += 8;
        context.qualityIndicators.testing += 8;
      }

      // === CI/CD & AUTOMATION ===
      
      // Check for CI/CD configuration
      const cicdFiles = [
        '.github/workflows/', '.gitlab-ci.yml', 'Jenkinsfile',
        'azure-pipelines.yml', '.circleci/', 'Dockerfile',
        'docker-compose.yml', '.dockerignore'
      ];
      
      let cicdScore = 0;
      for (const cicdPath of cicdFiles) {
        if (await fs.pathExists(path.join(projectPath, cicdPath))) {
          cicdScore += 5;
        }
      }
      
      if (cicdScore >= 10) {
        context.maturityIndicators.push('advanced-cicd');
        context.excellenceScore += 12;
        context.qualityIndicators.cicd += 12;
      } else if (cicdScore >= 5) {
        context.maturityIndicators.push('basic-cicd');
        context.excellenceScore += 6;
        context.qualityIndicators.cicd += 6;
      }

      // === PROJECT ARCHITECTURE ===
      
      // Check for clean architecture indicators
      const architectureIndicators = [
        'src/', 'lib/', 'components/', 'services/', 'utils/',
        'types/', 'interfaces/', 'models/', 'controllers/',
        'middleware/', 'config/', 'constants/'
      ];
      
      let architectureScore = 0;
      for (const archPath of architectureIndicators) {
        if (await fs.pathExists(path.join(projectPath, archPath))) {
          architectureScore += 2;
        }
      }
      
      if (architectureScore >= 10) {
        context.maturityIndicators.push('excellent-architecture');
        context.excellenceScore += 15;
        context.qualityIndicators.architecture += 15;
      } else if (architectureScore >= 6) {
        context.maturityIndicators.push('organized-structure');
        context.excellenceScore += 10;
        context.qualityIndicators.architecture += 10;
      } else if (architectureScore >= 3) {
        context.maturityIndicators.push('basic-structure');
        context.excellenceScore += 5;
        context.qualityIndicators.architecture += 5;
      }

      // === ADDITIONAL QUALITY INDICATORS ===
      
      // Check for changelog/versioning
      const changelogFiles = ['CHANGELOG.md', 'HISTORY.md', 'RELEASES.md'];
      for (const changelogFile of changelogFiles) {
        if (await fs.pathExists(path.join(projectPath, changelogFile))) {
          context.maturityIndicators.push('version-tracking');
          context.excellenceScore += 8;
          context.qualityIndicators.documentation += 8;
          break;
        }
      }

      // Check for license
      const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
      for (const licenseFile of licenseFiles) {
        if (await fs.pathExists(path.join(projectPath, licenseFile))) {
          context.maturityIndicators.push('proper-licensing');
          context.excellenceScore += 5;
          context.qualityIndicators.documentation += 5;
          break;
        }
      }

      // Check for security files
      const securityFiles = ['SECURITY.md', '.github/SECURITY.md', 'SECURITY_POLICY.md'];
      for (const securityFile of securityFiles) {
        if (await fs.pathExists(path.join(projectPath, securityFile))) {
          context.maturityIndicators.push('security-documentation');
          context.excellenceScore += 8;
          context.qualityIndicators.documentation += 8;
          break;
        }
      }

      // === DEBT CATEGORIZATION (Enhanced) ===
      
      // Categorize debt by type (development vs. critical)
      if (metrics.currentDebt) {
        const allIssues = [
          ...metrics.currentDebt.p1,
          ...metrics.currentDebt.p2,
          ...metrics.currentDebt.p3,
          ...metrics.currentDebt.p4
        ];

        allIssues.forEach(issue => {
          if (issue.category === 'markdown' || issue.category === 'spelling') {
            context.debtCategories.documentation++;
          } else if (issue.rule?.includes('console') || issue.rule?.includes('debug')) {
            context.debtCategories.development++;
          } else if (issue.priority === 'P1' && !issue.rule?.includes('markdown')) {
            context.debtCategories.critical++;
          } else {
            context.debtCategories.maintenance++;
          }
        });
      }

      // === PROJECT TYPE CLASSIFICATION (Enhanced) ===
      
      const totalQualityScore = Object.values(context.qualityIndicators).reduce((a, b) => a + b, 0);
      
      if (context.maturityIndicators.length >= 6 && totalQualityScore >= 60) {
        context.projectType = 'enterprise-grade';
      } else if (context.maturityIndicators.length >= 4 && totalQualityScore >= 40) {
        context.projectType = 'well-managed';
      } else if (context.maturityIndicators.length >= 2 && totalQualityScore >= 20) {
        context.projectType = 'developing';
      } else {
        context.projectType = 'basic';
      }

    } catch (error) {
      console.warn('Warning: Could not analyze project context:', error.message);
    }

    return context;
  }

  /**
   * Helper: Get code files for documentation analysis
   */
  async getCodeFiles(dirPath) {
    const files = [];
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subFiles = await this.getCodeFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors, just return what we have
    }
    
    return files.slice(0, 20); // Limit to 20 files for performance
  }

  /**
   * Helper: Analyze code documentation quality
   */
  async analyzeCodeDocumentation(codeFiles) {
    let totalLines = 0;
    let commentLines = 0;
    let jsdocBlocks = 0;
    let functionsWithDocs = 0;
    let totalFunctions = 0;

    for (const filePath of codeFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        totalLines += lines.length;

        // Count comment lines and JSDoc blocks
        let inJSDocBlock = false;
        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('/**')) {
            inJSDocBlock = true;
            jsdocBlocks++;
            commentLines++;
          } else if (trimmed.startsWith('*/')) {
            inJSDocBlock = false;
            commentLines++;
          } else if (inJSDocBlock || trimmed.startsWith('//') || trimmed.startsWith('*')) {
            commentLines++;
          }
        }

        // Count functions and their documentation
        const functionMatches = content.match(/(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>|class\s+\w+)/g);
        if (functionMatches) {
          totalFunctions += functionMatches.length;
          
          // Simple heuristic: if there's a JSDoc block within 5 lines before a function
          const functionRegex = /(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>|class\s+\w+)/g;
          let match;
          while ((match = functionRegex.exec(content)) !== null) {
            const beforeFunction = content.substring(Math.max(0, match.index - 200), match.index);
            if (beforeFunction.includes('/**') && beforeFunction.includes('*/')) {
              functionsWithDocs++;
            }
          }
        }

      } catch (error) {
        // Skip files we can't read
        continue;
      }
    }

    const commentRatio = totalLines > 0 ? (commentLines / totalLines) : 0;
    const docRatio = totalFunctions > 0 ? (functionsWithDocs / totalFunctions) : 0;

    let score = 0;
    
    // Score based on comment density
    if (commentRatio >= 0.15) score += 15; // Well commented
    else if (commentRatio >= 0.10) score += 10; // Moderately commented
    else if (commentRatio >= 0.05) score += 5;  // Lightly commented

    // Score based on JSDoc usage
    if (jsdocBlocks >= 5) score += 10; // Good JSDoc usage
    else if (jsdocBlocks >= 2) score += 5; // Some JSDoc

    // Score based on function documentation
    if (docRatio >= 0.7) score += 10; // Most functions documented
    else if (docRatio >= 0.4) score += 5; // Many functions documented

    return {
      score: Math.min(score, 25), // Cap at 25 points
      hasJSDoc: jsdocBlocks >= 2,
      wellCommented: commentRatio >= 0.10,
      commentRatio,
      docRatio,
      stats: { totalLines, commentLines, jsdocBlocks, functionsWithDocs, totalFunctions }
    };
  }

  /**
   * ENHANCED: Context-aware code quality scoring
   * Now considers comprehensive project quality indicators
   */
  calculateContextAwareCodeQualityScore(metrics, projectContext) {
    const { totalDebt, p1Count, p2Count, p3Count, p4Count } = metrics;
    
    // Base score starts at 75 (more forgiving baseline)
    let score = 75;
    
    // Apply excellence bonuses FIRST (now much more comprehensive)
    score += projectContext.excellenceScore;
    
    // Additional bonuses for exceptional projects
    if (projectContext.projectType === 'enterprise-grade') {
      score += 20; // Major bonus for enterprise-grade projects
    } else if (projectContext.projectType === 'well-managed') {
      score += 15; // Bonus for well-managed projects
    } else if (projectContext.projectType === 'developing') {
      score += 8;
    }
    
    // Quality indicator bonuses
    const qualityBonus = Math.min(
      Object.values(projectContext.qualityIndicators).reduce((a, b) => a + b, 0) * 0.1, 
      15
    ); // Cap quality bonuses at 15 points
    score += qualityBonus;
    
    // Context-aware debt penalties
    const criticalDebt = projectContext.debtCategories.critical;
    const developmentDebt = projectContext.debtCategories.development;
    const documentationDebt = projectContext.debtCategories.documentation;
    
    // Critical issues get full penalty (but reduced for enterprise projects)
    const criticalPenalty = projectContext.projectType === 'enterprise-grade' ? 8 : 12;
    score -= criticalDebt * criticalPenalty;
    
    // Development debt gets reduced penalty (especially for well-managed projects)
    const devPenaltyMultiplier = projectContext.projectType === 'enterprise-grade' ? 0.3 : 
                                projectContext.projectType === 'well-managed' ? 0.5 : 0.7;
    score -= Math.min(developmentDebt * devPenaltyMultiplier, 30);
    
    // Documentation debt gets minimal penalty (even less for well-documented projects)
    const hasGoodDocs = projectContext.maturityIndicators.includes('comprehensive-readme') ||
                       projectContext.maturityIndicators.includes('jsdoc-documentation');
    const docPenalty = hasGoodDocs ? 0.1 : 0.2;
    score -= Math.min(documentationDebt * docPenalty, 15);
    
    // Moderate penalties for remaining debt
    score -= (p2Count - criticalDebt) * 4;   // Reduced from 8
    score -= p3Count * 2;   // Reduced from 3
    score -= p4Count * 0.5; // Reduced from 1
    
    // Bonus for clean code in well-managed projects
    if (totalDebt === 0) score += 25;  // Increased debt-free bonus
    if (criticalDebt === 0 && projectContext.projectType === 'well-managed') score += 15;
    if (criticalDebt === 0 && projectContext.projectType === 'enterprise-grade') score += 20;
    
    return Math.max(20, Math.min(100, score));
  }

  /**
   * ENHANCED: Debt load scoring with comprehensive project context
   * FIXED: Much more forgiving for well-managed projects with comprehensive tracking
   */
  calculateFixedDebtLoadScore(metrics, projectContext) {
    const { totalDebt } = metrics;
    
    // Start with base score
    let score = 100;
    
    // MAJOR INSIGHT: High debt count in a well-managed project = GOOD tracking, not bad management
    const hasExcellentTracking = projectContext.maturityIndicators.includes('active-debt-tracking') &&
                                projectContext.maturityIndicators.includes('comprehensive-roadmap');
    
    // Context-aware debt load assessment
    const criticalDebt = projectContext.debtCategories.critical;
    const developmentDebt = projectContext.debtCategories.development;
    const documentationDebt = projectContext.debtCategories.documentation;
    
    // Critical debt impacts score heavily (but less for well-managed projects)
    const criticalPenalty = projectContext.projectType === 'enterprise-grade' ? 4 : 
                           projectContext.projectType === 'well-managed' ? 6 : 8;
    score -= criticalDebt * criticalPenalty;
    
    // Development debt gets very light penalty for tracked projects
    const devPenalty = hasExcellentTracking ? 0.1 : 
                      projectContext.projectType === 'enterprise-grade' ? 0.2 : 0.3;
    score -= Math.min(developmentDebt * devPenalty, 15); // Reduced cap
    
    // Documentation debt gets almost no penalty for well-documented projects
    const docPenalty = projectContext.maturityIndicators.includes('comprehensive-readme') ? 0.05 : 0.1;
    score -= Math.min(documentationDebt * docPenalty, 5); // Very low cap
    
    // REVOLUTIONARY: Debt tracking bonuses (high debt = good tracking in managed projects)
    if (hasExcellentTracking && totalDebt > 500) {
      score += 20; // Major bonus for comprehensive debt tracking
    } else if (hasExcellentTracking && totalDebt > 100) {
      score += 15; // Good tracking bonus
    }
    
    // Total debt thresholds (MUCH more forgiving for managed projects)
    if (projectContext.projectType === 'enterprise-grade' || 
        (projectContext.projectType === 'well-managed' && hasExcellentTracking)) {
      // Extremely forgiving for enterprise/well-tracked projects
      if (totalDebt > 2000) score -= 5;  // Very light penalty even for huge debt
      if (totalDebt > 5000) score -= 15; // Still light for massive debt
    } else if (projectContext.projectType === 'well-managed') {
      // More forgiving thresholds for well-managed projects
      if (totalDebt > 500) score -= 10;
      if (totalDebt > 1000) score -= 20;
      if (totalDebt > 2000) score -= 30;
    } else {
      // Standard thresholds for other projects
      if (totalDebt > 10) score -= 10;
      if (totalDebt > 25) score -= 20;
      if (totalDebt > 50) score -= 30;
      if (totalDebt > 100) score -= 40;
    }
    
    // Enhanced bonuses for excellent debt management
    if (totalDebt === 0) score += 20;
    if (criticalDebt === 0) score += 15;
    if (projectContext.maturityIndicators.includes('active-debt-tracking')) score += 10;
    if (projectContext.maturityIndicators.includes('cursor-rules-defined')) score += 8;
    if (projectContext.maturityIndicators.includes('comprehensive-tooling')) score += 5;
    
    // Special bonus for projects that track debt comprehensively
    if (totalDebt > 1000 && criticalDebt < 10 && hasExcellentTracking) {
      score += 25; // Huge bonus for excellent debt categorization and tracking
    }
    
    return Math.max(30, Math.min(100, score)); // Raised minimum from 0 to 30
  }

  /**
   * ENHANCED: Pattern scoring with comprehensive project maturity consideration
   */
  calculateEnhancedPatternScore(metrics, projectContext) {
    const { creditHistory } = metrics;
    
    // Start with higher baseline for mature projects
    let score = 75; // Base score
    
    // Project type bonuses
    if (projectContext.projectType === 'enterprise-grade') {
      score = 90; // Very high baseline for enterprise projects
    } else if (projectContext.projectType === 'well-managed') {
      score = 85; // High baseline for well-managed projects
    } else if (projectContext.projectType === 'developing') {
      score = 80; // Good baseline for developing projects
    }
    
    // Comprehensive maturity indicator bonuses
    const maturityBonuses = {
      'comprehensive-roadmap': 10,
      'comprehensive-readme': 8,
      'active-debt-tracking': 8,
      'cursor-rules-defined': 6,
      'jsdoc-documentation': 5,
      'well-commented-code': 5,
      'comprehensive-testing': 8,
      'advanced-cicd': 6,
      'excellent-architecture': 8,
      'comprehensive-tooling': 5,
      'version-tracking': 4,
      'security-documentation': 4,
      'proper-licensing': 3
    };
    
    // Apply bonuses for each maturity indicator
    projectContext.maturityIndicators.forEach(indicator => {
      if (maturityBonuses[indicator]) {
        score += maturityBonuses[indicator];
      }
    });
    
    // Quality indicators bonus (capped)
    const totalQualityScore = Object.values(projectContext.qualityIndicators).reduce((a, b) => a + b, 0);
    score += Math.min(totalQualityScore * 0.05, 10); // Small bonus for overall quality
    
    // Historical pattern analysis (if available)
    if (creditHistory.patterns) {
      const patterns = creditHistory.patterns;
      if (patterns.frequentP1Issues) score -= 15;
      if (patterns.improvingTrend) score += 10;
      if (patterns.worseningTrend) score -= 10;
      if (patterns.consistentCleanup) score += 15;
      if (patterns.debtIgnoreAbuse) score -= 20;
    }
    
    return Math.max(50, Math.min(100, score));
  }

  // BACKWARD COMPATIBILITY: Keep original methods for legacy support
  calculateCodeQualityScore(metrics) {
    // Fallback to context-aware version with basic context
    const basicContext = {
      excellenceScore: 0,
      debtCategories: { critical: 0, development: 0, documentation: 0 },
      projectType: 'basic'
    };
    return this.calculateContextAwareCodeQualityScore(metrics, basicContext);
  }

  calculateDebtLoadScore(metrics) {
    // Fallback to fixed version with basic context
    const basicContext = {
      debtCategories: { critical: 0, development: 0, documentation: 0 },
      projectType: 'basic',
      maturityIndicators: []
    };
    return this.calculateFixedDebtLoadScore(metrics, basicContext);
  }

  calculatePatternScore(metrics) {
    // Fallback to enhanced version with basic context
    const basicContext = {
      projectType: 'basic',
      maturityIndicators: []
    };
    return this.calculateEnhancedPatternScore(metrics, basicContext);
  }

  calculatePaymentHistoryScore(metrics) {
    const { creditHistory } = metrics;
    
    if (!creditHistory.payments || creditHistory.payments.length === 0) {
      return 75; // New account, neutral score
    }
    
    const payments = creditHistory.payments.slice(-12); // Last 12 payments
    let score = 100;
    
    // Analyze payment patterns
    const totalPayments = payments.length;
    const onTimePayments = payments.filter(p => p.type === 'full' || p.type === 'partial').length;
    const missedPayments = payments.filter(p => p.type === 'missed').length;
    const latePayments = payments.filter(p => p.type === 'late').length;
    
    // Calculate payment ratio
    const onTimeRatio = onTimePayments / totalPayments;
    
    // Penalties for bad payment behavior
    score -= missedPayments * 12;  // Missed payments hurt badly
    score -= latePayments * 6;     // Late payments also hurt
    
    // Bonus for consistent payments
    if (onTimeRatio >= 0.95) score += 15;  // Excellent payment history
    if (onTimeRatio >= 0.85) score += 10;  // Good payment history
    
    return Math.max(0, Math.min(100, score));
  }

  classifyDeveloper(creditScore) {
    if (creditScore >= 750) return 'PRIME_DEVELOPER';
    if (creditScore >= 670) return 'STANDARD';
    if (creditScore >= 580) return 'SUBPRIME';
    return 'VIBE_CODER';
  }

  calculateInterestRate(creditScore) {
    const classification = this.classifyDeveloper(creditScore);
    return this.interestRates[classification];
  }

  /**
   * Generate financial debt report with credit rating
   */
  async generateFinancialReport(projectPath) {
    const creditReport = await this.calculateCreditScore(projectPath);
    const debtAnalysis = await this.analyzeDebtCosts(projectPath);
    
    return {
      creditScore: creditReport.score,
      classification: creditReport.classification,
      interestRate: creditReport.interestRate,
      breakdown: creditReport.breakdown,
      debtAnalysis,
      recommendations: this.generateRecommendations(creditReport, debtAnalysis),
      timestamp: new Date().toISOString()
    };
  }

  async analyzeDebtCosts(projectPath) {
    const scanResult = await this.debtDetector.scanProject(projectPath, true);
    
    // Calculate time costs
    const timeEstimates = {
      p1: 2.0,  // 2 hours per P1 issue
      p2: 1.0,  // 1 hour per P2 issue
      p3: 0.5,  // 30 minutes per P3 issue
      p4: 0.25  // 15 minutes per P4 issue
    };
    
    const estimatedHours = (
      (scanResult.p1.length * timeEstimates.p1) +
      (scanResult.p2.length * timeEstimates.p2) +
      (scanResult.p3.length * timeEstimates.p3) +
      (scanResult.p4.length * timeEstimates.p4)
    );
    
    const hourlyRate = 100; // $100/hour developer rate
    const estimatedCost = estimatedHours * hourlyRate;
    
    // Calculate compound interest on debt
    const monthlyInterestRate = this.calculateInterestRate(700) / 100 / 12; // Default to standard rate
    const monthsInDebt = 3; // Assume 3 months if no history
    const compoundedCost = estimatedCost * Math.pow(1 + monthlyInterestRate, monthsInDebt);
    
    return {
      totalDebt: scanResult.totalDebt,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      estimatedCost: Math.round(estimatedCost),
      compoundedCost: Math.round(compoundedCost),
      interestAccrued: Math.round(compoundedCost - estimatedCost),
      breakdown: {
        p1: { count: scanResult.p1.length, hours: scanResult.p1.length * timeEstimates.p1, cost: scanResult.p1.length * timeEstimates.p1 * hourlyRate },
        p2: { count: scanResult.p2.length, hours: scanResult.p2.length * timeEstimates.p2, cost: scanResult.p2.length * timeEstimates.p2 * hourlyRate },
        p3: { count: scanResult.p3.length, hours: scanResult.p3.length * timeEstimates.p3, cost: scanResult.p3.length * timeEstimates.p3 * hourlyRate },
        p4: { count: scanResult.p4.length, hours: scanResult.p4.length * timeEstimates.p4, cost: scanResult.p4.length * timeEstimates.p4 * hourlyRate }
      }
    };
  }

  generateRecommendations(creditReport, debtAnalysis) {
    const recommendations = [];
    
    // Credit score recommendations
    if (creditReport.score < 580) {
      recommendations.push({
        type: 'URGENT',
        category: 'Credit Repair',
        message: 'Your credit score is in the danger zone. Focus on fixing P1 critical issues immediately.',
        priority: 'HIGH',
        estimatedImpact: '+50-100 points'
      });
    }
    
    if (creditReport.breakdown.codeQuality < 50) {
      recommendations.push({
        type: 'IMPROVEMENT',
        category: 'Code Quality',
        message: 'Code quality is dragging down your score. Implement automated linting and fix formatting issues.',
        priority: 'MEDIUM',
        estimatedImpact: '+20-40 points'
      });
    }
    
    if (creditReport.breakdown.paymentHistory < 70) {
      recommendations.push({
        type: 'BEHAVIORAL',
        category: 'Payment History',
        message: 'Establish consistent debt cleanup sessions to improve payment history.',
        priority: 'MEDIUM',
        estimatedImpact: '+15-30 points'
      });
    }
    
    // Debt cost recommendations
    if (debtAnalysis.estimatedCost > 1000) {
      recommendations.push({
        type: 'FINANCIAL',
        category: 'Cost Control',
        message: `Your debt costs $${debtAnalysis.estimatedCost} to fix. Consider debt consolidation through refactoring.`,
        priority: 'HIGH',
        estimatedImpact: `Save $${debtAnalysis.interestAccrued} in interest`
      });
    }
    
    // Interest rate recommendations
    if (creditReport.interestRate > 15) {
      recommendations.push({
        type: 'RATE_REDUCTION',
        category: 'Interest Rate',
        message: `Your ${creditReport.interestRate}% APR is high. Improve your credit score to qualify for better rates.`,
        priority: 'MEDIUM',
        estimatedImpact: 'Potential 5-10% rate reduction'
      });
    }
    
    return recommendations;
  }

  /**
   * Record a debt payment (debt reduction action)
   */
  async recordPayment(projectPath, paymentType, debtReduced, details = {}) {
    const historyPath = path.join(projectPath, '.refuctor', 'credit-history.json');
    await fs.ensureDir(path.dirname(historyPath));
    
    let creditHistory = {};
    if (await fs.pathExists(historyPath)) {
      try {
        creditHistory = await fs.readJson(historyPath);
      } catch (error) {
        console.warn('Warning: Could not read credit history, starting fresh');
      }
    }
    
    if (!creditHistory.payments) {
      creditHistory.payments = [];
    }
    
    const payment = {
      timestamp: new Date().toISOString(),
      type: paymentType, // 'full', 'partial', 'minimum', 'late', 'missed'
      debtReduced,
      details,
      balanceAfter: details.balanceAfter || 0
    };
    
    creditHistory.payments.push(payment);
    
    // Keep only last 24 payments
    if (creditHistory.payments.length > 24) {
      creditHistory.payments = creditHistory.payments.slice(-24);
    }
    
    await fs.writeJson(historyPath, creditHistory, { spaces: 2 });
    
    return payment;
  }

  /**
   * Generate snarky financial report
   */
  async generateSnarkyFinancialReport(projectPath) {
    const report = await this.generateFinancialReport(projectPath);
    
    let snarkyReport = `💰 **THE ACCOUNTANT'S DEBT ASSESSMENT**\n\n`;
    
    // Credit Score Section
    snarkyReport += `📊 **DEVELOPER CREDIT SCORE**: ${report.creditScore}/850\n`;
    snarkyReport += `🏷️  **CLASSIFICATION**: ${this.getSnarkyClassification(report.classification)}\n`;
    snarkyReport += `💸 **INTEREST RATE**: ${report.interestRate}% APR ${this.getSnarkyRateComment(report.interestRate)}\n\n`;
    
    // Debt Analysis
    snarkyReport += `💵 **DEBT FINANCIAL ANALYSIS**:\n`;
    snarkyReport += `   🕐 Estimated cleanup time: ${report.debtAnalysis.estimatedHours} hours\n`;
    snarkyReport += `   💰 Base cleanup cost: $${report.debtAnalysis.estimatedCost}\n`;
    snarkyReport += `   📈 With interest: $${report.debtAnalysis.compoundedCost}\n`;
    snarkyReport += `   🔥 Interest penalty: $${report.debtAnalysis.interestAccrued}\n\n`;
    
    // Credit Score Breakdown
    snarkyReport += `📈 **CREDIT SCORE BREAKDOWN**:\n`;
    snarkyReport += `   🧹 Code Quality: ${report.breakdown.codeQuality}/100 ${this.getScoreEmoji(report.breakdown.codeQuality)}\n`;
    snarkyReport += `   📅 Payment History: ${report.breakdown.paymentHistory}/100 ${this.getScoreEmoji(report.breakdown.paymentHistory)}\n`;
    snarkyReport += `   ⚖️  Debt Load: ${report.breakdown.debtLoad}/100 ${this.getScoreEmoji(report.breakdown.debtLoad)}\n`;
    snarkyReport += `   🧠 Patterns: ${report.breakdown.patterns}/100 ${this.getScoreEmoji(report.breakdown.patterns)}\n\n`;
    
    // Recommendations
    if (report.recommendations.length > 0) {
      snarkyReport += `💡 **FINANCIAL ADVICE** (You're gonna need it):\n`;
      report.recommendations.forEach(rec => {
        snarkyReport += `   ${this.getPriorityEmoji(rec.priority)} **${rec.category}**: ${rec.message}\n`;
        snarkyReport += `      💎 Impact: ${rec.estimatedImpact}\n`;
      });
    }
    
    snarkyReport += `\n🎯 **PAYMENT PLAN RECOMMENDATIONS**:\n`;
    if (report.debtAnalysis.totalDebt === 0) {
      snarkyReport += `   🏆 No debt! You're the envy of developers everywhere.\n`;
    } else {
      snarkyReport += `   🚨 Minimum payment: Fix P1 issues (${report.debtAnalysis.breakdown.p1.count} × $${Math.round(report.debtAnalysis.breakdown.p1.cost/report.debtAnalysis.breakdown.p1.count || 0)})\n`;
      snarkyReport += `   💳 Full payment: Fix all debt for $${report.debtAnalysis.estimatedCost}\n`;
      snarkyReport += `   ⏰ Payment due: Before interest compounds further\n`;
    }
    
    return snarkyReport;
  }

  getSnarkyClassification(classification) {
    const messages = {
      PRIME_DEVELOPER: 'PRIME DEVELOPER 🏆 (The unicorn of clean code)',
      STANDARD: 'STANDARD 📊 (Perfectly average, like most of us)',
      SUBPRIME: 'SUBPRIME ⚠️ (Your code needs a financial advisor)',
      VIBE_CODER: 'VIBE CODER 🔥 (Coding by feel, paying by pain)'
    };
    return messages[classification] || 'UNKNOWN (Even we can\'t classify this mess)';
  }

  getSnarkyRateComment(rate) {
    if (rate < 5) return '(Excellent! You\'ve earned the good rate)';
    if (rate < 10) return '(Not bad, but room for improvement)';
    if (rate < 20) return '(Ouch, that\'s gonna hurt the wallet)';
    return '(Loan shark territory - they\'re coming for your kneecaps)';
  }

  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  getPriorityEmoji(priority) {
    const emojis = {
      HIGH: '🚨',
      MEDIUM: '⚠️',
      LOW: '💡'
    };
    return emojis[priority] || '📝';
  }

  /**
   * COMPREHENSIVE: Calculate ALL financial metrics for dashboard SSOT
   * Replaces dozens of local dashboard calculations with single backend API
   */
  async calculateFinancialMetrics(projectPath) {
    const creditReport = await this.calculateCreditScore(projectPath);
    const debtAnalysis = await this.analyzeDebtCosts(projectPath);
    const scanResult = await this.debtDetector.scanProject(projectPath, true);
    
    const totalDebt = scanResult.totalDebt;
    const p1Count = scanResult.p1.length;
    const p2Count = scanResult.p2.length;
    const p3Count = scanResult.p3.length;
    const p4Count = scanResult.p4.length;
    
    // === CORE FINANCIAL METRICS ===
    const creditScore = creditReport.score;
    const creditTier = creditReport.classification;
    const interestRate = creditReport.interestRate;
    const timeWasted = `${debtAnalysis.estimatedHours}h`;
    const debtCost = debtAnalysis.estimatedCost;
    
    // === VELOCITY & TRENDS ===
    const debtVelocity = Math.round(totalDebt / 7); // Average daily debt
    const timeToCrisis = this.calculateTimeToCrisis(p1Count, p2Count, totalDebt);
    const cleanupEffort = debtAnalysis.estimatedHours;
    
    // === EFFICIENCY METRICS ===
    const debtEfficiency = totalDebt > 0 ? 
      Math.max(0, Math.round(((p1Count * 50) + (p2Count * 25)) / totalDebt * 100)) : 100;
    const fixRate = totalDebt > 0 ? 
      Math.max(0, Math.round((p1Count + p2Count) / totalDebt * 100)) : 100;
    
    // === STRATEGIC METRICS ===
    const quickWins = Math.min(p1Count, p2Count); // Issues that can be fixed quickly
    const successRate = this.calculateSuccessRate(p1Count, p2Count, totalDebt);
    const roi = this.calculateROI(debtAnalysis.estimatedCost, debtAnalysis.interestAccrued, totalDebt);
    
    // === RISK ASSESSMENTS ===
    const riskLevel = this.calculateRiskLevel(p1Count, p2Count, totalDebt);
    const healthScore = this.calculateHealthScore(creditReport, totalDebt);
    const stabilityIndex = this.calculateStabilityIndex(p1Count, p2Count, p3Count, p4Count);
    
    // === GAMIFICATION METRICS ===
    const debtSlayerLevel = this.calculateDebtSlayerLevel(creditScore);
    const achievementProgress = this.calculateAchievementProgress(creditReport, totalDebt);
    
    return {
      // Core Financial
      creditScore,
      creditTier,
      interestRate,
      timeWasted,
      debtCost,
      compoundedCost: debtAnalysis.compoundedCost,
      interestAccrued: debtAnalysis.interestAccrued,
      
      // Velocity & Trends  
      debtVelocity,
      timeToCrisis,
      cleanupEffort,
      
      // Efficiency
      debtEfficiency,
      fixRate,
      
      // Strategic
      quickWins,
      successRate,
      roi,
      
      // Risk Assessment
      riskLevel,
      healthScore,
      stabilityIndex,
      
      // Gamification
      debtSlayerLevel,
      achievementProgress,
      
      // Breakdown for detailed analysis
      breakdown: {
        p1: { count: p1Count, hours: p1Count * 2.0, cost: p1Count * 200 },
        p2: { count: p2Count, hours: p2Count * 1.0, cost: p2Count * 100 },
        p3: { count: p3Count, hours: p3Count * 0.5, cost: p3Count * 50 },
        p4: { count: p4Count, hours: p4Count * 0.25, cost: p4Count * 25 }
      },
      
      // Context
      projectContext: creditReport.projectContext,
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods for comprehensive metrics
  calculateTimeToCrisis(p1Count, p2Count, totalDebt) {
    if (totalDebt === 0) return Infinity;
    
    // Calculate time to reach critical thresholds
    const timeToP1 = (100 - (p1Count * 50)) / 50;
    const timeToP2 = (100 - (p2Count * 25)) / 25;
    
    const timeToCrisis = Math.min(timeToP1, timeToP2);
    return Math.max(0, Math.round(timeToCrisis));
  }

  calculateSuccessRate(p1Count, p2Count, totalDebt) {
    if (totalDebt === 0) return 100;
    
    const criticalIssues = p1Count + p2Count;
    const successRate = ((totalDebt - criticalIssues) / totalDebt) * 100;
    return Math.round(successRate);
  }

  calculateROI(estimatedCost, interestAccrued, totalDebt) {
    if (estimatedCost === 0) return 0;
    
    const productivityGains = totalDebt * 25; // $25 productivity gain per debt fixed
    const roi = ((productivityGains - estimatedCost) / estimatedCost) * 100;
    return Math.round(roi);
  }

  calculateRiskLevel(p1Count, p2Count, totalDebt) {
    if (p1Count > 20) return 'CRITICAL';
    if (p1Count > 10 || p2Count > 50) return 'HIGH';
    if (p1Count > 5 || p2Count > 25 || totalDebt > 100) return 'MEDIUM';
    if (totalDebt > 10) return 'LOW';
    return 'MINIMAL';
  }

  calculateHealthScore(creditReport, totalDebt) {
    const creditWeight = creditReport.score / 850 * 60; // 60% weight
    const debtWeight = Math.max(0, (100 - totalDebt) / 100) * 40; // 40% weight
    return Math.round(creditWeight + debtWeight);
  }

  calculateStabilityIndex(p1Count, p2Count, p3Count, p4Count) {
    const totalIssues = p1Count + p2Count + p3Count + p4Count;
    if (totalIssues === 0) return 100;
    
    // Weighted stability based on issue severity
    const stabilityScore = 100 - (
      (p1Count * 10) + (p2Count * 5) + (p3Count * 2) + (p4Count * 1)
    ) / totalIssues;
    
    return Math.max(0, Math.round(stabilityScore));
  }

  calculateDebtSlayerLevel(creditScore) {
    if (creditScore >= 800) return 'LEGENDARY';
    if (creditScore >= 750) return 'MASTER';
    if (creditScore >= 700) return 'EXPERT';
    if (creditScore >= 650) return 'SKILLED';
    if (creditScore >= 600) return 'APPRENTICE';
    return 'NOVICE';
  }

  calculateAchievementProgress(creditReport, totalDebt) {
    const achievements = {
      debtFreeChampion: totalDebt === 0 ? 100 : Math.max(0, (100 - totalDebt) / 100 * 100),
      primeCreditor: creditReport.score >= 750 ? 100 : (creditReport.score / 750) * 100,
      lowInterestRate: creditReport.interestRate <= 5 ? 100 : Math.max(0, (10 - creditReport.interestRate) / 10 * 100),
      architecturalExcellence: creditReport.projectContext?.qualityIndicators?.architecture || 0
    };
    
    return achievements;
  }

  /**
   * Generate snarky financial report
   */
  async generateSnarkyFinancialReport(projectPath) {
    const report = await this.generateFinancialReport(projectPath);
    
    let snarkyReport = `💰 **THE ACCOUNTANT'S DEBT ASSESSMENT**\n\n`;
    
    // Credit Score Section
    snarkyReport += `📊 **DEVELOPER CREDIT SCORE**: ${report.creditScore}/850\n`;
    snarkyReport += `🏷️  **CLASSIFICATION**: ${this.getSnarkyClassification(report.classification)}\n`;
    snarkyReport += `💸 **INTEREST RATE**: ${report.interestRate}% APR ${this.getSnarkyRateComment(report.interestRate)}\n\n`;
    
    // Debt Analysis
    snarkyReport += `💵 **DEBT FINANCIAL ANALYSIS**:\n`;
    snarkyReport += `   🕐 Estimated cleanup time: ${report.debtAnalysis.estimatedHours} hours\n`;
    snarkyReport += `   💰 Base cleanup cost: $${report.debtAnalysis.estimatedCost}\n`;
    snarkyReport += `   📈 With interest: $${report.debtAnalysis.compoundedCost}\n`;
    snarkyReport += `   🔥 Interest penalty: $${report.debtAnalysis.interestAccrued}\n\n`;
    
    // Credit Score Breakdown
    snarkyReport += `📈 **CREDIT SCORE BREAKDOWN**:\n`;
    snarkyReport += `   🧹 Code Quality: ${report.breakdown.codeQuality}/100 ${this.getScoreEmoji(report.breakdown.codeQuality)}\n`;
    snarkyReport += `   📅 Payment History: ${report.breakdown.paymentHistory}/100 ${this.getScoreEmoji(report.breakdown.paymentHistory)}\n`;
    snarkyReport += `   ⚖️  Debt Load: ${report.breakdown.debtLoad}/100 ${this.getScoreEmoji(report.breakdown.debtLoad)}\n`;
    snarkyReport += `   🧠 Patterns: ${report.breakdown.patterns}/100 ${this.getScoreEmoji(report.breakdown.patterns)}\n\n`;
    
    // Recommendations
    if (report.recommendations.length > 0) {
      snarkyReport += `💡 **FINANCIAL ADVICE** (You're gonna need it):\n`;
      report.recommendations.forEach(rec => {
        snarkyReport += `   ${this.getPriorityEmoji(rec.priority)} **${rec.category}**: ${rec.message}\n`;
        snarkyReport += `      💎 Impact: ${rec.estimatedImpact}\n`;
      });
    }
    
    snarkyReport += `\n🎯 **PAYMENT PLAN RECOMMENDATIONS**:\n`;
    if (report.debtAnalysis.totalDebt === 0) {
      snarkyReport += `   🏆 No debt! You're the envy of developers everywhere.\n`;
    } else {
      snarkyReport += `   🚨 Minimum payment: Fix P1 issues (${report.debtAnalysis.breakdown.p1.count} × $${Math.round(report.debtAnalysis.breakdown.p1.cost/report.debtAnalysis.breakdown.p1.count || 0)})\n`;
      snarkyReport += `   💳 Full payment: Fix all debt for $${report.debtAnalysis.estimatedCost}\n`;
      snarkyReport += `   ⏰ Payment due: Before interest compounds further\n`;
    }
    
    return snarkyReport;
  }

  getSnarkyClassification(classification) {
    const messages = {
      PRIME_DEVELOPER: 'PRIME DEVELOPER 🏆 (The unicorn of clean code)',
      STANDARD: 'STANDARD 📊 (Perfectly average, like most of us)',
      SUBPRIME: 'SUBPRIME ⚠️ (Your code needs a financial advisor)',
      VIBE_CODER: 'VIBE CODER 🔥 (Coding by feel, paying by pain)'
    };
    return messages[classification] || 'UNKNOWN (Even we can\'t classify this mess)';
  }

  getSnarkyRateComment(rate) {
    if (rate < 5) return '(Excellent! You\'ve earned the good rate)';
    if (rate < 10) return '(Not bad, but room for improvement)';
    if (rate < 20) return '(Ouch, that\'s gonna hurt the wallet)';
    return '(Loan shark territory - they\'re coming for your kneecaps)';
  }

  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  getPriorityEmoji(priority) {
    const emojis = {
      HIGH: '🚨',
      MEDIUM: '⚠️',
      LOW: '💡'
    };
    return emojis[priority] || '📝';
  }
}

module.exports = { Accountant }; 