import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/config/database'

export async function GET() {
  try {
    console.log('Starting quick fix...')

    // 1. Get admin user
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single()

    if (userError || !adminUser) {
      return NextResponse.json({ 
        step: 1, 
        error: 'Admin user not found',
        details: userError?.message 
      })
    }

    console.log('Admin user found:', adminUser.id)

    // 2. Create workspace (simple insert)
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: 'Admin Workspace',
        owner_id: adminUser.id
      })
      .select()
      .single()

    if (wsError) {
      return NextResponse.json({ 
        step: 2, 
        error: 'Failed to create workspace',
        details: wsError.message 
      })
    }

    console.log('Workspace created:', workspace.id)

    // 3. Add member (simple insert)
    const { data: member, error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: adminUser.id,
        role: 'owner'
      })
      .select()
      .single()

    if (memberError) {
      return NextResponse.json({ 
        step: 3, 
        error: 'Failed to add member',
        details: memberError.message 
      })
    }

    console.log('Member added:', member.id)

    return NextResponse.json({
      success: true,
      message: 'Quick fix completed successfully!',
      steps: [
        '✅ Admin user found',
        '✅ Workspace created',
        '✅ Member added'
      ],
      data: {
        user: adminUser.email,
        workspace: workspace.name,
        member: member.role
      },
      nextStep: 'Try logging in with admin@example.com / admin123'
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    })
  }
}