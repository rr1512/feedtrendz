# Content Collaboration System

A powerful web application for content collaboration and social media management built with Next.js, Supabase, and modern web technologies.

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with middleware protection
- **Workspace Management**: Multi-workspace support with role-based access control
- **Content Collaboration**: Structured workflow for script writers, video editors, and social media managers
- **Social Media Integration**: Connect and publish to Facebook, Instagram, TikTok, Threads, and YouTube
- **Content Scheduling**: Schedule posts across multiple platforms
- **Real-time Notifications**: Stay updated with team activities
- **File Management**: Shared media storage for team collaboration
- **Admin Panel**: Comprehensive admin interface for system management

### User Roles
- **Workspace Owner**: Full control over workspace settings and member management
- **Script Writer**: Creates content briefs with scripts, captions, and editing materials
- **Video Editor**: Downloads materials, edits content, and uploads final videos
- **Social Media Manager**: Reviews content, provides feedback, and manages publishing

### Content Workflow
1. **Draft** → Script writer creates content brief
2. **Waiting for Editor** → Assigned to video editor
3. **Edited** → Video editor uploads edited content
4. **Review** → Social media manager reviews
5. **Revision/Approved** → Feedback loop or approval
6. **Scheduled/Published** → Content goes live

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Library**: Shadcn UI, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT implementation
- **File Storage**: Supabase Storage
- **Styling**: Tailwind CSS (minimalist design)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- A Supabase account and project

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd content-collaboration-system
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/avi,video/mov

# Social Media API Keys (to be configured later)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
```

### 4. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and execute the SQL script from `database/schema.sql`
4. This will create all necessary tables, indexes, and triggers

### 5. Configure Supabase Storage
1. In your Supabase dashboard, go to Storage
2. Create a new bucket called `content-files`
3. Set the bucket to public or configure appropriate policies

### 6. Run the Application
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── register/
├── backend/               # Backend logic
│   ├── config/           # Database configuration
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── frontend/             # Frontend components
│   ├── components/       # Reusable UI components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Base UI components
│   └── lib/             # Frontend utilities
└── middleware.ts         # Next.js middleware for auth
```

## 🔐 Authentication Flow

1. User registers → Automatic workspace creation
2. JWT token generated and stored in HTTP-only cookies
3. Middleware validates tokens on protected routes
4. Role-based access control in workspace

## 👥 User Management

### Default Admin User
- Email: `admin@example.com`
- Password: `admin123`
- Role: Super Admin

**⚠️ Important**: Change the default admin credentials immediately after setup!

### Creating New Users
1. Users can register through the `/register` page
2. Each registration automatically creates a default workspace
3. Workspace owners can invite users with specific roles

## 🔧 Configuration

### Social Media Integration
To enable social media publishing, configure the following:

1. **Facebook/Instagram**:
   - Create a Facebook App
   - Add Instagram Basic Display API
   - Configure OAuth redirect URLs

2. **TikTok**:
   - Apply for TikTok for Business API access
   - Configure app credentials

3. **YouTube**:
   - Set up Google Cloud Console project
   - Enable YouTube Data API v3
   - Configure OAuth consent screen

### File Upload Limits
Adjust file upload settings in `.env.local`:
- `MAX_FILE_SIZE`: Maximum file size in bytes
- `ALLOWED_FILE_TYPES`: Comma-separated list of allowed MIME types

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

### Docker
```bash
docker build -t content-collaboration-system .
docker run -p 3000:3000 content-collaboration-system
```

## 📊 Admin Panel

Access the admin panel at `/admin` (super admin only):
- User management
- Workspace overview
- Activity logs
- System settings
- Analytics dashboard

## 🔒 Security Features

- JWT-based authentication
- HTTP-only cookies
- CSRF protection
- Input validation with Zod
- SQL injection prevention
- Rate limiting (to be implemented)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user data

### Workspace Endpoints
- `GET /api/workspaces` - Get user workspaces
- `POST /api/workspaces` - Create new workspace
- `PUT /api/workspaces/:id` - Update workspace
- `POST /api/workspaces/:id/invite` - Invite user to workspace

### Content Endpoints
- `GET /api/content` - Get content briefs
- `POST /api/content` - Create content brief
- `PUT /api/content/:id` - Update content brief
- `POST /api/content/:id/files` - Upload files

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase credentials
   - Check if database schema is properly set up

2. **Authentication Problems**
   - Ensure JWT_SECRET is set and secure
   - Check cookie settings in production

3. **File Upload Failures**
   - Verify Supabase storage bucket configuration
   - Check file size and type restrictions

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This application is designed for collaborative content creation and requires proper setup of social media API credentials for full functionality.