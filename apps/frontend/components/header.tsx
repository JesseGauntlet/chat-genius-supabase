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
    <header className="bg-white border-b py-2 px-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{chatName}</h2>
      <WorkspaceMembersDialog
        workspaceId={workspaceId}
        onSelectMember={onSelectMember}
        memberCount={memberCount}
      />
    </header>
  )
} 