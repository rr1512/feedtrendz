# 🚀 Social Media Integration Implementation

Implementasi lengkap untuk upload langsung ke Instagram, Facebook, YouTube, dan TikTok dari content brief telah selesai!

## ✅ Fitur yang Sudah Diimplementasikan

### 1. **OAuth Authentication untuk Semua Platform**
- ✅ Facebook OAuth flow
- ✅ Instagram OAuth flow (menggunakan Facebook API)
- ✅ YouTube OAuth flow (Google OAuth)
- ✅ TikTok OAuth flow
- ✅ Automatic token refresh mechanism
- ✅ Secure token storage di database

### 2. **Database Schema**
- ✅ Tabel `social_accounts` untuk menyimpan koneksi social media
- ✅ Tabel `scheduled_posts` untuk penjadwalan posting
- ✅ Token management dengan expiry handling

### 3. **Social Media Management Page**
- ✅ Halaman `/social` dengan real API implementation
- ✅ Connect/disconnect accounts
- ✅ Token refresh functionality
- ✅ Account status monitoring
- ✅ OAuth callback handling

### 4. **Publishing System**
- ✅ Direct publish ke semua platform
- ✅ Batch publishing ke multiple platforms
- ✅ Scheduling functionality
- ✅ Custom title dan caption per platform
- ✅ Media file handling untuk setiap platform

### 5. **Content Brief Integration**
- ✅ Publish section di content brief detail modal
- ✅ Platform selection dengan connected accounts
- ✅ Custom content editing
- ✅ Media preview
- ✅ Publishing status dan results

## 🔧 Setup Instructions

### 1. Environment Variables
Tambahkan ke file `.env.local` Anda:

```env
# Facebook & Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Instagram Business API (Direct access, no Facebook required - seperti Publer)
INSTAGRAM_BUSINESS_CLIENT_ID=your_instagram_business_client_id
INSTAGRAM_BUSINESS_CLIENT_SECRET=your_instagram_business_client_secret

# Instagram (Legacy - via Facebook - optional)
INSTAGRAM_APP_ID=your_instagram_app_id  # Optional untuk Instagram via Facebook
INSTAGRAM_APP_SECRET=your_instagram_app_secret  # Optional untuk Instagram via Facebook

# YouTube (Google OAuth)
YOUTUBE_CLIENT_ID=your_google_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_google_oauth_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### 2. Instagram Business API Setup (Direct - Seperti Publer)
1. Buka [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
2. Buat Facebook App baru atau gunakan yang sudah ada
3. Tambahkan produk **Instagram Basic Display**
4. Konfigurasi OAuth redirect URI:
   - `http://localhost:3000/api/auth/social/instagram-business/callback`
   - `https://yourdomain.com/api/auth/social/instagram-business/callback` (production)
5. Dapatkan App ID dan App Secret
6. **PENTING**: Aplikasi Anda harus di-review oleh Instagram untuk production
7. Untuk testing, tambahkan Instagram account ke **Instagram Testers**

⚠️ **Instagram Professional Account Requirements:**
- Harus memiliki **Instagram Business Account** atau **Creator Account** (Professional Account)
- Account tidak perlu di-link ke Facebook Page (berbeda dengan method lama)
- Personal accounts TIDAK didukung - harus convert ke Professional
- Aplikasi harus disetujui Instagram untuk akses production
- Scopes yang digunakan: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`

### 3. Facebook/Instagram Legacy Setup (Optional)
1. Buka [Facebook for Developers](https://developers.facebook.com/)
2. Buat app baru atau gunakan yang sudah ada
3. Tambahkan produk:
   - **Facebook Login** untuk Facebook posting
   - **Instagram Professional API** untuk Instagram Business posting
4. Configure OAuth redirect URLs:
   - `http://localhost:3000/api/auth/social/facebook/callback`
   - `http://localhost:3000/api/auth/social/instagram/callback`
5. Request permissions:
   - `pages_manage_posts`
   - `pages_read_engagement` 
   - `pages_show_list`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
   - `business_management`

⚠️ **Instagram Requirements:**
- Harus memiliki **Instagram Business Account** atau **Creator Account**
- Instagram account harus di-link ke Facebook Page
- Facebook Page harus di-manage oleh user yang melakukan OAuth

### 3. YouTube Setup
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih yang sudah ada
3. Enable **YouTube Data API v3**
4. Buat OAuth 2.0 credentials (Web application)
5. Tambahkan authorized redirect URI:
   - `http://localhost:3000/api/auth/social/youtube/callback`
6. Configure OAuth consent screen

