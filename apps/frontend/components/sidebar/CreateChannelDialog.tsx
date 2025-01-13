"use client"

import React, { useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createChannel } from "@/utils/channel"

interface CreateChannelDialogProps {
  supabase: SupabaseClient
  workspaceId: string
  userId: string
  onChannelCreated: (channelId: string) => void
}

export function CreateChannelDialog({
  supabase,
  workspaceId,
  userId,
  onChannelCreated,
}: CreateChannelDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !userId || !newChannelName.trim()) return

    setIsCreatingChannel(true)
    try {
      const channel = await createChannel(supabase, workspaceId, userId, newChannelName, false)
      setNewChannelName("")
      setDialogOpen(false)
      onChannelCreated(channel.id)
    } catch (error) {
      console.error("Error creating channel:", error)
    } finally {
      setIsCreatingChannel(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-purple-100">
          +
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <div>
            <Input
              placeholder="Enter channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isCreatingChannel}>
            {isCreatingChannel ? "Creating..." : "Create Channel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 