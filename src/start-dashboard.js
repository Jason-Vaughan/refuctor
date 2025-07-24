#!/usr/bin/env node

/**
 * Standalone Dashboard Starter
 * Allows dashboard to run independently in any project
 */

const DashboardServer = require('./dashboard-server');
const path = require('path');

// Get configuration from environment or command line
const port = process.env.REFUCTOR_PORT || process.argv[2] || 1947;
const projectPath = process.env.REFUCTOR_PROJECT_PATH || process.cwd();
const noBrowser = process.env.REFUCTOR_NO_BROWSER === 'true';

console.log('🌐 Starting Refuctor Dashboard Server...');
console.log(`📁 Project: ${projectPath}`);
console.log(`🔌 Port: ${port}`);

async function startDashboard() {
  try {
    const server = new DashboardServer({
      port: parseInt(port),
      projectPath: projectPath
    });
    
    await server.start();
    
    console.log('🎉 Dashboard started successfully!');
    console.log(`🌐 URL: http://localhost:${port}`);
    
    if (!noBrowser) {
      try {
        const open = await import('open');
        await open.default(`http://localhost:${port}`);
        console.log('🚀 Opening in browser...');
      } catch (error) {
        console.log('ℹ️  Open http://localhost:' + port + ' in your browser');
      }
    }
    
    // Keep process running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down dashboard...');
      await server.stop();
      console.log('✅ Dashboard stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('💥 Failed to start dashboard:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
    }
    process.exit(1);
  }
}

startDashboard(); 