# Setup Instructions

## Database Setup

Sebelum menjalankan aplikasi, Anda perlu setup database Supabase dengan langkah-langkah berikut:

### 1. Create Supabase Project

1. Buka [Supabase Dashboard](https://app.supabase.com/)
2. Klik "New Project"
3. Isi detail project Anda
4. Tunggu project selesai dibuat

### 2. Setup Database Schema

1. Buka project Supabase Anda
2. Pergi ke SQL Editor
3. Copy dan paste seluruh isi file `database/schema.sql`
4. Klik "Run" untuk menjalankan script

### 3. Configure Environment Variables

1. Copy file `.env.example` menjadi `.env.local`
2. Isi environment variables berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration (Generate secure random string)
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/avi,video/mov,application/pdf
```

### 4. Cara Mendapatkan Supabase Keys

1. **Supabase URL & Anon Key:**
   - Di dashboard Supabase, pergi ke Settings > API
   - Copy "Project URL" sebagai `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key sebagai `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Service Role Key:**
   - Di halaman yang sama, copy "service_role" key sebagai `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **PENTING**: Key ini harus dijaga kerahasiaannya dan jangan pernah di-expose ke frontend

### 5. File Upload Setup

Aplikasi ini menggunakan local file storage:

1. Directory `public/uploads/` sudah dibuat untuk menyimpan file upload
2. File akan disimpan secara lokal dan dapat diakses via `/uploads/[filename]`
3. Konfigurasi upload limits ada di environment variables:
   - `MAX_FILE_SIZE`: Ukuran maksimal file dalam bytes (default: 10MB)
   - `ALLOWED_FILE_TYPES`: Tipe file yang diizinkan (comma-separated)

### 6. Install Dependencies dan Run

```bash
npm install
npm run dev
```

## Default Admin User

Setelah database setup, akan ada default admin user:

- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **PENTING**: Segera ganti password default setelah login pertama!

## Social Media Integration Setup

Untuk mengaktifkan integrasi social media, Anda perlu mendapatkan API credentials dari masing-masing platform:

### Facebook & Instagram

1. Buka [Facebook Developers](https://developers.facebook.com/)
2. Buat app baru
3. Tambahkan Facebook Login dan Instagram Basic Display products
4. Dapatkan App ID dan App Secret
5. Configure OAuth redirect URLs

### TikTok

1. Apply for TikTok for Business API access
2. Buat app di TikTok Developer Portal
3. Dapatkan Client Key dan Client Secret

### YouTube

1. Buat project di [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Buat OAuth 2.0 credentials
4. Configure OAuth consent screen

### Konfigurasi di Environment Variables

```env
# Social Media API Keys
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

## Troubleshooting

### Database Connection Issues

1. Pastikan Supabase URL dan keys sudah benar
2. Check apakah schema sudah ter-install dengan benar
3. Pastikan tidak ada typo di environment variables

### Authentication Issues

1. Check JWT_SECRET sudah di-set dengan benar
2. Pastikan JWT_SECRET minimum 32 karakter
3. Clear browser cookies jika ada masalah login

### File Upload Issues

1. Pastikan Supabase Storage bucket sudah dibuat
2. Check storage policies
3. Verify file size limits

## Development Tips

1. Gunakan Supabase Table Editor untuk melihat data
2. Check Supabase Logs untuk troubleshooting
3. Gunakan browser developer tools untuk debug API calls
4. Test dengan different user roles untuk memastikan permissions

## Production Deployment

Sebelum deploy ke production:

1. Ganti semua default passwords
2. Setup proper environment variables
3. Configure proper CORS settings
4. Setup proper database policies
5. Enable row level security (RLS) jika diperlukan
6. Setup proper backup strategy