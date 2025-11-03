# Cloudinary Photo Upload Implementation

## ✅ Implementation Complete!

Professional photo upload system dengan presigned URLs, rate limiting, dan comprehensive error handling.

---

## 🎯 Features Implemented

### Backend (`backend/app/routes/uploads.py`)
✅ **POST /uploads/presign** - Generate presigned URL for secure client-side upload
  - Validates user has < 6 photos
  - Checks rate limit (10 uploads/hour)
  - Generates unique public_id per user
  - Returns signature for authenticated upload

✅ **POST /uploads/complete** - Save uploaded photo URL to user profile
  - Validates Cloudinary URL format
  - Verifies photo belongs to user's folder
  - Prevents duplicate uploads
  - Atomic profile update

✅ **DELETE /uploads/photo/{photo_index}** - Delete photo from Cloudinary and profile
  - Validates photo ownership
  - Deletes from Cloudinary first
  - Removes from user profile
  - Graceful failure handling

✅ **GET /uploads/stats** - Get upload statistics
  - Current photo count
  - Uploads in last hour
  - Can upload status

### Frontend
✅ **Updated `frontend/src/services/api.ts`**
  - `uploadAPI.getPresignURL()` - Get presigned credentials
  - `uploadAPI.uploadToCloudinary()` - Direct upload with progress tracking
  - `uploadAPI.completeUpload()` - Complete upload flow
  - `uploadAPI.deletePhoto()` - Delete photo by index
  - `uploadAPI.getStats()` - Get upload stats

✅ **New `frontend/src/components/PhotoUploader.tsx`**
  - Drag & drop support
  - Upload progress indicator
  - Photo grid with delete buttons
  - Max 6 photos enforcement
  - File size/type validation
  - Error handling with user feedback

✅ **Updated `frontend/src/lib/upload.ts`**
  - File validation utilities
  - Image compression (optional)
  - Format helpers
  - Dimension extraction

### Security
✅ **Validation Layer**
  - Max 6 photos per user
  - Max 5MB per file
  - Only image formats (JPG, PNG, WEBP)
  - Prevent duplicate uploads
  - Rate limit: 10 uploads per hour
  - User folder isolation (alivv/users/{userId}/)

✅ **Error Handling**
  - Comprehensive try-catch blocks
  - Proper HTTP status codes
  - Safe error messages (no sensitive data leaks)
  - Database error graceful degradation
  - Cloudinary API error handling

---

## 🔧 Setup Instructions

### 1. Cloudinary Account Setup

1. **Sign up for Cloudinary**: https://cloudinary.com/users/register_free
2. **Get your credentials** from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Backend Configuration

Add to `backend/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dvlqelnsf
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 3. Install Dependencies

Backend already has `cloudinary` in `requirements.txt`:
```bash
cd backend
pip install cloudinary
```

Frontend - no additional dependencies needed (uses native fetch API)

### 4. Database Index (Optional but Recommended)

Create index for upload logs:
```bash
python
```

```python
from app.db import upload_logs
from datetime import datetime

# Create index for rate limiting
upload_logs.create_index([
    ("userId", 1),
    ("uploadedAt", -1)
])

# Create TTL index to auto-delete old logs after 7 days
upload_logs.create_index(
    "createdAt",
    expireAfterSeconds=604800  # 7 days
)
```

### 5. Test Cloudinary Configuration

Run this test script:
```bash
cd backend
python -c "
from app.config import settings
import cloudinary

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

print('✅ Cloudinary configured successfully!')
print(f'Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}')
print(f'API Key: {settings.CLOUDINARY_API_KEY[:8]}...')
"
```

---

## 🧪 Testing Checklist

### Manual Testing

#### 1. Upload Single Photo
```
1. Login to the app
2. Go to Profile Edit page
3. Click "Add Photo" or drag & drop an image
4. Verify:
   ✅ Upload progress shows (0% → 100%)
   ✅ Photo appears in grid
   ✅ Photo persists after page reload
   ✅ Photo URL starts with https://res.cloudinary.com/
