'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { WorkspaceMembersDialog } from './workspace-members-dialog'
import { SearchPanel } from './search-panel'
import { Separator } from './ui/separator'

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
      <header className="h-14 border-b bg-background flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{chatName}</h2>
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm text-muted-foreground">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="hover:bg-purple-300/20"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
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