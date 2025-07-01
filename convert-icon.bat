@echo off
echo Converting PNG to ICO...
powershell.exe -ExecutionPolicy Bypass -Command "& '%~dp0convert-icon.ps1'"
pause 