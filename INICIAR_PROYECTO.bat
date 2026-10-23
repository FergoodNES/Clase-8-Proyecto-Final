@echo off
title IncidentHub Enterprise Pro - Servidor Local
echo ======================================================================
echo  INCIDENTHUB ENTERPRISE PRO - INICIANDO APLICACION
echo ======================================================================
echo.

cd /d "%~dp0"

IF NOT EXIST "node_modules\" (
    echo [INFO] Primera ejecucion detectada. Instalando dependencias necesarias...
    call npm install
    echo.
)

echo [INFO] Iniciando servidor Node.js en http://localhost:3000 ...
start "" http://localhost:3000
call npm start
pause
