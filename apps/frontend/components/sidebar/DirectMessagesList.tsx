"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePresence } from '@/lib/hooks/use-presence'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Channel = Database['public']['Tables']['channels']['Row']
type User = Database['public']['Tables']['users']['Row']
type Member = Database['public']['Tables']['members']['Row']

interface DirectMessagesListProps {
  directChannels: Channel[]
  selectedChannelId: string | null
  onSelectChannel: (channel: Channel) => void
}

interface DMUser {
  id: string
  name: string | null
  channelId: string
}

interface MemberWithUser {
  user: {
    id: string
    name: string | null
  }
}

export function DirectMessagesList({
  directChannels,
  selectedChannelId,
  onSelectChannel,
}: DirectMessagesListProps) {
  const { supabase, user } = useSupabase()
  const [dmUsers, setDmUsers] = useState<DMUser[]>([])

  const fetchDMUsers = useCallback(async () => {
    if (!user) return

    const channelIds = directChannels.map(c => c.id)
    if (channelIds.length === 0) return

    const { data: members, error } = await supabase
      .from('members')
      .select(`
        channel_id,
        user:users (
          id,
          name
        )
      `)
      .in('channel_id', channelIds)
      .neq('user_id', user.id)

    if (!error && members) {
      const newDmUsers = members.map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        channelId: member.channel_id,
      }))
      setDmUsers(newDmUsers)
    }
  }, [supabase, user, directChannels])

  useEffect(() => {
    fetchDMUsers()

    // Subscribe to member changes
    const channelIds = directChannels.map(c => c.id)
    if (channelIds.length === 0) return

    const subscription = supabase
      .channel('members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
          filter: `channel_id=in.(${channelIds.join(',')})`,
        },
        () => {
          fetchDMUsers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, directChannels, fetchDMUsers])

  const sortedDmUsers = useMemo(() => {
    return [...dmUsers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [dmUsers])

  return (
    <div className="space-y-1">
      {sortedDmUsers.map((dmUser) => (
        <DMUserItem
          key={dmUser.channelId}
          user={dmUser}
          isSelected={selectedChannelId === dmUser.channelId}
          onSelect={() => {
            const channel = directChannels.find(c => c.id === dmUser.channelId)
            if (channel) onSelectChannel(channel)
          }}
        />
      ))}
    </div>
  )
}

const DMUserItem = React.memo(function DMUserItem({
  user,
  isSelected,
  onSelect,
}: {
  user: DMUser
  isSelected: boolean
  onSelect: () => void
}) {
  const { status, customStatus } = usePresence(user.id)

  return (
    <button
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground"
      )}
      onClick={onSelect}
    >
      <div className="relative">
        <div className="w-2 h-2">
          <span className={cn(
            "absolute inset-0 rounded-full",
            status === 'online' && 'bg-green-500',
            status === 'away' && 'bg-yellow-500',
            status === 'offline' && 'bg-gray-500'
          )} />
        </div>
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium">{user.name || 'Unknown User'}</div>
        {customStatus && (
          <div className="text-xs text-muted-foreground truncate">
            {customStatus}
          </div>
        )}
      </div>
    </button>
  )
}) 