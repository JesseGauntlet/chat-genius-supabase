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
import { Button } from './ui/button'
import { MembersIcon } from './icons/members-icon'

interface WorkspaceMembersDialogProps {
  workspaceId: string
  onSelectMember: (memberId: string) => void
  memberCount: number
}

export function WorkspaceMembersDialog({ workspaceId, onSelectMember, memberCount }: WorkspaceMembersDialogProps) {
  const { supabase, user } = useSupabase()
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')

  useEffect(() => {
    if (open) {
      fetchWorkspaceMembers()
      fetchCurrentUser()
    }
  }, [open, workspaceId])

  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setCurrentUserName(data.name)
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchWorkspaceMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`user:users(id, name)`)
        .eq('workspace_id', workspaceId)

      if (error) throw error
      setMembers(data.flatMap((member) => member.user))
    } catch (error) {
      console.error('Error fetching workspace members:', error)
    }
  }

  const handleSelectMember = async (memberId: string, memberName: string) => {
    if (!workspaceId || !user) return

    try {
      const channelName = `${currentUserName},${memberName}`
      const { data, error } = await supabase.rpc('create_channel_with_members', {
        p_workspace_id: workspaceId,
        p_member_id: memberId,
        p_channel_name: channelName,
        p_current_user_id: user.id,
        p_is_private: true
      })

      if (error) throw error
      
      const channel = data
      onSelectMember(channel.id)
      setOpen(false)
    } catch (error) {
      console.error('Error creating channel with members:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-purple-300/20"
        >
          <div className="flex items-center space-x-1">
            <MembersIcon className="h-4 w-4" />
            <span className="text-sm">{memberCount}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => handleSelectMember(member.id, member.name)}
            >
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