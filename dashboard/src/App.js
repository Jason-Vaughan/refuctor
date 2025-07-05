import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const App = () => {
  const [debtData, setDebtData] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Refuctor Dashboard');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from Refuctor Dashboard');
      setConnected(false);
    });

    newSocket.on('debt-update', (data) => {
      console.log('📊 Debt update received:', data.type);
      if (data.type === 'scan-complete') {
        setDebtData(data.data);
        setLastScan(data.timestamp);
      }
    });

    // Load initial data
    loadDashboardData();

    return () => {
      newSocket.close();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load project info and debt status in parallel
      const [projectResponse, statusResponse] = await Promise.all([
        fetch('/api/project/info'),
        fetch('/api/debt/status')
      ]);

      const projectData = await projectResponse.json();
      const statusData = await statusResponse.json();

      setProjectInfo(projectData.data);
      setDebtData(statusData.data);
      setLastScan(new Date().toISOString());
      
    } catch (error) {
      console.error('💥 Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debt/scan');
      const data = await response.json();
      setDebtData(data.data);
      setLastScan(data.metadata.scannedAt);
    } catch (error) {
      console.error('💥 Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerFix = async (fixType) => {
    try {
      // Enhanced fix types for Phase 2 controls
      const fixActions = {
        'auto': 'Safe automated fixes',
        'schedule': 'Debt payment scheduling',
        'ai-help': 'AI-powered refactoring assistance',
        'nuclear': 'Complete debt elimination'
      };
      
      console.log(`🔧 ${fixActions[fixType]} initiated...`);
      
      const response = await fetch('/api/debt/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fixType })
      });
      
      const data = await response.json();
      console.log('🔧 Fix completed:', data.message);
      
      // Special handling for different fix types
      if (fixType === 'ai-help') {
        // TODO: Open AI assistance modal
        console.log('🤖 AI Collection Agency dispatched');
      } else if (fixType === 'schedule') {
        // TODO: Open debt payment scheduler
        console.log('💰 Debt refinancing options prepared');
      }
      
      // Refresh data after fix
      setTimeout(() => triggerScan(), 2000);
    } catch (error) {
      console.error('💥 Fix failed:', error);
    }
  };

  const getDebtColor = (priority) => {
    switch (priority) {
      case 'p1': return '#ff4757'; // Critical red
      case 'p2': return '#ffa502'; // Warning orange  
      case 'p3': return '#3742fa'; // Medium blue
      case 'p4': return '#7f8fa6'; // Low gray
      case 'guido': return '#8e24aa'; // Guido purple
      case 'mafia': return '#d63031'; // Mafia dark red
      default: return '#7f8fa6';
    }
  };

  const getShameMessage = (shameLevel) => {
    switch (shameLevel) {
      case 'debt-free':
        return '🎉 Debt-free! You magnificent debt-slayer!';
      case 'minor-issues':
        return '⚠️ Minor debt detected. Handle it before it breeds.';
      case 'needs-attention':
        return '🚨 Debt levels rising. Time to call The Fixer.';
      case 'embarrassing':
        return '💀 This is fucking embarrassing. Fix it NOW.';
      case 'bankruptcy-imminent':
        return '⚰️ Your code is in foreclosure. Guido is on his way.';
      default:
        return '📊 Debt status unknown. Run a scan.';
    }
  };

  // Phase 2 Enhancement: Credit Score & Financial Calculations
  const calculateCreditScore = (debtData) => {
    if (!debtData || !debtData.summary) return 300;
    
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Credit score algorithm (simplified for preview)
    let score = 850; // Start with perfect score
    
    // Deduct for debt levels
    score -= (p1Count * 50); // P1 Critical: -50 points each
    score -= (p2Count * 25); // P2 High: -25 points each  
    score -= (total * 5);     // All debt: -5 points each
    
    // Ensure minimum score
    return Math.max(300, Math.round(score));
  };

  const getCreditTier = (debtData) => {
    const score = calculateCreditScore(debtData);
    if (score >= 750) return 'prime';
    if (score >= 650) return 'standard';
    if (score >= 550) return 'subprime';
    return 'vibe-coder';
  };

  const getCreditTierLabel = (debtData) => {
    const tier = getCreditTier(debtData);
    switch (tier) {
      case 'prime': return '🌟 PRIME DEVELOPER';
      case 'standard': return '💼 STANDARD DEVELOPER';
      case 'subprime': return '⚠️ SUBPRIME DEVELOPER';
      case 'vibe-coder': return '🚨 VIBE CODER';
      default: return '📊 UNKNOWN';
    }
  };

  const calculateTimeWasted = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const hours = Math.round(total * 0.5); // 30 minutes per debt item
    return `${hours}h`;
  };

  const calculateDebtCost = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    return Math.round(total * 75); // $75 per debt item
  };

  const calculateAPR = (debtData) => {
    const tier = getCreditTier(debtData);
    switch (tier) {
      case 'prime': return '2.5';
      case 'standard': return '5.9';
      case 'subprime': return '12.8';
      case 'vibe-coder': return '24.9';
      default: return '0.0';
    }
  };

  const getHeatMapColor = (severity, count) => {
    // Color intensity based on debt count
    const baseAlpha = Math.min(0.3 + (count * 0.1), 1.0);
    
    switch (severity) {
      case 'p1':
      case 'critical':
        return `rgba(255, 71, 87, ${baseAlpha})`; // Red
      case 'p2':
      case 'high':
        return `rgba(255, 165, 2, ${baseAlpha})`; // Orange
      case 'p3':
      case 'medium':
        return `rgba(55, 66, 250, ${baseAlpha})`; // Blue
      case 'p4':
      case 'low':
        return `rgba(127, 143, 166, ${baseAlpha})`; // Gray
      default:
        return `rgba(255, 255, 255, ${baseAlpha * 0.5})`; // White
    }
  };

  const getTrendColor = (total) => {
    if (total > 0) return '#4caf50'; // Green
    if (total < 0) return '#f44336'; // Red
    return '#9e9e9e'; // Gray
  };

  const calculateDebtVelocity = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const velocity = Math.round(total / 7); // Average daily debt
    return velocity;
  };

  const calculateTimeToCrisis = (debtData) => {
    if (!debtData || !debtData.summary) return Infinity;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate time to reach P1 threshold
    const timeToP1 = (100 - (p1Count * 50)) / 50;
    const timeToP2 = (100 - (p2Count * 25)) / 25;
    
    // Find the minimum time to reach any threshold
    const timeToCrisis = Math.min(timeToP1, timeToP2);
    
    // Ensure minimum time
    return Math.max(0, Math.round(timeToCrisis));
  };

  const calculateCleanupEffort = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const hours = Math.round(total * 0.5); // 30 minutes per debt item
    return hours;
  };

  const calculateDebtEfficiency = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate debt efficiency
    const efficiency = ((p1Count * 50) + (p2Count * 25)) / total;
    
    // Ensure minimum efficiency
    return Math.max(0, Math.round(efficiency * 100));
  };

  const calculateFixRate = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate fix rate
    const fixRate = (p1Count + p2Count) / total;
    
    // Ensure minimum fix rate
    return Math.max(0, Math.round(fixRate * 100));
  };

  const generateSmartInsights = (debtData) => {
    if (!debtData || !debtData.summary) return [];
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    const insights = [
      {
        priority: 'p1',
        icon: '🔥',
        title: 'Critical Debt',
        message: `P1 Critical: ${p1Count} issues`,
        action: 'Fix now'
      },
      {
        priority: 'p2',
        icon: '⚠️',
        title: 'High Debt',
        message: `P2 High: ${p2Count} issues`,
        action: 'Refinance'
      },
      {
        priority: 'p3',
        icon: '💼',
        title: 'Medium Debt',
        message: `P3 Medium: ${debtData.summary.p3 || 0} issues`,
        action: 'Monitor'
      },
      {
        priority: 'p4',
        icon: '📊',
        title: 'Low Debt',
        message: `P4 Low: ${debtData.summary.p4 || 0} issues`,
        action: 'Plan'
      },
      {
        priority: 'guido',
        icon: '🤌',
        title: 'Guido Appearance',
        message: `Guido the Thumb Crusher has arrived`,
        action: 'Handle'
      },
      {
        priority: 'mafia',
        icon: '🕴️',
        title: 'Mafia Takeover',
        message: `Debt sold to the family`,
        action: 'Refinance'
      }
    ];

    return insights.filter(insight => insight.priority === 'p1' || insight.priority === 'p2' || insight.priority === 'guido' || insight.priority === 'mafia');
  };

  // Phase 2 Enhancement: AI-Powered Fix Suggestions
  const generatePriorityFixes = (debtData) => {
    if (!debtData || !debtData.summary) return [];
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    const fixes = [
      {
        priority: 'p1',
        icon: '🔥',
        title: 'Critical Debt',
        impact: 'High',
        description: 'Address critical debt issues immediately',
        command: 'Fix critical debt',
        estimatedTime: '1-2 hours',
        difficulty: 'Medium'
      },
      {
        priority: 'p2',
        icon: '⚠️',
        title: 'High Debt',
        impact: 'Medium',
        description: 'Refinance or consolidate high-interest debt',
        command: 'Refinance debt',
        estimatedTime: '2-4 hours',
        difficulty: 'Medium'
      },
      {
        priority: 'p3',
        icon: '💼',
        title: 'Medium Debt',
        impact: 'Low',
        description: 'Monitor medium-level debt',
        command: 'Monitor medium debt',
        estimatedTime: '0.5-1 hour',
        difficulty: 'Low'
      },
      {
        priority: 'p4',
        icon: '📊',
        title: 'Low Debt',
        impact: 'Low',
        description: 'Plan for low-level debt',
        command: 'Plan low debt',
        estimatedTime: '0.25-0.5 hour',
        difficulty: 'Low'
      },
      {
        priority: 'guido',
        icon: '🤌',
        title: 'Guido Appearance',
        impact: 'High',
        description: 'Handle Guido the Thumb Crusher',
        command: 'Handle Guido',
        estimatedTime: '1-2 hours',
        difficulty: 'Medium'
      },
      {
        priority: 'mafia',
        icon: '🕴️',
        title: 'Mafia Takeover',
        impact: 'High',
        description: 'Refinance debt to avoid family takeover',
        command: 'Refinance debt',
        estimatedTime: '2-4 hours',
        difficulty: 'Medium'
      }
    ];

    return fixes.filter(fix => fix.priority === 'p1' || fix.priority === 'p2' || fix.priority === 'guido' || fix.priority === 'mafia');
  };

  const calculateQuickWins = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate quick wins
    const quickWins = Math.min(p1Count, p2Count);
    
    return quickWins;
  };

  const calculateSuccessRate = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate success rate
    const successRate = ((p1Count + p2Count) / total) * 100;
    
    return Math.round(successRate);
  };

  const generateSmartRecommendations = (debtData) => {
    if (!debtData || !debtData.summary) return [];
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    const recommendations = [
      {
        type: 'p1',
        icon: '🔥',
        title: 'Critical Debt',
        message: 'Address critical debt issues immediately',
        score: 90
      },
      {
        type: 'p2',
        icon: '⚠️',
        title: 'High Debt',
        message: 'Refinance or consolidate high-interest debt',
        score: 80
      },
      {
        type: 'p3',
        icon: '💼',
        title: 'Medium Debt',
        message: 'Monitor medium-level debt',
        score: 70
      },
      {
        type: 'p4',
        icon: '📊',
        title: 'Low Debt',
        message: 'Plan for low-level debt',
        score: 60
      },
      {
        type: 'guido',
        icon: '🤌',
        title: 'Guido Appearance',
        message: 'Handle Guido the Thumb Crusher',
        score: 85
      },
      {
        type: 'mafia',
        icon: '🕴️',
        title: 'Mafia Takeover',
        message: 'Refinance debt to avoid family takeover',
        score: 75
      }
    ];

    return recommendations.filter(rec => rec.type === 'p1' || rec.type === 'p2' || rec.type === 'guido' || rec.type === 'mafia');
  };

  const getRecommendedStrategy = (debtData) => {
    if (!debtData || !debtData.summary) return 'Analysis pending';
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    if (p1Count > 0) {
      return 'Focus on critical debt';
    } else if (p2Count > 0) {
      return 'Refinance or consolidate high-interest debt';
    } else {
      return 'Monitor and plan debt';
    }
  };

  const calculateTotalFixTime = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate total fix time
    const totalTime = Math.round(total * 0.5); // 30 minutes per debt item
    
    return totalTime;
  };

  const calculateROI = (debtData) => {
    if (!debtData || !debtData.summary) return 0;
    const total = debtData.summary.total || 0;
    const p1Count = debtData.summary.p1 || 0;
    const p2Count = debtData.summary.p2 || 0;
    
    // Calculate ROI
    const roi = (total - (p1Count * 50 + p2Count * 25)) / (p1Count * 50 + p2Count * 25);
    
    return Math.round(roi * 100);
  };

  if (loading && !debtData) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-logo-container">
            <img 
              src="/images/refuctor-logo.png" 
              alt="Refuctor" 
              className="loading-logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="loading-logo fallback-loading" style={{display: 'none'}}>🏦 REFUCTOR</div>
          </div>
          <div className="loading-text">Loading Debt Collector Interface...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-container">
              <img 
                src="/images/refuctor-logo.png" 
                alt="Refuctor - The Debt Collector" 
                className="dashboard-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <h1 className="dashboard-title fallback-title" style={{display: 'none'}}>
                🏦 REFUCTOR DASHBOARD
              </h1>
              <p className="dashboard-subtitle">The Debt Collector Interface</p>
            </div>
          </div>
          
          <div className="connection-status">
            <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
        </div>
      </header>

      {/* Project Info */}
      {projectInfo && (
        <section className="project-info">
          <h2>📋 Project: {projectInfo.name}</h2>
          <div className="project-details">
            <span className="project-version">v{projectInfo.version}</span>
            <span className="project-path">{projectInfo.path}</span>
            <span className="refuctor-version">Refuctor {projectInfo.refuctorVersion}</span>
          </div>
        </section>
      )}

      {/* Phase 2 Enhancement: Credit Score & Financial Metrics */}
      <section className="financial-metrics">
        <div className="credit-score-widget">
          <div className="credit-score-display">
            <div className="score-value">
              {debtData ? calculateCreditScore(debtData) : '---'}
            </div>
            <div className="score-label">DEVELOPER CREDIT SCORE</div>
            <div className="score-range">300-850</div>
          </div>
          <div className="credit-classification">
            <div className={`credit-tier ${getCreditTier(debtData)}`}>
              {getCreditTierLabel(debtData)}
            </div>
          </div>
        </div>

        <div className="middle-panel">
          <h3 className="panel-title">📊 DEBT ANALYTICS</h3>
          <div className="analytics-display">
            <div className="metric-row">
              <div className="metric-item">
                <div className="metric-number">
                  {debtData ? Math.round((debtData.summary?.total || 0) / 7) : 0}
                </div>
                <div className="metric-desc">Days to Clean</div>
              </div>
              <div className="metric-item">
                <div className="metric-number">
                  {debtData ? Math.round(calculateCreditScore(debtData) / 10) : 0}%
                </div>
                <div className="metric-desc">Code Health</div>
              </div>
            </div>
            <div className="analytics-trend">
              <div className="trend-indicator">
                {debtData?.debtTrend === 'improving' ? '📈' : 
                 debtData?.debtTrend === 'worsening' ? '📉' : '📊'}
              </div>
              <div className="trend-text">
                {debtData?.debtTrend === 'improving' ? 'Improving' : 
                 debtData?.debtTrend === 'worsening' ? 'Worsening' : 'Stable'}
              </div>
            </div>
          </div>
        </div>

        <div className="interest-clock">
          <div className="clock-display">
            <div className="time-wasted">
              <div className="time-value">{debtData ? calculateTimeWasted(debtData) : '0h'}</div>
              <div className="time-label">TIME WASTED</div>
            </div>
            <div className="cost-impact">
              <div className="cost-value">${debtData ? calculateDebtCost(debtData) : '0'}</div>
              <div className="cost-label">CLEANUP COST</div>
            </div>
          </div>
          <div className="interest-rate">
            <div className="apr-display">
              {debtData ? calculateAPR(debtData) : '0.0'}% APR
            </div>
            <div className="rate-label">Current Interest Rate</div>
          </div>
        </div>
      </section>

      {/* Phase 2 Enhancement: Advanced Debt Heat Maps */}
      <section className="debt-heat-maps">
        <div className="heat-map-header">
          <h2>🔥 DEBT HEAT MAPS</h2>
          <p className="heat-map-subtitle">File-level debt concentration and hotspots</p>
        </div>
        
        <div className="heat-map-grid">
          <div className="heat-map-visualization">
            <h3>📊 File Debt Concentration</h3>
            <div className="heat-map-canvas">
              {debtData?.fileDebtMap ? (
                <div className="heat-blocks">
                  {Object.entries(debtData.fileDebtMap).slice(0, 20).map(([file, debtInfo], index) => (
                    <div 
                      key={index}
                      className={`heat-block heat-${debtInfo.severity}`}
                      title={`${file}: ${debtInfo.count} issues (${debtInfo.severity})`}
                      style={{
                        width: `${Math.min(Math.max(debtInfo.count * 2, 8), 40)}px`,
                        height: `${Math.min(Math.max(debtInfo.count * 2, 8), 40)}px`,
                        backgroundColor: getHeatMapColor(debtInfo.severity, debtInfo.count)
                      }}
                    >
                      <div className="heat-block-info">
                        <span className="file-name">{file.split('/').pop()}</span>
                        <span className="debt-count">{debtInfo.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="heat-map-placeholder">
                  <div className="placeholder-content">
                    <span className="placeholder-icon">🔥</span>
                    <p>Run a debt scan to generate heat maps</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="heat-map-hotspots">
            <h3>🚨 Top Debt Hotspots</h3>
            <div className="hotspot-list">
              {debtData?.topHotspots ? (
                debtData.topHotspots.slice(0, 8).map((hotspot, index) => (
                  <div key={index} className={`hotspot-item priority-${hotspot.priority}`}>
                    <div className="hotspot-rank">#{index + 1}</div>
                    <div className="hotspot-details">
                      <div className="hotspot-file">{hotspot.file}</div>
                      <div className="hotspot-stats">
                        <span className="debt-count">{hotspot.debtCount} issues</span>
                        <span className="severity-badge">{hotspot.priority.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="hotspot-temperature">
                      <span className="temp-value">{hotspot.temperature}°</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="hotspot-placeholder">
                  <p>🔍 No hotspots detected yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="heat-map-legend">
          <h4>🎨 Heat Map Legend</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color heat-p1"></span>
              <span className="legend-label">Critical (P1)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color heat-p2"></span>
              <span className="legend-label">High (P2)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color heat-p3"></span>
              <span className="legend-label">Medium (P3)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color heat-p4"></span>
              <span className="legend-label">Low (P4)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 2 Enhancement: Trend Analysis & Predictive Insights */}
      <section className="trend-analysis">
        <div className="trend-header">
          <h2>📈 DEBT TREND ANALYSIS</h2>
          <p className="trend-subtitle">Historical tracking and predictive insights</p>
        </div>
        
        <div className="trend-grid">
          <div className="trend-charts">
            <div className="trend-chart-container">
              <h3>🏗️ Debt History</h3>
              <div className="trend-chart">
                {debtData?.debtHistory ? (
                  <div className="chart-visualization">
                    <div className="chart-bars">
                      {debtData.debtHistory.slice(-7).map((entry, index) => (
                        <div key={index} className="chart-bar">
                          <div 
                            className="bar-fill"
                            style={{
                              height: `${Math.min((entry.total / Math.max(...debtData.debtHistory.map(e => e.total))) * 100, 100)}%`,
                              backgroundColor: getTrendColor(entry.total)
                            }}
                          ></div>
                          <div className="bar-label">{entry.date}</div>
                          <div className="bar-value">{entry.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chart-placeholder">
                    <div className="placeholder-content">
                      <span className="placeholder-icon">📊</span>
                      <p>Building debt history...</p>
                      <p className="placeholder-note">Run multiple scans to see trends</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="trend-predictions">
              <h3>🔮 Predictive Analysis</h3>
              <div className="prediction-cards">
                <div className="prediction-card">
                  <div className="prediction-icon">🎯</div>
                  <div className="prediction-content">
                    <div className="prediction-title">Debt Velocity</div>
                    <div className="prediction-value">
                      {debtData ? calculateDebtVelocity(debtData) : '0'} issues/day
                    </div>
                    <div className="prediction-desc">Current accumulation rate</div>
                  </div>
                </div>
                
                <div className="prediction-card">
                  <div className="prediction-icon">⏰</div>
                  <div className="prediction-content">
                    <div className="prediction-title">Time to Crisis</div>
                    <div className="prediction-value">
                      {debtData ? calculateTimeToCrisis(debtData) : '∞'} days
                    </div>
                    <div className="prediction-desc">Until P1 threshold</div>
                  </div>
                </div>
                
                <div className="prediction-card">
                  <div className="prediction-icon">🎪</div>
                  <div className="prediction-content">
                    <div className="prediction-title">Cleanup Effort</div>
                    <div className="prediction-value">
                      {debtData ? calculateCleanupEffort(debtData) : '0'} hrs
                    </div>
                    <div className="prediction-desc">Estimated fix time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="trend-insights">
            <h3>💡 Smart Insights</h3>
            <div className="insights-list">
              {debtData ? generateSmartInsights(debtData).map((insight, index) => (
                <div key={index} className={`insight-item ${insight.priority}`}>
                  <div className="insight-icon">{insight.icon}</div>
                  <div className="insight-content">
                    <div className="insight-title">{insight.title}</div>
                    <div className="insight-message">{insight.message}</div>
                    <div className="insight-action">{insight.action}</div>
                  </div>
                </div>
              )) : (
                <div className="insights-placeholder">
                  <p>🔍 Run a debt scan to generate insights</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="trend-summary">
          <h3>📊 Trend Summary</h3>
          <div className="trend-metrics">
            <div className="trend-metric">
              <div className="metric-icon">📈</div>
              <div className="metric-info">
                <div className="metric-label">Overall Trend</div>
                <div className={`metric-value trend-${debtData?.debtTrend || 'stable'}`}>
                  {debtData?.debtTrend === 'improving' ? '📈 IMPROVING' : 
                   debtData?.debtTrend === 'worsening' ? '📉 WORSENING' : '📊 STABLE'}
                </div>
              </div>
            </div>
            
            <div className="trend-metric">
              <div className="metric-icon">🎯</div>
              <div className="metric-info">
                <div className="metric-label">Debt Efficiency</div>
                <div className="metric-value">
                  {debtData ? calculateDebtEfficiency(debtData) : '0'}%
                </div>
              </div>
            </div>
            
            <div className="trend-metric">
              <div className="metric-icon">⚡</div>
              <div className="metric-info">
                <div className="metric-label">Fix Rate</div>
                <div className="metric-value">
                  {debtData ? calculateFixRate(debtData) : '0'} issues/scan
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 2 Enhancement: AI-Powered Fix Suggestions */}
      <section className="ai-suggestions">
        <div className="ai-header">
          <h2>🤖 AI-POWERED FIX SUGGESTIONS</h2>
          <p className="ai-subtitle">Smart refactoring recommendations powered by debt analysis</p>
        </div>
        
        <div className="ai-grid">
          <div className="priority-fixes">
            <h3>🎯 Priority Fixes</h3>
            <div className="fixes-list">
              {debtData ? generatePriorityFixes(debtData).map((fix, index) => (
                <div key={index} className={`fix-item priority-${fix.priority}`}>
                  <div className="fix-header">
                    <div className="fix-icon">{fix.icon}</div>
                    <div className="fix-title">{fix.title}</div>
                    <div className="fix-impact">{fix.impact} Impact</div>
                  </div>
                  <div className="fix-description">{fix.description}</div>
                  <div className="fix-actions">
                    <div className="fix-command">
                      <code>{fix.command}</code>
                    </div>
                    <div className="fix-buttons">
                      <button 
                        className="action-button primary"
                        onClick={() => triggerFix('ai-help')}
                        title="Apply AI suggestion"
                      >
                        🚀 Apply Fix
                      </button>
                      <button 
                        className="action-button secondary"
                        onClick={() => console.log('Manual fix guide:', fix)}
                        title="Show manual steps"
                      >
                        📋 Manual Steps
                      </button>
                    </div>
                  </div>
                  <div className="fix-estimate">
                    <span className="estimate-time">⏱️ {fix.estimatedTime}</span>
                    <span className="estimate-difficulty">🎯 {fix.difficulty}</span>
                  </div>
                </div>
              )) : (
                <div className="fixes-placeholder">
                  <p>🔍 Run a debt scan to generate AI suggestions</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="ai-insights">
            <h3>🧠 AI Analysis</h3>
            <div className="analysis-cards">
              <div className="analysis-card">
                <div className="card-icon">🔥</div>
                <div className="card-content">
                  <div className="card-title">Debt Hotspots</div>
                  <div className="card-value">
                    {debtData?.topHotspots ? debtData.topHotspots.length : 0} files
                  </div>
                  <div className="card-desc">Need immediate attention</div>
                </div>
              </div>
              
              <div className="analysis-card">
                <div className="card-icon">⚡</div>
                <div className="card-content">
                  <div className="card-title">Quick Wins</div>
                  <div className="card-value">
                    {debtData ? calculateQuickWins(debtData) : 0}
                  </div>
                  <div className="card-desc">Easy fixes available</div>
                </div>
              </div>
              
              <div className="analysis-card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <div className="card-title">Success Rate</div>
                  <div className="card-value">
                    {debtData ? calculateSuccessRate(debtData) : 0}%
                  </div>
                  <div className="card-desc">Fix success probability</div>
                </div>
              </div>
            </div>
            
            <div className="ai-recommendations">
              <h4>💡 Smart Recommendations</h4>
              <div className="recommendations-list">
                {debtData ? generateSmartRecommendations(debtData).map((rec, index) => (
                  <div key={index} className={`recommendation-item ${rec.type}`}>
                    <div className="rec-icon">{rec.icon}</div>
                    <div className="rec-content">
                      <div className="rec-title">{rec.title}</div>
                      <div className="rec-message">{rec.message}</div>
                    </div>
                    <div className="rec-score">{rec.score}%</div>
                  </div>
                )) : (
                  <div className="recommendations-placeholder">
                    <p>🤖 AI analysis pending...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="ai-summary">
          <h3>📊 Fix Strategy Summary</h3>
          <div className="strategy-metrics">
            <div className="strategy-item">
              <div className="strategy-icon">🎯</div>
              <div className="strategy-info">
                <div className="strategy-label">Recommended Strategy</div>
                <div className="strategy-value">
                  {debtData ? getRecommendedStrategy(debtData) : 'Analysis pending'}
                </div>
              </div>
            </div>
            
            <div className="strategy-item">
              <div className="strategy-icon">⏰</div>
              <div className="strategy-info">
                <div className="strategy-label">Total Fix Time</div>
                <div className="strategy-value">
                  {debtData ? calculateTotalFixTime(debtData) : '0'} hours
                </div>
              </div>
            </div>
            
            <div className="strategy-item">
              <div className="strategy-icon">💰</div>
              <div className="strategy-info">
                <div className="strategy-label">ROI Estimate</div>
                <div className="strategy-value">
                  {debtData ? calculateROI(debtData) : '0'}x return
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <main className="dashboard-main">
        {/* Enhanced Control Panel - Phase 2 "Debt Collector View" */}
        <section className="control-panel">
          <div className="control-row primary-controls">
            <button 
              className="scan-button primary-button"
              onClick={triggerScan}
              disabled={loading}
            >
              {loading ? '🔄 Scanning...' : '📊 SCAN DEBT'}
            </button>
            
            <button 
              className="make-disappear-button success-button"
              onClick={() => triggerFix('auto')}
              title="One-click cleanup of safe fixes"
            >
              ✨ MAKE IT DISAPPEAR
            </button>
          </div>
          
          <div className="control-row secondary-controls">
            <button 
              className="refinance-button warning-button"
              onClick={() => triggerFix('schedule')}
              title="Create a debt payment plan"
            >
              💰 REFINANCE DEBT
            </button>
            
            <button 
              className="collection-agency-button info-button"
              onClick={() => triggerFix('ai-help')}
              title="Get AI assistance for complex refactoring"
            >
              🤖 SELL TO COLLECTION AGENCY
            </button>
          </div>
          
          <div className="control-row danger-controls">
            <button 
              className="bankruptcy-button danger-button"
              onClick={() => triggerFix('nuclear')}
              title="Complete project debt elimination (nuclear option)"
            >
              💥 FILE FOR BANKRUPTCY
            </button>
          </div>
        </section>

        {/* Phase 2 Enhancement: Prominent Mafia/Guido Warnings */}
        {debtData && debtData.guidoAppearance && debtData.guidoAppearance.triggered && (
          <section className="guido-warning">
            <div className="guido-header">
              <h1>🤌 GUIDO THE THUMB CRUSHER HAS ARRIVED 🤌</h1>
            </div>
            <div className="guido-message">
              {debtData.guidoAppearance.message}
            </div>
            {debtData.guidoAppearance.daysOverdue > 0 && (
              <div className="guido-overdue">
                ⏰ VIGorish overdue: {debtData.guidoAppearance.daysOverdue} days
              </div>
            )}
            <div className="guido-recommendation">
              {debtData.guidoAppearance.recommendation}
            </div>
          </section>
        )}

        {debtData && debtData.mafiaStatus && debtData.mafiaStatus.triggered && (
          <section className="mafia-warning">
            <div className="mafia-header">
              <h2>🕴️ MAFIA TAKEOVER - DEBT SOLD TO THE FAMILY 🕴️</h2>
            </div>
            <div className="mafia-message">
              {debtData.mafiaStatus.message}
            </div>
            <div className="mafia-vigorish">
              💰 VIGorish Rate: {debtData.mafiaStatus.vigorishRate}% daily
              <br />
              💸 Daily Penalty: {debtData.mafiaStatus.dailyPenalty} debt units
            </div>
            <div className="mafia-recommendation">
              {debtData.mafiaStatus.recommendation}
            </div>
          </section>
        )}

        {/* Shame Level */}
        <div className="shame-level">
          <div className={`shame-indicator ${debtData.shameLevel}`}>
            {getShameMessage(debtData.shameLevel)}
          </div>
        </div>

        {/* Debt Status */}
        {debtData && (
          <section className="debt-status">
            <div className="status-header">
              <h2>💰 DEBT STATUS</h2>
              {lastScan && (
                <p className="last-scan">
                  Last scan: {new Date(lastScan).toLocaleString()}
                </p>
              )}
            </div>

            {/* Shame Level */}
            <div className="shame-level">
              <div className={`shame-indicator ${debtData.shameLevel}`}>
                {getShameMessage(debtData.shameLevel)}
              </div>
            </div>

            {/* Debt Summary */}
            <div className="debt-summary">
              <div className="debt-metric">
                <div className="metric-value" style={{ color: getDebtColor('p1') }}>
                  {debtData.summary?.p1 || 0}
                </div>
                <div className="metric-label">P1 Critical</div>
              </div>
              
              <div className="debt-metric">
                <div className="metric-value" style={{ color: getDebtColor('p2') }}>
                  {debtData.summary?.p2 || 0}
                </div>
                <div className="metric-label">P2 High</div>
              </div>
              
              <div className="debt-metric">
                <div className="metric-value" style={{ color: getDebtColor('p3') }}>
                  {debtData.summary?.p3 || 0}
                </div>
                <div className="metric-label">P3 Medium</div>
              </div>
              
              <div className="debt-metric">
                <div className="metric-value" style={{ color: getDebtColor('p4') }}>
                  {debtData.summary?.p4 || 0}
                </div>
                <div className="metric-label">P4 Low</div>
              </div>
              
              <div className="debt-metric total">
                <div className="metric-value">
                  {debtData.summary?.total || 0}
                </div>
                <div className="metric-label">Total Debt</div>
              </div>
            </div>

            {/* Debt Trend */}
            <div className="debt-trend">
              <span className="trend-label">Trend:</span>
              <span className={`trend-value ${debtData.debtTrend}`}>
                {debtData.debtTrend === 'improving' ? '📈 IMPROVING' : 
                 debtData.debtTrend === 'worsening' ? '📉 WORSENING' : '📊 STABLE'}
              </span>
            </div>
          </section>
        )}

        {/* Current Debt Details */}
        {debtData?.currentDebt && (
          <section className="debt-details">
            <h3>🔍 CURRENT DEBT BREAKDOWN</h3>
            
            {Object.entries(debtData.currentDebt).map(([priority, items]) => (
              items.length > 0 && (
                <div key={priority} className="debt-category">
                  <h4 style={{ color: getDebtColor(priority.toLowerCase()) }}>
                    {priority.toUpperCase()} - {items.length} items
                  </h4>
                  <ul className="debt-list">
                    {items.slice(0, 5).map((item, index) => (
                      <li key={index} className="debt-item">
                        {typeof item === 'string' ? item : item.description || 'Unknown debt item'}
                      </li>
                    ))}
                    {items.length > 5 && (
                      <li className="debt-item more">
                        ... and {items.length - 5} more items
                      </li>
                    )}
                  </ul>
                </div>
              )
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-tagline">"Refactor or Be Repossessed"</div>
          <div className="footer-info">
            Puberty Labs • Refuctor v{projectInfo?.refuctorVersion}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;