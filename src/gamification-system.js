/**
 * Gamification System - Developer Engagement & Achievement Tracking
 * 
 * This system provides:
 * - Achievement unlocking and badge collection
 * - Streak tracking for consistent debt cleanup
 * - Experience points and leveling system
 * - Team competitions and leaderboards
 * - Milestone celebrations and rewards
 */

const fs = require('fs-extra');
const path = require('path');

class GamificationSystem {
  constructor() {
    this.achievements = new Map();
    this.userStats = new Map();
    this.streaks = new Map();
    this.competitions = new Map();
    
    this.initializeAchievements();
    this.initializeExperienceSystem();
  }

  initializeAchievements() {
    // Debt Reduction Achievements
    this.achievements.set('first-scan', {
      id: 'first-scan',
      title: 'Debt Detective',
      description: 'Ran your first debt scan',
      icon: '🔍',
      rarity: 'common',
      xp: 10,
      category: 'first-steps'
    });

    this.achievements.set('debt-free', {
      id: 'debt-free',
      title: 'Debt-Free Warrior',
      description: 'Achieved zero technical debt',
      icon: '🏆',
      rarity: 'legendary',
      xp: 1000,
      category: 'mastery'
    });

    this.achievements.set('p1-eliminator', {
      id: 'p1-eliminator',
      title: 'Crisis Averted',
      description: 'Fixed 10 P1 critical issues',
      icon: '🚨',
      rarity: 'epic',
      xp: 500,
      category: 'heroic',
      progress: { current: 0, target: 10 }
    });

    this.achievements.set('consistency-champion', {
      id: 'consistency-champion',
      title: 'Consistency Champion',
      description: 'Maintained debt cleanup for 30 days',
      icon: '📅',
      rarity: 'epic',
      xp: 750,
      category: 'dedication',
      progress: { current: 0, target: 30 }
    });

    this.achievements.set('speed-demon', {
      id: 'speed-demon',
      title: 'Speed Demon',
      description: 'Fixed 100 issues in a single session',
      icon: '⚡',
      rarity: 'rare',
      xp: 300,
      category: 'efficiency',
      progress: { current: 0, target: 100 }
    });

    this.achievements.set('perfectionist', {
      id: 'perfectionist',
      title: 'Code Perfectionist',
      description: 'Maintained zero debt for 7 consecutive days',
      icon: '💎',
      rarity: 'epic',
      xp: 600,
      category: 'mastery',
      progress: { current: 0, target: 7 }
    });

    // Specialized Tool Achievements
    this.achievements.set('accountant-apprentice', {
      id: 'accountant-apprentice',
      title: 'Financial Advisor',
      description: 'Generated your first credit score report',
      icon: '💰',
      rarity: 'common',
      xp: 50,
      category: 'tools'
    });

    this.achievements.set('comment-killer', {
      id: 'comment-killer',
      title: 'Comment Assassin',
      description: 'Eliminated 50 dead comments',
      icon: '💀',
      rarity: 'rare',
      xp: 200,
      category: 'cleanup',
      progress: { current: 0, target: 50 }
    });

    this.achievements.set('import-optimizer', {
      id: 'import-optimizer',
      title: 'Dependency Wizard',
      description: 'Cleaned up 25 unused imports',
      icon: '📦',
      rarity: 'rare',
      xp: 150,
      category: 'optimization',
      progress: { current: 0, target: 25 }
    });

    // Easter Egg Achievements
    this.achievements.set('after-dark-discoverer', {
      id: 'after-dark-discoverer',
      title: 'Night Owl',
      description: 'Discovered the After Dark Mode',
      icon: '🌙',
      rarity: 'legendary',
      xp: 69,
      category: 'easter-egg'
    });

    this.achievements.set('guido-survivor', {
      id: 'guido-survivor',
      title: 'Guido Survivor',
      description: 'Survived a Guido-level debt crisis',
      icon: '🤌',
      rarity: 'legendary',
      xp: 800,
      category: 'survival'
    });

    // Team Achievements
    this.achievements.set('team-player', {
      id: 'team-player',
      title: 'Team Player',
      description: 'Participated in a team competition',
      icon: '🤝',
      rarity: 'common',
      xp: 100,
      category: 'social'
    });

    this.achievements.set('debt-slayer-leader', {
      id: 'debt-slayer-leader',
      title: 'Debt Slayer Leader',
      description: 'Topped the team leaderboard',
      icon: '👑',
      rarity: 'epic',
      xp: 500,
      category: 'leadership'
    });
  }

