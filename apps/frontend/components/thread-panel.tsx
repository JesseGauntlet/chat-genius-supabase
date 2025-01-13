import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Message } from './message'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { X } from 'lucide-react'

interface Reply {
  id: string
  message: {
    text: string
    attachments?: Array<{
      url: string
      name: string
    }>
  }
  user: {
    id: string
    name: string
  }
  created_at: string
}

interface ThreadPanelProps {
  parentMessage: any
  onClose: () => void
}

export function ThreadPanel({ parentMessage, onClose }: ThreadPanelProps) {
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState<Reply[]>([])
  const { supabase, user } = useSupabase()
  
  useEffect(() => {
    loadReplies()
    const cleanup = subscribeToReplies()
    return () => {
      cleanup()
    }
  }, [parentMessage.id])
  
  const loadReplies = async () => {
    const { data } = await supabase
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
      .eq('parent_id', parentMessage.id)
      .order('created_at', { ascending: true })
    
    setReplies(data || [])
  }
  
  const subscribeToReplies = () => {
    const channel = supabase
      .channel(`thread-${parentMessage.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat',
        filter: `parent_id=eq.${parentMessage.id}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data: joinedReply, error } = await supabase
            .from('chat')
            .select(`
              id,
              channel_id,
              message,
              created_at,
              user:user_id (
                id,
                name
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (error) {
            console.error('Error fetching new thread reply user info:', error)
            return
          }

          setReplies(prev => [...prev, joinedReply])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
  
  const sendReply = async () => {
    if (!replyText.trim()) return
    
    await supabase.from('chat').insert({
      message: { text: replyText },
      user_id: user?.id,
      channel_id: parentMessage.channel_id,
      parent_id: parentMessage.id
    })
    
    // Update parent message reply count
    await supabase.rpc('increment_reply_count', {
      message_id: parentMessage.id
    })
    
    setReplyText('')
  }

  return (
    <div className="flex h-full w-[400px] flex-col border-l">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Thread</h3>
        <button onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <Message {...parentMessage} showActions={false} />
        <div className="my-4 border-b" />
        
        {replies.map((reply) => {
          const messageProps = {
            id: reply.id,
            avatar: "/placeholder.svg",
            username: reply.user?.name || 'Unknown User',
            timestamp: new Date(reply.created_at).toLocaleTimeString(),
            content: reply.message.text,
            reactions: [],
            message: reply.message,
            showActions: false,
            onAddReaction: () => {}
          }
          
          return <Message key={reply.id} {...messageProps} />
        })}
      </div>
      
      <div className="border-t p-4">
        <Textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Reply to thread..."
          rows={3}
        />
        <Button 
          onClick={sendReply}
          className="mt-2"
        >
          Reply
        </Button>
      </div>
    </div>
  )
} 