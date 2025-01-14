'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { WorkspaceMembersDialog } from './workspace-members-dialog'
import { SearchPanel } from './search-panel'

interface HeaderProps {
  chatName: string
  workspaceId: string
  onSelectMember: (memberId: string) => void
  memberCount: number
}

export function Header({ chatName, workspaceId, onSelectMember, memberCount }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <header className="h-14 border-b bg-purple-200 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">{chatName}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="hover:bg-purple-300"
          >
            <Search className="h-4 w-4" />
          </Button>
          <WorkspaceMembersDialog
            workspaceId={workspaceId}
            onSelectMember={onSelectMember}
            memberCount={memberCount}
          />
        </div>
      </header>
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
} 