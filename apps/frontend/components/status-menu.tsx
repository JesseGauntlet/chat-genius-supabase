import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'

type Status = 'online' | 'away' | 'offline' | 'busy'

export default function StatusMenu() {
  const [status, setStatus] = useState<Status>('online')
  const { supabase } = useSupabase()

  const updateStatus = async (newStatus: Status) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { status: newStatus }
      })
      
      if (error) throw error
      setStatus(newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
        <div className={`w-3 h-3 rounded-full ${
          status === 'online' ? 'bg-green-500' :
          status === 'away' ? 'bg-yellow-500' :
          status === 'busy' ? 'bg-red-500' :
          'bg-gray-500'
        }`} />
        <span className="text-sm text-gray-700 capitalize">{status}</span>
      </div>
      
      <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg hidden group-hover:block">
        {(['online', 'away', 'busy', 'offline'] as Status[]).map((s) => (
          <div
            key={s}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => updateStatus(s)}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                s === 'online' ? 'bg-green-500' :
                s === 'away' ? 'bg-yellow-500' :
                s === 'busy' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className="capitalize">{s}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 