@echo off
set ASPNETCORE_ENVIRONMENT=Development
set ASPNETCORE_URLS=http://127.0.0.1:5000
cd /d "%~dp0"
dotnet run > run_e2e.log 2> run_e2e_err.log
