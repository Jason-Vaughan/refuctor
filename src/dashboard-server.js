const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { debtDetector } = require('./debt-detector');
const { techDebtManager } = require('./techdebt-manager');
const { DebtHistoryTracker } = require('./debt-history');
const { DebtIgnoreParser } = require('./debt-ignore-parser');
const { DebtModeManager } = require('./debt-mode-manager'); // NEW: Mode management
const { Accountant } = require('./goons/accountant'); // NEW: Enhanced accountant
const fs = require('fs-extra');

class DashboardServer {
    constructor(options = {}) {
        this.port = options.port || 1947;
        this.projectPath = options.projectPath || process.cwd();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // Initialize debt history tracker
        this.historyTracker = new DebtHistoryTracker(this.projectPath);
        
        // NEW: Initialize enhanced systems
        this.accountant = new Accountant();
        this.modeManager = new DebtModeManager();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketIO();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../dashboard/build')));
    }

    setupRoutes() {
        // API Routes
        this.app.get('/api/debt/scan', this.handleDebtScan.bind(this));
        this.app.get('/api/debt/status', this.handleDebtStatus.bind(this));
        this.app.get('/api/debt/history', this.handleDebtHistory.bind(this));
        this.app.post('/api/debt/fix', this.handleDebtFix.bind(this));
        this.app.get('/api/project/info', this.handleProjectInfo.bind(this));
        
        // NEW: Enhanced credit score endpoint
        this.app.get('/api/credit/score', this.handleCreditScore.bind(this));
        
        // NEW: Comprehensive financial metrics endpoint (SSOT)
        this.app.get('/api/financial/metrics', this.handleFinancialMetrics.bind(this));
        
        // NEW: Mode Management API (SSOT)
        this.app.get('/api/mode', this.handleGetMode.bind(this));
        this.app.post('/api/mode', this.handleSetMode.bind(this));
        this.app.get('/api/mode/available', this.handleGetAvailableModes.bind(this));
        this.app.post('/api/mode/auto-detect', this.handleAutoDetectMode.bind(this));
        
        // Debt Ignore Management APIs
        this.app.get('/api/debt/ignore', this.handleGetIgnorePatterns.bind(this));
        this.app.post('/api/debt/ignore', this.handleAddIgnorePattern.bind(this));
        this.app.delete('/api/debt/ignore', this.handleRemoveIgnorePattern.bind(this));
        this.app.post('/api/debt/ignore/init', this.handleInitIgnoreFile.bind(this));
        
        // NEW: Uncook the Books API
        this.app.post('/api/debt/uncook', this.handleUncookBooks.bind(this));
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'operational', 
                message: 'Debt Collector is watching...', 
                timestamp: new Date().toISOString(),
                project: this.projectPath
            });
        });

        // Serve React app for all other routes
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
        });
    }

    async handleDebtScan(req, res) {
        try {
            const results = await debtDetector.scanProject(this.projectPath);
            
            // Store scan result in history for trend analysis
            await this.historyTracker.addScanResult(results);
            
            // Get real historical data and trend analysis
            const debtHistory = await this.historyTracker.getHistory(7);
            const trendAnalysis = await this.historyTracker.getTrendAnalysis();
            const velocityAnalysis = await this.historyTracker.getVelocityAnalysis();
            
            // Enhanced results with real historical data
            const enhancedResults = {
                ...results,
                // Ensure all new fields are included
                fileDebtMap: results.fileDebtMap || {},
                topHotspots: results.topHotspots || [],
                debtTrend: trendAnalysis.trend, // Use real trend analysis
                debtHistory: debtHistory, // Real history data
                trendAnalysis: trendAnalysis,
                velocityAnalysis: velocityAnalysis,
                timestamp: new Date().toISOString()
            };
            
            // Emit real-time update to connected clients
            this.io.emit('debt-update', {
                type: 'scan-complete',
                data: enhancedResults,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: enhancedResults,
                metadata: {
                    scannedAt: new Date().toISOString(),
                    projectPath: this.projectPath,
                    totalFiles: Object.keys(enhancedResults.fileDebtMap || {}).length,
                    totalViolations: this.calculateTotalViolations(results),
                    hotspotCount: enhancedResults.topHotspots.length,
                    trendDirection: trendAnalysis.direction,
                    daysTracked: trendAnalysis.daysTracked
                }
            });
        } catch (error) {
            console.error('❌ Dashboard debt scan failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Your debt scan is in foreclosure. Try again.'
            });
        }
    }

    async handleDebtStatus(req, res) {
        try {
            const debtStatus = await techDebtManager.getDebtStatus(this.projectPath);
            const currentScan = await debtDetector.scanProject(this.projectPath);
            
            // Get real historical data and analysis
            const debtHistory = await this.historyTracker.getHistory(7);
            const trendAnalysis = await this.historyTracker.getTrendAnalysis();
            const velocityAnalysis = await this.historyTracker.getVelocityAnalysis();
            const peakAnalysis = await this.historyTracker.getPeakAnalysis();
            
            const status = {
                summary: {
                    p1: currentScan.p1?.length || 0,
                    p2: currentScan.p2?.length || 0,
                    p3: currentScan.p3?.length || 0,
                    p4: currentScan.p4?.length || 0,
                    total: this.calculateTotalViolations(currentScan),
                    // Enhanced summary with detailed breakdown
                    markdown: currentScan.summary?.markdown || 0,
                    spelling: currentScan.summary?.spelling || 0,
                    security: currentScan.summary?.security || 0,
                    dependencies: currentScan.summary?.dependencies || 0,
                    eslint: currentScan.summary?.eslint || 0,
                    typescript: currentScan.summary?.typescript || 0,
                    codeQuality: currentScan.summary?.codeQuality || 0,
                    formatting: currentScan.summary?.formatting || 0
                },
                currentDebt: {
                    P1: currentScan.p1 || [],
                    P2: currentScan.p2 || [],
                    P3: currentScan.p3 || [],
                    P4: currentScan.p4 || [],
                    Mafia: currentScan.mafia || [],
                    Guido: currentScan.guido || []
                },
                // Real Heat Map Data
                fileDebtMap: currentScan.fileDebtMap || {},
                topHotspots: currentScan.topHotspots || [],
                
                // Real Trend Analysis Data
                debtTrend: trendAnalysis.trend,
                debtHistory: debtHistory,
                trendAnalysis: trendAnalysis,
                velocityAnalysis: velocityAnalysis,
                peakAnalysis: peakAnalysis,
                
                resolvedCount: debtStatus.sessionsTracked || 0,
                lastScan: new Date().toISOString(),
                                    shameLevel: await debtDetector.getContextAwareShameLevel(currentScan, this.projectPath),
                mafiaStatus: currentScan.mafiaStatus,
                guidoAppearance: currentScan.guidoAppearance
            };

            res.json({
                success: true,
                data: status,
                message: this.getStatusMessage(status.summary.total)
            });
        } catch (error) {
            console.error('❌ Dashboard debt status failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Debt status is in bankruptcy court.'
            });
        }
    }

    // NEW: Enhanced credit score endpoint
    async handleCreditScore(req, res) {
        try {
            
            // Use the enhanced accountant to get real credit score
            const creditData = await this.accountant.calculateCreditScore(this.projectPath);
            
            console.log(`📊 Credit Score: ${creditData.score}/850 (${creditData.classification})`);
            
            res.json({
                success: true,
                creditScore: creditData.score,
                classification: creditData.classification,
                interestRate: creditData.interestRate,
                breakdown: creditData.breakdown,
                projectContext: creditData.projectContext,
                maturityIndicators: creditData.projectContext?.maturityIndicators || [],
                qualityIndicators: creditData.projectContext?.qualityIndicators || {},
                projectType: creditData.projectContext?.projectType || 'unknown',
                timestamp: new Date().toISOString(),
                message: this.getCreditScoreMessage(creditData.score, creditData.classification)
            });
            
        } catch (error) {
            console.error('💥 Credit score calculation failed:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Credit score is in technical bankruptcy. The accountant has fled to the Bahamas.'
            });
        }
    }

    // NEW: Comprehensive financial metrics endpoint (SSOT)
    async handleFinancialMetrics(req, res) {
        try {
            
            const creditScore = await this.accountant.calculateCreditScore(this.projectPath);
            const debtCostAnalysis = await this.accountant.analyzeDebtCosts(this.projectPath); // NEW: SSOT debt cost calculation
            const debtStatus = await techDebtManager.getDebtStatus(this.projectPath);
            const currentScan = await debtDetector.scanProject(this.projectPath);
            const debtHistory = await this.historyTracker.getHistory(7);
            const trendAnalysis = await this.historyTracker.getTrendAnalysis();
            const velocityAnalysis = await this.historyTracker.getVelocityAnalysis();
            const peakAnalysis = await this.historyTracker.getPeakAnalysis();

            const metrics = {
                creditScore: {
                    score: creditScore.score,
                    classification: creditScore.classification,
                    interestRate: creditScore.interestRate,
                    breakdown: creditScore.breakdown,
                    projectContext: creditScore.projectContext,
                    maturityIndicators: creditScore.projectContext?.maturityIndicators || [],
                    qualityIndicators: {
                        documentation: creditScore.projectContext?.qualityIndicators?.documentation || 0,
                        architecture: creditScore.projectContext?.qualityIndicators?.architecture || 0,
                        tooling: creditScore.projectContext?.qualityIndicators?.tooling || 0,
                        testing: creditScore.projectContext?.qualityIndicators?.testing || 0,
                        cicd: creditScore.projectContext?.qualityIndicators?.cicd || 0
                    },
                    projectType: creditScore.projectContext?.projectType || 'unknown'
                },
                debtCostAnalysis: {
                    estimatedHours: debtCostAnalysis?.estimatedHours || 0,
                    estimatedCost: debtCostAnalysis?.estimatedCost || 0,
                    compoundedCost: debtCostAnalysis?.compoundedCost || 0,
                    interestAccrued: debtCostAnalysis?.interestAccrued || 0,
                    contextInfo: debtCostAnalysis?.contextInfo || {},
                    breakdown: debtCostAnalysis?.breakdown || {}
                },
                debtStatus: {
                    summary: {
                        p1: currentScan.p1?.length || 0,
                        p2: currentScan.p2?.length || 0,
                        p3: currentScan.p3?.length || 0,
                        p4: currentScan.p4?.length || 0,
                        total: this.calculateTotalViolations(currentScan),
                        markdown: currentScan.summary?.markdown || 0,
                        spelling: currentScan.summary?.spelling || 0,
                        security: currentScan.summary?.security || 0,
                        dependencies: currentScan.summary?.dependencies || 0,
                        eslint: currentScan.summary?.eslint || 0,
                        typescript: currentScan.summary?.typescript || 0,
                        codeQuality: currentScan.summary?.codeQuality || 0,
                        formatting: currentScan.summary?.formatting || 0
                    },
                    currentDebt: {
                        P1: currentScan.p1 || [],
                        P2: currentScan.p2 || [],
                        P3: currentScan.p3 || [],
                        P4: currentScan.p4 || [],
                        Mafia: currentScan.mafia || [],
                        Guido: currentScan.guido || []
                    },
                    fileDebtMap: currentScan.fileDebtMap || {},
                    topHotspots: currentScan.topHotspots || [],
                    resolvedCount: debtStatus.sessionsTracked || 0,
                    shameLevel: await debtDetector.getContextAwareShameLevel(currentScan, this.projectPath),
                    mafiaStatus: currentScan.mafiaStatus,
                    guidoAppearance: currentScan.guidoAppearance
                },
                debtHistory: {
                    history: debtHistory,
                    trendAnalysis: trendAnalysis,
                    velocityAnalysis: velocityAnalysis,
                    peakAnalysis: peakAnalysis,
                    daysRequested: 7,
                    entriesFound: debtHistory.length,
                    hasEnoughDataForTrends: debtHistory.length >= 2
                },
                projectInfo: {
                    name: 'Unknown Project', // Will be fetched from package.json
                    version: '0.0.0', // Will be fetched from package.json
                    description: 'Project info unavailable', // Will be fetched from package.json
                    path: this.projectPath,
                    refuctorVersion: '0.1.0-beta.1'
                }
            };

            res.json({
                success: true,
                data: metrics,
                message: 'Comprehensive financial metrics calculated.'
            });
        } catch (error) {
            console.error('❌ Financial metrics calculation failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Financial metrics are in technical bankruptcy. The accountant has fled to the Bahamas.'
            });
        }
    }

    // Helper: Get snarky message for credit score
    getCreditScoreMessage(score, classification) {
        if (score >= 800) return '🌟 Elite credit! You magnificent debt-slaying machine!';
        if (score >= 750) return '💎 Prime developer! Your code is financially sound!';
        if (score >= 700) return '💼 Solid credit! You know how to manage debt!';
        if (score >= 650) return '📊 Standard credit. Room for improvement, but not bad!';
        if (score >= 600) return '⚠️ Subprime territory. Time to clean up your act!';
        if (score >= 550) return '🚨 Credit concerns detected. Guido is watching...';
        return '💀 Your credit is in foreclosure. Run. Hide. Code better.';
    }

    async handleDebtHistory(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;
            
            // Get comprehensive historical analysis
            const debtHistory = await this.historyTracker.getHistory(days);
            const trendAnalysis = await this.historyTracker.getTrendAnalysis();
            const velocityAnalysis = await this.historyTracker.getVelocityAnalysis();
            const peakAnalysis = await this.historyTracker.getPeakAnalysis();
            
            res.json({
                success: true,
                data: {
                    history: debtHistory,
                    trendAnalysis: trendAnalysis,
                    velocityAnalysis: velocityAnalysis,
                    peakAnalysis: peakAnalysis,
                    daysRequested: days,
                    entriesFound: debtHistory.length,
                    hasEnoughDataForTrends: debtHistory.length >= 2
                },
                message: `Debt history retrieved: ${debtHistory.length} entries over ${days} days`
            });
        } catch (error) {
            console.error('❌ Dashboard debt history failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Debt history is missing. The accountant is drunk.'
            });
        }
    }

    async handleDebtFix(req, res) {
        try {
            const { fixType, targetFile, category, targetFiles } = req.body;
            
            // Enhanced fix operation handling
            let results;
            
            if (targetFile && category) {
                // Category-specific fix for a file
                results = await this.handleCategoryFix(targetFile, category);
            } else if (targetFile) {
                // File-specific fix
                results = await this.handleFileFix(targetFile, fixType);
            } else {
                // Global fix (existing functionality)
                results = await this.handleGlobalFix(fixType, targetFiles);
            }
            
            // Emit real-time update
            this.io.emit('debt-update', {
                type: 'fix-started',
                data: results,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: results,
                message: `🔧 ${fixType} fix completed: ${results.message}`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Fix failed. Even The Fixer has limits.'
            });
        }
    }

    async handleFileFix(targetFile, fixType) {
        // Mock file-specific fix operation
        
        // Simulate fix time based on file type
        const fileExt = targetFile.split('.').pop();
        const fixTime = fileExt === 'md' ? 500 : fileExt === 'js' ? 1000 : 750;
        
        await new Promise(resolve => setTimeout(resolve, fixTime));
        
        return {
            targetFile,
            fixType,
            fixed: Math.floor(Math.random() * 5) + 1,
            status: 'completed',
            message: `File-specific ${fixType} fixes applied to ${targetFile.split('/').pop()}`
        };
    }

    async handleCategoryFix(targetFile, category) {
        // Mock category-specific fix operation
        
        const categoryFixes = {
            'markdown': { fixed: 3, message: 'Markdown formatting issues resolved' },
            'spelling': { fixed: 2, message: 'Spelling errors corrected' },
            'eslint-errors': { fixed: 4, message: 'ESLint errors fixed' },
            'eslint-warnings': { fixed: 6, message: 'ESLint warnings addressed' },
            'typescript': { fixed: 2, message: 'TypeScript errors resolved' },
            'console-logs': { fixed: 3, message: 'Console.log statements cleaned up' },
            'todos': { fixed: 1, message: 'TODO comments converted to issues' },
            'formatting': { fixed: 5, message: 'Code formatting standardized' }
        };
        
        const result = categoryFixes[category] || { fixed: 1, message: 'Category fixes applied' };
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            targetFile,
            category,
            status: 'completed',
            ...result,
            message: `${result.message} in ${targetFile.split('/').pop()}`
        };
    }

    async handleGlobalFix(fixType, targetFiles) {
        // Mock global fix operation - existing functionality
        const fixResults = {
            auto: { fixed: 12, remaining: 48, message: 'Safe fixes applied automatically' },
            schedule: { scheduled: 25, priority: 'p2', message: 'Debt payment plan created' },
            'ai-help': { suggestions: 8, automated: 3, message: 'AI assistance provided' },
            nuclear: { eliminated: 60, warning: 'Nuclear option executed', message: 'Complete debt elimination performed' }
        };
        
        const result = fixResults[fixType] || { message: 'Unknown fix type' };
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            fixType,
            targetFiles,
            status: 'completed',
            ...result
        };
    }

    async handleProjectInfo(req, res) {
        try {
            const packageJson = require(path.join(this.projectPath, 'package.json'));
            
            res.json({
                success: true,
                data: {
                    name: packageJson.name || 'Unknown Project',
                    version: packageJson.version || '0.0.0',
                    description: packageJson.description || 'No description available',
                    path: this.projectPath,
                    refuctorVersion: '0.1.0-beta.1'
                }
            });
        } catch (error) {
            res.json({
                success: true,
                data: {
                    name: 'Unknown Project',
                    version: '0.0.0', 
                    description: 'Project info unavailable',
                    path: this.projectPath,
                    refuctorVersion: '0.1.0-beta.1'
                }
            });
        }
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            
            // Send initial connection data
            socket.emit('connection-established', {
                message: 'Connected to Debt Collector',
                timestamp: new Date().toISOString(),
                features: ['real-time-scanning', 'live-notifications', 'progress-updates']
            });

            // Handle scan requests with progress updates
            socket.on('request-debt-scan', async () => {
                try {
                    socket.emit('scan-progress', { 
                        stage: 'initializing', 
                        message: '🔄 Initializing debt scan...',
                        progress: 0 
                    });

                    socket.emit('scan-progress', { 
                        stage: 'scanning', 
                        message: '📊 Scanning project files...',
                        progress: 25 
                    });

                    const results = await debtDetector.scanProject(this.projectPath);

                    socket.emit('scan-progress', { 
                        stage: 'analyzing', 
                        message: '🧠 Analyzing debt patterns...',
                        progress: 50 
                    });

                    // Store in history
                    await this.historyTracker.addScanResult(results);

                    socket.emit('scan-progress', { 
                        stage: 'processing', 
                        message: '📈 Processing historical trends...',
                        progress: 75 
                    });

                    // Get enhanced data
                    const debtHistory = await this.historyTracker.getHistory(7);
                    const trendAnalysis = await this.historyTracker.getTrendAnalysis();
                    const velocityAnalysis = await this.historyTracker.getVelocityAnalysis();

                    const enhancedResults = {
                        ...results,
                        fileDebtMap: results.fileDebtMap || {},
                        topHotspots: results.topHotspots || [],
                        debtTrend: trendAnalysis.trend,
                        debtHistory: debtHistory,
                        trendAnalysis: trendAnalysis,
                        velocityAnalysis: velocityAnalysis,
                        timestamp: new Date().toISOString()
                    };

                    socket.emit('scan-progress', { 
                        stage: 'complete', 
                        message: '✅ Scan complete!',
                        progress: 100 
                    });

                    // Send final results
                    socket.emit('debt-update', {
                        type: 'scan-complete',
                        data: enhancedResults,
                        timestamp: new Date().toISOString()
                    });

                    // Check for critical thresholds and send notifications
                    this.checkCriticalThresholds(socket, enhancedResults);

                } catch (error) {
                    socket.emit('scan-error', { 
                        message: error.message,
                        timestamp: new Date().toISOString() 
                    });
                    socket.emit('error', { message: error.message });
                }
            });

            // Handle fix requests with progress tracking
            socket.on('request-fix', async (data) => {
                try {
                    const { fixType, targetFiles } = data;
                    
                    socket.emit('fix-progress', {
                        stage: 'starting',
                        fixType: fixType,
                        message: `🔧 Starting ${fixType} fix...`,
                        progress: 0
                    });

                    // Simulate fix progress (real implementation would vary)
                    setTimeout(() => {
                        socket.emit('fix-progress', {
                            stage: 'processing',
                            fixType: fixType,
                            message: `⚡ Processing ${fixType} fixes...`,
                            progress: 50
                        });
                    }, 1000);

                    setTimeout(() => {
                        socket.emit('fix-progress', {
                            stage: 'complete',
                            fixType: fixType,
                            message: `✅ ${fixType} fixes applied!`,
                            progress: 100
                        });

                        // Trigger automatic rescan after fix
                        socket.emit('auto-rescan', {
                            reason: 'fix-applied',
                            fixType: fixType,
                            message: 'Rescanning to verify fixes...'
                        });
                    }, 2000);

                } catch (error) {
                    socket.emit('fix-error', { 
                        message: error.message,
                        fixType: data?.fixType,
                        timestamp: new Date().toISOString() 
                    });
                }
            });

            // Handle real-time monitoring toggle
            socket.on('toggle-monitoring', (enabled) => {
                if (enabled) {
                    socket.join('monitoring');
                    socket.emit('monitoring-status', { 
                        enabled: true, 
                        message: '👁️ Real-time monitoring enabled' 
                    });
                } else {
                    socket.leave('monitoring');
                    socket.emit('monitoring-status', { 
                        enabled: false, 
                        message: '⏸️ Real-time monitoring paused' 
                    });
                }
            });

            socket.on('disconnect', () => {
            });
        });

        // Periodic health checks for monitoring clients
        setInterval(() => {
            this.io.to('monitoring').emit('health-check', {
                timestamp: new Date().toISOString(),
                server: 'operational',
                clients: this.io.engine.clientsCount
            });
        }, 30000); // Every 30 seconds
    }

    // New method: Check for critical debt thresholds and send notifications
    checkCriticalThresholds(socket, scanResults) {
        const total = this.calculateTotalViolations(scanResults);
        const p1Count = scanResults.p1?.length || 0;
        const hasGuido = scanResults.guidoAppearance?.triggered;
        const hasMafia = scanResults.mafiaStatus?.triggered;

        // Critical debt threshold breach
        if (total > 50) {
            socket.emit('critical-alert', {
                type: 'debt-critical',
                severity: 'critical',
                title: '🚨 CRITICAL DEBT DETECTED',
                message: `${total} total debt issues detected. Immediate action required!`,
                action: 'Review and fix critical issues',
                timestamp: new Date().toISOString()
            });
        }

        // P1 issues detected
        if (p1Count > 0) {
            socket.emit('priority-alert', {
                type: 'p1-detected',
                severity: 'high',
                title: '⚠️ P1 Critical Issues',
                message: `${p1Count} P1 critical issues require immediate attention`,
                action: 'Fix P1 issues now',
                timestamp: new Date().toISOString()
            });
        }

        // Guido deployment
        if (hasGuido) {
            socket.emit('guido-alert', {
                type: 'guido-deployed',
                severity: 'extreme',
                title: '🤌 GUIDO THE THUMB CRUSHER DEPLOYED',
                message: 'Your code debt is so extreme, Guido has been dispatched!',
                action: 'Fix immediately or face the consequences',
                timestamp: new Date().toISOString()
            });
        }

        // Mafia takeover
        if (hasMafia) {
            socket.emit('mafia-alert', {
                type: 'mafia-takeover',
                severity: 'extreme',
                title: '🕴️ DEBT SOLD TO THE FAMILY',
                message: 'Your technical debt has been sold to private investors',
                action: 'Debt refinancing required immediately',
                timestamp: new Date().toISOString()
            });
        }
    }

    calculateTotalViolations(scanResults) {
        if (!scanResults) return 0;
        // New debt detector returns totalDebt directly
        return scanResults.totalDebt || 0;
    }

    calculateDebtTrend(debtStatus) {
        // Simple trend calculation based on current debt level
        if (!debtStatus || !debtStatus.currentDebtLevel) return 'stable';
        
        const level = debtStatus.currentDebtLevel;
        if (level.includes('ZERO')) return 'improving';
        if (level.includes('CRITICAL') || level.includes('MAFIA') || level.includes('GUIDO')) return 'worsening';
        
        return 'stable';
    }

    calculateShameLevel(scanResults) {
        const total = this.calculateTotalViolations(scanResults);
        if (total === 0) return 'debt-free';
        if (total < 5) return 'minor-issues';
        if (total < 20) return 'needs-attention';
        if (total < 50) return 'embarrassing';
        return 'bankruptcy-imminent';
    }

    getStatusMessage(totalViolations) {
        if (totalViolations === 0) return '🎉 Debt-free! You magnificent debt-slayer!';
        if (totalViolations < 5) return '⚠️ Minor debt detected. Handle it before it breeds.';
        if (totalViolations < 20) return '🚨 Debt levels rising. Time to call The Fixer.';
        if (totalViolations < 50) return '💀 This is fucking embarrassing. Fix it NOW.';
        return '⚰️ Your code is in foreclosure. Guido is on his way.';
    }

    // Debt Ignore Management API Handlers
    async handleGetIgnorePatterns(req, res) {
        try {
            const ignoreParser = new DebtIgnoreParser();
            await ignoreParser.loadIgnorePatterns(this.projectPath);
            const patterns = ignoreParser.getPatterns();
            
            // Separate default and custom patterns
            const defaultPatterns = patterns.slice(0, 6);
            const customPatterns = patterns.slice(6);
            
            res.json({
                success: true,
                data: {
                    default: defaultPatterns,
                    custom: customPatterns,
                    total: patterns.length
                },
                message: `Found ${patterns.length} ignore patterns`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to load ignore patterns'
            });
        }
    }

    async handleAddIgnorePattern(req, res) {
        try {
            const { pattern } = req.body;
            if (!pattern) {
                return res.status(400).json({
                    success: false,
                    error: 'Pattern is required',
                    message: 'Please provide a pattern to add'
                });
            }

            const ignoreParser = new DebtIgnoreParser();
            await ignoreParser.loadIgnorePatterns(this.projectPath);
            
            // Check if pattern already exists
            if (ignoreParser.getPatterns().includes(pattern)) {
                return res.status(409).json({
                    success: false,
                    error: 'Pattern already exists',
                    message: `Pattern "${pattern}" is already in ignore list`
                });
            }

            // Add pattern to .debtignore file
            const ignoreFilePath = path.join(this.projectPath, '.debtignore');
            const content = await fs.pathExists(ignoreFilePath) 
                ? await fs.readFile(ignoreFilePath, 'utf8') 
                : DebtIgnoreParser.getSampleContent();
            
            const newContent = content + `\n# Added via dashboard\n${pattern}\n`;
            await fs.writeFile(ignoreFilePath, newContent, 'utf8');

            res.json({
                success: true,
                data: { pattern },
                message: `🚫 Added ignore pattern: ${pattern}`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to add ignore pattern'
            });
        }
    }

    async handleRemoveIgnorePattern(req, res) {
        try {
            const { pattern } = req.body;
            if (!pattern) {
                return res.status(400).json({
                    success: false,
                    error: 'Pattern is required',
                    message: 'Please provide a pattern to remove'
                });
            }

            const ignoreFilePath = path.join(this.projectPath, '.debtignore');
            if (!await fs.pathExists(ignoreFilePath)) {
                return res.status(404).json({
                    success: false,
                    error: '.debtignore file not found',
                    message: 'No ignore file exists to remove patterns from'
                });
            }

            // Read and filter out the pattern
            const content = await fs.readFile(ignoreFilePath, 'utf8');
            const lines = content.split('\n');
            const filteredLines = lines.filter(line => line.trim() !== pattern);

            if (lines.length === filteredLines.length) {
                return res.status(404).json({
                    success: false,
                    error: 'Pattern not found',
                    message: `Pattern "${pattern}" not found in ignore list`
                });
            }

            await fs.writeFile(ignoreFilePath, filteredLines.join('\n'), 'utf8');

            res.json({
                success: true,
                data: { pattern },
                message: `🗑️ Removed ignore pattern: ${pattern}`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to remove ignore pattern'
            });
        }
    }

    async handleInitIgnoreFile(req, res) {
        try {
            const ignoreFilePath = path.join(this.projectPath, '.debtignore');
            
            if (await fs.pathExists(ignoreFilePath)) {
                return res.status(409).json({
                    success: false,
                    error: '.debtignore already exists',
                    message: 'Ignore file already exists in this project'
                });
            }

            const sampleContent = DebtIgnoreParser.getSampleContent();
            await fs.writeFile(ignoreFilePath, sampleContent, 'utf8');

            res.json({
                success: true,
                data: { path: ignoreFilePath },
                message: '🏖️ Created .debtignore with sample patterns'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to create ignore file'
            });
        }
    }

    async handleUncookBooks(req, res) {
        try {
            const { mode = 'chunked', chunkSize = 10, maxChunks = 20, maxFiles = 25 } = req.body;
            
            // Emit progress update for real-time UI feedback
            this.io.emit('uncook-progress', {
                stage: 'starting',
                message: '🍳 Starting un-cook operation...',
                progress: 0
            });
            
            const uncookOptions = {
                chunkSize: parseInt(chunkSize),
                maxChunks: parseInt(maxChunks),
                maxFiles: parseInt(maxFiles)
            };
            
            // Use the correct method name from accountant
            const uncookResult = await this.accountant.uncookTheBooks(this.projectPath, uncookOptions);
            
            // Emit completion update
            this.io.emit('uncook-progress', {
                stage: 'complete',
                message: '🎉 Un-cook operation complete!',
                progress: 100,
                result: uncookResult
            });
            
            res.json({
                success: true,
                data: uncookResult,
                message: `🍳 Books un-cooked successfully! Processed ${uncookResult.processed || 0} files in ${uncookResult.mode} mode.`
            });
        } catch (error) {
            console.error('❌ Uncooking books failed:', error.message);
            
            // Emit error update
            this.io.emit('uncook-progress', {
                stage: 'error',
                message: `❌ Un-cook failed: ${error.message}`,
                progress: 0,
                error: error.message
            });
            
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Uncooking books failed. The accountant has fled to the Bahamas.'
            });
        }
    }

    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                resolve();
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                resolve();
            });
        });
    }

    /**
     * Mode Management API Handlers (SSOT)
     */
    
    // GET /api/mode - Get current mode
    async handleGetMode(req, res) {
        try {
            const currentMode = await this.modeManager.getCurrentMode(this.projectPath);
            const modeConfig = this.modeManager.getModeConfig(currentMode);
            const thresholds = await this.modeManager.getThresholds(this.projectPath);
            const messages = await this.modeManager.getMessages(this.projectPath);
            
            res.json({
                success: true,
                data: {
                    currentMode,
                    config: modeConfig,
                    thresholds,
                    messages
                }
            });
        } catch (error) {
            console.error('Failed to get mode:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // POST /api/mode - Set mode
    async handleSetMode(req, res) {
        try {
            const { mode } = req.body;
            if (!mode) {
                return res.status(400).json({
                    success: false,
                    error: 'Mode is required'
                });
            }
            
            const config = await this.modeManager.setMode(this.projectPath, mode.toUpperCase());
            const modeConfig = this.modeManager.getModeConfig(mode.toUpperCase());
            
            res.json({
                success: true,
                data: {
                    config,
                    modeConfig,
                    message: `Mode updated to ${modeConfig.name}`
                }
            });
        } catch (error) {
            console.error('Failed to set mode:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // GET /api/mode/available - Get all available modes
    async handleGetAvailableModes(req, res) {
        try {
            const allModes = this.modeManager.getAllModes();
            const currentMode = await this.modeManager.getCurrentMode(this.projectPath);
            
            res.json({
                success: true,
                data: {
                    modes: allModes,
                    currentMode
                }
            });
        } catch (error) {
            console.error('Failed to get available modes:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // POST /api/mode/auto-detect - Auto-detect and optionally set mode
    async handleAutoDetectMode(req, res) {
        try {
            const { apply = false } = req.body;
            
            const detectedMode = await this.modeManager.detectProjectMode(this.projectPath);
            const detectedConfig = this.modeManager.getModeConfig(detectedMode);
            const indicators = await this.modeManager.analyzeProjectIndicators(this.projectPath);
            
            let config = null;
            if (apply) {
                config = await this.modeManager.setMode(this.projectPath, detectedMode);
            }
            
            res.json({
                success: true,
                data: {
                    detectedMode,
                    detectedConfig,
                    indicators,
                    applied: apply,
                    config
                }
            });
        } catch (error) {
            console.error('Failed to auto-detect mode:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = DashboardServer;

// Start the server if this file is run directly
if (require.main === module) {
    const server = new DashboardServer();
    server.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
} 