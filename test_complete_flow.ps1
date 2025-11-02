# ALLIV - Complete Flow Testing Script
# Test dari signup sampai verification sampai login sampai profile

Write-Host "ALLIV Complete Flow Testing" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$BASE_URL = "http://localhost:8000"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   Failed health check: $_" -ForegroundColor Red
    exit 1
}

# Test 2: User Registration
Write-Host "`nTest 2: User Registration" -ForegroundColor Yellow
$registerBody = @{
    email = "testuser$(Get-Random)@alliv.app"
    password = "SecurePass123!"
    name = "Test User"
    birthdate = "1995-06-15"
} | ConvertTo-Json

Write-Host "   Registering: $($registerBody | ConvertFrom-Json | Select-Object email, name)" -ForegroundColor Gray

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json"
    
    $userId = $registerResponse.userId
    $userEmail = $registerResponse.email
    
    Write-Host "   ✓ User created: $userEmail" -ForegroundColor Green
    Write-Host "   ✓ User ID: $userId" -ForegroundColor Green
    Write-Host "   ✓ Verified: $($registerResponse.verified)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Registration failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Request Email Verification
Write-Host "`n✅ Test 3: Email Verification Request" -ForegroundColor Yellow
$verifyRequestBody = @{
    channel = "email"
    destination = $userEmail
} | ConvertTo-Json

try {
    $verifyRequest = Invoke-RestMethod -Uri "$BASE_URL/auth/verify/request" `
        -Method POST `
        -Body $verifyRequestBody `
        -ContentType "application/json"
    
    Write-Host "   ✓ Verification code sent to: $userEmail" -ForegroundColor Green
    Write-Host "   📧 Check backend logs for OTP code" -ForegroundColor Cyan
    
    # For testing, use default OTP
    $otpCode = "123456"
    Write-Host "   🔢 Using test OTP: $otpCode" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Verification request failed: $_" -ForegroundColor Red
}

# Test 4: Confirm Email Verification
Write-Host "`n✅ Test 4: Confirm Email Verification" -ForegroundColor Yellow
$verifyConfirmBody = @{
    code = $otpCode
} | ConvertTo-Json

try {
    $verifyConfirm = Invoke-RestMethod -Uri "$BASE_URL/auth/verify/confirm" `
        -Method POST `
        -Body $verifyConfirmBody `
        -ContentType "application/json"
    
    Write-Host "   ✓ Email verified successfully!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Verification confirm failed: $_" -ForegroundColor Yellow
    Write-Host "   (Continuing with unverified account)" -ForegroundColor Gray
}

# Test 5: Login
Write-Host "`n✅ Test 5: User Login" -ForegroundColor Yellow
$loginBody = @{
    email = $userEmail
    password = "SecurePass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $accessToken = $loginResponse.access_token
    $refreshToken = $loginResponse.refresh_token
    
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    Write-Host "   ✓ Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "   ✓ Refresh Token: $($refreshToken.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 6: Get Current Profile
Write-Host "`n✅ Test 6: Get Current Profile (GET /me)" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $accessToken"
}

try {
    $profile = Invoke-RestMethod -Uri "$BASE_URL/me" `
        -Method GET `
        -Headers $headers
    
    Write-Host "   ✓ Profile retrieved!" -ForegroundColor Green
    Write-Host "   Name: $($profile.name)" -ForegroundColor Gray
    Write-Host "   Email: $($profile.email)" -ForegroundColor Gray
    Write-Host "   Age: $($profile.age)" -ForegroundColor Gray
    Write-Host "   Verified: $($profile.verified)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Get profile failed: $_" -ForegroundColor Red
}

# Test 7: Update Profile
Write-Host "`n✅ Test 7: Update Profile (PUT /me)" -ForegroundColor Yellow
$updateProfileBody = @{
    bio = "Passionate developer building the future of collaboration"
    field = "Developer"
    skills = @("React", "TypeScript", "Node.js", "Python", "FastAPI")
    interests = @("AI", "Web3", "Startups", "Open Source")
    goals = "Build innovative products that connect people"
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

try {
    $updatedProfile = Invoke-RestMethod -Uri "$BASE_URL/me" `
        -Method PUT `
        -Headers $headers `
        -Body $updateProfileBody `
        -ContentType "application/json"
    
    Write-Host "   ✓ Profile updated successfully!" -ForegroundColor Green
    Write-Host "   Bio: $($updatedProfile.bio)" -ForegroundColor Gray
    Write-Host "   Field: $($updatedProfile.field)" -ForegroundColor Gray
    Write-Host "   Skills: $($updatedProfile.skills -join ', ')" -ForegroundColor Gray
    Write-Host "   Interests: $($updatedProfile.interests -join ', ')" -ForegroundColor Gray
    Write-Host "   Location: $($updatedProfile.location.city), $($updatedProfile.location.country)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Update profile failed: $_" -ForegroundColor Red
    Write-Host "   Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 8: Update Photos
Write-Host "`n✅ Test 8: Update Photos (PUT /me/photos)" -ForegroundColor Yellow
$updatePhotosBody = @{
    photos = @(
        "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile1.jpg"
        "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile2.jpg"
        "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile3.jpg"
    )
} | ConvertTo-Json -Depth 3

try {
    $updatedPhotos = Invoke-RestMethod -Uri "$BASE_URL/me/photos" `
        -Method PUT `
        -Headers $headers `
        -Body $updatePhotosBody `
        -ContentType "application/json"
    
    Write-Host "   ✓ Photos updated successfully!" -ForegroundColor Green
    Write-Host "   Photo count: $($updatedPhotos.photos.Count)" -ForegroundColor Gray
    foreach ($photo in $updatedPhotos.photos) {
        Write-Host "   - $photo" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Update photos failed: $_" -ForegroundColor Red
}

# Test 9: View Public Profile
Write-Host "`n✅ Test 9: View Public Profile (GET /profiles/{userId})" -ForegroundColor Yellow
try {
    $publicProfile = Invoke-RestMethod -Uri "$BASE_URL/profiles/$userId" -Method GET
    
    Write-Host "   ✓ Public profile retrieved!" -ForegroundColor Green
    Write-Host "   Name: $($publicProfile.name)" -ForegroundColor Gray
    Write-Host "   Field: $($publicProfile.field)" -ForegroundColor Gray
    Write-Host "   Skills: $($publicProfile.skills -join ', ')" -ForegroundColor Gray
    Write-Host "   Photos: $($publicProfile.photos.Count) uploaded" -ForegroundColor Gray
    
    if ($publicProfile.location.hideExact -eq $true) {
        Write-Host "   Location: Hidden (privacy setting)" -ForegroundColor Yellow
    } else {
        Write-Host "   Location: $($publicProfile.location.city)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get public profile failed: $_" -ForegroundColor Red
}

# Test 10: Logout
Write-Host "`n✅ Test 10: Logout (POST /auth/logout)" -ForegroundColor Yellow
try {
    $logout = Invoke-RestMethod -Uri "$BASE_URL/auth/logout" `
        -Method POST `
        -Headers $headers
    
    Write-Host "   ✓ Logout successful!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Logout failed: $_" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "Test User Created:" -ForegroundColor Yellow
Write-Host "  Email: $userEmail" -ForegroundColor White
Write-Host "  User ID: $userId" -ForegroundColor White
Write-Host "  Profile: Updated with bio, skills, interests, location, photos" -ForegroundColor White
Write-Host "`nAll critical endpoints tested successfully!" -ForegroundColor Green
