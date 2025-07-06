import React, { useState, useEffect } from 'react';
import './TrendAnalysis.css';

const TrendAnalysis = ({ debtHistory, trendAnalysis, velocityAnalysis, peakAnalysis }) => {
  const [activeTab, setActiveTab] = useState('trend'); // 'trend', 'velocity', 'breakdown'
  const [timeRange, setTimeRange] = useState('7d'); // '7d', '30d', 'all'

  // Process historical data for charting
  const processedData = React.useMemo(() => {
    if (!debtHistory || debtHistory.length === 0) return [];

    return debtHistory.map(entry => ({
      date: entry.date,
      timestamp: entry.timestamp,
      total: entry.summary.total,
      p1: entry.summary.p1,
      p2: entry.summary.p2,
      p3: entry.summary.p3,
      p4: entry.summary.p4,
      breakdown: entry.breakdown,
      shameLevel: entry.shameLevel
    }));
  }, [debtHistory]);

  // Calculate chart dimensions and scales
  const chartWidth = 400;
  const chartHeight = 200;
  const padding = 20;

  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(d => d[key] || 0));
  };

  const getMinValue = (data, key) => {
    if (!data || data.length === 0) return 0;
    return Math.min(...data.map(d => d[key] || 0));
  };

  // Create SVG path for trend line
  const createTrendPath = (data, key) => {
    if (!data || data.length === 0) return '';

    const maxValue = getMaxValue(data, key);
    const minValue = getMinValue(data, key);
    const range = maxValue - minValue || 1;

    const points = data.map((point, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
      const y = chartHeight - padding - ((point[key] - minValue) / range) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Create chart points for hover interactions
  const createChartPoints = (data, key) => {
    if (!data || data.length === 0) return [];

    const maxValue = getMaxValue(data, key);
    const minValue = getMinValue(data, key);
    const range = maxValue - minValue || 1;

    return data.map((point, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
      const y = chartHeight - padding - ((point[key] - minValue) / range) * (chartHeight - 2 * padding);
      return { x, y, value: point[key], date: point.date, ...point };
    });
  };

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'increasing': return '#ff4757';
      case 'decreasing': return '#4caf50';
      case 'stable': return '#3742fa';
      default: return '#7f8fa6';
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '📊';
      default: return '❓';
    }
  };

  const getShameLevelColor = (shameLevel) => {
    switch (shameLevel) {
      case 'debt-free': return '#4caf50';
      case 'minor-issues': return '#ffc107';
      case 'needs-attention': return '#ff9800';
      case 'embarrassing': return '#f44336';
      case 'bankruptcy-imminent': return '#8b4513';
      default: return '#7f8fa6';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!debtHistory || debtHistory.length === 0) {
    return (
      <div className="trend-analysis">
        <div className="trend-header">
          <h3>📈 Trend Analysis</h3>
        </div>
        <div className="no-trend-data">
          <div className="no-trend-message">
            <span className="no-trend-icon">📊</span>
            <h4>No Historical Data Available</h4>
            <p>Run some debt scans to start tracking trends!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trend-analysis">
      <div className="trend-header">
        <h3>📈 Trend Analysis</h3>
        <div className="trend-summary">
          <div className="summary-item">
            <span className="summary-label">Direction:</span>
            <span className={`summary-value ${trendAnalysis?.direction || 'stable'}`}>
              {getTrendIcon(trendAnalysis?.direction)} {trendAnalysis?.direction || 'stable'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Change:</span>
            <span className={`summary-value ${trendAnalysis?.changePercent > 0 ? 'negative' : 'positive'}`}>
              {trendAnalysis?.changePercent > 0 ? '+' : ''}{trendAnalysis?.changePercent || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="trend-tabs">
        <button
          className={`tab-button ${activeTab === 'trend' ? 'active' : ''}`}
          onClick={() => setActiveTab('trend')}
        >
          📈 Debt Trend
        </button>
        <button
          className={`tab-button ${activeTab === 'velocity' ? 'active' : ''}`}
          onClick={() => setActiveTab('velocity')}
        >
          🚀 Velocity
        </button>
        <button
          className={`tab-button ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          📊 Breakdown
        </button>
      </div>

      {/* Trend Chart */}
      {activeTab === 'trend' && (
        <div className="trend-chart-container">
          <div className="chart-header">
            <h4>Total Debt Over Time</h4>
            <div className="chart-stats">
              <span className="stat-item">
                Current: <strong>{processedData[processedData.length - 1]?.total || 0}</strong>
              </span>
              <span className="stat-item">
                Peak: <strong>{peakAnalysis?.peakDebt || 0}</strong>
              </span>
              <span className="stat-item">
                Days Tracked: <strong>{processedData.length}</strong>
              </span>
            </div>
          </div>
          
          <div className="chart-wrapper">
            <svg width={chartWidth} height={chartHeight} className="trend-chart">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Trend line */}
              <path
                d={createTrendPath(processedData, 'total')}
                fill="none"
                stroke={getTrendColor(trendAnalysis?.direction)}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {createChartPoints(processedData, 'total').map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={getTrendColor(trendAnalysis?.direction)}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="chart-point"
                >
                  <title>{`${point.date}: ${point.value} issues`}</title>
                </circle>
              ))}
            </svg>
            
            {/* X-axis labels */}
            <div className="chart-labels">
              {processedData.map((point, index) => (
                <div key={index} className="chart-label">
                  {formatDate(point.date)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Velocity Analysis */}
      {activeTab === 'velocity' && (
        <div className="velocity-analysis">
          <div className="velocity-header">
            <h4>Debt Velocity Analysis</h4>
            <div className="velocity-summary">
              <div className="velocity-metric">
                <span className="metric-label">Daily Change:</span>
                <span className={`metric-value ${velocityAnalysis?.velocity > 0 ? 'negative' : 'positive'}`}>
                  {velocityAnalysis?.velocity > 0 ? '+' : ''}{velocityAnalysis?.velocity || 0}
                </span>
              </div>
              <div className="velocity-metric">
                <span className="metric-label">Acceleration:</span>
                <span className={`metric-value ${velocityAnalysis?.accelerating ? 'negative' : 'positive'}`}>
                  {velocityAnalysis?.accelerating ? '⬆️ Accelerating' : '⬇️ Decelerating'}
                </span>
              </div>
            </div>
          </div>

          <div className="velocity-chart-container">
            <svg width={chartWidth} height={chartHeight} className="velocity-chart">
              {/* Grid */}
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Velocity bars */}
              {processedData.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = processedData[index - 1];
                const change = point.total - prevPoint.total;
                const maxChange = Math.max(...processedData.slice(1).map((p, i) => 
                  Math.abs(p.total - processedData[i].total)));
                const barHeight = maxChange > 0 ? (Math.abs(change) / maxChange) * (chartHeight - 2 * padding) : 0;
                const barWidth = (chartWidth - 2 * padding) / (processedData.length - 1);
                const x = padding + (index - 1) * barWidth;
                const y = change >= 0 ? chartHeight / 2 - barHeight : chartHeight / 2;
                
                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width={barWidth * 0.8}
                    height={barHeight}
                    fill={change >= 0 ? '#ff4757' : '#4caf50'}
                    opacity={0.7}
                    rx="2"
                  >
                    <title>{`${point.date}: ${change > 0 ? '+' : ''}${change} issues`}</title>
                  </rect>
                );
              })}
              
              {/* Center line */}
              <line
                x1={padding}
                y1={chartHeight / 2}
                x2={chartWidth - padding}
                y2={chartHeight / 2}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Breakdown Analysis */}
      {activeTab === 'breakdown' && (
        <div className="breakdown-analysis">
          <div className="breakdown-header">
            <h4>Debt Category Breakdown</h4>
          </div>
          
          <div className="breakdown-grid">
            {['p1', 'p2', 'p3', 'p4'].map(priority => (
              <div key={priority} className="breakdown-item">
                <div className="breakdown-item-header">
                  <h5>{priority.toUpperCase()} Issues</h5>
                  <span className="breakdown-current">
                    {processedData[processedData.length - 1]?.[priority] || 0}
                  </span>
                </div>
                <div className="breakdown-mini-chart">
                  <svg width="200" height="40" className="mini-chart">
                    <path
                      d={createTrendPath(processedData, priority)}
                      fill="none"
                      stroke={
                        priority === 'p1' ? '#ff4757' :
                        priority === 'p2' ? '#ffa502' :
                        priority === 'p3' ? '#3742fa' : '#7f8fa6'
                      }
                      strokeWidth="2"
                    />
                    {createChartPoints(processedData, priority).map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x * 0.5}
                        cy={point.y * 0.2}
                        r="2"
                        fill={
                          priority === 'p1' ? '#ff4757' :
                          priority === 'p2' ? '#ffa502' :
                          priority === 'p3' ? '#3742fa' : '#7f8fa6'
                        }
                      />
                    ))}
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Panel */}
      <div className="trend-insights">
        <h4>📊 Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-icon">📈</span>
            <div className="insight-content">
              <h5>Trend Direction</h5>
              <p>Debt is currently {trendAnalysis?.direction || 'stable'}</p>
            </div>
          </div>
          
          <div className="insight-item">
            <span className="insight-icon">🎯</span>
            <div className="insight-content">
              <h5>Peak Debt</h5>
              <p>
                {peakAnalysis?.peakDebt || 0} issues on {peakAnalysis?.peakDate ? 
                  formatDate(peakAnalysis.peakDate) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="insight-item">
            <span className="insight-icon">⚡</span>
            <div className="insight-content">
              <h5>Daily Velocity</h5>
              <p>
                {velocityAnalysis?.velocity > 0 ? '+' : ''}{velocityAnalysis?.velocity || 0} issues/day
              </p>
            </div>
          </div>
          
          <div className="insight-item">
            <span className="insight-icon">📅</span>
            <div className="insight-content">
              <h5>Tracking Period</h5>
              <p>{processedData.length} days of data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis; 