#!/bin/bash

echo "🧪 Quick Refuctor Dashboard Test"
echo "================================="

# Check if refuctor is installed
if ! command -v refuctor &> /dev/null; then
    echo "❌ Refuctor not found. Install with:"
    echo "   npm install -g /path/to/refuctor"
    exit 1
fi

echo "📍 Testing in project: $(pwd)"
echo "🏃 Starting dashboard in background..."

# Start dashboard in background
nohup refuctor serve --no-browser > /tmp/refuctor-dashboard.log 2>&1 &
DASHBOARD_PID=$!

echo "🔌 Dashboard PID: $DASHBOARD_PID"
echo "⏳ Waiting for dashboard to start..."

# Wait for dashboard to start
sleep 5

# Test if dashboard is responding
if curl -s http://localhost:1947/api/health > /dev/null; then
    echo "✅ Dashboard is running at http://localhost:1947"
    echo "🎯 Testing project detection..."
    
    # Test project info
    PROJECT_NAME=$(curl -s http://localhost:1947/api/project/info | jq -r '.data.name' 2>/dev/null || echo "Unknown")
    echo "📁 Detected project: $PROJECT_NAME"
    
    echo ""
    echo "🎉 SUCCESS! Dashboard is working with your project data"
    echo "🌐 Open http://localhost:1947 to view the dashboard"
    echo ""
    echo "To stop dashboard: kill $DASHBOARD_PID"
else
    echo "❌ Dashboard failed to start"
    echo "📋 Check logs: tail /tmp/refuctor-dashboard.log"
    exit 1
fi 