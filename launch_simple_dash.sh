#!/bin/bash
# macOS launcher for simple-dash

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    osascript -e 'display dialog "Python 3 is required. Please install it from https://www.python.org/downloads/" buttons {"OK"} default button 1'
    exit 1
fi

# Check for pip
if ! python3 -m pip --version &> /dev/null; then
    osascript -e 'display dialog "pip is required. Please install it using: python3 -m ensurepip --upgrade" buttons {"OK"} default button 1'
    exit 1
fi

# Install dependencies
python3 -m pip install --user -r requirements.txt

# Start Flask app in background
nohup python3 app.py &

# Wait for server to start (simple wait, can be improved)
sleep 2

# Open in default browser
open http://localhost:5000
