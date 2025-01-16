import { useSupabase } from "@/components/providers/supabase-provider"
import { useState } from "react"
import { Button } from "./ui/button"
import { FileIcon } from "lucide-react"

interface FileUploadProps {
  channelId: string
  onUploadComplete: (fileUrl: string, fileName: string) => void
}

export function FileUpload({ channelId, onUploadComplete }: FileUploadProps) {
  const { supabase } = useSupabase()
  const [isUploading, setIsUploading] = useState(false)

  const sanitizeFileName = (fileName: string) => {
    // Remove special characters and spaces, keep extension
    const extension = fileName.split('.').pop()
    const baseName = fileName.split('.').slice(0, -1).join('.')
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()
    return `${sanitized}.${extension}`
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      
      const sanitizedFileName = sanitizeFileName(file.name)
      const filePath = `${channelId}/${Date.now()}_${sanitizedFileName}`
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('channel-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get signed URL instead of public URL
      const { data: signedData } = await supabase.storage
        .from('channel-files')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7) // 7 days expiry

      if (!signedData) throw new Error('Failed to get signed URL')

      onUploadComplete(signedData.signedUrl, file.name)
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 flex-shrink-0"
      disabled={isUploading}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <FileIcon className="h-5 w-5" />
    </Button>
  )
} 