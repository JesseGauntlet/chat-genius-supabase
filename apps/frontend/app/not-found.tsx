export default function NotFound() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>404 - Not Found</h1>
    </div>
  )
}

// Tell Next.js not to attempt defining this page at build time:
export const dynamic = 'force-dynamic' 