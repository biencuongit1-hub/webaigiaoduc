@echo off
echo ========================================================
echo  Tu dong build va deploy len Firebase Hosting
echo ========================================================

echo [1/3] Dang build ung dung (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Build that bai! Vui long kiem tra lai code.
    pause
    exit /b %errorlevel%
)

echo [2/3] Kiem tra Firebase CLI...
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo Dang cai dat firebase-tools...
    call npm install -g firebase-tools
)

echo [3/3] Dang deploy len Firebase Hosting...
call firebase deploy --only hosting

echo ========================================================
echo  HOAN TAT! Ung dung da duoc deploy len Firebase thanh cong!
echo ========================================================
pause
