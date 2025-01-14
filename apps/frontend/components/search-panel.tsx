'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { X } from 'lucide-react'

interface SearchResult {
  text: string
  user_name: string
  created_at: string
  score: number
}

interface SearchResponse {
  answer: string
  context: SearchResult[]
}

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      
      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data: SearchResponse = await response.json()
      setSearchResponse(data)
      
      if (!data.context || data.context.length === 0) {
        setError('No results found')
      }
    } catch (error) {
      console.error('Search failed:', error)
      setError('Failed to perform search')
      setSearchResponse(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI Search Bot</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="text-red-500 mb-4 text-sm">{error}</div>
        )}

        {searchResponse && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-md">
              <h4 className="font-medium mb-2">AI Answer:</h4>
              <p>{searchResponse.answer}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Related Messages:</h4>
              {searchResponse.context.map((result, index) => (
                <div key={index} className="p-3 border rounded-md mb-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{result.user_name}</span>
                    <span>{new Date(result.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1">{result.text}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Relevance: {Math.round(result.score * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 