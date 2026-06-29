@echo off
echo ===================================================
echo  Starting GitHub Sync (Safe Mode)...
echo ===================================================
echo.

:: Initialize Git if not exists
if not exist .git (
    echo [0/3] Initializing Git repository...
    git init
)

:: Set temporary git commit identity locally
git config user.name "eery1677-lab"
git config user.email "developer@example.com"

echo [1/3] Setting remote repository URL...
git remote set-url origin https://github.com/eery1677-lab/template.git 2>nul
if %errorlevel% neq 0 (
    git remote add origin https://github.com/eery1677-lab/template.git
)

echo.
echo [2/3] Adding and committing changes...
git add .
git commit -m "Fix: Neon color swap and PayPal modal overlap layout fix"

echo.
echo [3/3] Pushing latest changes...
git branch -M main
git push -u origin main --force

if %errorlevel% neq 0 (
    echo [Info] main branch failed. Trying master branch...
    git push -u origin master --force
)

echo.
echo ===================================================
echo  Push completed!
echo ===================================================
pause
