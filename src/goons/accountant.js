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
   * Algorithm: Code quality (40%), payment history (35%), debt load (15%), patterns (10%)
   */
  async calculateCreditScore(projectPath) {
    const metrics = await this.gatherCreditMetrics(projectPath);
    
    // Code Quality Score (40% weight)
    const codeQualityScore = this.calculateCodeQualityScore(metrics);
    
    // Payment History Score (35% weight)
    const paymentHistoryScore = this.calculatePaymentHistoryScore(metrics);
    
    // Debt Load Score (15% weight)
    const debtLoadScore = this.calculateDebtLoadScore(metrics);
    
    // Pattern Recognition Score (10% weight)
    const patternScore = this.calculatePatternScore(metrics);
    
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

  calculateCodeQualityScore(metrics) {
    const { totalDebt, p1Count, p2Count, p3Count, p4Count } = metrics;
    
    // Base score starts at 100
    let score = 100;
    
    // Heavy penalties for critical issues
    score -= p1Count * 15;  // P1 issues are expensive
    score -= p2Count * 8;   // P2 issues hurt
    score -= p3Count * 3;   // P3 issues are noticeable
    score -= p4Count * 1;   // P4 issues add up
    
    // Severe penalties for extreme debt
    if (totalDebt > 100) score -= 30;  // Hoarding debt
    if (totalDebt > 200) score -= 50;  // Debt crisis
    if (p1Count > 20) score -= 40;     // Critical negligence
    
    // Bonus for clean code
    if (totalDebt === 0) score += 20;  // Debt-free bonus
    if (p1Count === 0) score += 10;    // No critical issues
    
    return Math.max(0, Math.min(100, score));
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

  calculateDebtLoadScore(metrics) {
    const { totalDebt } = metrics;
    
    // Debt utilization scoring (reverse of debt load)
    let score = 100;
    
    // Penalties based on debt levels
    if (totalDebt > 10) score -= 10;
    if (totalDebt > 25) score -= 20;
    if (totalDebt > 50) score -= 30;
    if (totalDebt > 100) score -= 40;
    if (totalDebt > 200) score -= 50;
    
    // Bonus for low debt
    if (totalDebt === 0) score += 10;
    if (totalDebt < 5) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  calculatePatternScore(metrics) {
    const { creditHistory } = metrics;
    
    if (!creditHistory.patterns) {
      return 75; // Neutral score for new accounts
    }
    
    let score = 100;
    const patterns = creditHistory.patterns;
    
    // Analyze coding patterns
    if (patterns.frequentP1Issues) score -= 15;
    if (patterns.improvingTrend) score += 10;
    if (patterns.worseningTrend) score -= 10;
    if (patterns.consistentCleanup) score += 15;
    if (patterns.debtIgnoreAbuse) score -= 20;
    
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
}

module.exports = { Accountant }; 