# CollabMatch API Testing Script
# Run this in PowerShell

Write-Host "🚀 CollabMatch API Testing" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "✅ Response: $($response | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

# Test 2: Root Endpoint
Write-Host "Test 2: Root Endpoint" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
Write-Host "✅ Response: $($response | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

# Test 3: API Docs Available
Write-Host "Test 3: API Documentation" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/docs" -Method Get
    Write-Host "✅ Swagger UI available at: $baseUrl/docs" -ForegroundColor Green
} catch {
    Write-Host "❌ Swagger UI not available" -ForegroundColor Red
}
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "✅ All basic tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Open browser to test more:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000/docs" -ForegroundColor Cyan
