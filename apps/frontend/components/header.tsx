'use client'

export function Header({ chatName }: { chatName: string }) {
  return (
    <header className="border-b p-4">
      <h2 className="font-semibold">{chatName}</h2>
    </header>
  )
} 