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
  
  // NEW: SSOT Financial metrics from backend
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  // NEW: Mode management state (SSOT)
  const [currentMode, setCurrentMode] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);
  const [loadingMode, setLoadingMode] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [ignorePatterns, setIgnorePatterns] = useState([]);
  const [showDebtDetails, setShowDebtDetails] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);

  // NEW: Fetch comprehensive financial metrics (SSOT)
  const fetchFinancialMetrics = async () => {
    if (loadingFinancials) return;
    
    console.log('🔄 Fetching financial metrics...');
    setLoadingFinancials(true);
    try {
      const response = await fetch('/api/financial/metrics');
      console.log('📡 Response status:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Raw API response:', data);
        if (data.success) {
          setFinancialMetrics(data.data);
          console.log('✅ SSOT Financial metrics loaded successfully!');
          console.log('💰 Cost:', data.data?.debtCostAnalysis?.estimatedCost);
          console.log('🕐 Hours:', data.data?.debtCostAnalysis?.estimatedHours);
          console.log('📊 Credit:', data.data?.creditScore?.score);
        } else {
          console.error('❌ API returned success:false', data);
        }
      } else {
        console.error('❌ HTTP error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('💥 Failed to fetch financial metrics:', error);
    } finally {
      setLoadingFinancials(false);
      console.log('🏁 Financial metrics fetch completed');
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

  // Auto-fix integration handlers
  const handleFileSelect = async (filePath) => {
    try {
      console.log(`📂 Opening file: ${filePath}`);
      // TODO: Implement file viewer integration
      alert(`File selected: ${filePath}\nFile viewer integration coming soon!`);
    } catch (error) {
      console.error('💥 File selection failed:', error);
    }
  };

  const handleDebtItemClick = async (filePath, action) => {
    try {
      console.log(`🔧 Debt item action: ${action} on ${filePath}`);
      
      if (action === 'auto-fix') {
        // Trigger auto-fix for specific file
        const response = await fetch('/api/debt/fix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            fixType: 'auto',
            targetFile: filePath 
          })
        });
        
        const data = await response.json();
        console.log('🔧 File-specific fix completed:', data.message);
        
        // Refresh debt data after fix
        setTimeout(() => triggerScan(), 1000);
      } else {
        // Handle category-specific fixes
        const response = await fetch('/api/debt/fix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            fixType: 'category',
            targetFile: filePath,
            category: action 
          })
        });
        
        const data = await response.json();
        console.log(`🔧 ${action} fixes completed:`, data.message);
        
        // Refresh debt data after fix
        setTimeout(() => triggerScan(), 1000);
      }
    } catch (error) {
      console.error('💥 Debt item action failed:', error);
      alert(`Failed to ${action} debt item: ${error.message}`);
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
      // Context-aware shame levels for well-managed development projects
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
      // Legacy shame levels for production/unmanaged projects
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

  // REMOVED: Local calculations violate SSOT principle
  // Dashboard now uses accountant's context-aware calculations via API

  // NEW: Mode management functions (SSOT)
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

  // Terminal and Debt Ignore Management Functions
  const loadIgnorePatterns = async () => {
    try {
      const response = await fetch('/api/debt/ignore');
      const data = await response.json();
      if (data.success) {
        setIgnorePatterns([...data.data.default, ...data.data.custom]);
      }
    } catch (error) {
      console.error('Failed to load ignore patterns:', error);
    }
  };

  const executeTerminalCommand = async (command) => {
    const timestamp = new Date().toLocaleTimeString();
    const prompt = `refuctor@dashboard:~$ ${command}`;
    
    setTerminalHistory(prev => [...prev, { type: 'command', content: prompt, timestamp }]);
    
    try {
      // Parse command
      const parts = command.trim().split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);
      
      if (cmd === 'refuctor' && args[0] === 'ignore') {
        await handleIgnoreCommand(args.slice(1));
      } else if (cmd === 'help' || cmd === 'refuctor' && args[0] === 'help') {
        addTerminalOutput('Available commands:', 'info');
        addTerminalOutput('  refuctor ignore --list          List ignore patterns', 'info');
        addTerminalOutput('  refuctor ignore --add <pattern> Add ignore pattern', 'info');
        addTerminalOutput('  refuctor ignore --remove <pattern> Remove ignore pattern', 'info');
        addTerminalOutput('  refuctor ignore --init          Create .debtignore file', 'info');
        addTerminalOutput('  clear                          Clear terminal', 'info');
      } else if (cmd === 'clear') {
        setTerminalHistory([]);
      } else {
        addTerminalOutput(`Command not found: ${cmd}`, 'error');
        addTerminalOutput('Type "help" for available commands', 'info');
      }
    } catch (error) {
      addTerminalOutput(`Error: ${error.message}`, 'error');
    }
    
    setTerminalInput('');
  };

  const handleIgnoreCommand = async (args) => {
    if (args.length === 0 || args[0] === '--list') {
      await loadIgnorePatterns();
      addTerminalOutput('🚫 Current ignore patterns:', 'info');
      ignorePatterns.forEach((pattern, index) => {
        const isDefault = index < 6;
        const prefix = isDefault ? '[default]' : '[custom]';
        addTerminalOutput(`  ${prefix} ${pattern}`, 'info');
      });
    } else if (args[0] === '--add' && args[1]) {
      const pattern = args.slice(1).join(' ');
      try {
        const response = await fetch('/api/debt/ignore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern })
        });
        const data = await response.json();
        if (data.success) {
          addTerminalOutput(`✅ Added ignore pattern: ${pattern}`, 'success');
          await loadIgnorePatterns();
        } else {
          addTerminalOutput(`❌ Failed to add pattern: ${data.message}`, 'error');
        }
      } catch (error) {
        addTerminalOutput(`❌ Error adding pattern: ${error.message}`, 'error');
      }
    } else if (args[0] === '--remove' && args[1]) {
      const pattern = args.slice(1).join(' ');
      try {
        const response = await fetch('/api/debt/ignore', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern })
        });
        const data = await response.json();
        if (data.success) {
          addTerminalOutput(`🗑️ Removed ignore pattern: ${pattern}`, 'success');
          await loadIgnorePatterns();
        } else {
          addTerminalOutput(`❌ Failed to remove pattern: ${data.message}`, 'error');
        }
      } catch (error) {
        addTerminalOutput(`❌ Error removing pattern: ${error.message}`, 'error');
      }
    } else if (args[0] === '--init') {
      try {
        const response = await fetch('/api/debt/ignore/init', {
          method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
          addTerminalOutput('🏖️ Created .debtignore with sample patterns', 'success');
          await loadIgnorePatterns();
        } else {
          addTerminalOutput(`❌ Failed to create .debtignore: ${data.message}`, 'error');
        }
      } catch (error) {
        addTerminalOutput(`❌ Error creating .debtignore: ${error.message}`, 'error');
      }
    } else {
      addTerminalOutput('Usage: refuctor ignore [--list|--add <pattern>|--remove <pattern>|--init]', 'error');
    }
  };

  const addTerminalOutput = (content, type = 'output') => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalHistory(prev => [...prev, { type, content, timestamp }]);
  };

  const handleTerminalKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeTerminalCommand(terminalInput);
    }
  };

  const toggleTerminal = () => {
    setTerminalOpen(!terminalOpen);
    if (!terminalOpen) {
      loadIgnorePatterns();
      addTerminalOutput('🌐 Refuctor Web Terminal - Type "help" for commands', 'info');
    }
  };

  const toggleDebtDetails = () => {
    setShowDebtModal(!showDebtModal);
  };

  const closeDebtModal = () => {
    setShowDebtModal(false);
  };

  // Get actual debt counts including Guido/Mafia levels
  const getDebtCounts = (debtData) => {
    if (!debtData) return { total: 0, p1: 0, p2: 0, p3: 0, p4: 0, guido: 0, mafia: 0 };
    
    const guidoCount = debtData.currentDebt?.Guido?.length || 0;
    const mafiaCount = debtData.currentDebt?.Mafia?.length || 0;
    const p1Count = debtData.summary?.p1 || 0;
    const p2Count = debtData.summary?.p2 || 0;
    const p3Count = debtData.summary?.p3 || 0;
    const p4Count = debtData.summary?.p4 || 0;
    
    return {
      total: debtData.summary?.total || 0,
      p1: p1Count,
      p2: p2Count,
      p3: p3Count,
      p4: p4Count,
      guido: guidoCount,
      mafia: mafiaCount
    };
  };

  // Get detailed debt breakdown with file information
  const getDetailedDebtBreakdown = (debtData) => {
    if (!debtData?.summary) return [];
    
    const breakdown = [];
    const summary = debtData.summary;
    
    if (summary.markdown > 0) breakdown.push({ 
      category: 'Markdown Issues', 
      count: summary.markdown, 
      icon: '📝',
      description: 'Documentation formatting and structure issues',
      severity: 'high'
    });
    if (summary.spelling > 0) breakdown.push({ 
      category: 'Spelling Errors', 
      count: summary.spelling, 
      icon: '📚',
      description: 'Misspelled words and typos in documentation',
      severity: 'medium'
    });
    if (summary.security > 0) breakdown.push({ 
      category: 'Security Vulnerabilities', 
      count: summary.security, 
      icon: '🔒',
      description: 'Known security issues in dependencies',
      severity: 'critical'
    });
    if (summary.dependencies > 0) breakdown.push({ 
      category: 'Dependency Issues', 
      count: summary.dependencies, 
      icon: '📦',
      description: 'Outdated or problematic package dependencies',
      severity: 'medium'
    });
    if (summary.eslint > 0) breakdown.push({ 
      category: 'ESLint Issues', 
      count: summary.eslint, 
      icon: '🔧',
      description: 'Code style and quality violations',
      severity: 'medium'
    });
    if (summary.typescript > 0) breakdown.push({ 
      category: 'TypeScript Errors', 
      count: summary.typescript, 
      icon: '📘',
      description: 'Type checking and compilation errors',
      severity: 'high'
    });
    if (summary.codeQuality > 0) breakdown.push({ 
      category: 'Code Quality Issues', 
      count: summary.codeQuality, 
      icon: '💻',
      description: 'Console.log statements, TODOs, and code smells',
      severity: 'low'
    });
    if (summary.formatting > 0) breakdown.push({ 
      category: 'Formatting Issues', 
      count: summary.formatting, 
      icon: '🎨',
      description: 'Code formatting and style inconsistencies',
      severity: 'low'
    });
    
    return breakdown;
  };

  // Get top debt hotspots for modal
  const getTopHotspots = (debtData) => {
    if (!debtData?.topHotspots) return [];
    return debtData.topHotspots.slice(0, 10);
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
        {/* NEW LAYOUT: Two column upper section */}
        <div className="dashboard-grid">
          {/* Upper Left: Financial Metrics */}
          <div className="upper-left-panel">
            <div className="financial-metrics">
              <h2>💰 Financial Impact</h2>
              <div className="financial-grid">
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.creditScore?.score || 
                     calculateCreditScore(debtData)}
                  </div>
                  <div className="metric-label">Credit Score</div>
                </div>
                <div className="financial-metric">
                  <div className="metric-value">
                    {loadingFinancials ? '...' : 
                     financialMetrics?.creditScore?.classification?.replace('_', ' ') || 
                     getCreditTierLabel(debtData).split(' ')[1]}
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
                     `${calculateAPR(debtData)}%`}
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
                <div className={`shame-indicator ${debtData?.shameLevel || 'unknown'}`}>
                  {loadingFinancials ? '📊 Loading debt analysis...' : 
                 financialMetrics?.debtStatus?.shameLevel ? 
                 getShameMessage(financialMetrics.debtStatus.shameLevel) : 
                 getShameMessage(debtData?.shameLevel)}
                </div>
              </div>

              {/* Debt Summary */}
              <div className="debt-summary">
                <div className="debt-metric total clickable" onClick={toggleDebtDetails}>
                  <div className="metric-value">{getDebtCounts(debtData).total}</div>
                  <div className="metric-label">Total Debt</div>
                  <div className="metric-subtitle">Click for details</div>
                </div>
                <div className="debt-metrics-grid">
                  {/* Show Guido/Mafia levels if present */}
                  {getDebtCounts(debtData).guido > 0 && (
                    <div className="debt-metric guido">
                      <div className="metric-value">{getDebtCounts(debtData).guido}</div>
                      <div className="metric-label">🤌 Guido</div>
                    </div>
                  )}
                  {getDebtCounts(debtData).mafia > 0 && (
                    <div className="debt-metric mafia">
                      <div className="metric-value">{getDebtCounts(debtData).mafia}</div>
                      <div className="metric-label">🕴️ Mafia</div>
                    </div>
                  )}
                  {/* Regular P1-P4 levels */}
                  <div className="debt-metric p1">
                    <div className="metric-value">{getDebtCounts(debtData).p1}</div>
                    <div className="metric-label">P1 Critical</div>
                  </div>
                  <div className="debt-metric p2">
                    <div className="metric-value">{getDebtCounts(debtData).p2}</div>
                    <div className="metric-label">P2 High</div>
                  </div>
                  <div className="debt-metric p3">
                    <div className="metric-value">{getDebtCounts(debtData).p3}</div>
                    <div className="metric-label">P3 Medium</div>
                  </div>
                  <div className="debt-metric p4">
                    <div className="metric-value">{getDebtCounts(debtData).p4}</div>
                    <div className="metric-label">P4 Low</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW LAYOUT: Full width control panel */}
          <div className="full-width-control-panel">
            <div className="control-panel-header">
              <h2>🎯 Debt Management Operations</h2>
              <div className="control-panel-subtitle">Professional debt elimination strategies</div>
            </div>

            {/* NEW: Mode Management Controls (SSOT) */}
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
            
            {/* Terminal Toggle Button */}
            <div className="terminal-toggle-container">
              <button 
                className="terminal-toggle-button"
                onClick={toggleTerminal}
              >
                <span className="terminal-icon">🖥️</span>
                <span className="terminal-text">
                  {terminalOpen ? 'Close Terminal' : 'Open Terminal'}
                </span>
                <span className="terminal-subtitle">Debt ignore management</span>
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Interface */}
        {terminalOpen && (
          <div className="terminal-panel">
            <div className="terminal-header">
              <span className="terminal-title">🖥️ Refuctor Web Terminal</span>
              <span className="terminal-subtitle">Debt ignore pattern management</span>
              <button className="terminal-close" onClick={toggleTerminal}>✕</button>
            </div>
            <div className="terminal-content">
              <div className="terminal-output">
                {terminalHistory.map((item, index) => (
                  <div key={index} className={`terminal-line ${item.type}`}>
                    <span className="terminal-timestamp">[{item.timestamp}]</span>
                    <span className="terminal-text">{item.content}</span>
                  </div>
                ))}
              </div>
              <div className="terminal-input-container">
                <span className="terminal-prompt">refuctor@dashboard:~$</span>
                <input
                  type="text"
                  className="terminal-input"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={handleTerminalKeyPress}
                  placeholder="Type 'help' for available commands"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* New Section: File-Level Breakdown and Trend Analysis */}
        <div className="enhanced-analysis-section">
          <div className="analysis-grid">
            {/* File-Level Breakdown */}
            <div className="analysis-panel">
              <FileDebtBreakdown 
                fileDebtMap={debtData?.fileDebtMap || {}}
                onFileSelect={handleFileSelect}
                onDebtItemClick={handleDebtItemClick}
              />
            </div>
            
            {/* Trend Analysis */}
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

        {/* Debt Details Modal */}
        {showDebtModal && (
          <div className="modal-overlay" onClick={closeDebtModal}>
            <div className="debt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📊 Debt Analysis Details</h2>
                <button className="modal-close" onClick={closeDebtModal}>✕</button>
              </div>
              
              <div className="modal-content">
                {/* Summary Stats */}
                <div className="debt-summary-stats">
                  <div className="summary-stat">
                    <div className="stat-value">{getDebtCounts(debtData).total}</div>
                    <div className="stat-label">Total Issues</div>
                  </div>
                  {getDebtCounts(debtData).guido > 0 && (
                    <div className="summary-stat guido">
                      <div className="stat-value">{getDebtCounts(debtData).guido}</div>
                      <div className="stat-label">🤌 Guido Categories</div>
                    </div>
                  )}
                  <div className="summary-stat">
                    <div className="stat-value">{getTopHotspots(debtData).length}</div>
                    <div className="stat-label">Hotspot Files</div>
                  </div>
                </div>

                {/* Debt Breakdown by Category */}
                <div className="debt-breakdown-section">
                  <h3>📋 Issues by Category</h3>
                  <div className="debt-categories">
                    {getDetailedDebtBreakdown(debtData).map((item, index) => (
                      <div key={index} className={`debt-category-card ${item.severity}`}>
                        <div className="category-header">
                          <span className="category-icon">{item.icon}</span>
                          <div className="category-info">
                            <h4>{item.category}</h4>
                            <p>{item.description}</p>
                          </div>
                          <div className="category-count">{item.count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Debt Hotspots */}
                {getTopHotspots(debtData).length > 0 && (
                  <div className="hotspots-section">
                    <h3>🔥 Top Debt Hotspots</h3>
                    <div className="hotspots-list">
                      {getTopHotspots(debtData).map((hotspot, index) => (
                        <div key={index} className="hotspot-card">
                          <div className="hotspot-info">
                            <div className="hotspot-file">{hotspot.file}</div>
                            <div className="hotspot-stats">
                              <span className="hotspot-count">{hotspot.debtCount} issues</span>
                              <span className={`hotspot-priority ${hotspot.priority}`}>
                                {hotspot.priority.toUpperCase()}
                              </span>
                              <span className="hotspot-temp">🌡️ {hotspot.temperature}°</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guido Messages if present */}
                {debtData?.currentDebt?.Guido && debtData.currentDebt.Guido.length > 0 && (
                  <div className="guido-messages-section">
                    <h3>🤌 Guido's Collection Notices</h3>
                    <div className="guido-messages">
                      {debtData.currentDebt.Guido.map((message, index) => (
                        <div key={index} className="guido-message">
                          <div className="guido-text">{message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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