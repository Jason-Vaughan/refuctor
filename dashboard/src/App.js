import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import FileDebtBreakdown from './components/FileDebtBreakdown';
import TrendAnalysis from './components/TrendAnalysis';

const App = () => {
  const [debtData, setDebtData] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  
  // SSOT Financial metrics from backend
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  
  // Mode management state (SSOT)
  const [currentMode, setCurrentMode] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);
  const [loadingMode, setLoadingMode] = useState(false);

  // Fetch comprehensive financial metrics (SSOT)
  const fetchFinancialMetrics = async () => {
    if (loadingFinancials) return;
    
    console.log('🔄 Fetching financial metrics...');
    setLoadingFinancials(true);
    try {
      const response = await fetch('/api/financial/metrics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFinancialMetrics(data.data);
          console.log('✅ SSOT Financial metrics loaded successfully!');
        }
      }
    } catch (error) {
      console.error('💥 Failed to fetch financial metrics:', error);
    } finally {
      setLoadingFinancials(false);
    }
  };

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
      
      // Load SSOT data
      fetchFinancialMetrics();
      fetchCurrentMode();
      fetchAvailableModes();
      
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
      // Refresh financial metrics after scan
      await fetchFinancialMetrics();
    } catch (error) {
      console.error('💥 Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerFix = async (fixType) => {
    try {
      console.log(`🔧 ${fixType} fix initiated...`);
      
      const response = await fetch('/api/debt/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fixType })
      });
      
      const data = await response.json();
      console.log('🔧 Fix completed:', data.message);
      
      // Refresh data after fix
      setTimeout(() => {
        triggerScan();
      }, 2000);
    } catch (error) {
      console.error('💥 Fix failed:', error);
    }
  };

  // Mode management functions (SSOT)
  const fetchCurrentMode = async () => {
    setLoadingMode(true);
    try {
      const response = await fetch('/api/mode');
      const result = await response.json();
      if (result.success) {
        setCurrentMode(result.data);
      } else {
        console.error('Failed to fetch current mode:', result.error);
      }
    } catch (error) {
      console.error('Error fetching current mode:', error);
    } finally {
      setLoadingMode(false);
    }
  };

  const fetchAvailableModes = async () => {
    try {
      const response = await fetch('/api/mode/available');
      const result = await response.json();
      if (result.success) {
        setAvailableModes(result.data.modes);
      } else {
        console.error('Failed to fetch available modes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching available modes:', error);
    }
  };

  const switchMode = async (newMode) => {
    setLoadingMode(true);
    try {
      const response = await fetch('/api/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: newMode }),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh all data after mode change
        await fetchCurrentMode();
        await fetchFinancialMetrics();
        await loadDashboardData();
        console.log('✅ Mode switched to:', result.data.modeConfig.name);
      } else {
        console.error('Failed to switch mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching mode:', error);
    } finally {
      setLoadingMode(false);
    }
  };

  const autoDetectMode = async (apply = false) => {
    setLoadingMode(true);
    try {
      const response = await fetch('/api/mode/auto-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apply }),
      });
      const result = await response.json();
      if (result.success) {
        if (apply) {
          await fetchCurrentMode();
          await fetchFinancialMetrics();
          await loadDashboardData();
        }
        return result.data;
      } else {
        console.error('Failed to auto-detect mode:', result.error);
      }
    } catch (error) {
      console.error('Error auto-detecting mode:', error);
    } finally {
      setLoadingMode(false);
    }
  };

  const getShameMessage = (shameLevel) => {
    switch (shameLevel) {
      case 'spotless':
        return '🎉 Debt-free! You magnificent debt-slayer!';
      case 'mild embarrassment':
        return '⚠️ Minor debt detected. Handle it when convenient.';
      case 'professional responsibility':
        return '📝 Professional development debt. Schedule cleanup time.';
      case 'needs attention':
        return '🛠️ Moderate debt levels. Worth addressing in next sprint.';
      case 'documentation focused':
        return '📚 Documentation-heavy debt. Normal for active development.';
      case 'debt-free':
        return '🎉 Debt-free! You magnificent debt-slayer!';
      case 'minor-issues':
        return '⚠️ Minor debt detected. Handle it before it breeds.';
      case 'needs-attention':
        return '🚨 Debt levels rising. Time to call The Fixer.';
      case 'embarrassing':
        return '💀 This is fucking embarrassing. Fix it NOW.';
      case 'bankruptcy-imminent':
      case 'career ending':
        return '💀 This is career-ending debt. Fix it NOW.';
      case 'guido territory':
        return '⚰️ Your code is in foreclosure. Guido is on his way.';
      default:
        return '📊 Debt status unknown. Run a scan.';
    }
  };

  // Tooltip Functions
  const showTooltip = (e, content) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content: content,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const hideTooltip = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  // Tooltip Content for Each Button
  const tooltipContent = {
    scan: "Runs a comprehensive analysis of your codebase to identify technical debt across multiple categories including spelling errors, linting issues, security vulnerabilities, and code quality problems. This is your first step in the debt elimination process.",
    fix: "Automatically fixes safe, low-risk technical debt items that can be resolved without human intervention. This includes spelling corrections, import organization, and basic formatting issues. Perfect for quick wins and instant debt reduction.",
    refinance: "Restructures your technical debt by prioritizing fixes, creating payment schedules, and organizing debt into manageable chunks. This helps you tackle debt systematically rather than being overwhelmed by the total amount.",
    collectors: "Deploys AI-powered assistance to help resolve complex technical debt that requires human judgment. The AI Collection Agency provides intelligent suggestions and automated refactoring for challenging debt items.",
    bankruptcy: "The nuclear option - performs aggressive debt elimination including major refactoring, dependency updates, and structural changes. Use with caution as this can make significant changes to your codebase. Always backup first!"
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-logo-container">
            <img 
              src="/images/refuctor-logo.png" 
              alt="Refuctor Logo" 
              className="loading-logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="loading-logo fallback-loading" style={{display: 'none'}}>
              REFUCTOR
            </div>
          </div>
          <div className="loading-text">💀 The Debt Collector is awakening...</div>
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
          <div className="logo-container">
            <img 
              src="/images/refuctor-logo.png" 
              alt="Refuctor Logo" 
              className="dashboard-logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <h1 className="dashboard-title fallback-title" style={{display: 'none'}}>
              REFUCTOR
            </h1>
            <div className="dashboard-subtitle">
              "The Debt Collector" - Professional Technical Debt Management
            </div>
          </div>
          <div className="connection-status">
            <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}
            </div>
          </div>
        </div>
      </header>

      {/* Project Info */}
      {projectInfo && (
        <div className="project-info">
          <h2>{projectInfo.name}</h2>
          <div className="project-details">
            <span>{projectInfo.path}</span>
            <span className="project-version">v{projectInfo.version}</span>
            <span className="refuctor-version">Refuctor v{projectInfo.refuctorVersion}</span>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <main className="dashboard-main">
        {/* Two column upper section */}
        <div className="dashboard-grid">
          {/* Upper Left: Financial Metrics */}
          <div className="upper-left-panel">
            <div className="financial-metrics">
              <h2>💰 Financial Impact</h2>
              <div className="financial-grid">
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.creditScore?.score || 0}
                  </div>
                  <div className="metric-label">Credit Score</div>
                </div>
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.creditScore?.classification?.replace('_', ' ') || 
                     'VIBE'}
                  </div>
                  <div className="metric-label">Credit Tier</div>
                </div>
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.debtCostAnalysis?.estimatedCost ? 
                     `$${financialMetrics.debtCostAnalysis.estimatedCost}` : 
                     '$0'}
                  </div>
                  <div className="metric-label">Total Debt Cost</div>
                </div>
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.debtCostAnalysis?.estimatedHours ? 
                     `${financialMetrics.debtCostAnalysis.estimatedHours}h` : 
                     '0h'}
                  </div>
                  <div className="metric-label">Time Wasted</div>
                </div>
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.creditScore?.interestRate ? 
                     `${financialMetrics.creditScore.interestRate}%` : 
                     '0%'}
                  </div>
                  <div className="metric-label">Interest Rate (APR)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upper Right: Debt Status */}
          <div className="upper-right-panel">
            <div className="debt-status">
              <div className="status-header">
                <h2>📊 Debt Analysis</h2>
                {lastScan && (
                  <div className="last-scan">
                    Last scan: {new Date(lastScan).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Shame Level */}
              <div className="shame-level">
                <div className={`shame-indicator ${financialMetrics?.debtStatus?.shameLevel || 'unknown'}`}>
                  {loadingFinancials ? '📊 Loading debt analysis...' : 
                   financialMetrics?.debtStatus?.shameLevel ? 
                   getShameMessage(financialMetrics.debtStatus.shameLevel) : 
                   '📊 Run a scan to analyze debt'}
                </div>
              </div>

              {/* Debt Summary */}
              <div className="debt-summary">
                <div className="debt-metric total">
                  <div className="metric-value">{financialMetrics?.debtStatus?.summary?.total || 0}</div>
                  <div className="metric-label">Total Debt</div>
                  <div className="metric-subtitle">Click for details</div>
                </div>
                <div className="debt-metrics-grid">
                  {/* Show Guido/Mafia levels if present */}
                  {(financialMetrics?.debtStatus?.currentDebt?.Guido?.length || 0) > 0 && (
                    <div className="debt-metric guido">
                      <div className="metric-value">{financialMetrics?.debtStatus?.currentDebt?.Guido?.length || 0}</div>
                      <div className="metric-label">🤌 Guido</div>
                    </div>
                  )}
                  {(financialMetrics?.debtStatus?.currentDebt?.Mafia?.length || 0) > 0 && (
                    <div className="debt-metric mafia">
                      <div className="metric-value">{financialMetrics?.debtStatus?.currentDebt?.Mafia?.length || 0}</div>
                      <div className="metric-label">🕴️ Mafia</div>
                    </div>
                  )}
                  {/* Regular P1-P4 levels */}
                  <div className="debt-metric p1">
                    <div className="metric-value">{financialMetrics?.debtStatus?.summary?.p1 || 0}</div>
                    <div className="metric-label">P1 Critical</div>
                  </div>
                  <div className="debt-metric p2">
                    <div className="metric-value">{financialMetrics?.debtStatus?.summary?.p2 || 0}</div>
                    <div className="metric-label">P2 High</div>
                  </div>
                  <div className="debt-metric p3">
                    <div className="metric-value">{financialMetrics?.debtStatus?.summary?.p3 || 0}</div>
                    <div className="metric-label">P3 Medium</div>
                  </div>
                  <div className="debt-metric p4">
                    <div className="metric-value">{financialMetrics?.debtStatus?.summary?.p4 || 0}</div>
                    <div className="metric-label">P4 Low</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full width control panel */}
          <div className="full-width-control-panel">
            <div className="control-panel-header">
              <h2>🎯 Debt Management Operations</h2>
              <div className="control-panel-subtitle">Professional debt elimination strategies</div>
            </div>

            {/* Mode Management Controls (SSOT) */}
            <div className="mode-management-section">
              <div className="mode-header">
                <h3>🔧 Classification Mode</h3>
                <div className="mode-subtitle">
                  {loadingMode ? 'Loading...' : 
                   currentMode ? `Current: ${currentMode.config.emoji} ${currentMode.config.name}` : 
                   'Select debt classification mode'}
                </div>
              </div>
              
              <div className="mode-controls">
                <div className="mode-radio-group">
                  {availableModes.map((mode) => (
                    <label key={mode.key} className="mode-radio-option">
                      <input
                        type="radio"
                        name="debt-mode"
                        value={mode.key}
                        checked={currentMode?.currentMode === mode.key}
                        onChange={() => switchMode(mode.key)}
                        disabled={loadingMode}
                      />
                      <div className="mode-radio-content">
                        <div className="mode-icon">{mode.emoji}</div>
                        <div className="mode-info">
                          <div className="mode-name">{mode.name}</div>
                          <div className="mode-description">{mode.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="mode-actions">
                  <button 
                    className="mode-action-button auto-detect"
                    onClick={() => autoDetectMode(true)}
                    disabled={loadingMode}
                  >
                    🔍 Auto-Detect & Apply
                  </button>
                  <button 
                    className="mode-action-button refresh"
                    onClick={fetchCurrentMode}
                    disabled={loadingMode}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            </div>
            
            <div className="control-buttons-container">
              <button 
                className="control-button scan-button"
                onClick={triggerScan}
                disabled={loading}
                onMouseEnter={(e) => showTooltip(e, tooltipContent.scan)}
                onMouseLeave={hideTooltip}
              >
                <div className="button-icon">📊</div>
                <div className="button-text">
                  <div className="button-title">SCAN DEBT</div>
                  <div className="button-subtitle">Comprehensive analysis</div>
                </div>
              </button>

              <button 
                className="control-button fix-button"
                onClick={() => triggerFix('auto')}
                disabled={loading}
                onMouseEnter={(e) => showTooltip(e, tooltipContent.fix)}
                onMouseLeave={hideTooltip}
              >
                <div className="button-icon">✨</div>
                <div className="button-text">
                  <div className="button-title">MAKE IT DISAPPEAR</div>
                  <div className="button-subtitle">One-click cleanup of safe fixes</div>
                </div>
              </button>

              <button 
                className="control-button refinance-button"
                onClick={() => triggerFix('schedule')}
                disabled={loading}
                onMouseEnter={(e) => showTooltip(e, tooltipContent.refinance)}
                onMouseLeave={hideTooltip}
              >
                <div className="button-icon">💰</div>
                <div className="button-text">
                  <div className="button-title">REFINANCE DEBT</div>
                  <div className="button-subtitle">Restructure payment plan</div>
                </div>
              </button>

              <button 
                className="control-button collectors-button"
                onClick={() => triggerFix('ai-help')}
                disabled={loading}
                onMouseEnter={(e) => showTooltip(e, tooltipContent.collectors)}
                onMouseLeave={hideTooltip}
              >
                <div className="button-icon">🤖</div>
                <div className="button-text">
                  <div className="button-title">SELL TO COLLECTORS</div>
                  <div className="button-subtitle">AI-powered debt resolution</div>
                </div>
              </button>

              <button 
                className="control-button bankruptcy-button"
                onClick={() => triggerFix('nuclear')}
                disabled={loading}
                onMouseEnter={(e) => showTooltip(e, tooltipContent.bankruptcy)}
                onMouseLeave={hideTooltip}
              >
                <div className="button-icon">⚡</div>
                <div className="button-text">
                  <div className="button-title">FILE FOR BANKRUPTCY</div>
                  <div className="button-subtitle">Nuclear option - complete reset</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* File-Level Breakdown and Trend Analysis */}
        <div className="enhanced-analysis-section">
          <div className="analysis-grid">
            <div className="analysis-panel">
              <FileDebtBreakdown 
                fileDebtMap={debtData?.fileDebtMap || {}}
                onFileSelect={(file) => console.log('File selected:', file)}
                onDebtItemClick={(file, action) => console.log('Debt action:', action, file)}
              />
            </div>
            
            <div className="analysis-panel">
              <TrendAnalysis 
                debtHistory={debtData?.debtHistory || []}
                trendAnalysis={debtData?.trendAnalysis || {}}
                velocityAnalysis={debtData?.velocityAnalysis || {}}
                peakAnalysis={debtData?.peakAnalysis || {}}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-tagline">
            💀 Refactor or Be Repossessed 💀
          </div>
          <div className="footer-info">
            The Debt Collector © 2024 Puberty Labs
          </div>
        </div>
      </footer>

      {/* Tooltip */}
      {tooltip.show && (
        <div 
          className="tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-content">
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;