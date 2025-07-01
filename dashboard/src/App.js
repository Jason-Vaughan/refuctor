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
      const response = await fetch('/api/debt/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fixType })
      });
      
      const data = await response.json();
      console.log('🔧 Fix triggered:', data.message);
      
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

      {/* Main Dashboard */}
      <main className="dashboard-main">
        {/* Control Panel */}
        <section className="control-panel">
          <button 
            className="scan-button primary-button"
            onClick={triggerScan}
            disabled={loading}
          >
            {loading ? '🔄 Scanning...' : '📊 SCAN DEBT'}
          </button>
          
          <button 
            className="fix-button secondary-button"
            onClick={() => triggerFix('auto')}
          >
            🔧 FIX DEBT
          </button>
          
          <button 
            className="nuclear-button danger-button"
            onClick={() => triggerFix('nuclear')}
          >
            💥 NUCLEAR OPTION
          </button>
        </section>

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