import React from 'react';
import './DebtMetrics.css';

const DebtMetrics = ({ debtData, onShowModal }) => {
  // Provide mock data for development when no real data is available
  const mockData = {
    summary: {
      total: 93,
      p1: 2,
      p2: 15,
      p3: 23,
      p4: 53,
      debtLevel: 'High'
    }
  };

  // Use mock data if no real data is available
  const displayData = debtData || mockData;

  if (!displayData || !displayData.summary) {
    return (
      <div className="debt-metrics loading">
        <div className="metric-card">
          <div className="loading-spinner"></div>
          <p>Loading debt metrics...</p>
        </div>
      </div>
    );
  }

  const { summary } = displayData;
  const totalDebt = summary.total || 0;

  // Calculate debt distribution
  const p1Count = summary.p1 || 0;
  const p2Count = summary.p2 || 0;
  const p3Count = summary.p3 || 0;
  const p4Count = summary.p4 || 0;

  const getDebtStatus = () => {
    if (totalDebt === 0) return { status: 'clean', message: 'Zero debt, you magnificent developer!' };
    if (p1Count > 10) return { status: 'guido', message: 'Guido deployed! Fix NOW!' };
    if (totalDebt > 100) return { status: 'mafia', message: 'Mafia takeover imminent!' };
    if (p1Count > 0) return { status: 'critical', message: 'Critical debt detected!' };
    return { status: 'warning', message: 'Technical debt accumulating...' };
  };

  const debtStatus = getDebtStatus();

  return (
    <div className="debt-metrics">
      <div className="metrics-grid">
        <div 
          className={`metric-card total-debt ${debtStatus.status}`}
          onClick={onShowModal}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-header">
            <span className="metric-icon">📊</span>
            <h3>Total Debt</h3>
          </div>
          <div className="metric-value">
            <span className="debt-count">{totalDebt}</span>
            <span className="debt-label">issues</span>
          </div>
          <div className="metric-status">
            <span className={`status-indicator ${debtStatus.status}`}>
              {debtStatus.message}
            </span>
          </div>
        </div>

        <div className="metric-card priority-breakdown">
          <div className="metric-header">
            <span className="metric-icon">🚨</span>
            <h3>Priority Breakdown</h3>
          </div>
          <div className="priority-grid">
            <div className={`priority-item p1 ${p1Count > 0 ? 'active' : ''}`}>
              <span className="priority-label">P1 Critical</span>
              <span className="priority-count">{p1Count}</span>
            </div>
            <div className={`priority-item p2 ${p2Count > 0 ? 'active' : ''}`}>
              <span className="priority-label">P2 High</span>
              <span className="priority-count">{p2Count}</span>
            </div>
            <div className={`priority-item p3 ${p3Count > 0 ? 'active' : ''}`}>
              <span className="priority-label">P3 Medium</span>
              <span className="priority-count">{p3Count}</span>
            </div>
            <div className={`priority-item p4 ${p4Count > 0 ? 'active' : ''}`}>
              <span className="priority-label">P4 Low</span>
              <span className="priority-count">{p4Count}</span>
            </div>
          </div>
        </div>

        <div className="metric-card debt-temperature">
          <div className="metric-header">
            <span className="metric-icon">🌡️</span>
            <h3>Debt Temperature</h3>
          </div>
          <div className="temperature-display">
            <div className={`temperature-bar ${debtStatus.status}`}>
              <div 
                className="temperature-fill" 
                style={{ width: `${Math.min(100, (totalDebt / 50) * 100)}%` }}
              ></div>
            </div>
            <span className="temperature-label">
              {totalDebt === 0 ? 'Ice Cold' : 
               totalDebt < 10 ? 'Cool' :
               totalDebt < 25 ? 'Warm' :
               totalDebt < 50 ? 'Hot' : 'Burning'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtMetrics; 