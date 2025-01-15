'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const { supabase } = useSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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

        router.push('/')
      }
    } catch (error) {
      console.error('Error registering:', error)
      setError('Error creating account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/30 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <Icons.logo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => {}}>
            <Icons.gitHub className="mr-2 h-4 w-4" />
            GitHub
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-primary hover:text-primary/90"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 