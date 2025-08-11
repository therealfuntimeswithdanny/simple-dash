import os
import sys
import subprocess
import webbrowser
import time

REQUIRED_PACKAGES = ["flask", "flask_sqlalchemy"]


def check_and_install_packages():
    import pkg_resources
    installed = {pkg.key for pkg in pkg_resources.working_set}
    missing = [pkg for pkg in REQUIRED_PACKAGES if pkg not in installed]
    if missing:
        print(f"Installing missing packages: {missing}")
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)


def start_flask_app():
    # Start the Flask app in a subprocess
    env = os.environ.copy()
    env["FLASK_ENV"] = "production"
    proc = subprocess.Popen([sys.executable, "app.py"], env=env)
    return proc


def main():
    try:
        check_and_install_packages()
    except Exception as e:
        print(f"Failed to install dependencies: {e}")
        sys.exit(1)

    proc = start_flask_app()
    time.sleep(2)  # Wait for server to start
    webbrowser.open("http://localhost:5000")
    try:
        proc.wait()
    except KeyboardInterrupt:
        proc.terminate()
        print("\nFlask app terminated.")


if __name__ == "__main__":
    main()
