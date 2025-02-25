'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import EmojiPicker from 'emoji-picker-react'
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { FileIcon, MessageCircle, MoreVertical, Pin, Smile } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
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
  message: {
    text: string
    metadata?: {
      imitating_user?: string
    }
    attachments?: Array<{
      url: string
      name: string
    }>
    total_replies: number
  }
  onAddReaction: (messageId: string, emoji: string) => void
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
  const { supabase } = useSupabase()

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    onAddReaction(id, emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleAttachmentClick = async (attachment: { url: string, name: string }) => {
    try {
      // Extract the file path from the URL
      const url = new URL(attachment.url)
      const path = url.pathname.split('/channel-files/')[1]
      
      if (!path) {
        console.error('Invalid file path')
        return
      }

      // Get a fresh signed URL
      const { data, error } = await supabase.storage
        .from('channel-files')
        .createSignedUrl(path, 60 * 60) // 1 hour expiry

      if (error) throw error
      if (!data) throw new Error('Failed to get signed URL')

      // Open the signed URL in a new tab
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error getting signed URL:', error)
    }
  }

  const displayName = username === 'Chatbot' && message.metadata?.imitating_user
    ? `Chatbot | ${message.metadata.imitating_user}`
    : username

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
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={username || 'User'} />
        <AvatarFallback>{(username || 'U')[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {message.total_replies > 0 && showReplyCount && (
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => onThreadOpen?.({
              id,
              avatar,
              username: displayName,
              timestamp,
              content,
              message
            })}>
              • {message.total_replies === 1 ? "1 reply" : `${message.total_replies} replies`}
            </span>
          )}
          {isPinned && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-normal break-words text-foreground">
            {content}
          </p>
          {message?.attachments?.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileIcon className="h-4 w-4" />
              <button
                onClick={() => handleAttachmentClick(attachment)}
                className="hover:underline"
              >
                {attachment.name}
              </button>
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

      {showActions && (
        <div 
          className={cn(
            "absolute right-4 top-2 flex items-center gap-0.5 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/20"
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
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/20"
              onClick={() => onThreadOpen?.({
                id,
                avatar,
                username: displayName,
                timestamp,
                content,
                message
              })}
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
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/20"
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