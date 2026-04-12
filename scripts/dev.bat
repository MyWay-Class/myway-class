@echo off
set "ROOT=%~dp0.."
start "" /D "%ROOT%\frontend" cmd /c npm run dev
start "" /D "%ROOT%\backend" cmd /c npm run dev
start "" /D "%ROOT%" cmd /c npm run dev:media-processor
