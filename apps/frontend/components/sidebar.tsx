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

  const fetchChannels = async () => {
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
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchDirectMessages = async () => {
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
      onSelectChannel(channel)
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

  return (
    <div className="w-64 bg-gray-100 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">{workspace?.name || 'Loading...'}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-500">Channels</h3>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-200">
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
                      ? 'bg-gray-200 hover:bg-gray-200'
                      : 'hover:bg-gray-200'
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
                    className="w-full justify-start"
                    onClick={() => onSelectChannel(channel)}
                  >
                    {channel.name}
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