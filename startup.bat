@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo   FitQuest
echo   ----------------------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo   [错误] 没有找到 Node.js，请先安装：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
echo   Node.js !NODE_VER!

if not exist "node_modules" (
    echo   首次运行，正在安装依赖…
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo   [错误] 依赖安装失败
        echo.
        pause
        exit /b 1
    )
    echo.
)

set MODE=%1
if /i "%MODE%"=="https" goto https
if /i "%MODE%"=="phone" goto https
if /i "%MODE%"=="build" goto build
if /i "%MODE%"=="check" goto check
if not "%MODE%"=="" goto usage

:dev
echo   模式：桌面调试（http）
echo   桌面没有 IMU，浏览器会自动打开 ?mock=1，用合成波形跑通整条链路。
echo   关闭窗口或按 Ctrl+C 停止。
echo.
start "" "http://localhost:5173/?mock=1"
call npm run dev
goto end

:https
echo   模式：手机调试（https）
echo   DeviceMotion 需要安全上下文，局域网必须走 https。
echo.
echo   用手机浏览器打开下面 Network 那一行的地址，
echo   接受自签证书警告后，把手机放进裤子前侧口袋开始训练。
echo   关闭窗口或按 Ctrl+C 停止。
echo.
call npm run dev:https
goto end

:build
echo   模式：生产构建
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo   [错误] 构建失败
    echo.
    pause
    exit /b 1
)
echo.
echo   构建完成，产物在 dist\
echo.
pause
goto end

:check
echo   模式：自检（类型 + 计数 + 渲染）
echo.
call npx tsc --noEmit
if errorlevel 1 goto checkfail
echo   [1/3] 类型检查通过
echo.
call npm run repcheck
if errorlevel 1 goto checkfail
echo.
call npm run smoke
if errorlevel 1 goto checkfail
echo.
echo   全部通过
echo.
pause
goto end

:checkfail
echo.
echo   [错误] 自检未通过
echo.
pause
exit /b 1

:usage
echo   未知参数：%MODE%
echo.
echo   用法：
echo     startup.bat          桌面调试，自动开浏览器（mock 传感器）
echo     startup.bat phone    手机调试，https + 局域网
echo     startup.bat build    生产构建
echo     startup.bat check    类型检查 + 计数验证 + 渲染冒烟
echo.
pause
exit /b 1

:end
endlocal
