import React, { useState } from 'react';

const ControlPanel = ({ onScanDebt, onFixDebt, onNuclearOption, isScanning, isFixing, scanProgress }) => {
  const [showNuclearConfirm, setShowNuclearConfirm] = useState(false);

  const handleNuclearClick = () => {
    if (!showNuclearConfirm) {
      setShowNuclearConfirm(true);
      // Auto-hide confirmation after 5 seconds
      setTimeout(() => setShowNuclearConfirm(false), 5000);
    } else {
      setShowNuclearConfirm(false);
      onNuclearOption();
    }
  };

  return (
    <div className="control-panel">
      <h2>Debt Collection Operations</h2>
      <div className="control-grid">
        <div className="control-section primary-actions">
          <button 
            className={`control-btn scan-btn ${isScanning ? 'scanning' : ''}`}
            onClick={onScanDebt}
            disabled={isScanning || isFixing}
          >
            <div className="btn-content">
              <span className="btn-icon">🔍</span>
              <div className="btn-text">
                <span className="btn-title">
                  {isScanning ? 'SCANNING...' : 'SCAN DEBT'}
                </span>
                <span className="btn-subtitle">
                  {isScanning ? `${scanProgress}% complete` : 'Audit your codebase'}
                </span>
              </div>
            </div>
            {isScanning && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            )}
          </button>

          <button 
            className={`control-btn fix-btn ${isFixing ? 'fixing' : ''}`}
            onClick={onFixDebt}
            disabled={isScanning || isFixing}
          >
            <div className="btn-content">
              <span className="btn-icon">🔧</span>
              <div className="btn-text">
                <span className="btn-title">
                  {isFixing ? 'FIXING...' : 'FIX DEBT'}
                </span>
                <span className="btn-subtitle">
                  {isFixing ? 'Eliminating debt...' : 'Auto-repair issues'}
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="control-section nuclear-section">
          <button 
            className={`control-btn nuclear-btn ${showNuclearConfirm ? 'confirm-mode' : ''}`}
            onClick={handleNuclearClick}
            disabled={isScanning || isFixing}
          >
            <div className="btn-content">
              <span className="btn-icon">
                {showNuclearConfirm ? '⚠️' : '💥'}
              </span>
              <div className="btn-text">
                <span className="btn-title">
                  {showNuclearConfirm ? 'CONFIRM NUCLEAR' : 'NUCLEAR OPTION'}
                </span>
                <span className="btn-subtitle">
                  {showNuclearConfirm 
                    ? 'Click again to execute' 
                    : 'Complete debt obliteration'
                  }
                </span>
              </div>
            </div>
          </button>
          {showNuclearConfirm && (
            <div className="nuclear-warning">
              <p>⚠️ This will attempt to fix ALL debt aggressively!</p>
              <p>Make sure your code is backed up!</p>
            </div>
          )}
        </div>
      </div>

      <div className="operation-status">
        {isScanning && (
          <div className="status-message scanning">
            <span className="status-icon">🔍</span>
            <span>Scanning codebase for technical debt...</span>
          </div>
        )}
        {isFixing && (
          <div className="status-message fixing">
            <span className="status-icon">🔧</span>
            <span>Applying automated fixes...</span>
          </div>
        )}
        {!isScanning && !isFixing && (
          <div className="status-message ready">
            <span className="status-icon">✅</span>
            <span>Ready for debt operations</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel; 