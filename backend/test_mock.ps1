# Test Mock Database
Write-Host "🧪 Testing CollabMatch with Mock Database" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test Login
Write-Host "Test: Login with mock user" -ForegroundColor Yellow
$loginData = @{
    email = "aulia@dev.com"
    password = "pass123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/token" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($response.access_token.Substring(0,50))..." -ForegroundColor Cyan
    
    $token = $response.access_token
    
    # Test Get User Info
    Write-Host ""
    Write-Host "Test: Get current user info" -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $user = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    Write-Host "✅ User: $($user.name) - $($user.role)" -ForegroundColor Green
    
    # Test Discover
    Write-Host ""
    Write-Host "Test: Discover candidates" -ForegroundColor Yellow
    $candidates = Invoke-RestMethod -Uri "$baseUrl/discover/next" -Method Get -Headers $headers
    Write-Host "✅ Found $($candidates.Count) candidates" -ForegroundColor Green
    foreach ($candidate in $candidates | Select-Object -First 3) {
        Write-Host "   - $($candidate.name) ($($candidate.role))" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✅ All tests passed! Mock database working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to test Flutter UI!" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
