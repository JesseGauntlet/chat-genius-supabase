'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/lib/database.types"
import { CreateChannelDialog } from "./sidebar/CreateChannelDialog"
import { ChannelList } from "./sidebar/ChannelList"
import { DirectMessagesList } from "./sidebar/DirectMessagesList"
import { WorkspacePanel } from "./sidebar/WorkspacePanel"
import { Separator } from "./ui/separator"
import { StatusMenu } from "./status-menu"
import { Button } from "@/components/ui/button"
import { useWorkspaces } from "@/components/providers/workspace-provider"

type Channel = Database["public"]["Tables"]["channels"]["Row"]

interface SidebarProps {
  onSelectChannel: (channel: Channel) => void
  onSelectMember: (memberId: string) => void
}

function SidebarContent({ onSelectChannel }: SidebarProps) {
  const { supabase, user } = useSupabase()
  const { workspaces } = useWorkspaces()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const router = useRouter()

  // Get current workspace from workspaces list
  const currentWorkspace = workspaces.find(w => w.id === workspaceId)

  useEffect(() => {
    if (workspaceId) {
      fetchChannels()
    }
  }, [workspaceId])

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

  return (
    <div className="w-64 bg-sidebar border-r flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <WorkspacePanel currentWorkspace={currentWorkspace} />

        <Separator className="mx-3 my-3" />

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