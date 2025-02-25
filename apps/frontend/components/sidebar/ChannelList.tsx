"use client"

import { Button } from "../ui/button"
import type { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"

type Channel = Database["public"]["Tables"]["channels"]["Row"]

interface ChannelListProps {
  channels: Channel[]
  selectedChannelId: string | null
  onChannelClick: (channel: Channel) => void
}

export function ChannelList({ channels, selectedChannelId, onChannelClick }: ChannelListProps) {
  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <Button
          key={channel.id}
          variant="ghost"
          className={cn(
            "w-full justify-start hover:bg-purple-200",
            selectedChannelId === channel.id && "bg-purple-200"
          )}
          onClick={() => onChannelClick(channel)}
        >
          # {channel.name}
        </Button>
      ))}
    </div>
  )
} 