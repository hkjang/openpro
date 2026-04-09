@echo off
setlocal
node "%~dp0openpro" %*
exit /b %ERRORLEVEL%
