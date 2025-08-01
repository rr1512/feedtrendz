import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/config/database'

export async function GET(request: NextRequest) {
  try {
    // Test if users table exists and get users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, created_at')
      .limit(5)

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Users table not found or accessible',
        details: usersError.message,
        hint: 'Make sure you have run the database schema from database/schema.sql'
      })
    }

    // Test workspaces table
    const { data: workspaces, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, created_at')
      .limit(3)

    // Test workspace_members table
    const { data: members, error: membersError } = await supabaseAdmin
      .from('workspace_members')
      .select('id, role, created_at')
      .limit(3)

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        users: {
          count: users?.length || 0,
          data: users || [],
          tableExists: !usersError
        },
        workspaces: {
          count: workspaces?.length || 0,
          data: workspaces || [],
          tableExists: !workspaceError
        },
        members: {
          count: members?.length || 0,
          data: members || [],
          tableExists: !membersError
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error.message
    })
  }
}