@echo off
REM Clean existing output
if exist "MD-DEVTO" (
    echo Cleaning MD-DEVTO folder...
    del /Q MD-DEVTO\*
)

REM Run the script
echo.
echo Running CodePen creator...
echo.
node create-codepens.js

echo.
echo Done!
pause

