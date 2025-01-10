import { Database } from '@/lib/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

type Channel = Database['public']['Tables']['channels']['Row']
type ChannelInsert = Database['public']['Tables']['channels']['Insert']

export async function createChannel(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  channelName: string,
  isPrivate: boolean = false
): Promise<Channel> {
  const channelData: ChannelInsert = {
    name: channelName.toLowerCase().replace(/\s+/g, '-'),
    workspace_id: workspaceId,
    is_private: isPrivate,
  }

  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .insert([channelData])
    .select()
    .single()

  if (channelError) {
    throw channelError
  }

  return channel
} 