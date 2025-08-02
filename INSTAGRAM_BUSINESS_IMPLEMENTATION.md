# ✨ Instagram Business API Implementation (Direct Upload - Like Publer)

Implementasi lengkap untuk upload Instagram menggunakan **Instagram Business API secara langsung**, tanpa memerlukan Facebook Page seperti yang dilakukan oleh Publer.

## 🎯 Yang Sudah Diimplementasikan

### ✅ 1. Instagram Business Authentication Service
**File**: `src/backend/utils/instagramBusinessAuth.ts`

- **OAuth Flow Direct**: Menggunakan Instagram Business API langsung
- **Long-lived Tokens**: Token yang bertahan 60 hari
- **Token Refresh**: Automatic token refresh mechanism
- **Business Account Validation**: Memastikan hanya Business Account yang bisa connect

### ✅ 2. API Routes untuk Instagram Business
**Files**: 
- `src/app/api/auth/social/instagram-business/route.ts` - OAuth URL generation
- `src/app/api/auth/social/instagram-business/callback/route.ts` - OAuth callback handler

### ✅ 3. Publishing Service Update
**File**: `src/backend/services/socialPublishingService.ts`

- **Direct Instagram Publishing**: Menggunakan Instagram Graph API langsung
- **Two-step Process**: Create media container → Publish
- **Support Image & Video**: Automatic media type detection
- **Error Handling**: Comprehensive error handling dan logging

### ✅ 4. Frontend Integration
**File**: `src/app/social/page.tsx`

- **Updated Platform List**: Instagram Business dengan label "No Facebook required"
- **Special OAuth Handling**: Routing ke endpoint Instagram Business
- **Workspace Context**: Support untuk multiple workspace

### ✅ 5. Configuration & Documentation
**Files**: 
- `SOCIAL_MEDIA_INTEGRATION.md` - Updated dengan Instagram Business setup
- `INSTAGRAM_BUSINESS_IMPLEMENTATION.md` - Dokumentasi lengkap (file ini)

## 🚀 Cara Setup Instagram Business API

### 1. Environment Variables
Tambahkan ke `.env.local`:

```env
# Instagram Business API (Direct - seperti Publer)
INSTAGRAM_BUSINESS_CLIENT_ID=your_instagram_business_client_id
INSTAGRAM_BUSINESS_CLIENT_SECRET=your_instagram_business_client_secret

# Base URL untuk callback
NEXTAUTH_URL=http://localhost:3000
```

### 2. Instagram Developer Setup

