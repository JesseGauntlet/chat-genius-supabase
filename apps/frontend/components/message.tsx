'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import EmojiPicker from 'emoji-picker-react'
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { FileIcon, MessageCircle } from "lucide-react"

interface MessageProps {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  isPinned?: boolean
  reactions: Array<{ emoji: string; count: number }>
  onAddReaction: (messageId: string, emoji: string) => void
  message: {
    text: string
    attachments?: Array<{
      url: string
      name: string
    }>
    total_replies: number
  }
  onThreadOpen?: (message: any) => void
  showActions?: boolean
  channel_id: string
}

export function Message({ 
  id, 
  avatar, 
  username, 
  timestamp, 
  content, 
  isPinned, 
  reactions = [],
  onAddReaction,
  message,
  onThreadOpen,
  showActions = true,
  channel_id
}: MessageProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    onAddReaction(id, emojiData.emoji)
    setShowEmojiPicker(false)
  }

  return (
    <div
      className="group flex items-start space-x-3 p-4 hover:bg-gray-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={username || 'User'} />
        <AvatarFallback>{(username || 'U')[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center">
          <span className="font-semibold">{username || 'Unknown User'}</span>
          <span className="ml-2 text-sm text-gray-500">{timestamp}</span>
          {isPinned && (
            <span className="ml-2 text-sm text-blue-500">📌 Pinned</span>
          )}
        </div>
        <p className="text-gray-900">{content}</p>
        
        {message?.attachments?.map((attachment, index) => (
          <div key={index} className="mt-2">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
            >
              <FileIcon className="h-4 w-4" />
              <span>{attachment.name}</span>
            </a>
          </div>
        ))}
        
        <div className="flex items-center gap-2 mt-2">
          {reactions.map(({ emoji, count }, index) => (
            <button
              key={index}
              onClick={() => onAddReaction(id, emoji)}
              className="flex items-center space-x-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
          
          {isHovered && (
            <>
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="lg"
                    className="h-8 w-8 p-0 text-xl"
                  >
                    😀
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <EmojiPicker onEmojiClick={handleEmojiSelect} />
                </PopoverContent>
              </Popover>

              {showActions && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-8 w-8 p-0"
                  onClick={() => onThreadOpen?.({
                    id,
                    avatar,
                    username,
                    timestamp,
                    content,
                    isPinned,
                    reactions,
                    message,
                    channel_id
                  })}
                >
                  <MessageCircle className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                </Button>
              )}
            </>
          )}
        </div>
        
        {message?.total_replies > 0 && (
          <button
            onClick={() => onThreadOpen?.(message)}
            className="mt-1 text-sm text-blue-500 hover:underline"
          >
            {message.total_replies} {message.total_replies === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
    </div>
  )
} 