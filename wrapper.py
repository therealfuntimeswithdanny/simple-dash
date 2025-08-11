import os
import subprocess
import threading
import webbrowser
import time

def run_flask_app():
    """Run the shell script that sets up and starts the Flask app."""
    # Find the directory where the PyInstaller-bundled app is located
    # This is important for finding the shell script and other files
    if getattr(sys, 'frozen', False):
        # The script is running in a PyInstaller bundle
        application_path = os.path.dirname(sys.executable)
    else:
        # The script is running in a normal Python environment
        application_path = os.path.dirname(os.path.abspath(__file__))

    script_path = os.path.join(application_path, 'run_app.sh')
    
    # Make sure the script is executable
    os.chmod(script_path, 0o755)
    
    # Run the shell script
    subprocess.run(f'{script_path}', shell=True, check=True)

if __name__ == '__main__':
    # Start the Flask app in a separate thread to not block the main process
    flask_thread = threading.Thread(target=run_flask_app)
    flask_thread.daemon = True # Allows the app to exit even if the thread is running
    flask_thread.start()
    
    # Open the browser after a short delay to give the server time to start
    time.sleep(2)
    webbrowser.open_new("http://127.0.0.1:5000")
    
    # Keep the main process alive so the Flask server doesn't shut down
    # This is a simple method. For a production app, you'd use a more robust
    # solution like a simple GUI or a system tray icon.
    while True:
        time.sleep(1)