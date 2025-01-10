'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "./ui/button"
import { useSupabase } from '@/components/providers/supabase-provider'
import { Plus } from 'lucide-react'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import type { Database } from '@/lib/database.types'
import { createChannel } from '@/utils/channel'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

type Channel = Database['public']['Tables']['channels']['Row']
type Workspace = Database['public']['Tables']['workspaces']['Row']
type ChannelInsert = Database['public']['Tables']['channels']['Insert']
type MemberInsert = Database['public']['Tables']['members']['Insert']

interface SidebarProps {
  onSelectChannel: (channel: Channel) => void
  onSelectMember: (memberId: string) => void
}

export function Sidebar({ onSelectChannel, onSelectMember }: SidebarProps) {
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [newChannelName, setNewChannelName] = useState('')
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [directMessages, setDirectMessages] = useState<any[]>([])

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace()
      fetchChannels()
    }
  }, [workspaceId])

  useEffect(() => {
    const channelId = searchParams.get('channel')
    if (channelId) {
      setSelectedChannelId(channelId)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchDirectMessages()
    }
  }, [user])

  const fetchWorkspace = async () => {
    if (!workspaceId) return

    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()

      if (error) throw error
      setWorkspace(workspace)
    } catch (error) {
      console.error('Error fetching workspace:', error)
    }
  }

  const fetchChannels = async (selectChannelId?: string) => {
    if (!workspaceId) return

    try {
      const { data: workspaceChannels, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_private', false)
        .order('name')

      if (error) throw error
      setChannels(workspaceChannels)

      if (selectChannelId) {
        const channelToSelect = workspaceChannels.find(c => c.id === selectChannelId)
        if (channelToSelect) {
          setSelectedChannelId(selectChannelId)
          onSelectChannel(channelToSelect)
        }
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchDirectMessages = async (selectChannelId?: string) => {
    try {
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id, members!inner(user_id)')
        .eq('is_private', true)
        .eq('members.user_id', user?.id)

      if (channelsError) throw channelsError

      const channelIds = channels.map((channel) => channel.id)

      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          channel_id,
          user:users(id, name)
        `)
        .in('channel_id', channelIds)
        .neq('user_id', user?.id)

      if (membersError) throw membersError

      const directMessages = channels.map((channel) => {
        const channelMembers = members
          .filter((member) => member.channel_id === channel.id)
          .map((member) => member.user.name)

        return {
          id: channel.id,
          name: channelMembers.join(', ')
        }
      })

      setDirectMessages(directMessages)

      if (selectChannelId) {
        const dmToSelect = directMessages.find(dm => dm.id === selectChannelId)
        if (dmToSelect) {
          setSelectedChannelId(selectChannelId)
          onSelectChannel(dmToSelect)
        }
      }
    } catch (error) {
      console.error('Error fetching direct messages:', error)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !user || !newChannelName.trim()) return

    setIsCreatingChannel(true)
    try {
      const channel = await createChannel(
        supabase,
        workspaceId,
        user.id,
        newChannelName,
        false
      )

      setNewChannelName('')
      setDialogOpen(false)
      
      await fetchChannels(channel.id)
    } catch (error) {
      console.error('Error creating channel:', error)
    } finally {
      setIsCreatingChannel(false)
    }
  }

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannelId(channel.id)
    onSelectChannel(channel)
  }

  useEffect(() => {
    if (!workspaceId) return

    const channelSubscription = supabase
      .channel('channel-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'channels',
          filter: `workspace_id=eq.${workspaceId}`
        }, 
        () => {
          fetchChannels()
        }
      )
      .subscribe()

    const memberSubscription = supabase
      .channel('member-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members'
        },
        () => {
          fetchDirectMessages()
        }
      )
      .subscribe()

    return () => {
      channelSubscription.unsubscribe()
      memberSubscription.unsubscribe()
    }
  }, [workspaceId])

  return (
    <div className="w-64 bg-purple-100 flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between bg-purple-200">
        <h2 className="font-semibold">{workspace?.name || 'Loading...'}</h2>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.name || ''} />
          <AvatarFallback>
            {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-500">Channels</h3>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-purple-100">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a new channel</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Enter channel name"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isCreatingChannel}>
                      {isCreatingChannel ? 'Creating...' : 'Create Channel'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`w-full justify-start ${
                    selectedChannelId === channel.id
                      ? 'bg-purple-200 hover:bg-purple-200'
                      : 'hover:bg-purple-200'
                  }`}
                  onClick={() => handleChannelClick(channel)}
                >
                  # {channel.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">Direct Messages</h3>
            {directMessages.length > 0 ? (
              <div className="space-y-1">
                {directMessages.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className={`w-full justify-start ${
                      selectedChannelId === channel.id
                        ? 'bg-purple-200 hover:bg-purple-200'
                        : 'hover:bg-purple-200'
                    }`}
                    onClick={() => handleChannelClick(channel)}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {channel.name.split(',')[0].trim()[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{channel.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No direct messages</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 