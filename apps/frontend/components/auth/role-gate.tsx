'use client'

import { useRoleCheck } from "@/lib/hooks/use-role-check"
import { useEffect, useState } from "react"

interface RoleGateProps {
  children: React.ReactNode
  workspaceId?: string
  channelId?: string
  requiredRole?: 'admin' | 'member' | 'guest'
}

export default function RoleGate({
  children,
  workspaceId,
  channelId,
  requiredRole = 'member'
}: RoleGateProps) {
  const { isWorkspaceAdmin, isChannelAdmin } = useRoleCheck()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      if (workspaceId) {
        const isAdmin = await isWorkspaceAdmin(workspaceId)
        setHasAccess(requiredRole === 'admin' ? isAdmin : true)
      } else if (channelId) {
        const isAdmin = await isChannelAdmin(channelId)
        setHasAccess(requiredRole === 'admin' ? isAdmin : true)
      }
    }

    checkAccess()
  }, [workspaceId, channelId, requiredRole, isWorkspaceAdmin, isChannelAdmin])

  if (!hasAccess) return null

  return <>{children}</>
} 