@echo off
cd /d "%~dp0"
python -c "import flask" >nul 2>&1
if errorlevel 1 (
  echo Installing project dependencies...
  python -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Could not install dependencies. Run: python -m pip install -r requirements.txt
    pause
    exit /b 1
  )
)
python app.py
pause
