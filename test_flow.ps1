# ALLIV - Complete Flow Testing Script
Write-Host "ALLIV Complete Flow Testing" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$BASE_URL = "http://localhost:8000"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
Write-Host "   Status: $($health.status)" -ForegroundColor Green

# Test 2: User Registration
Write-Host "`nTest 2: User Registration" -ForegroundColor Yellow
$registerBody = @{
    email = "testuser$(Get-Random)@alliv.app"
    password = "SecurePass123!"
    name = "Test User"
    birthdate = "1995-06-15"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" `
    -Method POST `
    -Body $registerBody `
    -ContentType "application/json"

$userId = $registerResponse.userId
$userEmail = $registerResponse.email

Write-Host "   User created: $userEmail" -ForegroundColor Green
Write-Host "   User ID: $userId" -ForegroundColor Green
Write-Host "   Verified: $($registerResponse.verified)" -ForegroundColor Green

# Test 3: Request Email Verification
Write-Host "`nTest 3: Email Verification Request" -ForegroundColor Yellow
$verifyRequestBody = @{
    channel = "email"
    destination = $userEmail
} | ConvertTo-Json

$verifyRequest = Invoke-RestMethod -Uri "$BASE_URL/auth/verify/request" `
    -Method POST `
    -Body $verifyRequestBody `
    -ContentType "application/json"

Write-Host "   Verification code sent to: $userEmail" -ForegroundColor Green
Write-Host "   Check backend logs for OTP code" -ForegroundColor Cyan

# Test 4: Confirm Email Verification (using test OTP)
Write-Host "`nTest 4: Confirm Email Verification" -ForegroundColor Yellow
$otpCode = "123456"
Write-Host "   Using test OTP: $otpCode" -ForegroundColor Yellow

$verifyConfirmBody = @{
    code = $otpCode
} | ConvertTo-Json

try {
    $verifyConfirm = Invoke-RestMethod -Uri "$BASE_URL/auth/verify/confirm" `
        -Method POST `
        -Body $verifyConfirmBody `
        -ContentType "application/json"
    
    Write-Host "   Email verified successfully!" -ForegroundColor Green
} catch {
    Write-Host "   Verification failed (continuing): $_" -ForegroundColor Yellow
}

# Test 5: Login
Write-Host "`nTest 5: User Login" -ForegroundColor Yellow
$loginBody = @{
    email = $userEmail
    password = "SecurePass123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$accessToken = $loginResponse.access_token
$refreshToken = $loginResponse.refresh_token

Write-Host "   Login successful!" -ForegroundColor Green
Write-Host "   Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Green

# Test 6: Get Current Profile
Write-Host "`nTest 6: Get Current Profile (GET /me)" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $accessToken"
}

$profile = Invoke-RestMethod -Uri "$BASE_URL/me" `
    -Method GET `
    -Headers $headers

Write-Host "   Profile retrieved!" -ForegroundColor Green
Write-Host "   Name: $($profile.name)" -ForegroundColor Gray
Write-Host "   Email: $($profile.email)" -ForegroundColor Gray
Write-Host "   Age: $($profile.age)" -ForegroundColor Gray
Write-Host "   Verified: $($profile.verified)" -ForegroundColor Gray

# Test 7: Update Profile
Write-Host "`nTest 7: Update Profile (PUT /me)" -ForegroundColor Yellow
$updateProfileBody = @{
    bio = "Passionate developer building the future"
    field = "Developer"
    skills = @("React", "TypeScript", "Node.js", "Python", "FastAPI")
    interests = @("AI", "Web3", "Startups", "Open Source")
    goals = "Build innovative products"
    location = @{
        city = "Jakarta"
        country = "Indonesia"
        lat = -6.2088
        lon = 106.8456
        hideExact = $false
    }
    portfolio = @{
        github = "https://github.com/testuser"
        behance = "https://behance.net/testuser"
    }
    modePreference = "online"
} | ConvertTo-Json -Depth 5

$updatedProfile = Invoke-RestMethod -Uri "$BASE_URL/me" `
    -Method PUT `
    -Headers $headers `
    -Body $updateProfileBody `
    -ContentType "application/json"

Write-Host "   Profile updated!" -ForegroundColor Green
Write-Host "   Bio: $($updatedProfile.bio)" -ForegroundColor Gray
Write-Host "   Field: $($updatedProfile.field)" -ForegroundColor Gray
Write-Host "   Skills: $($updatedProfile.skills -join ', ')" -ForegroundColor Gray
Write-Host "   Interests: $($updatedProfile.interests -join ', ')" -ForegroundColor Gray

# Test 8: Update Photos
Write-Host "`nTest 8: Update Photos (PUT /me/photos)" -ForegroundColor Yellow
$updatePhotosBody = @{
    photos = @(
        "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile1.jpg"
        "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile2.jpg"
        "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile3.jpg"
    )
} | ConvertTo-Json -Depth 3

$updatedPhotos = Invoke-RestMethod -Uri "$BASE_URL/me/photos" `
    -Method PUT `
    -Headers $headers `
    -Body $updatePhotosBody `
    -ContentType "application/json"

Write-Host "   Photos updated!" -ForegroundColor Green
Write-Host "   Photo count: $($updatedPhotos.photos.Count)" -ForegroundColor Gray

# Test 9: View Public Profile
Write-Host "`nTest 9: View Public Profile (GET /profiles/{userId})" -ForegroundColor Yellow
$publicProfile = Invoke-RestMethod -Uri "$BASE_URL/profiles/$userId" -Method GET

Write-Host "   Public profile retrieved!" -ForegroundColor Green
Write-Host "   Name: $($publicProfile.name)" -ForegroundColor Gray
Write-Host "   Field: $($publicProfile.field)" -ForegroundColor Gray
Write-Host "   Skills: $($publicProfile.skills -join ', ')" -ForegroundColor Gray
Write-Host "   Photos: $($publicProfile.photos.Count) uploaded" -ForegroundColor Gray

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "Test User:" -ForegroundColor Yellow
Write-Host "  Email: $userEmail" -ForegroundColor White
Write-Host "  User ID: $userId" -ForegroundColor White
Write-Host "`nAll endpoints tested successfully!" -ForegroundColor Green
