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
      {/* Total Debt Card */}
      <div 
        className={`debt-card total-debt ${debtStatus.status}`}
        onClick={onShowModal}
        style={{ cursor: 'pointer' }}
      >
        <div className="card-header">
          <span className="card-icon">📊</span>
          <h3>Total Debt</h3>
        </div>
        <div className="total-debt-number">{totalDebt}</div>
        <div className={`debt-subtitle ${p1Count > 0 ? 'immediate' : ''}`}>
          {debtStatus.message}
        </div>
      </div>

      {/* Priority Breakdown Card */}
      <div className="debt-card priority-breakdown">
        <div className="card-header">
          <span className="card-icon">🚨</span>
          <h3>Priority Breakdown</h3>
        </div>
        <ul className="priority-list">
          <li className="priority-item">
            <div className="priority-label">
              <div className="priority-dot p1"></div>
              P1 Critical
            </div>
            <span className={`priority-count p1`}>{p1Count}</span>
          </li>
          <li className="priority-item">
            <div className="priority-label">
              <div className="priority-dot p2"></div>
              P2 High
            </div>
            <span className={`priority-count p2`}>{p2Count}</span>
          </li>
          <li className="priority-item">
            <div className="priority-label">
              <div className="priority-dot p3"></div>
              P3 Medium
            </div>
            <span className={`priority-count p3`}>{p3Count}</span>
          </li>
          <li className="priority-item">
            <div className="priority-label">
              <div className="priority-dot p4"></div>
              P4 Low
            </div>
            <span className={`priority-count p4`}>{p4Count}</span>
          </li>
        </ul>
      </div>

      {/* Debt Temperature Card */}
      <div className="debt-card debt-temperature">
        <div className="card-header">
          <span className="card-icon">🌡️</span>
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
  );
};

export default DebtMetrics; 