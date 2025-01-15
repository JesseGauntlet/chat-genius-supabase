'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/lib/database.types"
import { CreateChannelDialog } from "./sidebar/CreateChannelDialog"
import { ChannelList } from "./sidebar/ChannelList"
import { DirectMessagesList } from "./sidebar/DirectMessagesList"
import { Separator } from "./ui/separator"
import { StatusMenu } from "./status-menu"

type Channel = Database["public"]["Tables"]["channels"]["Row"]
type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]

interface SidebarProps {
  onSelectChannel: (channel: Channel) => void
  onSelectMember: (memberId: string) => void
}

function SidebarContent({ onSelectChannel }: SidebarProps) {
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace()
      fetchChannels()
    }
  }, [workspaceId])

  useEffect(() => {
    const channelId = searchParams.get("channel")
    if (channelId) {
      setSelectedChannelId(channelId)
    }
  }, [searchParams])

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

      if (selectChannelId) {
        const channelToSelect = allChannels.find(c => c.id === selectChannelId)
        if (channelToSelect) {
          setSelectedChannelId(selectChannelId)
          onSelectChannel(channelToSelect)
        }
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
      <div className="p-4 border-b flex items-center justify-between bg-sidebar-header">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={workspace?.avatar_url || ""}
              alt={workspace?.name || "Workspace"}
            />
            <AvatarFallback>
              {workspace?.name?.[0]?.toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="font-semibold text-sm leading-none">
              {workspace?.name || "Loading..."}
            </h2>
            <StatusMenu />
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