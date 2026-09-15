import os
import sys
import threading
import webview
import uvicorn


def get_app_directory():
    if getattr(sys, "frozen", False):
        return sys._MEIPASS

    return os.path.dirname(
        os.path.abspath(__file__)
    )


APP_DIR = get_app_directory()

# Keep Avani's files available to the packaged application
os.chdir(APP_DIR)


def start_server():
    from main import app

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="warning"
    )


if __name__ == "__main__":

    server_thread = threading.Thread(
        target=start_server,
        daemon=True
    )

    server_thread.start()

    webview.create_window(
        "Avani",
        "http://127.0.0.1:8000",
        width=1400,
        height=900,
        min_size=(1000, 700),
        resizable=True
    )

    # Persistent browser storage for Avani
    storage_path = os.path.join(
        os.environ.get(
            "LOCALAPPDATA",
            os.path.expanduser("~")
        ),
        "Avani",
        "WebViewData"
    )

    os.makedirs(
        storage_path,
        exist_ok=True
    )

    webview.start(
        private_mode=False,
        storage_path=storage_path
    )