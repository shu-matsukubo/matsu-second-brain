@echo off
setlocal

rem Run from the repository root, even when launched from another directory.
pushd "%~dp0.." >nul || (
  echo [ERROR] Could not open the workspace directory.
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [ERROR] This directory is not a Git worktree.
  popd
  exit /b 1
)

git status --porcelain --untracked-files=all >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Could not inspect the Git worktree.
  popd
  exit /b 1
)

set "WORKTREE_DIRTY="
for /f "delims=" %%I in ('git status --porcelain --untracked-files^=all 2^>nul') do set "WORKTREE_DIRTY=1"

if defined WORKTREE_DIRTY (
  echo [STOP] The workspace has uncommitted changes. Nothing was pulled.
  echo.
  git status --short
  popd
  exit /b 1
)

git symbolic-ref --quiet HEAD >nul 2>&1
if errorlevel 1 (
  echo [STOP] HEAD is detached. Nothing was pulled.
  popd
  exit /b 1
)

git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}" >nul 2>&1
if errorlevel 1 (
  echo [STOP] The current branch has no upstream. Nothing was pulled.
  popd
  exit /b 1
)

echo Pulling the current branch...
git pull
set "PULL_EXIT_CODE=%ERRORLEVEL%"

if not "%PULL_EXIT_CODE%"=="0" (
  echo [ERROR] git pull failed with exit code %PULL_EXIT_CODE%.
)

popd
exit /b %PULL_EXIT_CODE%
