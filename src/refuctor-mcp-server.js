#!/usr/bin/env node

/**
 * Refuctor MCP (Model Context Protocol) Server
 * "The Debt Broker" - Exposing debt detection capabilities across workspaces
 * 
 * This server implements the MCP protocol to allow AI assistants and other tools
 * to access Refuctor's debt detection, analysis, and cleanup capabilities.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { DebtDetector } = require('./debt-detector.js');
const { techDebtManager } = require('./techdebt-manager.js');
const { DebtIgnoreParser } = require('./debt-ignore-parser.js');
const path = require('path');
const fs = require('fs-extra');

class RefuctorMCPServer {
  constructor() {
    this.server = new Server({
      name: 'refuctor-debt-broker',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {
          debt_detection: true,
          auto_fixing: true,
          session_management: true,
          real_time_monitoring: true,
          cross_workspace_communication: true
        }
      }
    });

    this.debtDetector = new DebtDetector();
    this.ignoreParser = new DebtIgnoreParser();
    this.setupHandlers();
  }

  setupHandlers() {
    // Tool listing handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'scan_debt',
            description: 'Scan project for technical debt (markdown, spelling, security, code quality)',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the project directory to scan',
                  default: '.'
                },
                verbose: {
                  type: 'boolean',
                  description: 'Include detailed breakdown of debt issues',
                  default: false
                },
                types: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific debt types to scan for',
                  default: ['markdown', 'spelling', 'security', 'code-quality']
                }
              }
            }
          },
          {
            name: 'get_debt_status',
            description: 'Get current debt status and trends from TECHDEBT.md',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the project directory',
                  default: '.'
                }
              }
            }
          },
          {
            name: 'fix_debt',
            description: 'Attempt to auto-fix common debt issues',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the project directory',
                  default: '.'
                },
                dryRun: {
                  type: 'boolean',
                  description: 'Preview fixes without applying them',
                  default: true
                },
                types: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Types of fixes to apply',
                  default: ['markdown', 'formatting']
                }
              }
            }
          },
          {
            name: 'get_shame_report',
            description: 'Generate humorous debt shaming report with financial metaphors',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the project directory',
                  default: '.'
                }
              }
            }
          },
          {
            name: 'broadcast_debt_status',
            description: 'Broadcast debt status to other MCP clients for cross-workspace awareness',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the project directory',
                  default: '.'
                },
                workspaceName: {
                  type: 'string',
                  description: 'Name of the workspace for identification'
                }
              }
            }
          },
          {
            name: 'manage_debt_ignore',
            description: 'Manage debt ignore patterns (.debtignore file)',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the project directory',
                  default: '.'
                },
                action: {
                  type: 'string',
                  enum: ['list', 'add', 'remove', 'init'],
                  description: 'Action to perform on ignore patterns'
                },
                pattern: {
                  type: 'string',
                  description: 'Pattern to add or remove (required for add/remove actions)'
                }
              },
              required: ['action']
            }
          }
        ]
      };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'scan_debt':
            return await this.handleScanDebt(args);
          case 'get_debt_status':
            return await this.handleGetDebtStatus(args);
          case 'fix_debt':
            return await this.handleFixDebt(args);
          case 'get_shame_report':
            return await this.handleGetShameReport(args);
          case 'broadcast_debt_status':
            return await this.handleBroadcastDebtStatus(args);
          case 'manage_debt_ignore':
            return await this.handleManageDebtIgnore(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `💥 DEBT BROKER ERROR: ${error.message}\n\nEven the debt collector makes mistakes sometimes. Please check your inputs and try again.`
            }
          ],
          isError: true
        };
      }
    });
  }

  async handleScanDebt(args) {
    const { projectPath = '.', verbose = false, types = ['markdown', 'spelling', 'security', 'code-quality'] } = args;
    
    console.error('🏦 REFUCTOR DEBT BROKER: Scanning for debt...');
    
    const scanResult = await this.debtDetector.scanProject(projectPath, verbose);
    
    // Generate snarky response based on debt levels
    let response = `🏦 **REFUCTOR DEBT ANALYSIS REPORT**\n\n`;
    response += `📊 **PROJECT**: ${path.basename(path.resolve(projectPath))}\n`;
    response += `📈 **TOTAL DEBT**: ${scanResult.totalDebt} issues\n\n`;
    
    if (scanResult.totalDebt === 0) {
      response += `✅ **DEBT-FREE STATUS ACHIEVED!**\n`;
      response += `Your code is so clean it squeaks. No debt collector needed here, you absolute legend.\n\n`;
    } else {
      response += `💸 **DEBT BREAKDOWN**:\n`;
      response += `   🔥 P1 Critical: ${scanResult.p1.length} (${this.getDebtMessage('P1')})\n`;
      response += `   ⚠️  P2 High: ${scanResult.p2.length} (${this.getDebtMessage('P2')})\n`;
      response += `   📝 P3 Medium: ${scanResult.p3.length} (${this.getDebtMessage('P3')})\n`;
      response += `   🔧 P4 Low: ${scanResult.p4.length} (${this.getDebtMessage('P4')})\n\n`;
      
      if (scanResult.p1.length > 0) {
        response += `🚨 **CRITICAL DEBT ALERT**: ${scanResult.p1.length} P1 issues require immediate attention!\n`;
      }
      
      if (verbose) {
        response += `\n📋 **DETAILED BREAKDOWN**:\n`;
        for (const [priority, issues] of Object.entries({
          P1: scanResult.p1,
          P2: scanResult.p2,
          P3: scanResult.p3,
          P4: scanResult.p4
        })) {
          if (issues.length > 0) {
            response += `\n**${priority} Issues (${issues.length})**:\n`;
            issues.slice(0, 10).forEach(issue => {
              response += `   • ${issue.description} (${issue.file}:${issue.line})\n`;
            });
            if (issues.length > 10) {
              response += `   ... and ${issues.length - 10} more\n`;
            }
          }
        }
      }
    }
    
    response += `\n💡 **RECOMMENDATIONS**:\n`;
    response += `   🔧 Run "fix_debt" tool to auto-repair common issues\n`;
    response += `   📊 Use "get_debt_status" to track trends\n`;
    response += `   😱 Try "get_shame_report" for motivational debt shaming\n`;
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async handleGetDebtStatus(args) {
    const { projectPath = '.' } = args;
    
    console.error('📊 REFUCTOR DEBT BROKER: Getting debt status...');
    
    const status = await techDebtManager.getDebtStatus(projectPath);
    
    let response = `📊 **REFUCTOR DEBT STATUS REPORT**\n\n`;
    response += `📂 **PROJECT**: ${path.basename(path.resolve(projectPath))}\n`;
    
    if (status.hasDebtFile) {
      response += `✅ **DEBT TRACKING**: Active (TECHDEBT.md found)\n`;
      response += `📈 **SESSIONS TRACKED**: ${status.sessionsTracked}\n`;
      response += `⚖️  **CURRENT DEBT LEVEL**: ${status.currentDebtLevel}\n`;
      
      if (status.debtTrend === 'improving') {
        response += `📈 **TREND**: 🟢 IMPROVING (you're crushing it!)\n`;
      } else if (status.debtTrend === 'worsening') {
        response += `📉 **TREND**: 🔴 WORSENING (time to panic?)\n`;
      } else {
        response += `📊 **TREND**: 🟡 STABLE (steady as she goes)\n`;
      }
      
      response += `\n💡 **DEBT MANAGEMENT TIPS**:\n`;
      response += `   🎯 Schedule regular debt cleanup sessions\n`;
      response += `   🔄 Use the dashboard for real-time monitoring\n`;
      response += `   📈 Track progress over time\n`;
      
    } else {
      response += `⚠️  **DEBT TRACKING**: Inactive (no TECHDEBT.md)\n`;
      response += `\n💡 **SETUP RECOMMENDATION**:\n`;
      response += `   Run Refuctor CLI "init" command to start tracking debt\n`;
      response += `   Initialize debt management infrastructure\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async handleFixDebt(args) {
    const { projectPath = '.', dryRun = true, types = ['markdown', 'formatting'] } = args;
    
    console.error('🔧 REFUCTOR DEBT BROKER: Attempting auto-fixes...');
    
    let response = `🔧 **REFUCTOR AUTO-REPAIR SERVICE**\n\n`;
    response += `📂 **PROJECT**: ${path.basename(path.resolve(projectPath))}\n`;
    response += `🔍 **MODE**: ${dryRun ? 'DRY RUN (Preview Only)' : 'LIVE FIXES'}\n`;
    response += `🎯 **TYPES**: ${types.join(', ')}\n\n`;
    
    let totalFixes = 0;
    const fixResults = [];
    
    // Markdown fixes (safe and proven)
    if (types.includes('markdown')) {
      const glob = require('glob');
      const markdownFixerGoon = require('./goons/markdown-fixer');
      
      const mdFiles = glob.sync('**/*.{md,mdc}', {
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      
      response += `📝 **MARKDOWN FIXES**:\n`;
      
      if (mdFiles.length === 0) {
        response += `   No markdown files found to fix\n`;
      } else {
        for (const file of mdFiles.slice(0, 20)) { // Limit to prevent overwhelming
          try {
            const report = await markdownFixerGoon.eliminateDebt(
              path.join(projectPath, file),
              dryRun
            );
            
            if (report.fixesApplied > 0) {
              response += `   ✅ ${file}: ${report.fixesApplied} fixes ${dryRun ? 'would be' : ''} applied\n`;
              totalFixes += report.fixesApplied;
              fixResults.push({ file, fixes: report.fixesApplied, type: 'markdown' });
            }
          } catch (error) {
            response += `   ❌ ${file}: Error - ${error.message}\n`;
          }
        }
        
        if (mdFiles.length > 20) {
          response += `   ... and ${mdFiles.length - 20} more files\n`;
        }
      }
    }
    
    // Future: Add other fix types here
    if (types.includes('formatting')) {
      response += `\n🎨 **FORMATTING FIXES**:\n`;
      response += `   📦 Advanced formatting fixes coming in future updates...\n`;
    }
    
    response += `\n🎉 **REPAIR SUMMARY**:\n`;
    response += `   🔧 Total fixes ${dryRun ? 'available' : 'applied'}: ${totalFixes}\n`;
    
    if (dryRun) {
      response += `   ⚠️  This was a dry run - no actual changes made\n`;
      response += `   💡 Set dryRun=false to apply these fixes\n`;
    } else if (totalFixes > 0) {
      response += `   ✅ Your debt has been refinanced. Much better!\n`;
    } else {
      response += `   🏆 No debt found to fix. You magnificent debt-slayer!\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async handleGetShameReport(args) {
    const { projectPath = '.' } = args;
    
    console.error('😱 REFUCTOR DEBT BROKER: Generating shame report...');
    
    try {
      const shameReport = await this.debtDetector.generateShameReport(projectPath);
      
      let response = `😱 **REFUCTOR HALL OF SHAME**\n\n`;
      response += `📂 **PROJECT**: ${path.basename(path.resolve(projectPath))}\n`;
      
      if (shameReport.totalShame === 0) {
        response += `\n🏆 **CONGRATULATIONS!**\n`;
        response += `Your code is so clean it squeaks. No shame here, you absolute legend.\n`;
        response += `🎉 You've achieved debt-free status - the envy of developers everywhere!\n`;
      } else {
        response += `\n🔥 **SHAME LEVEL**: ${shameReport.shameLevel.toUpperCase()}\n`;
        response += `💸 **Total debt**: ${shameReport.totalShame} issues\n`;
        response += `🕐 **Time wasted**: ~${shameReport.timeWasted} hours\n`;
        response += `💰 **Estimated cleanup cost**: $${shameReport.cleanupCost}\n`;
        
        response += `\n🎭 **SHAME BREAKDOWN**:\n`;
        shameReport.shameItems.forEach(item => {
          response += `   ${item.emoji} ${item.description}\n`;
        });
        
        response += `\n💡 **REDEMPTION PATH**:\n`;
        response += `   1. 🔍 Run "scan_debt" to see all issues\n`;
        response += `   2. 🚨 Fix P1 critical issues immediately\n`;
        response += `   3. 📅 Schedule time for P2-P4 cleanup\n`;
        response += `   4. 🔄 Run shame report again to measure improvement\n`;
        response += `   5. 🎯 Achieve debt-free status and eternal glory\n`;
      }
      
      return {
        content: [
          {
            type: 'text',
            text: response
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `💥 **SHAME GENERATION FAILED**\n\nError: ${error.message}\n\nEven the debt collector's shame machine broke down. That's... actually pretty shameful.`
          }
        ]
      };
    }
  }

  async handleBroadcastDebtStatus(args) {
    const { projectPath = '.', workspaceName = 'Unknown Project' } = args;
    
    console.error('📡 REFUCTOR DEBT BROKER: Broadcasting debt status...');
    
    // Get current debt status
    const scanResult = await this.debtDetector.scanProject(projectPath, false);
    const status = await techDebtManager.getDebtStatus(projectPath);
    
    const broadcast = {
      workspace: workspaceName,
      path: path.resolve(projectPath),
      timestamp: new Date().toISOString(),
      debtSummary: {
        totalDebt: scanResult.totalDebt,
        p1: scanResult.p1.length,
        p2: scanResult.p2.length,
        p3: scanResult.p3.length,
        p4: scanResult.p4.length
      },
      status: {
        hasDebtFile: status.hasDebtFile,
        debtTrend: status.debtTrend,
        currentDebtLevel: status.currentDebtLevel
      },
      healthScore: this.calculateHealthScore(scanResult),
      riskLevel: this.calculateRiskLevel(scanResult)
    };
    
    // Store broadcast for cross-workspace communication
    await this.storeBroadcast(broadcast);
    
    let response = `📡 **DEBT STATUS BROADCAST**\n\n`;
    response += `🏷️  **WORKSPACE**: ${workspaceName}\n`;
    response += `📂 **PATH**: ${broadcast.path}\n`;
    response += `🕐 **TIMESTAMP**: ${broadcast.timestamp}\n`;
    response += `💯 **HEALTH SCORE**: ${broadcast.healthScore}/100\n`;
    response += `⚠️  **RISK LEVEL**: ${broadcast.riskLevel}\n\n`;
    
    response += `📊 **DEBT SUMMARY**:\n`;
    response += `   🔥 P1 Critical: ${broadcast.debtSummary.p1}\n`;
    response += `   ⚠️  P2 High: ${broadcast.debtSummary.p2}\n`;
    response += `   📝 P3 Medium: ${broadcast.debtSummary.p3}\n`;
    response += `   🔧 P4 Low: ${broadcast.debtSummary.p4}\n`;
    response += `   📈 Total: ${broadcast.debtSummary.totalDebt}\n\n`;
    
    response += `✅ **BROADCAST COMPLETE**\n`;
    response += `Status shared with other MCP clients for cross-workspace awareness.\n`;
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async handleManageDebtIgnore(args) {
    const { projectPath = '.', action, pattern } = args;
    
    console.error('🚫 REFUCTOR DEBT BROKER: Managing debt ignore patterns...');
    
    try {
      await this.ignoreParser.loadIgnorePatterns(projectPath);
      
      let response = `🚫 **DEBT IGNORE MANAGEMENT**\n\n`;
      response += `📂 **PROJECT**: ${path.basename(path.resolve(projectPath))}\n`;
      response += `🎯 **ACTION**: ${action.toUpperCase()}\n\n`;
      
      switch (action) {
        case 'list':
          const patterns = this.ignoreParser.getPatterns();
          response += `📋 **CURRENT IGNORE PATTERNS**:\n`;
          
          if (patterns.length === 0) {
            response += `   No ignore patterns configured\n`;
            response += `   💡 Use action="init" to create sample .debtignore\n`;
          } else {
            patterns.forEach((pattern, index) => {
              const isDefault = index < 6; // First 6 are default patterns
              const prefix = isDefault ? '[default]' : '[custom]';
              response += `   ${prefix} ${pattern}\n`;
            });
          }
          break;
          
        case 'add':
          if (!pattern) {
            throw new Error('Pattern is required for add action');
          }
          this.ignoreParser.addPattern(pattern);
          response += `✅ **PATTERN ADDED**: ${pattern}\n`;
          response += `💡 Update .debtignore file to persist this change\n`;
          break;
          
        case 'remove':
          if (!pattern) {
            throw new Error('Pattern is required for remove action');
          }
          this.ignoreParser.removePattern(pattern);
          response += `🗑️  **PATTERN REMOVED**: ${pattern}\n`;
          response += `💡 Update .debtignore file to persist this change\n`;
          break;
          
        case 'init':
          const ignoreFilePath = path.join(projectPath, '.debtignore');
          if (await fs.pathExists(ignoreFilePath)) {
            response += `⚠️  **ALREADY EXISTS**: .debtignore already exists\n`;
          } else {
            const sampleContent = this.ignoreParser.constructor.getSampleContent();
            await fs.writeFile(ignoreFilePath, sampleContent, 'utf8');
            response += `✅ **CREATED**: .debtignore file with sample patterns\n`;
            response += `🔧 Customize patterns as needed for your project\n`;
          }
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: response
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `💥 **IGNORE MANAGEMENT FAILED**\n\nError: ${error.message}\n\nEven the debt collector's ignore list has issues. The irony is not lost on us.`
          }
        ],
        isError: true
      };
    }
  }

  getDebtMessage(priority) {
    const messages = {
      P1: "This is fucking embarrassing. Fix it NOW.",
      P2: "We're taking back the repo. Clean this today.",
      P3: "A bit crusty. Handle it this sprint.",
      P4: "Minor blemish. But you'll pay later…"
    };
    return messages[priority] || "Unknown debt level";
  }

  calculateHealthScore(scanResult) {
    const totalIssues = scanResult.totalDebt;
    const p1Weight = scanResult.p1.length * 10;
    const p2Weight = scanResult.p2.length * 5;
    const p3Weight = scanResult.p3.length * 2;
    const p4Weight = scanResult.p4.length * 1;
    
    const weightedDebt = p1Weight + p2Weight + p3Weight + p4Weight;
    const maxScore = 100;
    const healthScore = Math.max(0, maxScore - weightedDebt);
    
    return Math.min(100, healthScore);
  }

  calculateRiskLevel(scanResult) {
    const p1Count = scanResult.p1.length;
    const p2Count = scanResult.p2.length;
    const totalDebt = scanResult.totalDebt;
    
    if (p1Count > 10 || totalDebt > 100) return 'CRITICAL';
    if (p1Count > 5 || p2Count > 10 || totalDebt > 50) return 'HIGH';
    if (p1Count > 0 || p2Count > 5 || totalDebt > 20) return 'MEDIUM';
    if (totalDebt > 0) return 'LOW';
    return 'MINIMAL';
  }

  async storeBroadcast(broadcast) {
    // Store broadcast in a shared location for cross-workspace communication
    const broadcastDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.refuctor-broadcasts');
    await fs.ensureDir(broadcastDir);
    
    const broadcastFile = path.join(broadcastDir, `${broadcast.workspace.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    await fs.writeJson(broadcastFile, broadcast, { spaces: 2 });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🏦 REFUCTOR DEBT BROKER: MCP Server started');
    console.error('💀 The Debt Collector is now available via Model Context Protocol');
    console.error('🔗 Cross-workspace debt communication enabled');
    console.error('📡 Broadcasting debt status for collective shame metrics');
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new RefuctorMCPServer();
  server.start().catch(console.error);
}

module.exports = RefuctorMCPServer; 