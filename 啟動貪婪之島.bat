@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在啟動 Greed Island 3D（貪婪之島）...
echo 伺服器啟動完成後會自動開啟瀏覽器（http://localhost:5179）
npm.cmd run dev -- --open
pause
