const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const debtDetector = require('./debt-detector');
const techDebtManager = require('./techdebt-manager');

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
            console.log('📊 Running debt scan for dashboard...');
            const results = await debtDetector.scanProject(this.projectPath);
            
            // Emit real-time update to connected clients
            this.io.emit('debt-update', {
                type: 'scan-complete',
                data: results,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: results,
                metadata: {
                    scannedAt: new Date().toISOString(),
                    projectPath: this.projectPath,
                    totalFiles: results.files?.length || 0,
                    totalViolations: this.calculateTotalViolations(results)
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
            const techDebt = await techDebtManager.loadTechDebt(this.projectPath);
            const currentScan = await debtDetector.scanProject(this.projectPath);
            
            const status = {
                summary: {
                    p1: techDebt.activePriorities?.P1?.length || 0,
                    p2: techDebt.activePriorities?.P2?.length || 0,
                    p3: techDebt.activePriorities?.P3?.length || 0,
                    p4: techDebt.activePriorities?.P4?.length || 0,
                    total: this.calculateTotalViolations(currentScan)
                },
                currentDebt: techDebt.activePriorities || {},
                resolvedCount: techDebt.resolvedSessions?.length || 0,
                lastScan: new Date().toISOString(),
                debtTrend: this.calculateDebtTrend(techDebt),
                shameLevel: this.calculateShameLevel(currentScan)
            };

            res.json({
                success: true,
                data: status,
                message: this.getStatusMessage(status.summary.total)
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Debt status is in bankruptcy court.'
            });
        }
    }

    async handleDebtHistory(req, res) {
        try {
            const techDebt = await techDebtManager.loadTechDebt(this.projectPath);
            
            res.json({
                success: true,
                data: {
                    resolvedSessions: techDebt.resolvedSessions || [],
                    totalResolved: techDebt.resolvedSessions?.length || 0,
                    activePriorities: techDebt.activePriorities || {}
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Debt history is missing. The accountant is drunk.'
            });
        }
    }

    async handleDebtFix(req, res) {
        try {
            const { fixType, targetFiles } = req.body;
            console.log(`🔧 Dashboard triggered fix: ${fixType}`);
            
            // This would integrate with our existing goon tools
            const results = { 
                message: 'Fix request received', 
                fixType, 
                targetFiles,
                status: 'queued' 
            };
            
            // Emit real-time update
            this.io.emit('debt-update', {
                type: 'fix-started',
                data: results,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: results,
                message: 'The Fixer is on the case...'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Fix failed. Even The Fixer has limits.'
            });
        }
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
            console.log('📡 Dashboard client connected');
            
            socket.on('request-debt-scan', async () => {
                try {
                    const results = await debtDetector.scanProject(this.projectPath);
                    socket.emit('debt-update', {
                        type: 'scan-complete',
                        data: results,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log('📡 Dashboard client disconnected');
            });
        });
    }

    calculateTotalViolations(scanResults) {
        if (!scanResults || !scanResults.files) return 0;
        return scanResults.files.reduce((total, file) => {
            return total + (file.violations?.length || 0);
        }, 0);
    }

    calculateDebtTrend(techDebt) {
        // Simple trend calculation based on recent sessions
        const sessions = techDebt.resolvedSessions || [];
        if (sessions.length < 2) return 'stable';
        
        const recent = sessions.slice(-3);
        const totalResolved = recent.reduce((sum, session) => {
            return sum + (session.resolved?.length || 0);
        }, 0);
        
        return totalResolved > 5 ? 'improving' : 'stable';
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

    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`🌐 Refuctor Dashboard running at http://localhost:${this.port}`);
                console.log(`📊 Monitoring project: ${this.projectPath}`);
                console.log(`💀 The Debt Collector is watching...`);
                resolve();
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🛑 Dashboard server stopped');
                resolve();
            });
        });
    }
}

module.exports = DashboardServer; 