  initializeExperienceSystem() {
    this.levelThresholds = [
      { level: 1, xp: 0, title: 'Code Newbie' },
      { level: 2, xp: 100, title: 'Bug Spotter' },
      { level: 3, xp: 250, title: 'Debt Detective' },
      { level: 4, xp: 500, title: 'Cleanup Specialist' },
      { level: 5, xp: 1000, title: 'Refactor Ninja' },
      { level: 6, xp: 1750, title: 'Quality Guardian' },
      { level: 7, xp: 2750, title: 'Debt Eliminator' },
      { level: 8, xp: 4000, title: 'Code Whisperer' },
      { level: 9, xp: 6000, title: 'Technical Sage' },
      { level: 10, xp: 9000, title: 'Debt Collector' },
      { level: 11, xp: 13000, title: 'Code Deity' },
      { level: 12, xp: 18000, title: 'Legendary Refactorer' }
    ];
  }

  /**
   * Load user progress from file system
   */
  async loadUserProgress(projectPath, userId = 'default') {
    const progressFile = path.join(projectPath, '.refuctor', 'gamification.json');
    
    if (await fs.pathExists(progressFile)) {
      try {
        const data = await fs.readJson(progressFile);
        return data[userId] || this.createNewUserProgress();
      } catch (error) {
        console.warn('Could not load gamification progress, starting fresh');
      }
    }
    
    return this.createNewUserProgress();
  }

  createNewUserProgress() {
    return {
      userId: 'default',
      xp: 0,
      level: 1,
      achievements: [],
      streaks: {
        current: 0,
        longest: 0,
        lastActivity: null
      },
      stats: {
        totalScans: 0,
        totalFixes: 0,
        debtEliminated: 0,
        sessionsCompleted: 0,
        toolsUsed: new Set(),
        criticalIssuesFixed: 0
      },
      milestones: [],
      joinDate: new Date().toISOString()
    };
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(projectPath, achievementId, userId = 'default') {
    const progress = await this.loadUserProgress(projectPath, userId);
    const achievement = this.achievements.get(achievementId);
    
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }
    
    // Check if already achieved
    if (progress.achievements.some(a => a.id === achievementId)) {
      return { awarded: false, reason: 'already_achieved' };
    }
    
    // Award the achievement
    const awardedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
      seasonEarned: this.getCurrentSeason()
    };
    
    progress.achievements.push(awardedAchievement);
    progress.xp += achievement.xp;
    
    // Check for level up
    const newLevel = this.calculateLevel(progress.xp);
    const leveledUp = newLevel > progress.level;
    progress.level = newLevel;
    
    // Save progress
    await this.saveUserProgress(projectPath, userId, progress);
    
