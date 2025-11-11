"use client"

import { useState, useEffect } from "react"
import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon, Loader2Icon } from "lucide-react"

import { useFileUpload, type FileWithPreview } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/video-player"

type UploadedFile = {
  id: string
  url: string
  name: string
  type?: "image" | "video"
}

export default function MultipleFileUpload({
  onUploadComplete,
  initialFiles = [],
}: {
  onUploadComplete?: (files: UploadedFile[]) => void
  initialFiles?: UploadedFile[]
}) {
  const maxSizeMB = 500 // 500MB for videos
  const maxSize = maxSizeMB * 1024 * 1024
  const maxFiles = 12

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())

  // Sync uploadedFiles with initialFiles when they change
  useEffect(() => {
    setUploadedFiles(initialFiles)
  }, [initialFiles])

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*,video/*",
    maxSize,
    multiple: true,
    maxFiles,
    initialFiles: initialFiles.map((file) => ({
      name: file.name,
      size: 0,
      type: file.type === "video" ? "video/mp4" : "image/jpeg",
      url: file.url,
      id: file.id,
    })),
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      for (const fileWithPreview of addedFiles) {
        const file = fileWithPreview.file
        if (file instanceof File) {
          await uploadFile(file, fileWithPreview.id)
        }
      }
    },
  })

  const uploadFile = async (file: File, fileId: string) => {
    setUploadingIds((prev) => new Set(prev).add(fileId))

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
      const uploadedFile: UploadedFile = {
        id: fileId,
        url: data.url,
        name: file.name,
        type: data.type || (file.type.startsWith("video/") ? "video" : "image"),
      }

      setUploadedFiles((prev) => {
        const updated = [...prev, uploadedFile]
        onUploadComplete?.(updated)
        return updated
      })
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
    }
  }

  const handleRemove = (fileId: string) => {
    removeFile(fileId)
    setUploadedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId)
      onUploadComplete?.(updated)
      return updated
    })
  }

  const allFiles = files.map((file) => {
    const uploaded = uploadedFiles.find((uf) => uf.id === file.id)
    const fileType = uploaded?.type || (file.file instanceof File && file.file.type.startsWith("video/") ? "video" : "image")
    return {
      ...file,
      uploadedUrl: uploaded?.url,
      isUploading: uploadingIds.has(file.id),
      type: fileType,
    }
  })

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        className="relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload file"
        />
        {allFiles.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                Uploaded Files ({allFiles.length}/{maxFiles})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                disabled={allFiles.length >= maxFiles}
              >
                <UploadIcon
                  className="-ms-0.5 size-3.5 opacity-60"
                  aria-hidden="true"
                />
                Add more
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {allFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative rounded-md bg-accent overflow-hidden group ${
                    file.type === "video" ? "aspect-video" : "aspect-square"
                  }`}
                >
                  {file.isUploading ? (
                    <div className="flex size-full items-center justify-center bg-accent/50">
                      <Loader2Icon className="size-6 animate-spin opacity-60" />
                    </div>
                  ) : file.type === "video" ? (
                    <VideoPlayer
                      url={file.uploadedUrl || file.preview || ""}
                      className="size-full"
                      name={file.file.name}
                    />
                  ) : (
                    <img
                      src={file.uploadedUrl || file.preview}
                      alt={file.file.name}
                      className="size-full rounded-[inherit] object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                  <Button
                    onClick={() => handleRemove(file.id)}
                    size="icon"
                    className="absolute -top-2 -right-2 size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                    disabled={file.isUploading}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              aria-hidden="true"
            >
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your files here</p>
            <p className="text-xs text-muted-foreground">
              Images or Videos (max. {maxSizeMB}MB for videos, 10MB for images)
            </p>
            <Button variant="outline" className="mt-4" onClick={openFileDialog}>
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              Select files
            </Button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

    </div>
  )
}
