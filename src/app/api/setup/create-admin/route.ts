import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/config/database'
import { hashPassword } from '@/backend/utils/password'

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'admin@example.com')
      .single()

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin user already exists',
        message: 'Use email: admin@example.com, password: admin123'
      })
    }

    // Hash the default password
    const hashedPassword = await hashPassword('admin123')

    // Create admin user
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: 'admin@example.com',
        password_hash: hashedPassword,
        full_name: 'System Administrator'
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin user',
        details: userError.message
      })
    }

    // Create default workspace for admin
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: 'Admin Workspace',
        owner_id: newUser.id
      })
      .select()
      .single()

    if (workspaceError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin workspace',
        details: workspaceError.message
      })
    }

    // Add admin as owner to workspace
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: newUser.id,
        role: 'owner'
      })

    if (memberError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to add admin to workspace',
        details: memberError.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        email: 'admin@example.com',
        password: 'admin123',
        workspace: workspace.name
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error.message
    })
  }
}