    return {
      awarded: true,
      achievement: awardedAchievement,
      xpGained: achievement.xp,
      leveledUp,
      newLevel: progress.level,
      newTitle: this.getLevelTitle(progress.level)
    };
  }

  /**
   * Track user activity and update progress
   */
  async trackActivity(projectPath, activityType, data = {}, userId = 'default') {
    const progress = await this.loadUserProgress(projectPath, userId);
    const achievements = [];
    
    // Update streak
    const today = new Date().toDateString();
    const lastActivity = progress.streaks.lastActivity;
    
    if (lastActivity === today) {
      // Same day, no streak change
    } else if (lastActivity === new Date(Date.now() - 86400000).toDateString()) {
      // Consecutive day
      progress.streaks.current++;
      progress.streaks.longest = Math.max(progress.streaks.longest, progress.streaks.current);
    } else {
      // Streak broken or new streak
      progress.streaks.current = 1;
    }
    progress.streaks.lastActivity = today;
    
    // Update stats based on activity type
    switch (activityType) {
      case 'debt-scan':
        progress.stats.totalScans++;
        if (progress.stats.totalScans === 1) {
          achievements.push(await this.awardAchievement(projectPath, 'first-scan', userId));
        }
        break;
        
      case 'debt-fix':
        progress.stats.totalFixes += data.fixesApplied || 1;
        progress.stats.debtEliminated += data.debtReduced || 0;
        
        if (data.criticalIssues) {
          progress.stats.criticalIssuesFixed += data.criticalIssues;
          
          // Check P1 eliminator achievement
          const p1Achievement = this.achievements.get('p1-eliminator');
          if (p1Achievement && progress.stats.criticalIssuesFixed >= p1Achievement.progress.target) {
            achievements.push(await this.awardAchievement(projectPath, 'p1-eliminator', userId));
          }
        }
        
        // Check speed demon achievement
        if (data.fixesApplied >= 100) {
          achievements.push(await this.awardAchievement(projectPath, 'speed-demon', userId));
        }
        break;
        
      case 'tool-usage':
        progress.stats.toolsUsed.add(data.tool);
        
        // Tool-specific achievements
        if (data.tool === 'accountant' && !progress.achievements.some(a => a.id === 'accountant-apprentice')) {
          achievements.push(await this.awardAchievement(projectPath, 'accountant-apprentice', userId));
        }
        break;
        
      case 'debt-free':
        achievements.push(await this.awardAchievement(projectPath, 'debt-free', userId));
        break;
        
      case 'session-wrap':
        progress.stats.sessionsCompleted++;
        break;
        
      case 'easter-egg':
        if (data.easterEgg === 'after-dark') {
          achievements.push(await this.awardAchievement(projectPath, 'after-dark-discoverer', userId));
        }
        break;
    }
    
    // Check streak-based achievements
    if (progress.streaks.current >= 30) {
      achievements.push(await this.awardAchievement(projectPath, 'consistency-champion', userId));
    }
    
    // Save progress
    await this.saveUserProgress(projectPath, userId, progress);
    
    return {
      progress,
      newAchievements: achievements.filter(a => a.awarded),
      streakUpdated: true,
      currentStreak: progress.streaks.current
    };
  }

  /**
   * Generate user dashboard with gamification stats
   */
  async generateUserDashboard(projectPath, userId = 'default') {
    const progress = await this.loadUserProgress(projectPath, userId);
    const level = this.calculateLevel(progress.xp);
    const nextLevel = level + 1;
    const currentLevelXP = this.getLevelXP(level);
    const nextLevelXP = this.getLevelXP(nextLevel);
    const xpToNext = nextLevelXP - progress.xp;
    
    return {
      user: {
        id: userId,
        level,
        title: this.getLevelTitle(level),
        xp: progress.xp,
        xpProgress: {
          current: progress.xp - currentLevelXP,
          needed: nextLevelXP - currentLevelXP,
          toNext: xpToNext
        }
      },
      streaks: progress.streaks,
      achievements: {
        total: progress.achievements.length,
        byRarity: this.groupAchievementsByRarity(progress.achievements),
        recent: progress.achievements
          .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
          .slice(0, 5)
      },
      stats: {
        ...progress.stats,
        toolsUsed: Array.from(progress.stats.toolsUsed)
      },
      nextAchievements: this.getSuggestedAchievements(progress)
    };
  }

  /**
   * Create team competition
   */
  async createTeamCompetition(projectPath, competitionData) {
    const competition = {
      id: competitionData.id || `comp_${Date.now()}`,
      name: competitionData.name,
      description: competitionData.description,
      startDate: competitionData.startDate || new Date().toISOString(),
      endDate: competitionData.endDate,
      type: competitionData.type || 'debt-reduction', // debt-reduction, speed-fixing, consistency
      participants: [],
      leaderboard: [],
      prizes: competitionData.prizes || [],
      status: 'active'
    };
    
    this.competitions.set(competition.id, competition);
    
    // Save to file
    const competitionsFile = path.join(projectPath, '.refuctor', 'competitions.json');
    await fs.ensureDir(path.dirname(competitionsFile));
    
    const allCompetitions = {};
    for (const [id, comp] of this.competitions) {
      allCompetitions[id] = comp;
    }
    
    await fs.writeJson(competitionsFile, allCompetitions, { spaces: 2 });
    
    return competition;
  }

  /**
   * Generate snarky gamification report
   */
  async generateSnarkyGamificationReport(projectPath, userId = 'default') {
    const dashboard = await this.generateUserDashboard(projectPath, userId);
    
    let report = `🎮 **REFUCTOR GAMIFICATION PROFILE**\n\n`;
    
    // User Level and Progress
    report += `👤 **DEVELOPER PROFILE**:\n`;
    report += `   🏷️  Level ${dashboard.user.level}: ${dashboard.user.title}\n`;
    report += `   ⭐ Experience: ${dashboard.user.xp} XP\n`;
    report += `   📈 Progress: ${dashboard.user.xpProgress.current}/${dashboard.user.xpProgress.needed} XP to next level\n`;
    report += `   🎯 XP needed: ${dashboard.user.xpProgress.toNext} more to level up\n\n`;
    
    // Achievement Summary
    report += `🏆 **ACHIEVEMENT COLLECTION**:\n`;
    report += `   📊 Total: ${dashboard.achievements.total} achievements unlocked\n`;
    
    if (dashboard.achievements.byRarity.legendary > 0) {
      report += `   💎 Legendary: ${dashboard.achievements.byRarity.legendary} (You absolute legend!)\n`;
    }
    if (dashboard.achievements.byRarity.epic > 0) {
      report += `   🟣 Epic: ${dashboard.achievements.byRarity.epic} (Epic achievement hunter!)\n`;
    }
    if (dashboard.achievements.byRarity.rare > 0) {
      report += `   🔵 Rare: ${dashboard.achievements.byRarity.rare} (Getting rare finds!)\n`;
    }
    if (dashboard.achievements.byRarity.common > 0) {
      report += `   ⚪ Common: ${dashboard.achievements.byRarity.common} (Building the foundation!)\n`;
    }
    
    // Recent Achievements
    if (dashboard.achievements.recent.length > 0) {
      report += `\n🏅 **RECENT ACHIEVEMENTS**:\n`;
      dashboard.achievements.recent.forEach(achievement => {
        const timeAgo = this.getTimeAgo(achievement.unlockedAt);
        report += `   ${achievement.icon} ${achievement.title} (${timeAgo})\n`;
      });
    }
    
    // Streak Information
    report += `\n🔥 **STREAK STATUS**:\n`;
    if (dashboard.streaks.current > 0) {
      report += `   🔥 Current streak: ${dashboard.streaks.current} days\n`;
      report += `   📈 Longest streak: ${dashboard.streaks.longest} days\n`;
      
      if (dashboard.streaks.current >= 7) {
        report += `   💪 You're on fire! Keep the momentum going!\n`;
      } else if (dashboard.streaks.current >= 3) {
        report += `   🎯 Solid consistency! Building good habits!\n`;
      } else {
        report += `   🌱 Keep it up! Consistency is key to debt mastery!\n`;
      }
    } else {
      report += `   😴 No active streak - time to get back to work!\n`;
      report += `   💡 Tip: Regular debt cleanup builds momentum!\n`;
    }
    
    // Statistics
    report += `\n📊 **DEBT SLAYING STATISTICS**:\n`;
    report += `   🔍 Total scans: ${dashboard.stats.totalScans}\n`;
    report += `   🔧 Total fixes: ${dashboard.stats.totalFixes}\n`;
    report += `   💀 Debt eliminated: ${dashboard.stats.debtEliminated} issues\n`;
    report += `   🚨 Critical issues fixed: ${dashboard.stats.criticalIssuesFixed}\n`;
    report += `   🛠️  Tools mastered: ${dashboard.stats.toolsUsed.length}\n`;
    report += `   📝 Sessions completed: ${dashboard.stats.sessionsCompleted}\n`;
    
    // Motivational Messages
    if (dashboard.user.level >= 10) {
      report += `\n🎉 **STATUS**: DEBT COLLECTOR LEVEL! You've reached legendary status!\n`;
    } else if (dashboard.user.level >= 7) {
      report += `\n⚡ **STATUS**: DEBT ELIMINATOR! You're crushing technical debt!\n`;
    } else if (dashboard.user.level >= 5) {
      report += `\n🥷 **STATUS**: REFACTOR NINJA! Your skills are getting sharp!\n`;
    } else if (dashboard.user.level >= 3) {
      report += `\n🔍 **STATUS**: DEBT DETECTIVE! You're developing your skills!\n`;
    } else {
      report += `\n🌱 **STATUS**: RISING TALENT! Keep learning and growing!\n`;
    }
    
    // Next Achievements to Unlock
    if (dashboard.nextAchievements.length > 0) {
      report += `\n🎯 **NEXT ACHIEVEMENTS TO UNLOCK**:\n`;
      dashboard.nextAchievements.slice(0, 3).forEach(achievement => {
        report += `   ${achievement.icon} ${achievement.title}: ${achievement.description}\n`;
        if (achievement.progress) {
          const percent = Math.round((achievement.progress.current / achievement.progress.target) * 100);
          report += `      Progress: ${achievement.progress.current}/${achievement.progress.target} (${percent}%)\n`;
        }
      });
    }
    
    return report;
  }

  // Helper Methods
  calculateLevel(xp) {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (xp >= this.levelThresholds[i].xp) {
        return this.levelThresholds[i].level;
      }
    }
    return 1;
  }

  getLevelXP(level) {
    const levelData = this.levelThresholds.find(l => l.level === level);
    return levelData ? levelData.xp : 0;
  }

  getLevelTitle(level) {
    const levelData = this.levelThresholds.find(l => l.level === level);
    return levelData ? levelData.title : 'Code Newbie';
  }

  groupAchievementsByRarity(achievements) {
    return achievements.reduce((acc, achievement) => {
      acc[achievement.rarity] = (acc[achievement.rarity] || 0) + 1;
      return acc;
    }, { common: 0, rare: 0, epic: 0, legendary: 0 });
  }

  getSuggestedAchievements(progress) {
    const unlockedIds = progress.achievements.map(a => a.id);
    const available = Array.from(this.achievements.values())
      .filter(achievement => !unlockedIds.includes(achievement.id));
    
    // Sort by rarity and XP value
    return available
      .sort((a, b) => {
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity] || a.xp - b.xp;
      })
      .slice(0, 10);
  }

  getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 0 && month <= 2) return `${year}Q1`;
    if (month >= 3 && month <= 5) return `${year}Q2`;
    if (month >= 6 && month <= 8) return `${year}Q3`;
    return `${year}Q4`;
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  async saveUserProgress(projectPath, userId, progress) {
    const progressFile = path.join(projectPath, '.refuctor', 'gamification.json');
    await fs.ensureDir(path.dirname(progressFile));
    
    let allProgress = {};
    if (await fs.pathExists(progressFile)) {
      try {
        allProgress = await fs.readJson(progressFile);
      } catch (error) {
        // Start fresh if corrupted
      }
    }
    
    allProgress[userId] = progress;
    await fs.writeJson(progressFile, allProgress, { spaces: 2 });
  }
}

module.exports = { GamificationSystem }; 