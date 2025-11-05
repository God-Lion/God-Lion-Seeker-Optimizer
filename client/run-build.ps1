$ErrorActionPreference = "Continue"
Set-Location "E:\AI Point\Automated search job project\God Lion Seeker Optimizer\client"

Write-Host "Starting build process..." -ForegroundColor Green

# Run TypeScript compilation
Write-Host "`n=== TypeScript Compilation ===" -ForegroundColor Cyan
& npx tsc -b 2>&1 | Tee-Object -Variable tscOutput
Write-Host $tscOutput

# Run Vite build
Write-Host "`n=== Vite Build ===" -ForegroundColor Cyan
& npx vite build 2>&1 | Tee-Object -Variable viteOutput
Write-Host $viteOutput

Write-Host "`nBuild process completed!" -ForegroundColor Green
