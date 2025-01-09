import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function checkWorkspaceRole(workspaceId: string, requiredRole: 'admin' | 'member' | 'guest' = 'member') {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (error) return false

  switch (requiredRole) {
    case 'admin':
      return data.role === 'admin'
    case 'member':
      return ['admin', 'member'].includes(data.role)
    case 'guest':
      return ['admin', 'member', 'guest'].includes(data.role)
    default:
      return false
  }
}

export async function checkChannelRole(channelId: string, requiredRole: 'admin' | 'member' | 'guest' = 'member') {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('members')
    .select('role')
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
    .single()

  if (error) return false

  switch (requiredRole) {
    case 'admin':
      return data.role === 'admin'
    case 'member':
      return ['admin', 'member'].includes(data.role)
    case 'guest':
      return ['admin', 'member', 'guest'].includes(data.role)
    default:
      return false
  }
} 