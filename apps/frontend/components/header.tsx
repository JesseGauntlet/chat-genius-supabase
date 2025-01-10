'use client'

import { WorkspaceMembersDialog } from './workspace-members-dialog'

interface HeaderProps {
  chatName: string
  workspaceId: string
  onSelectMember: (memberId: string) => void
  memberCount: number
}

export function Header({ chatName, workspaceId, onSelectMember, memberCount }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-purple-100 flex items-center justify-between px-4">
      <h2 className="text-lg font-semibold">{chatName}</h2>
      <WorkspaceMembersDialog
        workspaceId={workspaceId}
        onSelectMember={onSelectMember}
        memberCount={memberCount}
      />
    </header>
  )
} 