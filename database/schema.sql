-- Content Collaboration System Database Schema
-- This script creates all the necessary tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'script_writer', 'video_editor', 'social_media_manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Content briefs table
CREATE TABLE IF NOT EXISTS content_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    script TEXT NOT NULL,
    caption TEXT NOT NULL,
    note TEXT,
    label VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting_for_editor', 'edited', 'review', 'revision', 'approved', 'scheduled', 'published')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_editor UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_manager UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content files table (for both editing materials and final files)
CREATE TABLE IF NOT EXISTS content_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_briefs(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    is_editing_material BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'threads', 'youtube')),
    account_name VARCHAR(255) NOT NULL,
    account_id TEXT, -- External platform account ID (e.g., Facebook Page ID, Instagram Business Account ID)
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, platform, account_name)
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_briefs(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
    published_at TIMESTAMP WITH TIME ZONE,
    post_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content status history table (for tracking status changes)
CREATE TABLE IF NOT EXISTS content_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_briefs(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content comments table (for feedback and collaboration)
CREATE TABLE IF NOT EXISTS content_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_briefs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table (for admin panel)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Activity logs table (for admin monitoring)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_briefs_workspace_id ON content_briefs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_briefs_status ON content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_content_briefs_created_by ON content_briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_content_files_content_id ON content_files(content_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace_id ON social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_content_id ON scheduled_posts(content_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_content_status_history_content_id ON content_status_history(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_briefs_updated_at BEFORE UPDATE ON content_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create notification when content status changes
CREATE OR REPLACE FUNCTION notify_content_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for assigned editor when status changes to 'waiting_for_editor'
    IF NEW.status = 'waiting_for_editor' AND NEW.assigned_editor IS NOT NULL THEN
        INSERT INTO notifications (user_id, workspace_id, title, message, type)
        VALUES (
            NEW.assigned_editor,
            NEW.workspace_id,
            'New content assigned for editing',
            'You have been assigned to edit: ' || NEW.title,
            'info'
        );
    END IF;
    
    -- Insert notification for assigned manager when status changes to 'review'
    IF NEW.status = 'review' AND NEW.assigned_manager IS NOT NULL THEN
        INSERT INTO notifications (user_id, workspace_id, title, message, type)
        VALUES (
            NEW.assigned_manager,
            NEW.workspace_id,
            'Content ready for review',
            'Content ready for review: ' || NEW.title,
            'info'
        );
    END IF;
    
    -- Insert notification for content creator when status changes to 'approved' or 'revision'
    IF NEW.status IN ('approved', 'revision') THEN
        INSERT INTO notifications (user_id, workspace_id, title, message, type)
        VALUES (
            NEW.created_by,
            NEW.workspace_id,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Content approved'
                ELSE 'Content needs revision'
            END,
            'Your content "' || NEW.title || '" has been ' || NEW.status,
            CASE 
                WHEN NEW.status = 'approved' THEN 'success'
                ELSE 'warning'
            END
        );
    END IF;
    
    -- Log status change in history
    INSERT INTO content_status_history (content_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.created_by);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for content status changes
CREATE TRIGGER notify_on_content_status_change AFTER UPDATE OF status ON content_briefs
    FOR EACH ROW EXECUTE FUNCTION notify_content_status_change();

-- Insert default admin user (you should change this)
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name) VALUES 
('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5w6/bOWs0i', 'System Administrator')
ON CONFLICT (email) DO NOTHING;

-- Make the default user an admin
INSERT INTO admin_users (user_id, role) 
SELECT id, 'super_admin' FROM users WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;