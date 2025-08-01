import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name too long')
})

export const contentBriefSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  script: z.string().min(1, 'Script is required'),
  caption: z.string().min(1, 'Caption is required'),
  note: z.string().optional(),
  label: z.string().optional(),
  assignedEditor: z.string().optional().transform(val => val === '' ? undefined : val),
  assignedManager: z.string().optional().transform(val => val === '' ? undefined : val),
  status: z.enum(['draft', 'waiting_for_editor']).optional().default('waiting_for_editor')
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['script_writer', 'video_editor', 'social_media_manager'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  })
})

export const socialAccountSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'threads', 'youtube']),
  accountName: z.string().min(1, 'Account name is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional()
})

export const schedulePostSchema = z.object({
  contentId: z.string().uuid('Invalid content ID'),
  platforms: z.array(z.string()).min(1, 'At least one platform must be selected'),
  scheduledAt: z.string().datetime('Invalid date format')
})

export const updateContentStatusSchema = z.object({
  status: z.enum([
    'draft',
    'waiting_for_editor', 
    'edited',
    'review',
    'revision',
    'approved',
    'scheduled',
    'published'
  ]),
  feedback: z.string().optional()
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type WorkspaceInput = z.infer<typeof workspaceSchema>
export type ContentBriefInput = z.infer<typeof contentBriefSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type SocialAccountInput = z.infer<typeof socialAccountSchema>
export type SchedulePostInput = z.infer<typeof schedulePostSchema>
export type UpdateContentStatusInput = z.infer<typeof updateContentStatusSchema>