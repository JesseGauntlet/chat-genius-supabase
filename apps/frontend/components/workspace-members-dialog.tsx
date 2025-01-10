import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface WorkspaceMembersDialogProps {
  workspaceId: string
}

export function WorkspaceMembersDialog({ workspaceId }: WorkspaceMembersDialogProps) {
  const { supabase } = useSupabase()
  const [members, setMembers] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetchWorkspaceMembers()
    }
  }, [open, workspaceId])

  const fetchWorkspaceMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`user:users(id, name)`)
        .eq('workspace_id', workspaceId)

      if (error) throw error
      setMembers(data.map((member) => member.user))
    } catch (error) {
      console.error('Error fetching workspace members:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="flex items-center space-x-1 cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <span className="text-sm">{members.length}</span>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span>{member.name}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 