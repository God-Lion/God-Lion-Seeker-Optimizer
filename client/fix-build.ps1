# Fix Vite Build Errors Script
Write-Host "=== God Lion Seeker Optimizer - Build Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean build artifacts
Write-Host "[1/5] Cleaning build artifacts..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Path "build" -Recurse -Force
    Write-Host "✓ Removed build directory" -ForegroundColor Green
}
if (Test-Path "node_modules/.vite") {
    Remove-Item -Path "node_modules/.vite" -Recurse -Force
    Write-Host "✓ Removed Vite cache" -ForegroundColor Green
}
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Path "tsconfig.tsbuildinfo" -Force
    Write-Host "✓ Removed TypeScript build info" -ForegroundColor Green
}
if (Test-Path "tsconfig.node.tsbuildinfo") {
    Remove-Item -Path "tsconfig.node.tsbuildinfo" -Force
    Write-Host "✓ Removed TypeScript node build info" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install lightningcss for proper Tailwind CSS minification
Write-Host "[2/5] Installing lightningcss for CSS minification..." -ForegroundColor Yellow
npm install --save-dev lightningcss
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ lightningcss installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install lightningcss" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Update Vite to latest version to avoid CJS deprecation
Write-Host "[3/5] Updating Vite to latest version..." -ForegroundColor Yellow
npm install --save-dev vite@latest @vitejs/plugin-react@latest
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Vite updated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to update Vite" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Run TypeScript check
Write-Host "[4/5] Running TypeScript check..." -ForegroundColor Yellow
npm run type-check
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript check passed" -ForegroundColor Green
} else {
    Write-Host "⚠ TypeScript check had warnings (continuing...)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Build the project
Write-Host "[5/5] Building the project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "" 
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "✓ Build completed successfully!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run 'npm run preview' to test the production build" -ForegroundColor White
    Write-Host "  2. Check the build folder for output files" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    exit 1
}
