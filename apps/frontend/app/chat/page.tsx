'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Message } from "@/components/message"
import { MessageInput } from "@/components/message-input"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useSupabase } from '@/components/providers/supabase-provider'
import type { Database } from '@/lib/database.types'

type Channel = Database['public']['Tables']['channels']['Row']

interface ChatMessage {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  isPinned?: boolean
  reactions?: Array<{ emoji: string; count: number }>
}

interface ChannelResponse {
  channel: Channel | null
}

export default function ChatPage() {
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')
  
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChat, setActiveChat] = useState<{ type: 'channel' | 'dm', id: string | null }>({ type: 'channel', id: null })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)

  useEffect(() => {
    if (workspaceId && user) {
      fetchChannels()
    }
  }, [workspaceId, user])

  const fetchChannels = async () => {
    if (!workspaceId) return

    try {
      const { data: memberChannels, error } = await supabase
        .from('members')
        .select(`
          channel:channels (
            id,
            name,
            created_at,
            workspace_id,
            is_private
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('user_id', user?.id)

      if (error) throw error

      const channelList = (memberChannels as unknown as ChannelResponse[])
        .map(mc => mc.channel)
        .filter((c): c is Channel => c !== null)

      setChannels(channelList)

      // Set first channel as active if none selected
      if (!activeChat.id && channelList.length > 0) {
        setActiveChat({ type: 'channel', id: channelList[0].id })
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const handleSelectChannel = (channel: Channel) => {
    setActiveChat({ type: 'channel', id: channel.id })
    setActiveChannel(channel)
  }

  const handleSelectDM = (dmId: string) => {
    setActiveChat({ type: 'dm', id: dmId })
    // TODO: Fetch messages for the selected DM
  }

  const fetchMessages = async (channelId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat')
        .select(`
          id,
          message,
          created_at,
          user:user_id (
            id,
            name
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(messages.map(message => ({
        id: message.id,
        avatar: "/placeholder.svg",
        username: message.user?.name || 'Unknown User',
        timestamp: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: message.message.text,
      })))
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  useEffect(() => {
    if (activeChat.id && activeChat.type === 'channel') {
      fetchMessages(activeChat.id)
    }
  }, [activeChat])

  const handleSendMessage = async (content: string) => {
    if (!activeChat.id || !user) return

    try {
      const { error } = await supabase
        .from('chat')
        .insert({
          message: { text: content },
          user_id: user.id,
          channel_id: activeChat.id,
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat' },
        async (payload) => {
          if (payload.new.channel_id === activeChat.id) {
            const { data: user, error } = await supabase
              .from('users')
              .select('name')
              .eq('id', payload.new.user_id)
              .single()

            if (error) {
              console.error('Error fetching user:', error)
              return
            }

            setMessages(prevMessages => [...prevMessages, {
              id: payload.new.id,
              avatar: "/placeholder.svg",
              username: user.name || 'Unknown User',
              timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: payload.new.message.text,
            }])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChat.id])

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please select a workspace to continue.</p>
      </div>
    )
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        channels={channels}
        onSelectChannel={handleSelectChannel} 
        onSelectDM={handleSelectDM} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          chatName={activeChannel 
            ? `#${activeChannel.name}` 
            : 'Unnamed Channel'
          } 
          workspaceId={workspaceId}
        />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <Message key={message.id} {...message} />
          ))}
        </div>
        <MessageInput onSendMessage={handleSendMessage} />
      </main>
    </div>
  )