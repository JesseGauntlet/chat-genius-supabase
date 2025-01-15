'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useWorkspaces } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/lib/database.types'

type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert']
type MemberInsert = Database['public']['Tables']['members']['Insert']

export default function WorkspacesPage() {
  const { supabase, user } = useSupabase()
  const { workspaces, refreshWorkspaces, isLoading } = useWorkspaces()
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim() || !user) return

    setLoading(true)
    try {
      // Insert new workspace
      const workspaceData: WorkspaceInsert = {
        name: newWorkspaceName,
        owner_id: user.id,
      }

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([workspaceData])
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Add creator as admin member
      const memberData: MemberInsert = {
        user_id: user.id,
        workspace_id: workspace.id,
        role: 'admin',
      }

      const { error: memberError } = await supabase
        .from('members')
        .insert([memberData])

      if (memberError) throw memberError

      setNewWorkspaceName('')
      await refreshWorkspaces()
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWorkspace = async (workspaceId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          role: 'member',
        })

      if (error) throw error

      // Refresh the workspaces list after joining
      await refreshWorkspaces()
    } catch (error) {
      console.error('Error joining workspace:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">Your Workspaces</h1>
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">New Workspace Name</Label>
              <Input
                id="workspace-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Enter workspace name"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="p-4 border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold">{workspace.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created {new Date(workspace.created_at).toLocaleDateString()}
              </p>
              <div className="mt-2 space-x-2">
                <Button variant="outline" onClick={() => window.location.href = `/chat?workspace=${workspace.id}`}>
                  Open Workspace
                </Button>
                {user && workspace.owner_id !== user.id && (
                  <Button variant="outline" onClick={() => handleJoinWorkspace(workspace.id)}>
                    Join Workspace
                  </Button>
                )}
              </div>
            </div>
          ))}

          {workspaces.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No workspaces. Create one to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 