'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Message } from "@/components/message"
import { MessageInput } from "@/components/message-input"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useSupabase } from '@/components/providers/supabase-provider'
import type { Database } from '@/lib/database.types'
import { FileUpload } from "@/components/file-upload"
import { ThreadPanel } from '@/components/thread-panel'

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
    total_replies: number
  }
}

interface ChannelResponse {
  channel: Channel | null
}

// Message with join on users for name
interface DatabaseMessage {
  id: string;
  message: {
    text: string;
    attachments?: Array<{
      url: string;
      name: string;
    }>;
  };
  created_at: string;
  total_replies: number;
  user: {
    id: string;
    name: string;
  };
}

function ChatPageContent() {
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')
  const channelId = searchParams.get('channel')
  const [activeChat, setActiveChat] = useState<{ type: 'channel' | 'dm', id: string | null }>({ type: 'channel', id: null })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [activeThread, setActiveThread] = useState(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle URL channel parameter
  useEffect(() => {
    if (channelId) {
      fetchChannel(channelId)
    } else {
      // Reset active chat and channel when there's no channel in URL
      setActiveChat({ type: 'channel', id: null })
      setActiveChannel(null)
    }
  }, [channelId])

  const fetchChannel = async (channelId: string) => {
    try {
      const { data: channel, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single()

      if (error) throw error
      if (channel) {
        setActiveChat({ type: 'channel', id: channel.id })
        setActiveChannel(channel)
      }
    } catch (error) {
      console.error('Error fetching channel:', error)
      // Reset active chat and channel on error
      setActiveChat({ type: 'channel', id: null })
      setActiveChannel(null)
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

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
          total_replies,
          user:user_id (
            id,
            name
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .returns<DatabaseMessage[]>()

      if (error) throw error

      // Fetch reactions for each message
      const messagesWithReactions = await Promise.all(
        messages.map(async (message) => {
          const reactions = await fetchMessageReactions(message.id)
          return {
            id: message.id,
            avatar: "/placeholder.svg",
            username: message.user.name,
            timestamp: new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            content: message.message.text,
            reactions,
            message: {
              ...message.message,
              total_replies: message.total_replies || 0
            }
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
    if (activeChat.id && activeChat.type === 'channel') {
      fetchMessages(activeChat.id)
    }
  }, [activeChat])

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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat' },
        (payload) => {
          if (payload.new.total_replies !== payload.old.total_replies) {
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === payload.new.id 
                  ? {
                      ...msg,
                      message: {
                        ...msg.message,
                        total_replies: payload.new.total_replies
                      }
                    }
                  : msg
              )
            )
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
      const { error } = await supabase
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
        onSelectChannel={handleSelectChannel} 
        onSelectMember={handleSelectMember} 
      />
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {activeChat.id ? (
          <>
            <Header 
              chatName={activeChat.type === 'channel' 
                ? (activeChannel?.name || 'Unknown Channel')
                : 'Direct Message'
              }
              workspaceId={workspaceId}
              onSelectMember={handleSelectMember}
              memberCount={memberCount}
            />
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2 p-4">
                {messages.map((message) => (
                  <Message 
                    key={message.id} 
                    {...message} 
                    onAddReaction={handleAddReaction}
                    onThreadOpen={setActiveThread}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="max-w-[1200px] mx-auto">
                <div className="flex items-center gap-2">
                  <FileUpload 
                    channelId={activeChannel?.id || ''}
                    onUploadComplete={handleFileUpload} 
                  />
                  <div className="flex-1">
                    <MessageInput onSendMessage={handleSendMessage} />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <Header 
              chatName="No channel selected"
              workspaceId={workspaceId}
              onSelectMember={handleSelectMember}
              memberCount={memberCount}
            />
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </main>
      {activeThread && (
        <ThreadPanel
          parentMessage={activeThread}
          onClose={() => setActiveThread(null)}
        />
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}