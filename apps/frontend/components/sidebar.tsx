'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/lib/database.types"
import { CreateChannelDialog } from "./sidebar/CreateChannelDialog"
import { ChannelList } from "./sidebar/ChannelList"
import { DirectMessagesList } from "./sidebar/DirectMessagesList"

type Channel = Database["public"]["Tables"]["channels"]["Row"]
type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]

interface SidebarProps {
  onSelectChannel: (channel: Channel) => void
  onSelectMember: (memberId: string) => void
}

// Main sidebar component that handles channel management and display
function SidebarContent({ onSelectChannel }: SidebarProps) {
  // State management for workspace, channels, and selection
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  /* -------------------------------------------------------------------------
   * Data Fetching Effects
   * ------------------------------------------------------------------------- */
  // Initialize workspace and channels when workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace()
      fetchChannels()
    }
  }, [workspaceId])

  // Update selected channel when URL changes
  useEffect(() => {
    const channelId = searchParams.get("channel")
    if (channelId) {
      setSelectedChannelId(channelId)
    }
  }, [searchParams])

  /* -------------------------------------------------------------------------
   * Data Fetching Functions
   * ------------------------------------------------------------------------- */
  // Fetch current workspace details
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

  // Fetch all channels (both public and DMs) for the current workspace
  const fetchChannels = async (selectChannelId?: string) => {
    if (!workspaceId) return
    try {
      // Fetch all channels - both public and private (DMs)
      const { data: allChannels, error } = await supabase
        .from("channels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name")

      if (error) throw error
      setChannels(allChannels)

      // If a specific channel should be selected (e.g., after creation)
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

  /* -------------------------------------------------------------------------
   * Event Handlers
   * ------------------------------------------------------------------------- */
  // Handle channel selection
  const handleChannelClick = (channel: Channel) => {
    setSelectedChannelId(channel.id)
    onSelectChannel(channel)
  }

  // Handle new channel creation
  const handleChannelCreated = async (channelId: string) => {
    await fetchChannels(channelId)
  }

  /* -------------------------------------------------------------------------
   * Realtime Subscriptions
   * ------------------------------------------------------------------------- */
  // Subscribe to channel changes for real-time updates
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

  /* -------------------------------------------------------------------------
   * Render UI
   * ------------------------------------------------------------------------- */
  return (
    <div className="w-64 bg-purple-100 flex flex-col h-full">
      {/* Workspace Header */}
      <div className="p-4 border-b flex items-center justify-between bg-purple-200">
        <h2 className="font-semibold">{workspace?.name || "Loading..."}</h2>
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user?.user_metadata?.avatar_url || ""}
            alt={user?.user_metadata?.name || ""}
          />
          <AvatarFallback>
            {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Channel Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Public Channels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500">Channels</h3>
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

        {/* Direct Messages */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500">Direct Messages</h3>
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

// Wrapper component that provides loading state
export function Sidebar({ onSelectChannel, onSelectMember }: SidebarProps) {
  return (
    <Suspense
      fallback={
        <div className="w-64 bg-purple-100 flex flex-col h-full">
          <div className="p-4">Loading sidebar...</div>
        </div>
      }
    >
      <SidebarContent onSelectChannel={onSelectChannel} onSelectMember={onSelectMember} />
    </Suspense>
  )
}