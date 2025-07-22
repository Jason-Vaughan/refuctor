import React, { useState, useEffect, lazy, Suspense } from 'react';
import io from 'socket.io-client';
import './App.css';
import DashboardHeader from './components/DashboardHeader';
import DebtMetrics from './components/DebtMetrics';
import ControlPanel from './components/ControlPanel';
import MobileTestingLayout from './components/MobileTestingLayout';
import './components/MobileTestingLayout.css';

// Lazy load heavy components for better performance
const FileDebtBreakdown = lazy(() => import('./components/FileDebtBreakdown'));
const TrendAnalysis = lazy(() => import('./components/TrendAnalysis'));
const AfterDarkMode = lazy(() => import('./components/AfterDarkMode'));

const App = () => {
  // Core state - streamlined from original
  const [debtData, setDebtData] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  
  // Performance optimized state
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Socket connection effect
  useEffect(() => {
    const newSocket = io('http://localhost:1947');
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

    loadDashboardData();

    return () => {
      newSocket.close();
    };
  }, []);

  // Optimized data loading
  const loadDashboardData = async () => {
    try {
      const [projectResponse, statusResponse] = await Promise.all([
        fetch('http://localhost:1947/api/project/info'),
        fetch('http://localhost:1947/api/debt/status')
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

  // Optimized scan function with progress tracking
  const triggerScan = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch('http://localhost:1947/api/debt/scan');
      const data = await response.json();
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setDebtData(data.data);
      setLastScan(data.metadata.scannedAt);
      
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
      }, 500);
    } catch (error) {
      console.error('💥 Scan failed:', error);
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // Optimized fix function
  const triggerFix = async () => {
    try {
      setIsFixing(true);
      const response = await fetch('http://localhost:1947/api/debt/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixType: 'auto' })
      });
      
      const data = await response.json();
      console.log('🔧 Fix completed:', data.message);
      
      // Refresh data after fix
      await loadDashboardData();
    } catch (error) {
      console.error('💥 Fix failed:', error);
    } finally {
      setIsFixing(false);
    }
  };

  // Nuclear option handler
  const triggerNuclearOption = async () => {
    try {
      setIsFixing(true);
      const response = await fetch('http://localhost:1947/api/debt/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixType: 'nuclear' })
      });
      
      const data = await response.json();
      console.log('💥 Nuclear option completed:', data.message);
      
      // Refresh data after nuclear fix
      await loadDashboardData();
    } catch (error) {
      console.error('💥 Nuclear option failed:', error);
    } finally {
      setIsFixing(false);
    }
  };

    // Loading state
  if (loading) {
    return (
      <MobileTestingLayout>
        <div className="dashboard loading">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading Refuctor Dashboard...</p>
          </div>
        </div>
      </MobileTestingLayout>
    );
  }

  return (
    <MobileTestingLayout>
      <div className="dashboard">
        <DashboardHeader 
          connected={connected}
          projectInfo={projectInfo}
          debtData={debtData}
        />

        <main className="dashboard-main">
          <div className="dashboard-grid">
            <DebtMetrics 
              debtData={debtData}
              onShowModal={() => setShowDebtModal(true)}
            />
            
            <ControlPanel 
              onScanDebt={triggerScan}
              onFixDebt={triggerFix}
              onNuclearOption={triggerNuclearOption}
              isScanning={isScanning}
              isFixing={isFixing}
              scanProgress={scanProgress}
            />
          </div>

          {/* Enhanced Analysis Section - Lazy Loaded */}
          <Suspense fallback={<div className="loading-component">Loading analysis...</div>}>
            <div className="enhanced-analysis">
              <FileDebtBreakdown 
                fileDebtMap={debtData?.fileDebtMap} 
                onFileSelect={(file) => console.log('File selected:', file)}
                onDebtItemClick={(item) => console.log('Debt item clicked:', item)}
              />
              <TrendAnalysis 
                debtHistory={debtData?.debtHistory}
                trendAnalysis={debtData?.trendAnalysis}
                velocityAnalysis={debtData?.velocityAnalysis}
                peakAnalysis={debtData?.peakAnalysis}
              />
            </div>
          </Suspense>
        </main>

      {/* Debt Details Modal */}
      {showDebtModal && (
        <div className="modal-overlay" onClick={() => setShowDebtModal(false)}>
          <div className="debt-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Detailed Debt Analysis</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDebtModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <Suspense fallback={<div className="loading-component">Loading details...</div>}>
                <FileDebtBreakdown 
                  fileDebtMap={debtData?.fileDebtMap} 
                  detailed={true}
                  onFileSelect={(file) => console.log('File selected:', file)}
                  onDebtItemClick={(item) => console.log('Debt item clicked:', item)}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* After Dark Mode - Lazy Loaded */}
      <Suspense fallback={null}>
        <AfterDarkMode />
      </Suspense>
      </div>
    </MobileTestingLayout>
  );
};

export default App; 