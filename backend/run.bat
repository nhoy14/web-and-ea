@echo off
echo Installing python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies. Make sure Python and pip are in your PATH.
    pause
    exit /b %ERRORLEVEL%
)

echo Starting FastAPI Backend server...
uvicorn main:app --reload --port 8000
pause
