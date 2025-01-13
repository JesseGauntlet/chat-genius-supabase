"use client"

import { Button } from "../ui/button"
import { Avatar, AvatarFallback } from "../ui/avatar"
import type { Database } from "@/lib/database.types"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useEffect, useState } from "react"

type Channel = Database["public"]["Tables"]["channels"]["Row"] & {
  displayName: string
}

interface DirectMessagesListProps {
  directChannels: Channel[]
  selectedChannelId: string | null
  onSelectChannel: (channel: Channel) => void
}

export function DirectMessagesList({
  directChannels,
  selectedChannelId,
  onSelectChannel,
}: DirectMessagesListProps) {
  const { user, supabase } = useSupabase()
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false)
  const currentUserName = user?.user_metadata?.name

  useEffect(() => {
    const updateUserMetadata = async () => {
      if (user && !currentUserName && !isUpdatingMetadata) {
        try {
          setIsUpdatingMetadata(true)
          console.warn('No Metadata found, fetching from users table')
          // Fetch the user's name from the users table
          const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single()

          if (error) throw error

          if (data?.name) {
            // Update the user's metadata
            const { error: updateError } = await supabase.auth.updateUser({
              data: { name: data.name }
            })

            if (updateError) throw updateError
          }
        } catch (error) {
          console.error('Error updating user metadata:', error)
        } finally {
          setIsUpdatingMetadata(false)
        }
      }
    }

    updateUserMetadata()
  }, [user, currentUserName, supabase, isUpdatingMetadata])

  if (directChannels.length === 0) {
    return <p className="text-sm text-gray-500">No direct messages</p>
  }

  const getDisplayName = (channelName: string) => {
    if (!currentUserName && !isUpdatingMetadata) {
      console.warn('Fallback: No current user name available', {
        channelName,
        currentUserName,
        userId: user?.id
      })
      return channelName
    }
    
    // If we're still updating metadata, show a loading state
    if (isUpdatingMetadata) {
      return channelName
    }
    
    const names = channelName.split(',').map(name => name.trim())
    
    // If there are exactly 2 names and one is the current user
    if (names.length === 2) {
      const otherName = names.find(name => name !== currentUserName)
      if (!otherName) {
        console.warn('Fallback: Could not find other user name', {
          channelName,
          names,
          currentUserName
        })
      }
      return otherName || names[0]
    }
    
    // Log why we're using the fallback
    console.warn('Fallback: Unexpected channel name format', {
      channelName,
      namesCount: names.length,
      names,
      currentUserName
    })
    return channelName
  }

  return (
    <div className="space-y-1">
      {directChannels.map((channel) => (
        <Button
          key={channel.id}
          variant="ghost"
          className={`w-full justify-start ${
            selectedChannelId === channel.id
              ? "bg-purple-200 hover:bg-purple-200"
              : "hover:bg-purple-200"
          }`}
          onClick={() => onSelectChannel(channel)}
        >
          <div className="flex items-center space-x-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {getDisplayName(channel.name).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{getDisplayName(channel.name)}</span>
          </div>
        </Button>
      ))}
    </div>
  )
} 