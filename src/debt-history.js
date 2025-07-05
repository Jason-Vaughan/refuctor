const fs = require('fs-extra');
const path = require('path');

/**
 * Debt History Tracker - Persistent debt tracking for trend analysis
 * Stores scan results with timestamps for historical comparison
 */
class DebtHistoryTracker {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.historyFile = path.join(projectPath, '.refuctor', 'debt-history.json');
    this.maxHistoryEntries = 30; // Keep last 30 scans
  }

  /**
   * Initialize history storage
   */
  async initialize() {
    await fs.ensureDir(path.dirname(this.historyFile));
    
    if (!await fs.pathExists(this.historyFile)) {
      await this.saveHistory([]);
    }
  }

  /**
   * Add a new scan result to history
   */
  async addScanResult(scanResult) {
    await this.initialize();
    
    const history = await this.loadHistory();
    const timestamp = new Date().toISOString();
    
    const historyEntry = {
      timestamp,
      date: timestamp.split('T')[0], // YYYY-MM-DD
      summary: {
        total: scanResult.totalDebt || 0,
        p1: scanResult.p1?.length || 0,
        p2: scanResult.p2?.length || 0,
        p3: scanResult.p3?.length || 0,
        p4: scanResult.p4?.length || 0,
        mafia: scanResult.mafia?.length || 0,
        guido: scanResult.guido?.length || 0
      },
      breakdown: {
        markdown: scanResult.summary?.markdown || 0,
        spelling: scanResult.summary?.spelling || 0,
        security: scanResult.summary?.security || 0,
        dependencies: scanResult.summary?.dependencies || 0,
        eslint: scanResult.summary?.eslint || 0,
        typescript: scanResult.summary?.typescript || 0,
        codeQuality: scanResult.summary?.codeQuality || 0,
        formatting: scanResult.summary?.formatting || 0
      },
      debtTrend: scanResult.debtTrend || 'stable',
      shameLevel: this.calculateShameLevel(scanResult.totalDebt || 0),
      hotspotCount: scanResult.topHotspots?.length || 0,
      fileCount: Object.keys(scanResult.fileDebtMap || {}).length
    };

    // Add to history
    history.push(historyEntry);
    
    // Keep only last N entries
    if (history.length > this.maxHistoryEntries) {
      history.splice(0, history.length - this.maxHistoryEntries);
    }

    await this.saveHistory(history);
    return historyEntry;
  }

  /**
   * Get debt history for trend analysis
   */
  async getHistory(days = 7) {
    await this.initialize();
    const history = await this.loadHistory();
    
    // Return last N days or all if less than N
    return history.slice(-days);
  }

  /**
   * Get debt trend analysis
   */
  async getTrendAnalysis() {
    const history = await this.getHistory(7);
    
    if (history.length < 2) {
      return {
        trend: 'stable',
        direction: 'no-data',
        changePercent: 0,
        daysTracked: history.length
      };
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const currentTotal = latest.summary.total;
    const previousTotal = previous.summary.total;
    
    const changePercent = previousTotal === 0 ? 0 : 
      Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    
    let trend = 'stable';
    let direction = 'stable';
    
    if (changePercent > 10) {
      trend = 'worsening';
      direction = 'increasing';
    } else if (changePercent < -10) {
      trend = 'improving';
      direction = 'decreasing';
    }

    return {
      trend,
      direction,
      changePercent,
      daysTracked: history.length,
      currentTotal,
      previousTotal
    };
  }

  /**
   * Get velocity analysis (debt accumulation rate)
   */
  async getVelocityAnalysis() {
    const history = await this.getHistory(7);
    
    if (history.length < 3) {
      return {
        velocity: 0,
        accelerating: false,
        averageDaily: 0
      };
    }

    // Calculate daily changes
    const dailyChanges = [];
    for (let i = 1; i < history.length; i++) {
      const change = history[i].summary.total - history[i - 1].summary.total;
      dailyChanges.push(change);
    }

    const averageDaily = dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length;
    
    // Check if acceleration is increasing
    const recentChanges = dailyChanges.slice(-3);
    const earlierChanges = dailyChanges.slice(0, -3);
    
    const recentAvg = recentChanges.length ? recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length : 0;
    const earlierAvg = earlierChanges.length ? earlierChanges.reduce((sum, change) => sum + change, 0) / earlierChanges.length : 0;
    
    return {
      velocity: Math.round(averageDaily * 10) / 10, // Round to 1 decimal
      accelerating: recentAvg > earlierAvg,
      averageDaily: Math.round(averageDaily * 10) / 10
    };
  }

  /**
   * Get peak debt analysis
   */
  async getPeakAnalysis() {
    const history = await this.getHistory(30); // Look at last 30 days
    
    if (history.length === 0) {
      return {
        peakDebt: 0,
        peakDate: null,
        daysSincePeak: 0,
        currentVsPeak: 0
      };
    }

    const peak = history.reduce((max, entry) => 
      entry.summary.total > max.summary.total ? entry : max
    );
    
    const latest = history[history.length - 1];
    const daysSincePeak = history.length - 1 - history.indexOf(peak);
    
    return {
      peakDebt: peak.summary.total,
      peakDate: peak.date,
      daysSincePeak,
      currentVsPeak: Math.round(((latest.summary.total - peak.summary.total) / peak.summary.total) * 100)
    };
  }

  /**
   * Load history from file
   */
  async loadHistory() {
    try {
      return await fs.readJson(this.historyFile);
    } catch (error) {
      return [];
    }
  }

  /**
   * Save history to file
   */
  async saveHistory(history) {
    await fs.writeJson(this.historyFile, history, { spaces: 2 });
  }

  /**
   * Calculate shame level based on total debt
   */
  calculateShameLevel(totalDebt) {
    if (totalDebt === 0) return 'debt-free';
    if (totalDebt < 5) return 'minor-issues';
    if (totalDebt < 20) return 'needs-attention';
    if (totalDebt < 50) return 'embarrassing';
    return 'bankruptcy-imminent';
  }

  /**
   * Clear all history (for testing)
   */
  async clearHistory() {
    await this.saveHistory([]);
  }
}

module.exports = { DebtHistoryTracker }; 