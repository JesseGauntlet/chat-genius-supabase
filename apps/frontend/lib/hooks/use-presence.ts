'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'

export type Status = 'online' | 'away' | 'offline'

export interface UserPresence {
  status: Status
  customStatus: string
  lastSeen: string
}

export function usePresence(targetUserId?: string) {
  const { supabase, user } = useSupabase()
  const [status, setStatus] = useState<Status>('online')
  const [customStatus, setCustomStatus] = useState<string>('')
  const [lastSeen, setLastSeen] = useState<string>('')

  useEffect(() => {
    if (!user) return
    const userId = targetUserId || user.id

    // Fetch initial status
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('presence')
        .select('status, custom_status, last_seen')
        .eq('user_id', userId)
        .single()

      if (!error && data) {
        setStatus(data.status as Status)
        setCustomStatus(data.custom_status || '')
        setLastSeen(data.last_seen)
      }
    }

    fetchStatus()

    // Subscribe to presence changes
    const presenceSubscription = supabase
      .channel(`presence-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setStatus((payload.new as any).status as Status)
            setCustomStatus((payload.new as any).custom_status || '')
            setLastSeen((payload.new as any).last_seen)
          }
        }
      )
      .subscribe()

    return () => {
      presenceSubscription.unsubscribe()
    }
  }, [supabase, user, targetUserId])

  const updateStatus = async (newStatus: Status) => {
    if (!user || targetUserId) return // Only allow updates for the current user

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          user_id: user.id,
          status: newStatus,
          last_seen: new Date().toISOString(),
          custom_status: customStatus,
        })

      if (error) throw error
      setStatus(newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const updateCustomStatus = async (newCustomStatus: string) => {
    if (!user || targetUserId) return // Only allow updates for the current user

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          custom_status: newCustomStatus,
        })

      if (error) throw error
      setCustomStatus(newCustomStatus)
    } catch (error) {
      console.error('Error updating custom status:', error)
    }
  }

  return {
    status,
    customStatus,
    lastSeen,
    updateStatus,
    updateCustomStatus,
  }
} 