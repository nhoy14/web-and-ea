import sys
import os

# Add root directory to sys.path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import traceback

try:
    from backend.main import app
except Exception as e:
    tb_str = traceback.format_exc()
    from fastapi import FastAPI
    app = FastAPI(title="Fallback Debug App")
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    def catch_all(path_name: str = None):
        return {
            "error": "Initialization failed",
            "exception": str(e),
            "traceback": tb_str
        }
