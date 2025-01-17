'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Smile, Send, Bot, ChevronLeft } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "./ui/input"
import EmojiPicker from 'emoji-picker-react'
import TextareaAutosize from 'react-textarea-autosize'
import { useSupabase } from "@/components/providers/supabase-provider"
import { cn } from "@/lib/utils"
import { FileUpload } from "./file-upload"

interface MessageInputProps {
  onSendMessage: (content: string) => void
  channelId: string
  onFileUpload: (fileUrl: string, fileName: string) => void
}

type CommandType = 'chatbot'
type CommandView = 'list' | 'input'

export function MessageInput({ onSendMessage, channelId, onFileUpload }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [targetUsername, setTargetUsername] = useState("")
  const [query, setQuery] = useState("")
  const [showChatbotInput, setShowChatbotInput] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null)
  const [commandView, setCommandView] = useState<CommandView>('list')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { supabase } = useSupabase()

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

  const handleChatbotCommand = async () => {
    if (!targetUsername.trim() || !query.trim()) return
    
    // Send the user's command message first
    const command = `@chatbot ${targetUsername} ${query}`
    onSendMessage(command)

    // Reset the input fields and close the dropdown
    setTargetUsername("")
    setQuery("")
    setShowChatbotInput(false)
    setCommandView('list')
    setSelectedCommand(null)
  }

  const handleCommandSelect = (command: CommandType) => {
    setSelectedCommand(command)
    setCommandView('input')
  }

  const handleBackToCommands = () => {
    setCommandView('list')
    setSelectedCommand(null)
    setTargetUsername("")
    setQuery("")
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const renderCommandContent = () => {
    if (commandView === 'list') {
      return (
        <div className="py-1">
          <button 
            className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
            onClick={(e) => {
              e.preventDefault()
              handleCommandSelect('chatbot')
            }}
          >
            <Bot className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">@chatbot [user] [query]</div>
              <div className="text-xs text-muted-foreground">Ask the chatbot to imitate a user</div>
            </div>
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleBackToCommands}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">@chatbot Command</span>
        </div>
        <div>
          <label className="text-sm font-medium">Username to imitate</label>
          <Input
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="Enter username..."
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Query</label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your question..."
            className="mt-1"
          />
        </div>
        <Button 
          type="button"
          onClick={handleChatbotCommand}
          className="w-full"
          disabled={!targetUsername.trim() || !query.trim()}
        >
          Send Chatbot Command
        </Button>
      </div>
    )
  }

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

            <DropdownMenu 
              open={showChatbotInput} 
              onOpenChange={(open) => {
                setShowChatbotInput(open)
                if (!open) {
                  setCommandView('list')
                  setSelectedCommand(null)
                  setTargetUsername("")
                  setQuery("")
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <Bot className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Commands</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={cn(
                  "w-80",
                  commandView === 'input' ? "p-4" : "p-0"
                )}
              >
                {renderCommandContent()}
              </DropdownMenuContent>
            </DropdownMenu>

            <FileUpload 
              channelId={channelId}
              onUploadComplete={onFileUpload}
            />
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