### 4. TikTok Setup
1. Apply untuk TikTok for Business API access
2. Buat app di [TikTok Developer Portal](https://developers.tiktok.com/)
3. Dapatkan Client Key dan Client Secret
4. Configure redirect URI:
   - `http://localhost:3000/api/auth/social/tiktok/callback`

## 📁 Files yang Dibuat/Dimodifikasi

### Backend Services
- `src/backend/services/socialMediaService.ts` - Social media database operations
- `src/backend/services/socialPublishingService.ts` - Publishing logic untuk setiap platform
- `src/backend/utils/socialAuth.ts` - OAuth utilities dan token management

### API Endpoints
- `src/app/api/auth/social/[platform]/route.ts` - OAuth initiation
- `src/app/api/auth/social/[platform]/callback/route.ts` - OAuth callbacks
- `src/app/api/social/accounts/route.ts` - Social accounts management
- `src/app/api/social/accounts/[id]/route.ts` - Individual account operations
- `src/app/api/social/accounts/[id]/refresh/route.ts` - Token refresh
- `src/app/api/social/publish/route.ts` - Publishing endpoint

### Frontend Components
- `src/app/social/page.tsx` - Updated dengan real API calls
- `src/frontend/components/content/social-media-publisher.tsx` - Publishing component
- `src/frontend/components/content/content-brief-detail-modal.tsx` - Updated dengan publish feature

## 🎯 Cara Menggunakan

### 1. Connect Social Media Accounts
1. Buka halaman **Social** (`/social`)
2. Klik **Connect Account** untuk platform yang diinginkan
3. Login dan authorize aplikasi
4. Account akan muncul sebagai "Connected"

### 2. Publish dari Content Brief
1. Buka content brief yang statusnya **"Approved"**
2. Scroll ke bagian **"Publish to Social Media"**
3. Pilih platform yang ingin digunakan
4. Customize title dan caption jika perlu
5. Klik **"Publish Now"** atau schedule untuk nanti
6. Monitor hasil publishing di section results

## 🔄 Publishing Flow

### Platform-Specific Behavior

**Facebook:**
- Support text posts dengan atau tanpa media
- Video dan image posting
- Automatic page posting (if business account)

**Instagram:**
- Requires media file (image atau video)
- Two-step process: create media → publish
- Business account required

**YouTube:**
- Video upload dengan resumable upload support
- Support title, description, privacy settings, dan tags
- Automatic hashtag extraction untuk tags
- Progress tracking untuk upload besar
- Chunk-based upload (256KB chunks) untuk reliability

**TikTok:**
- Video upload dengan TikTok API v2 (open.tiktokapis.com)
- Support title, description, privacy settings, dan content controls
- Status monitoring dengan retry mechanism (30 attempts)
- Metadata validation untuk description length, privacy level
- Progress tracking untuk upload status (PROCESSING → PUBLISH_COMPLETE)

### Content Mapping
- **Title**: Used for YouTube, fallback to caption for others
- **Caption**: Used as description/caption for all platforms
- **Media**: First video/image file from content brief
- **Scheduling**: Supported for all platforms

## 🛡️ Security Features

- ✅ JWT-based API authentication
- ✅ Workspace-based access control
- ✅ Secure token storage dengan encryption
- ✅ OAuth state parameter untuk CSRF protection
- ✅ Token expiry monitoring dan refresh
- ✅ Input validation untuk semua API calls

## 🎨 UI Features

- ✅ Real-time platform connection status
- ✅ Visual platform selection dengan icons
- ✅ Content preview sebelum publish
- ✅ Publishing progress indicators
- ✅ Detailed error messages
- ✅ Success/failure feedback
- ✅ Scheduling interface
- ✅ Account management tools

## 🚀 Ready to Use!

Sistem social media integration sudah lengkap dan siap digunakan! User tinggal:

1. **Setup API credentials** di `.env.local`
2. **Connect social media accounts** di halaman Social
3. **Publish content** langsung dari content brief modal

Semua workflow dari OAuth sampai publishing sudah terintegrasi dengan sistem yang ada dan mengikuti role-based permissions yang sudah ada di aplikasi.

## 🔧 Troubleshooting

**Jika OAuth gagal:**
- Pastikan redirect URLs sudah benar di platform developer console
- Check environment variables sudah terisi dengan benar
- Pastikan app sudah dalam mode "Live" (bukan Development)

**Jika publishing gagal:**
- Check token expiry di halaman Social
- Refresh token jika expired
- Pastikan account masih memiliki posting permissions
- Check file format supported oleh platform target

**Jika tidak muncul publish section:**
- Pastikan content brief status = "approved"
- Check apakah ada social media accounts yang connected
- Refresh halaman dan coba lagi