🧪 COMPLETE REFUCTOR DASHBOARD TESTING - BiTCH PROJECT

Copy-paste this entire section to test Refuctor dashboard in your external project

---

🛑 FIRST: Stop Any Running Refuctor Instances

# Kill any existing dashboard processes to free up port 1947
pkill -f "dashboard-server.js" 2>/dev/null || true
pkill -f "refuctor serve" 2>/dev/null || true

---

📦 STEP 1: Install Fixed Refuctor Version

# Install the fixed local version (with dashboard build files)
npm install -g /Users/jasonvaughan/Documents/Projects/Refuctor

# Verify installation
refuctor --version

---

🧪 STEP 2: Test Dashboard (Choose ONE Method)

🚀 METHOD A: Simple Background Start (Recommended)

echo "🧪 Testing Refuctor Dashboard in $(pwd)"
echo "Starting dashboard in background..."

# Start dashboard in background (non-blocking)
nohup refuctor serve --no-browser > /tmp/refuctor-dashboard.log 2>&1 &
DASHBOARD_PID=$!

echo "Dashboard PID: $DASHBOARD_PID"
echo "Waiting for startup..."
sleep 5

# Test if running
if curl -s http://localhost:1947/api/health > /dev/null; then
    echo "✅ Dashboard running at http://localhost:1947"
    PROJECT_NAME=$(curl -s http://localhost:1947/api/project/info | jq -r '.data.name' 2>/dev/null || echo "Unknown")
    echo "📁 Project detected: $PROJECT_NAME"
    echo ""
    echo "🎉 SUCCESS! Open http://localhost:1947 to view dashboard"
    echo "To stop later: kill $DASHBOARD_PID"
else
    echo "❌ Dashboard failed. Check: tail /tmp/refuctor-dashboard.log"
fi

🚀 METHOD B: Two Terminal Method

Terminal 1:
# Start dashboard (keeps terminal open)
refuctor serve --no-browser
# Leave this running

Terminal 2:
# Continue testing in second terminal
refuctor init
refuctor scan
echo "Dashboard should be at http://localhost:1947"

---

🔍 STEP 3: Validate Dashboard Functionality

# Test core functionality
refuctor init
refuctor scan

# Test API endpoints
echo "Testing API..."
curl -s http://localhost:1947/api/project/info | jq '.data.name'
curl -s http://localhost:1947/api/debt/status | jq '.success'

echo ""
echo "🌐 Open http://localhost:1947 in browser to see full dashboard"

---

✅ WHAT SHOULD WORK NOW

Dashboard Display:
- ✅ Loads without ENOENT errors
- ✅ Shows YOUR project name prominently at top  
- ✅ Displays your actual project files and debt data
- ✅ Positive debt numbers (no negatives)
- ✅ Real-time debt analysis for YOUR project

Validation Points:
- ✅ Project name shows in blue header section
- ✅ File debt breakdown shows your actual files
- ✅ No "Cannot find build/index.html" errors
- ✅ Dashboard is non-blocking (you can run other commands)

---

🐛 IF SOMETHING FAILS

Common Issues:

1. Port 1947 in use:
   # Check what's using the port
   lsof -i :1947
   # Kill the process
   kill $(lsof -t -i:1947)

2. ENOENT errors:
   # Make sure you installed the LOCAL version
   which refuctor
   # Should show local path, not global npm

3. Dashboard won't load:
   # Check the logs
   tail /tmp/refuctor-dashboard.log

---

📋 TESTING REPORT TEMPLATE

REFUCTOR DASHBOARD TEST RESULTS:

PROJECT: [Your project name here]
INSTALLATION: [✅ Success / ❌ Failed]
DASHBOARD STARTUP: [✅ Success / ❌ Failed]  
PROJECT DETECTION: [✅ Shows my project / ❌ Generic data]
FILE ANALYSIS: [✅ Shows my files / ❌ No files shown]
DEBT NUMBERS: [✅ Positive / ❌ Negative / ❌ Zero]

ERRORS ENCOUNTERED:
[List any error messages]

DASHBOARD URL WORKING: [✅ Yes / ❌ No]
SHOWS MY PROJECT DATA: [✅ Yes / ❌ No]

ADDITIONAL NOTES:
[Any other observations]

---

🛑 CLEANUP WHEN DONE

# Stop dashboard
kill $DASHBOARD_PID 2>/dev/null || pkill -f "refuctor serve"

# Optional: Uninstall test version
# npm uninstall -g @puberty-labs/refuctor

---

🎯 The key test: Dashboard should show YOUR project's name and files, not generic placeholders! 