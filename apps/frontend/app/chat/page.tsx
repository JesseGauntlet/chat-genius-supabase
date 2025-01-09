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

  const handleSelectChannel = (channelId: string) => {
    setActiveChat({ type: 'channel', id: channelId })
    // TODO: Fetch messages for the selected channel
  }

  const handleSelectDM = (dmId: string) => {
    setActiveChat({ type: 'dm', id: dmId })
    // TODO: Fetch messages for the selected DM
  }

  const handleSendMessage = async (content: string) => {
    if (!activeChat.id || !user) return

    const newMessage: ChatMessage = {
      id: String(Date.now()),
      avatar: "/placeholder.svg",
      username: user.email || 'Anonymous',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content,
    }

    // TODO: Save message to Supabase
    setMessages([...messages, newMessage])
  }

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
          chatName={activeChat.type === 'channel' 
            ? `#${channels.find(c => c.id === activeChat.id)?.name || 'unknown'}` 
            : 'Direct Message'
          } 
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
} 