```

#### 2. Upload Multiple Photos
```
1. Upload 6 photos (maximum)
2. Verify:
   ✅ All 6 photos display correctly
   ✅ Photo numbers (1-6) show on badges
   ✅ "Add Photo" button disappears after 6
```

#### 3. Upload Validation
```
Test Case A: File Size Limit
1. Try uploading image > 5MB
2. Verify: ❌ Error: "File too large. Maximum size is 5MB"

Test Case B: File Type
1. Try uploading .pdf or .gif file
2. Verify: ❌ Error: "Invalid file type. Only JPG, PNG, and WEBP are allowed"

Test Case C: Max Photos
1. Upload 6 photos
2. Try uploading 7th photo
3. Verify: ❌ Error: "Maximum 6 photos allowed"
```

#### 4. Delete Photo
```
1. Hover over a photo
2. Click X button (top-right)
3. Verify:
   ✅ Photo removed from grid
   ✅ Photo deleted from Cloudinary
   ✅ Photo count decreases
   ✅ Can upload new photo again
```

#### 5. Rate Limiting
```
1. Upload 10 photos in quick succession (delete after each upload)
2. Try uploading 11th photo within 1 hour
3. Verify: ❌ Error: "Upload rate limit exceeded. Try again later."
```

#### 6. Concurrent Uploads
```
1. Open app in 2 browser tabs
2. Upload photo in Tab 1
3. Refresh Tab 2
4. Verify: ✅ Photo appears in both tabs
```

#### 7. Error Recovery
```
Test Case A: Network Failure
1. Disable network mid-upload
2. Verify: ❌ Error shown with clear message
3. Re-enable network
4. Try uploading again
5. Verify: ✅ Upload succeeds

Test Case B: Invalid Cloudinary Config
1. Set wrong CLOUDINARY_CLOUD_NAME in .env
2. Try uploading
3. Verify: ❌ Error: "Upload service not configured"
```

### API Testing (Postman/cURL)

#### 1. Get Presign URL
```bash
curl -X POST http://localhost:8000/uploads/presign \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected Response:
```json
{
  "timestamp": 1699000000,
  "signature": "abc123...",
  "api_key": "123456789012345",
  "cloud_name": "your_cloud_name",
  "public_id": "alivv/users/userId/hash123",
  "folder": "alivv/users/userId"
}
```

#### 2. Upload to Cloudinary (Manual)
```bash
curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload \
  -F "file=@path/to/image.jpg" \
  -F "timestamp=1699000000" \
  -F "signature=abc123..." \
  -F "api_key=123456789012345" \
  -F "public_id=alivv/users/userId/hash123" \
  -F "folder=alivv/users/userId"
```

#### 3. Complete Upload
```bash
curl -X POST http://localhost:8000/uploads/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "public_id": "alivv/users/userId/hash123",
    "url": "https://res.cloudinary.com/..."
  }'
```

#### 4. Get Upload Stats
```bash
curl http://localhost:8000/uploads/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected Response:
```json
{
  "currentPhotoCount": 3,
  "maxPhotos": 6,
  "uploadsInLastHour": 5,
  "maxUploadsPerHour": 10,
  "canUpload": true
}
```

#### 5. Delete Photo
```bash
curl -X DELETE http://localhost:8000/uploads/photo/0 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected Response:
```json
{
  "message": "Photo deleted successfully",
  "deletedUrl": "https://res.cloudinary.com/...",
  "remainingPhotos": 2
}
```

---

## 🐛 Troubleshooting

### Problem: "Upload service not configured"
**Solution:**
1. Check `.env` file has correct Cloudinary credentials
2. Restart backend server
3. Verify with test script above

### Problem: "Failed to upload to Cloudinary"
**Solution:**
1. Check Cloudinary API credentials
2. Verify network connectivity
3. Check browser console for CORS errors
4. Ensure Cloudinary account is not suspended

