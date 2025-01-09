'use client'

import { useSupabase } from "@/components/providers/supabase-provider"
import { useCallback } from "react"

export function useRoleCheck() {
  const { supabase } = useSupabase()

  const isWorkspaceAdmin = useCallback(async (workspaceId: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (error) return false
    return data?.role === 'admin'
  }, [supabase])

  const isChannelAdmin = useCallback(async (channelId: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (error) return false
    return data?.role === 'admin'
  }, [supabase])

  return {
    isWorkspaceAdmin,
    isChannelAdmin,
  }
} 