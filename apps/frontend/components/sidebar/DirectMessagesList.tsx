"use client"

import { useSupabase } from '@/components/providers/supabase-provider'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!user) return

    const fetchDMUsers = async () => {
      for (const channel of directChannels) {
        const { data: members, error } = await supabase
          .from('members')
          .select(`
            user:users (
              id,
              name
            )
          `)
          .eq('channel_id', channel.id)
          .neq('user_id', user.id)
          .single()

        if (!error && members) {
          const memberWithUser = members as unknown as MemberWithUser
          setDmUsers(prev => [
            ...prev.filter(u => u.channelId !== channel.id),
            {
              id: memberWithUser.user.id,
              name: memberWithUser.user.name,
              channelId: channel.id,
            }
          ])
        }
      }
    }

    fetchDMUsers()
  }, [directChannels, supabase, user])

  return (
    <div className="space-y-1">
      {dmUsers.map((dmUser) => (
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

function DMUserItem({
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
} 