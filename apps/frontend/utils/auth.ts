import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

export async function updateUserMetadata(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  try {
    // Fetch the user's name from the users table
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    if (error) throw error

    if (data?.name) {
      // Update the user's metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: data.name }
      })

      if (updateError) throw updateError
    }
  } catch (error) {
    console.error('Error updating user metadata:', error)
    throw error
  }
} 