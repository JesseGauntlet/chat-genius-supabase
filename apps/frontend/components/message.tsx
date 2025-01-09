'use client'

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface MessageProps {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  isPinned?: boolean
  reactions?: Array<{ emoji: string; count: number }>
}

export function Message({ avatar, username, timestamp, content, isPinned, reactions }: MessageProps) {
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
        {reactions && reactions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {reactions.map(({ emoji, count }, index) => (
              <button
                key={index}
                className="flex items-center space-x-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 