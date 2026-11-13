@echo off
rem Build the client, then start the API server (port 4000) and the ngrok tunnel in their own windows.
cd /d "%~dp0client"
call npm run build || (echo Build failed & pause & exit /b 1)

start "TRISAK server" cmd /k "cd /d "%~dp0server" && npm start"
rem give the server a moment to listen before ngrok forwards to it
timeout /t 3 /nobreak >nul
start "TRISAK ngrok" cmd /k "ngrok http 4000 --url https://zoology-audio-twitch.ngrok-free.dev"

echo Site: https://zoology-audio-twitch.ngrok-free.dev
echo Close both windows (or Ctrl-C) to stop.
