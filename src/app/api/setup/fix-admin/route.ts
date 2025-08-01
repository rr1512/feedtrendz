import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/config/database'

export async function GET(request: NextRequest) {
  return handleFixAdmin()
}

export async function POST(request: NextRequest) {
  return handleFixAdmin()
}

async function handleFixAdmin() {
  try {
    // Get existing admin user
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single()

    if (userError || !adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found',
        details: userError?.message
      })
    }

    // Check if admin already has workspace
    const { data: existingWorkspace } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('owner_id', adminUser.id)
      .single()

    let workspace = existingWorkspace

    // Create workspace if doesn't exist
    if (!existingWorkspace) {
      const { data: newWorkspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: 'Admin Workspace',
          owner_id: adminUser.id
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

      workspace = newWorkspace
    }

    // Check if admin is member of workspace
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('user_id', adminUser.id)
      .single()

    // Add admin as member if not exists
    if (!existingMember) {
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: adminUser.id,
          role: 'owner'
        })

      if (memberError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to add admin as workspace member',
          details: memberError.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user setup completed successfully',
      data: {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.full_name
        },
        workspace: {
          id: workspace.id,
          name: workspace.name
        },
        credentials: {
          email: 'admin@example.com',
          password: 'admin123'
        }
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