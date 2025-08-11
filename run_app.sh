#!/bin/bash

# --- CHECK FOR PYTHON ---
# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 to run this application."
    exit 1
fi
echo "Python 3 found."

# --- VIRTUAL ENVIRONMENT SETUP ---
# Check if the virtual environment exists, if not, create it
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating a new one..."
    python3 -m venv venv
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# --- INSTALL DEPENDENCIES ---
# Check if requirements.txt exists and install dependencies
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
else
    echo "requirements.txt not found. Skipping dependency installation."
fi

# --- RUN THE FLASK APP ---
echo "Starting the Flask app..."
# You can set Flask environment variables here if needed
export FLASK_APP=app.py
export FLASK_RUN_PORT=5000
flask run