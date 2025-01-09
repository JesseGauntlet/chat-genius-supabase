'use client'

import { Button } from "./ui/button"

interface SidebarProps {
  onSelectChannel: (channelId: string) => void
  onSelectDM: (dmId: string) => void
}

const channels = [
  { id: '1', name: 'general' },
  { id: '2', name: 'random' },
]

const directMessages = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Jane Doe' },
  { id: '3', name: 'Bob Wilson' },
  { id: '4', name: 'Alice Brown' },
  { id: '5', name: 'Sam Taylor' },
]

export function Sidebar({ onSelectChannel, onSelectDM }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-100 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Workspace Name</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">Channels</h3>
            <div className="space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onSelectChannel(channel.id)}
                >
                  # {channel.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">Direct Messages</h3>
            <div className="space-y-1">
              {directMessages.map((dm) => (
                <Button
                  key={dm.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onSelectDM(dm.id)}
                >
                  {dm.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 