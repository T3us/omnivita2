@echo off
setlocal

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File ".\scripts\start-session.ps1" -Mode local

pause
endlocal
