'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspaces } from "@/components/providers/workspace-provider"
import type { Database } from "@/lib/database.types"

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]
type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"]

interface WorkspacePanelProps {
  currentWorkspace: Workspace | undefined
}

export function WorkspacePanel({ currentWorkspace }: WorkspacePanelProps) {
  const { supabase, user } = useSupabase()
  const { workspaces, refreshWorkspaces } = useWorkspaces()
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim() || !user) return

    setIsCreatingWorkspace(true)
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
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          workspace_id: workspace.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      // Create default channels
      const defaultChannels = ['general', 'random']
      for (const channelName of defaultChannels) {
        const { error: channelError } = await supabase
          .from('channels')
          .insert([
            {
              name: channelName,
              workspace_id: workspace.id,
              is_private: false,
            },
          ])

        if (channelError) throw channelError
      }

      setNewWorkspaceName('')
      setDropdownOpen(false)
      await refreshWorkspaces()
      router.push(`/chat?workspace=${workspace.id}`)
    } catch (error) {
      console.error("Error creating workspace:", error)
    } finally {
      setIsCreatingWorkspace(false)
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

      // Refresh workspaces list and switch to the joined workspace
      await refreshWorkspaces()
      router.push(`/chat?workspace=${workspaceId}`)
    } catch (error) {
      console.error("Error joining workspace:", error)
    }
  }

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      // Fetch channels for the new workspace before switching
      const { data: allChannels, error } = await supabase
        .from("channels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name")

      if (error) throw error

      // Build the URL with workspace ID
      const url = new URL('/chat', window.location.href)
      url.searchParams.set('workspace', workspaceId)
      
      // Only add channel parameter if there are channels
      if (allChannels && allChannels.length > 0) {
        url.searchParams.set('channel', allChannels[0].id)
      } else {
        // Explicitly remove channel parameter for workspaces with no channels
        url.searchParams.delete('channel')
      }
      
      router.push(url.pathname + url.search)
    } catch (error) {
      console.error("Error switching workspace:", error)
      // Even on error, switch to the workspace without a channel selected
      const url = new URL('/chat', window.location.href)
      url.searchParams.set('workspace', workspaceId)
      url.searchParams.delete('channel')
      router.push(url.pathname + url.search)
    }
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 px-2 hover:bg-accent/50"
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback>
              {currentWorkspace?.name?.[0]?.toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm flex-1 text-left truncate">
            {currentWorkspace?.name || "Loading..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {workspaces.map((ws) => (
            <div key={ws.id} className="px-2 py-1">
              <div
                className="p-2 rounded-md hover:bg-accent flex items-center justify-between group cursor-pointer"
                onClick={() => handleWorkspaceSwitch(ws.id)}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {ws.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{ws.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {user && ws.owner_id !== user.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinWorkspace(ws.id)
                    }}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    Join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <form onSubmit={handleCreateWorkspace} className="space-y-2">
            <Input
              placeholder="New workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              disabled={isCreatingWorkspace} 
              className="w-full"
            >
              {isCreatingWorkspace ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 