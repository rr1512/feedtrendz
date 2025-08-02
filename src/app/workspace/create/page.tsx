'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Label } from '@/frontend/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { useToast } from '@/frontend/contexts/toast-context'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { MainLayout } from '@/frontend/components/layout/main-layout'

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name too long')
})

type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>

export default function CreateWorkspacePage() {
  const router = useRouter()
  const toast = useToast()
  const [isCreating, setIsCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema)
  })

  const onSubmit = async (data: CreateWorkspaceInput) => {
    try {
      setIsCreating(true)

      const response = await fetch('/api/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create workspace')
      }

      toast.success('Workspace created successfully!', 'Redirecting to workspace...')
      
      // Redirect to the new workspace
      router.push(`/workspace?id=${result.data.id}`)
    } catch (error: any) {
      toast.error('Failed to create workspace', error.message || 'An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Workspace</h1>
            <p className="text-muted-foreground">
              Set up a new workspace for your team collaboration
            </p>
          </div>
        </div>

        {/* Create Workspace Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Workspace Details
            </CardTitle>
            <CardDescription>
              Enter the basic information for your new workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="Enter workspace name"
                  {...register('name')}
                  disabled={isCreating}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Workspace
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>What is a Workspace?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A workspace is a collaborative environment where your team can:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Create and manage content briefs</li>
              <li>• Collaborate on video editing projects</li>
              <li>• Schedule and publish social media content</li>
              <li>• Manage team members and their roles</li>
              <li>• Track project progress and analytics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 