@echo off
chcp 65001 >nul
echo ============================================
echo   Ahorcado - Modo Votacion Multijugador
echo ============================================
echo.

REM --- Instalar dependencias backend ---
echo [1/4] Instalando dependencias del backend...
pip install -r requirements.txt -q
echo.

REM --- Iniciar backend en segundo plano ---
echo [2/4] Iniciando backend (auto-detectando puerto libre)...
start /B python main.py
echo.

REM --- Esperar a que el backend genere backend_port.json ---
echo [3/4] Esperando al backend...
set RETRIES=0
:WAIT_LOOP
if exist "..\backend_port.json" goto PORT_READY
set /a RETRIES+=1
if %RETRIES% GEQ 15 (
    echo ERROR: El backend no pudo iniciar. Revisa errores arriba.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto WAIT_LOOP

:PORT_READY
REM --- Leer el puerto del backend ---
for /f "tokens=2 delims=:}" %%a in ('type "..\backend_port.json"') do set BACKEND_PORT=%%a
set BACKEND_PORT=%BACKEND_PORT: =%

echo.
echo ============================================
echo   Backend corriendo en puerto: %BACKEND_PORT%
echo ============================================
echo.

REM --- Iniciar frontend ---
echo [4/4] Iniciando frontend...
cd ..\frontend
start /B cmd /c "npm run dev"

REM --- Esperar un momento para que Vite arranque ---
timeout /t 4 /nobreak >nul

echo.
echo ============================================
echo.
echo   TODO LISTO!
echo.
echo   Abre en tu navegador:
echo   http://localhost:5173/
echo.
echo   Backend API: http://localhost:%BACKEND_PORT%
echo   Frontend:    http://localhost:5173
echo.
echo   (Presiona Ctrl+C para detener todo)
echo ============================================
echo.

REM --- Abrir navegador automaticamente ---
start http://localhost:5173/

REM --- Mantener ventana abierta ---
pause
