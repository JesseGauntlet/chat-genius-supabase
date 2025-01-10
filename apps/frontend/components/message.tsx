'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import EmojiPicker from 'emoji-picker-react'
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useSupabase } from "@/components/providers/supabase-provider"

interface MessageProps {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  isPinned?: boolean
  reactions: Array<{ emoji: string; count: number }>
  onAddReaction: (messageId: string, emoji: string) => void
}

export function Message({ 
  id, 
  avatar, 
  username, 
  timestamp, 
  content, 
  isPinned, 
  reactions = [],
  onAddReaction 
}: MessageProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleEmojiSelect = (emojiData: any) => {
    onAddReaction(id, emojiData.emoji)
    setShowEmojiPicker(false)
  }

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={username} />
        <AvatarFallback>{username[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center">
          <span className="font-semibold">{username}</span>
          <span className="ml-2 text-sm text-gray-500">{timestamp}</span>
          {isPinned && (
            <span className="ml-2 text-sm text-blue-500">📌 Pinned</span>
          )}
        </div>
        <p className="text-gray-900">{content}</p>
        
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
          
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0"
              >
                😀
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <EmojiPicker onEmojiClick={handleEmojiSelect} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
} 