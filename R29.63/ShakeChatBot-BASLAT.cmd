@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ShakeChatBot - BASLAT

cd /d "%~dp0"

if not exist "package.json" (
  echo.
  echo [HATA] Bu dosyayi ShakeChatBot ana klasorune koy.
  echo package.json ayni klasorde olmali.
  echo.
  pause
  exit /b 1
)

echo.
echo ==========================================
echo   SHAKECHATBOT BASLATILIYOR
echo ==========================================
echo.

REM Bot service zaten 8795 portunda calisiyorsa ikinci kopyayi acma.
powershell -NoProfile -Command "$p=Get-NetTCPConnection -LocalPort 8795 -State Listen -ErrorAction SilentlyContinue; if($p){exit 0}else{exit 1}"
if %errorlevel%==0 (
  echo [OK] Bot service zaten calisiyor.
) else (
  echo [..] Bot service baslatiliyor...
  start "ShakeChatBot Bot Service" /min cmd /c "cd /d ""%~dp0"" && npm run bot:dev"
  timeout /t 2 /nobreak >nul
)

echo [..] Tauri uygulamasi baslatiliyor...
start "ShakeChatBot Tauri Dev" /min cmd /c "cd /d ""%~dp0"" && npx tauri dev"

echo.
echo [OK] ShakeChatBot baslatma komutlari gonderildi.
echo Bu pencere 3 saniye sonra kapanacak.
timeout /t 3 /nobreak >nul

endlocal
exit /b 0