#### A. Buat Facebook App untuk Instagram Business
1. Buka [Facebook for Developers](https://developers.facebook.com/)
2. Klik **Create App** → **Business** → **Next**
3. Masukkan App Name dan Contact Email

#### B. Tambahkan Instagram Basic Display Product
1. Di Dashboard app, klik **Add Product**
2. Pilih **Instagram Basic Display** → **Set Up**
3. Klik **Create New App** (jika diminta)

#### C. Konfigurasi OAuth Settings
1. Masuk ke **Instagram Basic Display** → **Basic Display**
2. Klik **Create New App**
3. **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/social/instagram-business/callback
   https://yourdomain.com/api/auth/social/instagram-business/callback
   ```
4. **Deauthorize Callback URL**:
   ```
   https://yourdomain.com/api/auth/social/instagram-business/deauthorize
   ```
5. **Data Deletion Request URL**:
   ```
   https://yourdomain.com/api/auth/social/instagram-business/data-deletion
   ```

#### D. Dapatkan App Credentials
1. Copy **Instagram App ID** → `INSTAGRAM_BUSINESS_CLIENT_ID`
2. Copy **Instagram App Secret** → `INSTAGRAM_BUSINESS_CLIENT_SECRET`

#### E. Instagram Professional Account Requirements
1. **Convert ke Professional Account** (Business atau Creator):
   - Buka Instagram app → Profile → Settings → Account Type
   - Pilih **Switch to Professional Account**
   - Pilih **"Business"** ATAU **"Creator"** (keduanya didukung)
   
2. **Add Instagram Tester** (WAJIB untuk development):
   - Di Facebook App Dashboard → Instagram Basic Display → Roles → Roles
   - Klik **Add Instagram Testers**
   - Masukkan Instagram username yang akan testing
   - User harus accept invitation di Instagram app
   
   ⚠️ **PENTING**: Tanpa langkah ini, akan muncul error "Insufficient Developer Role"
   
3. **Accept Invitation di Instagram App**:
   - Buka Instagram mobile app
   - Settings → Apps and Websites
   - Accept invitation dari aplikasi Anda
   - Jika tidak accept, OAuth akan gagal dengan error "access_denied"

### 3. Testing Setup

#### A. Instagram Tester Acceptance
1. Buka Instagram app
2. Settings → Apps and Websites
3. Accept invitation dari app Anda

#### B. Test Connection
1. Jalankan aplikasi: `npm run dev`
2. Buka `/social`
3. Klik **Connect Account** untuk Instagram Business
4. Login dengan Instagram Business Account
5. Authorize permissions

## 📋 Scopes & Permissions

Aplikasi ini menggunakan scopes berikut:
- `instagram_business_basic` - Basic profile access
- `instagram_business_manage_comments` - Manage comments
- `instagram_business_content_publish` - Publish content
- `instagram_business_manage_insights` - Access analytics

## 🔄 Publishing Flow

### 1. Media Upload Process
```typescript
// Step 1: Create media container
POST https://graph.instagram.com/{business-account-id}/media
{
  "image_url": "https://your-domain.com/media/image.jpg", // untuk image
  "video_url": "https://your-domain.com/media/video.mp4", // untuk video/reels
  "media_type": "REELS", // WAJIB untuk video (bukan "VIDEO" lagi)
  "caption": "Your caption here #hashtags",
  "access_token": "long_lived_token"
}

// Step 2: Publish media container
POST https://graph.instagram.com/{business-account-id}/media_publish
{
  "creation_id": "media_container_id",
  "access_token": "long_lived_token"
}
```

### 2. Supported Media Types (Updated API)
- **Images**: JPG, PNG (max 8MB) → `media_type: "IMAGE"` - Instant publish
- **Videos/Reels**: MP4 (max 100MB, 3-60 seconds) → `media_type: "REELS"` - ⏱️ 30-60s processing time
- **Carousel**: Multiple images/videos → `media_type: "CAROUSEL"` (future)

⚠️ **Instagram API Update**: Media type "VIDEO" sudah deprecated, sekarang menggunakan "REELS" untuk semua video content.

⏱️ **Video Processing**: Instagram memerlukan waktu 30-60 detik untuk memproses video sebelum dapat dipublish. Sistem akan otomatis retry dengan exponential backoff hingga 90 detik.

## 🎨 Frontend Usage

### Connect Instagram Business Account
```typescript
// Automatic detection in social page
const handleConnect = async () => {
  // Redirect to Instagram Business OAuth
  const authUrl = await getInstagramBusinessAuthUrl(workspaceId)
  window.location.href = authUrl
}
```

### Publish Content
```typescript
// Publishing from content brief
const publishData = {
  contentId: 'content-brief-id',
  platforms: ['instagram'],
  title: 'Optional title',
  caption: 'Caption with #hashtags',
  scheduledAt: undefined // or Date for scheduling
}

const result = await fetch('/api/social/publish', {
  method: 'POST',
  body: JSON.stringify(publishData)
})
```

## 🔐 Security Features

### 1. Token Management
- **Long-lived Tokens**: 60 hari validity
- **Secure Storage**: Encrypted dalam database
- **Auto Refresh**: Token refresh sebelum expired
- **Workspace Isolation**: Token terisolasi per workspace

### 2. Error Handling
- **OAuth Errors**: Graceful error handling dengan user feedback
- **API Rate Limits**: Built-in retry mechanism
- **Media Validation**: Pre-upload media validation
- **Token Expiry**: Automatic token refresh

## 🆚 Perbedaan dengan Implementation Lama

| Feature | Instagram (Legacy) | Instagram Business (New) |
|---------|-------------------|-------------------------|
| **Authentication** | Via Facebook Page | Direct Instagram Business |
| **Requirements** | Facebook Page required | Only Instagram Business Account |
| **API Endpoint** | Facebook Graph API | Instagram Graph API |
| **Token Type** | Page Access Token | Instagram Long-lived Token |
| **Setup Complexity** | High (Facebook + Instagram) | Medium (Instagram only) |
| **Like Publer** | ❌ No | ✅ Yes |

## 🚨 Troubleshooting Common Errors

### 1. "Insufficient Developer Role" Error
**Penyebab**: App masih dalam Development Mode
**Solusi**:
1. **Tambahkan Instagram Tester** (WAJIB):
   - Facebook App Dashboard → Instagram Basic Display → Roles
   - Add Instagram Testers → Masukkan username
2. **Accept invitation** di Instagram mobile app
3. **Pastikan Business Account** (bukan Personal)

### 2. "access_denied" Error
**Penyebab**: User belum accept invitation sebagai tester
**Solusi**:
1. Check Instagram app → Settings → Apps and Websites
2. Accept invitation dari aplikasi Anda
3. Retry OAuth flow

### 3. "Instagram account type not supported" Error
**Penyebab**: Account type tidak dikenali (sangat jarang)
**Account Types yang Didukung**:
- ✅ `BUSINESS` - Instagram Business Account
- ✅ `CREATOR` - Instagram Creator Account  
- ✅ `MEDIA_CREATOR` - Instagram Creator Account (variant)
- ✅ `CONTENT_CREATOR` - Instagram Creator Account (variant)
- ❌ `PERSONAL` - Personal Account (tidak didukung)

**Solusi**:
1. **Jika sudah Professional Account**: Restart OAuth flow (account type mungkin baru diupdate)
2. **Jika masih Personal**: Convert ke Professional Account
3. **Report ke developer** jika account type baru yang belum didukung

### 4. "Jenis media VIDEO tidak didukung" Error  
**Penyebab**: Instagram API sudah deprecated media_type "VIDEO"
**Error Message**: *"Nilai VIDEO untuk media_type sudah usang. Gunakan jenis media REELS"*
**Solusi**: ✅ **SUDAH DIPERBAIKI** - Kode sekarang menggunakan "REELS" untuk video

### 5. "Media URL not accessible (401)" Error
**Penyebab**: Middleware memblokir akses ke `/api/files/public/`
**Error Message**: `accessible: false, status: 401`
**Solusi**: ✅ **SUDAH DIPERBAIKI** - Added `/api/files/public/` to middleware whitelist

### 6. "Media belum siap untuk menerbitkan" Error
**Penyebab**: Instagram memerlukan waktu untuk memproses video sebelum publish (30-60 detik normal)
**Error Message**: *"Media belum siap untuk menerbitkan, tunggu beberapa saat lagi"*
**Error Code**: 9007, subcode: 2207027
**Solusi**: ✅ **SUDAH DIPERBAIKI** - Enhanced retry mechanism:
- 10x attempts dengan exponential backoff (3s → 10s)
- 90 detik max wait time
- User-friendly timeout messages
- Automatic retry untuk video processing delay

### 7. "Invalid redirect_uri" Error
**Penyebab**: Redirect URI tidak match
**Solusi**:
1. Pastikan di Facebook App: `http://localhost:3000/api/auth/social/instagram-business/callback`
2. Pastikan environment variable `NEXTAUTH_URL=http://localhost:3000`

## 🚀 Production Deployment

### 1. Instagram App Review (Required untuk Production)
Untuk production, aplikasi Anda harus di-review oleh Instagram:

1. **App Review Process**:
   - Submit app untuk review dengan use case explanation
   - Provide demo video showing app functionality
   - Explain business justification
   - **Timeline**: 2-7 hari kerja

2. **Required Documentation**:
   - Privacy Policy URL
   - Terms of Service URL
   - App functionality description
   - Detailed use case explanation

### 2. Environment Setup
```env
# Production environment
INSTAGRAM_BUSINESS_CLIENT_ID=your_production_client_id
INSTAGRAM_BUSINESS_CLIENT_SECRET=your_production_client_secret
NEXTAUTH_URL=https://yourdomain.com
```

## 🎯 Kesimpulan

✅ **Implementation Complete**:
- ✅ Instagram Business API integration (seperti Publer)
- ✅ Direct authentication tanpa Facebook Page
- ✅ Publishing dengan media support
- ✅ Token management dan refresh
- ✅ Frontend integration
- ✅ Error handling dan logging

🎉 **Ready to Use**: Aplikasi siap untuk testing dan production deployment setelah Instagram App Review.

---

**Note**: Implementation ini mengikuti pendekatan yang sama dengan Publer, menggunakan Instagram Business API secara langsung tanpa memerlukan Facebook Page linking.