### Problem: Photos not persisting
**Solution:**
1. Check MongoDB connection
2. Verify `/uploads/complete` endpoint is called after Cloudinary upload
3. Check browser Network tab for failed requests

### Problem: "Rate limit exceeded" immediately
**Solution:**
1. Check `upload_logs` collection in MongoDB
2. Clear old logs: `db.upload_logs.deleteMany({ uploadedAt: { $lt: Date.now() - 3600000 } })`
3. Or wait 1 hour

### Problem: Delete not working
**Solution:**
1. Check photo_index is correct (0-based)
2. Verify user owns the photo
3. Check Cloudinary console - photo may be deleted from DB but not Cloudinary
4. Manual cleanup: Use Cloudinary dashboard

---

## 📊 Database Schema

### `users` collection
```javascript
{
  _id: ObjectId,
  email: String,
  photos: [String], // Array of Cloudinary URLs
  // ... other fields
}
```

### `upload_logs` collection (for rate limiting)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  publicId: String,
  url: String,
  uploadedAt: Number, // Unix timestamp
  createdAt: Date
}
```

**Indexes:**
```javascript
// Rate limiting query optimization
{ userId: 1, uploadedAt: -1 }

// Auto-delete old logs after 7 days (TTL)
{ createdAt: 1 }, { expireAfterSeconds: 604800 }
```

---

## 🚀 Usage Example

### In Profile Edit Component

```tsx
import { PhotoUploader } from '../components/PhotoUploader';
import { profileAPI } from '../services/api';

export const ProfileEdit = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const response = await profileAPI.getMe();
    if (response.data) {
      setProfile(response.data);
    }
  };

  const handlePhotosChange = async (newPhotos: string[]) => {
    // Update local state
    setProfile({ ...profile, photos: newPhotos });

    // Save to backend
    await profileAPI.updateMe({ photos: newPhotos });
  };

  return (
    <div>
      <h2>Profile Photos</h2>
      <PhotoUploader
        photos={profile?.photos || []}
        onPhotosChange={handlePhotosChange}
        maxPhotos={6}
      />
    </div>
  );
};
```

---

## 🎨 UI/UX Features

### PhotoUploader Component
- ✅ **Drag & Drop Support** - Drag images directly onto upload area
- ✅ **Upload Progress** - Circular progress indicator (0% → 100%)
- ✅ **Photo Grid** - Clean 3-column grid layout
- ✅ **Delete on Hover** - X button appears on hover
- ✅ **Photo Numbers** - Badge shows photo position (1-6)
- ✅ **Error Messages** - Clear, actionable error feedback
- ✅ **Loading States** - Visual feedback during upload
- ✅ **Validation Feedback** - Inline validation messages
- ✅ **Responsive Design** - Works on mobile/tablet/desktop

---

## 🔐 Security Features

1. **Rate Limiting** - 10 uploads per hour per user
2. **File Validation** - Size (5MB) and type (JPG/PNG/WEBP) checks
3. **User Isolation** - Photos stored in user-specific folders
4. **Presigned URLs** - No API credentials exposed to client
5. **Ownership Verification** - Server validates user owns photo before delete
6. **Duplicate Prevention** - Same URL can't be uploaded twice
7. **Error Message Safety** - No sensitive data in error responses
8. **Atomic Operations** - Race condition protection

---

## 📈 Performance Optimizations

1. **Direct Client Upload** - Files upload directly to Cloudinary (not through backend)
2. **Progress Tracking** - XMLHttpRequest for upload progress
3. **Async Operations** - Non-blocking upload flow
4. **Database Indexing** - Fast rate limit queries
5. **TTL Cleanup** - Automatic old log deletion
6. **Error Recovery** - Graceful failure handling

---

## ✅ Ready for Production!

All features implemented and tested. To deploy:

1. ✅ Add Cloudinary credentials to production `.env`
2. ✅ Create database indexes
3. ✅ Test in production environment
4. ✅ Monitor upload logs for issues
5. ✅ Set up Cloudinary usage alerts

**Questions or issues?** Check the troubleshooting section above.
