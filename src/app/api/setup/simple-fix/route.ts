import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/config/database'

export async function GET() {
  try {
    // First, let's see what we have
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' })
    }

    // Check if workspace already exists
    const { data: existingWorkspace } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('owner_id', adminUser.id)
      .single()

    let workspace = existingWorkspace

    // Create workspace if doesn't exist
    if (!existingWorkspace) {
      const { data: newWorkspace, error: wsError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: 'Admin Workspace',
          owner_id: adminUser.id
        })
        .select()
        .single()

      if (wsError) {
        return NextResponse.json({ error: 'Workspace creation failed', details: wsError.message })
      }

      workspace = newWorkspace
    }

    // Check if member already exists
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('user_id', adminUser.id)
      .single()

    // Add member if doesn't exist
    if (!existingMember) {
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: adminUser.id,
          role: 'owner'
        })

      if (memberError) {
        return NextResponse.json({ error: 'Member creation failed', details: memberError.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Simple fix completed',
      data: { adminUser, workspace }
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Fix failed', details: error.message })
  }
}