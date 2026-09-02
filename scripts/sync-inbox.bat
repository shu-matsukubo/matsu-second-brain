@echo off
setlocal

pushd "%~dp0.." || exit /b 1

git pull
set "EXIT_CODE=%ERRORLEVEL%"

popd
exit /b %EXIT_CODE%
