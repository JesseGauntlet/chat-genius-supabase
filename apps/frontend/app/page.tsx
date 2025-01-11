import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = createServerComponentClient({ cookies })
    await supabase.auth.signOut()
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Welcome, {session.user.email}</h1>
        <form action={handleSignOut}>
          <Button type="submit">Sign Out</Button>
        </form>
      </div>
    </div>
  )
} 