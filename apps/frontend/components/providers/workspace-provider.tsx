'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSupabase } from './supabase-provider'
import type { Database } from '@/lib/database.types'

type Workspace = Database['public']['Tables']['workspaces']['Row']

interface WorkspaceContextType {
  workspaces: Workspace[]
  refreshWorkspaces: () => Promise<void>
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  const fetchWorkspaces = useCallback(async (force: boolean = false) => {
    if (!user) return
    if (!force && hasInitialFetch && workspaces.length > 0) return
    
    setIsLoading(true)
    try {
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          created_at,
          owner_id
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!workspaces) return
      
      setWorkspaces(workspaces)
      setHasInitialFetch(true)
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, user, hasInitialFetch, workspaces.length])

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    } else {
      setWorkspaces([])
      setHasInitialFetch(false)
    }
  }, [user, fetchWorkspaces])

  // Subscribe to workspace changes
  useEffect(() => {
    if (!user) return

    const workspaceSubscription = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspaces'
        },
        () => {
          // Force refresh when we get a real-time update
          fetchWorkspaces(true)
        }
      )
      .subscribe()

    return () => {
      workspaceSubscription.unsubscribe()
    }
  }, [user, supabase, fetchWorkspaces])

  const refreshWorkspacesIfNeeded = useCallback(async () => {
    await fetchWorkspaces(true)
  }, [fetchWorkspaces])

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      refreshWorkspaces: refreshWorkspacesIfNeeded, 
      isLoading 
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider')
  }
  return context
} 