'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function RegisterPage() {
  const { supabase } = useSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Create default workspace
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert([
            {
              name: `${name}'s Workspace`,
              owner_id: authData.user.id,
            },
          ])
          .select()
          .single()

        if (workspaceError) throw workspaceError

        // 3. Add user as admin to workspace
        const { error: memberError } = await supabase
          .from('members')
          .insert([
            {
              user_id: authData.user.id,
              workspace_id: workspace.id,
              role: 'admin',
            },
          ])

        if (memberError) throw memberError

        // 4. Create default channels
        const defaultChannels = ['general', 'random']
        for (const channelName of defaultChannels) {
          // Create channel
          const { data: channel, error: channelError } = await supabase
            .from('channels')
            .insert([
              {
                name: channelName,
                workspace_id: workspace.id,
                is_private: false,
              },
            ])
            .select()
            .single()

          if (channelError) throw channelError

          // Add user as member of channel
          const { error: channelMemberError } = await supabase
            .from('members')
            .insert([
              {
                user_id: authData.user.id,
                workspace_id: workspace.id,
                channel_id: channel.id,
                role: 'admin',
              },
            ])

          if (channelMemberError) throw channelMemberError
        }
      }
    } catch (error) {
      console.error('Error registering:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
} 