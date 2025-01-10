'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Message } from "@/components/message"
import { MessageInput } from "@/components/message-input"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useSupabase } from '@/components/providers/supabase-provider'
import type { Database } from '@/lib/database.types'
import { FileUpload } from "@/components/file-upload"

type Channel = Database['public']['Tables']['channels']['Row']

interface ChatMessage {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  isPinned?: boolean
  reactions: Array<{ emoji: string; count: number }>
  message: {
    text: string
    attachments?: Array<{
      url: string
      name: string
    }>
  }
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
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    if (workspaceId && user) {
      fetchChannels()
    }
  }, [workspaceId, user])

  useEffect(() => {
    if (workspaceId) {
      fetchMemberCount()
    }
  }, [workspaceId])

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

  const fetchMemberCount = async () => {
    if (!workspaceId) return

    try {
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId)

      if (error) throw error
      setMemberCount(count || 0)
    } catch (error) {
      console.error('Error fetching member count:', error)
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

  const handleSelectMember = (memberId: string) => {
    setActiveChat({ type: 'dm', id: memberId })
    // TODO: Fetch messages for the selected DM
  }

  const fetchMessageReactions = async (messageId: string) => {
    const { data: reactions, error } = await supabase
      .from('emojis')
      .select('emoji_uni_code')
      .eq('chat_id', messageId)

    if (error) {
      console.error('Error fetching reactions:', error)
      return []
    }

    // Count occurrences of each emoji
    const emojiCounts = reactions.reduce((acc: Record<string, number>, { emoji_uni_code }) => {
      acc[emoji_uni_code] = (acc[emoji_uni_code] || 0) + 1
      return acc
    }, {})

    return Object.entries(emojiCounts).map(([emoji, count]) => ({
      emoji,
      count
    }))
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

      // Fetch reactions for each message
      const messagesWithReactions = await Promise.all(
        messages.map(async (message) => {
          const reactions = await fetchMessageReactions(message.id)
          return {
            id: message.id,
            avatar: "/placeholder.svg",
            username: message.user?.name || 'Unknown User',
            timestamp: new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            content: message.message.text,
            reactions,
            message: message.message
          }
        })
      )

      setMessages(messagesWithReactions)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('emojis')
        .insert({
          chat_id: messageId,
          user_id: user.id,
          emoji_uni_code: emoji
        })

      if (error) throw error

      // Update the messages state with the new reaction
      setMessages(prevMessages => 
        prevMessages.map(message => {
          if (message.id === messageId) {
            const existingReaction = message.reactions.find(r => r.emoji === emoji)
            if (existingReaction) {
              return {
                ...message,
                reactions: message.reactions.map(r => 
                  r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                )
              }
            } else {
              return {
                ...message,
                reactions: [...message.reactions, { emoji, count: 1 }]
              }
            }
          }
          return message
        })
      )
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }, [user, supabase])

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
              timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              content: payload.new.message.text,
              reactions: [],
              message: payload.new.message
            }])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChat.id])

  useEffect(() => {
    const channel = supabase
      .channel('chat-reactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emojis' },
        async (payload) => {
          const messageId = payload.new.chat_id
          if (messages.some(m => m.id === messageId)) {
            // Refresh reactions for this message
            const reactions = await fetchMessageReactions(messageId)
            setMessages(prevMessages =>
              prevMessages.map(message =>
                message.id === messageId
                  ? { ...message, reactions }
                  : message
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messages])

  const handleFileUpload = async (fileUrl: string, fileName: string) => {
    if (!activeChannel?.id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat')
        .insert({
          channel_id: activeChannel.id,
          user_id: user.id,
          message: {
            text: `Shared a file: ${fileName}`,
            attachments: [{ url: fileUrl, name: fileName }]
          }
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending file message:', error)
    }
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
        onSelectMember={handleSelectMember} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          chatName={activeChat.type === 'channel' 
            ? activeChannel?.name 
            : 'Direct Message'
          }
          workspaceId={workspaceId}
          onSelectMember={handleSelectMember}
          memberCount={memberCount}
        />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <Message 
              key={message.id} 
              {...message} 
              onAddReaction={handleAddReaction}
            />
          ))}
        </div>
        <div className="flex items-center space-x-2 p-4 border-t">
          <FileUpload 
            channelId={activeChannel?.id || ''}
            onUploadComplete={handleFileUpload} 
          />
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </main>
    </div>
  )
}