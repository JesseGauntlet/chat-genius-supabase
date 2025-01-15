'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import EmojiPicker from 'emoji-picker-react'
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { FileIcon, MessageCircle, MoreVertical, Pin, Smile } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

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
  showReplyCount?: boolean
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
  showReplyCount = true
}: MessageProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    onAddReaction(id, emojiData.emoji)
    setShowEmojiPicker(false)
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 px-4 py-3 transition-colors",
        "hover:bg-accent hover:bg-opacity-10",
        isPinned && "bg-accent/5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={avatar} alt={username || 'User'} />
        <AvatarFallback>{(username || 'U')[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{username || 'Unknown User'}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {isPinned && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm leading-normal break-words text-foreground">{content}</p>
          {message.attachments?.map((attachment, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileIcon className="h-4 w-4" />
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {attachment.name}
              </a>
            </div>
          ))}
        </div>
        {(reactions.length > 0 || showActions) && (
          <div className="flex items-center gap-2 pt-0.5">
            {reactions.map(({ emoji, count }, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => onAddReaction(id, emoji)}
                className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs hover:bg-accent/20 transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {showActions && isHovered && (
        <div className="absolute right-4 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-accent/20"
              >
                <Smile className="h-4 w-4" />
                <span className="sr-only">Add reaction</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="end" 
              className="w-80 p-0"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width="100%"
              />
            </PopoverContent>
          </Popover>
          {showReplyCount && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-accent/20"
              onClick={() => onThreadOpen?.(message)}
            >
              <div className="relative">
                <MessageCircle className="h-4 w-4" />
                {message.total_replies > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3 min-w-[0.75rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    {message.total_replies}
                  </span>
                )}
              </div>
              <span className="sr-only">Reply in thread</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-accent/20"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Pin message
              </DropdownMenuItem>
              <DropdownMenuItem>
                Copy text
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
} 