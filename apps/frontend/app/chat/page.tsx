'use client'

import { useState } from 'react'
import { Message } from "@/components/message"
import { MessageInput } from "@/components/message-input"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

interface ChatMessage {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  isPinned?: boolean
  reactions?: Array<{ emoji: string; count: number }>
}

const channelMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: '1',
      avatar: "/placeholder.svg",
      username: "John Smith",
      timestamp: "9:53 AM",
      content: "Hello everyone! Welcome to the #general channel 👋",
      isPinned: true,
      reactions: [
        { emoji: "👋", count: 2 },
        { emoji: "❤️", count: 4 }
      ]
    },
    {
      id: '2',
      avatar: "/placeholder.svg",
      username: "Jane Doe",
      timestamp: "9:56 AM",
      content: "Thanks for the warm welcome! Excited to be here.",
      reactions: [
        { emoji: "🎉", count: 1 }
      ]
    }
  ],
  '2': [
    {
      id: '3',
      avatar: "/placeholder.svg",
      username: "Alice Brown",
      timestamp: "10:15 AM",
      content: "Hey all! Anyone have any fun weekend plans to share? #random",
      reactions: [
        { emoji: "🏖️", count: 3 },
        { emoji: "🍻", count: 2 }
      ]
    }
  ]
}

const dmMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: '5',
      avatar: "/placeholder.svg",
      username: "John Smith",
      timestamp: "2:30 PM",
      content: "Hey, how's the project coming along?",
    }
  ],
  '2': [
    {
      id: '6',
      avatar: "/placeholder.svg",
      username: "Jane Doe",
      timestamp: "3:45 PM",
      content: "Just wanted to check in about the meeting tomorrow.",
    }
  ]
}

const channels = [
  { id: '1', name: 'general' },
  { id: '2', name: 'random' },
]

const directMessages = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Jane Doe' },
  { id: '3', name: 'Bob Wilson' },
  { id: '4', name: 'Alice Brown' },
  { id: '5', name: 'Sam Taylor' },
]

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState({ type: 'channel', id: '1' })
  const [messages, setMessages] = useState(channelMessages['1'])

  const handleSelectChannel = (channelId: string) => {
    setActiveChat({ type: 'channel', id: channelId })
    setMessages(channelMessages[channelId] || [])
  }

  const handleSelectDM = (dmId: string) => {
    setActiveChat({ type: 'dm', id: dmId })
    setMessages(dmMessages[dmId] || [])
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onSelectChannel={handleSelectChannel} onSelectDM={handleSelectDM} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          chatName={activeChat.type === 'channel' 
            ? `#${channels.find(c => c.id === activeChat.id)?.name || 'unknown'}` 
            : directMessages.find(dm => dm.id === activeChat.id)?.name || 'unknown'
          } 
        />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <Message key={message.id} {...message} />
          ))}
        </div>
        <MessageInput onSendMessage={(content) => {
          const newMessage: ChatMessage = {
            id: String(Date.now()),
            avatar: "/placeholder.svg",
            username: "John Doe",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content,
          }
          setMessages([...messages, newMessage])
        }} />
      </main>
    </div>
  )
} 