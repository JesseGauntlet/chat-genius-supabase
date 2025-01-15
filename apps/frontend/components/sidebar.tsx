'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/lib/database.types"
import { CreateChannelDialog } from "./sidebar/CreateChannelDialog"
import { ChannelList } from "./sidebar/ChannelList"
import { DirectMessagesList } from "./sidebar/DirectMessagesList"
import { Separator } from "./ui/separator"
import { StatusMenu } from "./status-menu"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type Channel = Database["public"]["Tables"]["channels"]["Row"]
type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]
type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"]
type MemberInsert = Database["public"]["Tables"]["members"]["Insert"]

interface SidebarProps {
  onSelectChannel: (channel: Channel) => void
  onSelectMember: (memberId: string) => void
}

function SidebarContent({ onSelectChannel }: SidebarProps) {
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace()
      fetchChannels()
    }
  }, [workspaceId])

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  useEffect(() => {
    const channelId = searchParams.get("channel")
    if (channelId) {
      setSelectedChannelId(channelId)
    }
  }, [searchParams])

  const fetchWorkspaces = async () => {
    if (!user) return
    try {
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          created_at,
          owner_id
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!workspaces) return
      
      setWorkspaces(workspaces)
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    }
  }

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
      const memberData: MemberInsert = {
        user_id: user.id,
        workspace_id: workspace.id,
        role: 'admin',
      }

      const { error: memberError } = await supabase
        .from('members')
        .insert([memberData])

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
      await fetchWorkspaces()
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
      await fetchWorkspaces()
      router.push(`/chat?workspace=${workspaceId}`)
    } catch (error) {
      console.error("Error joining workspace:", error)
    }
  }

  const fetchWorkspace = async () => {
    if (!workspaceId) return
    try {
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single()

      if (error) throw error
      setWorkspace(workspace)
    } catch (error) {
      console.error("Error fetching workspace:", error)
    }
  }

  const fetchChannels = async (selectChannelId?: string) => {
    if (!workspaceId) return
    try {
      const { data: allChannels, error } = await supabase
        .from("channels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name")

      if (error) throw error
      setChannels(allChannels)

      // If a specific channel is requested, select it
      if (selectChannelId) {
        const channelToSelect = allChannels.find(c => c.id === selectChannelId)
        if (channelToSelect) {
          setSelectedChannelId(selectChannelId)
          onSelectChannel(channelToSelect)
        }
      } 
      // Otherwise, if no channel is currently selected and there are channels, select the first one
      else if (!selectedChannelId && allChannels.length > 0) {
        const firstChannel = allChannels[0]
        setSelectedChannelId(firstChannel.id)
        onSelectChannel(firstChannel)
      }
    } catch (error) {
      console.error("Error fetching channels:", error)
    }
  }

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannelId(channel.id)
    onSelectChannel(channel)
  }

  const handleChannelCreated = async (channelId: string) => {
    await fetchChannels(channelId)
  }

  useEffect(() => {
    if (!workspaceId) return

    const channelSubscription = supabase
      .channel("channel-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channels",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchChannels()
        }
      )
      .subscribe()

    return () => {
      channelSubscription.unsubscribe()
    }
  }, [workspaceId])

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
    <div className="w-64 bg-sidebar border-r flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 px-2 hover:bg-accent/50"
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback>
                  {workspace?.name?.[0]?.toUpperCase() || "W"}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm flex-1 text-left truncate">
                {workspace?.name || "Loading..."}
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

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || ""}
                  alt={user?.user_metadata?.name || ""}
                />
                <AvatarFallback>
                  {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <StatusMenu />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || "Unknown User"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/auth/login')
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        <div className="px-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Channels</h3>
            {user && workspaceId && (
              <CreateChannelDialog
                supabase={supabase}
                workspaceId={workspaceId}
                userId={user.id}
                onChannelCreated={handleChannelCreated}
              />
            )}
          </div>

          <ChannelList
            channels={channels.filter(c => !c.is_private)}
            selectedChannelId={selectedChannelId}
            onChannelClick={handleChannelClick}
          />
        </div>

        <Separator className="mx-3" />

        <div className="px-3">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Direct Messages</h3>
          <DirectMessagesList
            directChannels={channels.filter(c => c.is_private)}
            selectedChannelId={selectedChannelId}
            onSelectChannel={handleChannelClick}
          />
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ onSelectChannel, onSelectMember }: SidebarProps) {
  return (
    <Suspense
      fallback={
        <div className="w-64 bg-sidebar border-r flex flex-col h-full">
          <div className="p-4">Loading sidebar...</div>
        </div>
      }
    >
      <SidebarContent onSelectChannel={onSelectChannel} onSelectMember={onSelectMember} />
    </Suspense>
  )
}