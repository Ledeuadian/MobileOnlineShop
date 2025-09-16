@echo off
echo Setting up Android Debug Bridge...

:: Set ADB path
set ADB_PATH=C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe

:: Check if ADB exists
if not exist "%ADB_PATH%" (
    echo Error: ADB not found at %ADB_PATH%
    echo Please make sure Android SDK is installed
    pause
    exit
)

echo ADB found, checking devices...
%ADB_PATH% devices

echo.
echo Instructions:
echo 1. Make sure your Samsung A23 is connected via USB
echo 2. USB Debugging should be enabled
echo 3. Install and try to open the GroSho app
echo 4. This will show crash logs in real-time
echo.
echo Press any key to start monitoring logs...
pause

echo.
echo Monitoring crash logs for GroSho app...
echo Press Ctrl+C to stop
echo.
%ADB_PATH% logcat | findstr "GroSho\|groceryshop\|AndroidRuntime\|FATAL"