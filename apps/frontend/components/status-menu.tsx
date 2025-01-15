'use client'

import { useState } from 'react'
import { usePresence, Status } from '@/lib/hooks/use-presence'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export function StatusMenu() {
  const { status, customStatus, updateStatus, updateCustomStatus } = usePresence()
  const [newCustomStatus, setNewCustomStatus] = useState(customStatus)
  const [isEditing, setIsEditing] = useState(false)

  const handleCustomStatusSave = () => {
    updateCustomStatus(newCustomStatus)
    setIsEditing(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background">
          <span className={cn(
            "absolute inset-0 rounded-full",
            status === 'online' && 'bg-green-500',
            status === 'away' && 'bg-yellow-500',
            status === 'offline' && 'bg-gray-500'
          )} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <div className="p-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={newCustomStatus}
                onChange={(e) => setNewCustomStatus(e.target.value)}
                placeholder="What's your status?"
                className="h-8"
              />
              <Button
                size="sm"
                className="h-8"
                onClick={handleCustomStatusSave}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="text-sm px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
              onClick={() => setIsEditing(true)}
            >
              {customStatus || "Set a status..."}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => updateStatus('online')}>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
            Online
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateStatus('away')}>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
            Away
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateStatus('offline')}>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-gray-500 mr-2" />
            Offline
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 