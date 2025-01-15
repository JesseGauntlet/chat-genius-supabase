'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Smile, Paperclip, Send } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import EmojiPicker from 'emoji-picker-react'
import TextareaAutosize from 'react-textarea-autosize'

interface MessageInputProps {
  onSendMessage: (content: string) => void
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isComposing) {
      onSendMessage(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    setMessage(prev => prev + emojiData.emoji)
    textareaRef.current?.focus()
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-background border rounded-lg">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2 min-h-[44px] rounded-md border bg-background px-3 py-2">
          <TextareaAutosize
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-w-0 resize-none bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            maxRows={5}
          />
          <div className="flex shrink-0 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <Smile className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Add emoji</span>
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
            <Button 
              type="button" 
              size="icon" 
              variant="ghost"
              className="h-8 w-8"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Attach file</span>
            </Button>
          </div>
        </div>
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || isComposing}
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  )
} 