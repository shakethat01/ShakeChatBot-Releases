@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ShakeChatBot - TEMIZLIK

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
echo   SHAKECHATBOT - TEK TIK TEMIZLIK
echo ==========================================
echo.
echo Uygulama aciksa once kapat.
echo Kaynak kod, ayarlar, OAuth, bot profilleri ve node_modules korunur.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$ErrorActionPreference='Continue';" ^
"$root=(Get-Location).Path;" ^
"$protected=@('bot-service','src','src-tauri','scripts','tests','node_modules','package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','.env','.env.example','.gitignore','README.md','ARCHITECTURE.md','OKU.md','OKU.txt');" ^
"$targets=New-Object System.Collections.Generic.List[System.IO.FileSystemInfo];" ^
"function AddPattern([string]$p){Get-ChildItem -LiteralPath $root -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -like $p -and $protected -notcontains $_.Name } | ForEach-Object {[void]$targets.Add($_)}};" ^
"$backups=Get-ChildItem -LiteralPath $root -Force -Directory -ErrorAction SilentlyContinue | Where-Object {$_.Name -like 'backup-*' -or $_.Name -like 'audit-backup-*'} | Sort-Object LastWriteTime -Descending;" ^
"if($backups.Count -gt 2){$backups | Select-Object -Skip 2 | ForEach-Object {[void]$targets.Add($_)}};" ^
"@('apply-r*.mjs','verify-r*.mjs','collect-r*.mjs','KUR-R*.cmd','KUR-VE-BASLAT-R*.cmd','r29.*-update','R29.*','CHANGELOG-v*.md','PATCH-NOTES-v*.txt','UPDATE-v*.txt','UPDATE_NOTES-v*.txt','OKU-R*.txt','OKU-R*.md','shake-diagnostics-*.json','*-report.jsonl','build-results.txt','test-results.txt','server-changes.diff','changes.diff','SHA256SUMS.txt','tsconfig.tsbuildinfo','patch','payload','dist','release-out') | ForEach-Object {AddPattern $_};" ^
"$cargoTarget=Join-Path $root 'src-tauri\target'; if(Test-Path -LiteralPath $cargoTarget){[void]$targets.Add((Get-Item -LiteralPath $cargoTarget -Force))};" ^
"$targets=$targets | Sort-Object FullName -Unique | Where-Object {$protected -notcontains $_.Name};" ^
"if(-not $targets){Write-Host 'Temizlenecek artik bulunamadi.' -ForegroundColor Green; exit 0};" ^
"$bytes=0; foreach($item in $targets){if($item.PSIsContainer){$v=(Get-ChildItem $item.FullName -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum}else{$v=$item.Length}; if($v){$bytes+=$v}};" ^
"Write-Host ('Temizlenecek: ' + $targets.Count + ' oge / yaklasik ' + [math]::Round($bytes/1GB,2) + ' GB') -ForegroundColor Cyan;" ^
"foreach($item in $targets){try{Remove-Item -LiteralPath $item.FullName -Recurse -Force -ErrorAction Stop; Write-Host ('SILINDI: ' + $item.Name) -ForegroundColor Green}catch{Write-Host ('SILINEMEDI: ' + $item.Name + ' -> ' + $_.Exception.Message) -ForegroundColor Yellow}};" ^
"Write-Host ''; Write-Host 'TEMIZLIK TAMAM.' -ForegroundColor Green; Write-Host 'En yeni 2 backup korundu.' -ForegroundColor DarkGray; Write-Host 'src-tauri\target sonraki npx tauri dev calismasinda yeniden olusur.' -ForegroundColor DarkGray;"

echo.
pause
endlocal
