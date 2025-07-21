import React from 'react';

const DashboardHeader = ({ connected, projectInfo, debtData }) => {
  const getConnectionStatus = () => {
    if (connected) {
      return (
        <span className="connection-status connected">
          <span className="status-dot"></span>
          Connected
        </span>
      );
    } else {
      return (
        <span className="connection-status disconnected">
          <span className="status-dot"></span>
          Disconnected
        </span>
      );
    }
  };

  const getDebtLevel = () => {
    if (!debtData || !debtData.summary) return 'Unknown';
    return debtData.summary.debtLevel || 'Clean';
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <div className="refuctor-logo">
            <span className="logo-icon">🏦</span>
            <h1>Refuctor Dashboard</h1>
            <span className="tagline">The Debt Cleansing Syndicate</span>
          </div>
        </div>
        
        <div className="header-center">
          {projectInfo && (
            <div className="project-info">
              <span className="project-name">{projectInfo.name}</span>
              <span className="project-type">{projectInfo.type}</span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <div className="status-indicators">
            {getConnectionStatus()}
            <span className="debt-level">
              <span className="status-label">Debt Level:</span>
              <span className={`debt-value ${getDebtLevel().toLowerCase()}`}>
                {getDebtLevel()}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 