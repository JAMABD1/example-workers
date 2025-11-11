"use client"

import { useState } from "react"
import { CircleUserRoundIcon, XIcon, Loader2Icon } from "lucide-react"

import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"

export function AvatarUpload(props: { imageUrl?: string; onUploadComplete?: (url: string) => void }) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(props.imageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    accept: "image/*",
    onFilesAdded: async (addedFiles) => {
      const file = addedFiles[0]?.file
      if (file instanceof File) {
        await uploadFile(file)
      }
    },
  })

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setUploadedUrl(data.url)
      props.onUploadComplete?.(data.url)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    removeFile(files[0]?.id)
    setUploadedUrl(props.imageUrl || null)
    setUploadError(null)
  }

  const previewUrl = files[0]?.preview || uploadedUrl || null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex">
        {/* Drop area */}
        <button
          className="relative flex size-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-input transition-colors outline-none hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none data-[dragging=true]:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          disabled={isUploading}
          aria-label={previewUrl ? "Change image" : "Upload image"}
        >
          {isUploading ? (
            <Loader2Icon className="size-4 animate-spin opacity-60" />
          ) : previewUrl ? (
            <img
              className="size-full object-cover"
              src={previewUrl}
              alt={files[0]?.file?.name || "Uploaded image"}
              width={64}
              height={64}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div aria-hidden="true">
              <CircleUserRoundIcon className="size-4 opacity-60" />
            </div>
          )}
        </button>
        {previewUrl && !isUploading && (
          <Button
            onClick={handleRemove}
            size="icon"
            className="absolute -top-1 -right-1 size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
            aria-label="Remove image"
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload image file"
          tabIndex={-1}
        />
      </div>
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}
    </div>
  )
}
