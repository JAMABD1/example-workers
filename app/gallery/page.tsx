"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { VideoPlayer } from "@/components/video-player"
import { Button } from "@/components/ui/button"
import { XIcon, ImageIcon, VideoIcon, EyeIcon } from "lucide-react"

type UploadedFile = {
  id: string
  url: string
  name: string
  type?: "image" | "video"
}

const STORAGE_KEY = "r2-uploaded-files"

export default function GalleryPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [filter, setFilter] = useState<"all" | "image" | "video">("all")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const files = JSON.parse(stored) as UploadedFile[]
        setUploadedFiles(files)
      } catch (error) {
        console.error("Failed to load stored files:", error)
      }
    }
  }, [])

  const handleRemove = (fileId: string) => {
    const updated = uploadedFiles.filter((f) => f.id !== fileId)
    setUploadedFiles(updated)
    if (updated.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const filteredFiles = uploadedFiles.filter((file) => {
    if (filter === "all") return true
    if (filter === "image") return file.type !== "video"
    if (filter === "video") return file.type === "video"
    return true
  })

  const imageCount = uploadedFiles.filter((f) => f.type !== "video").length
  const videoCount = uploadedFiles.filter((f) => f.type === "video").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            Gallery
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Browse and manage your uploaded media files.
          </p>
        </div>

        {uploadedFiles.length > 0 ? (
          <>
            {/* Filter Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                size="sm"
              >
                All ({uploadedFiles.length})
              </Button>
              <Button
                variant={filter === "image" ? "default" : "outline"}
                onClick={() => setFilter("image")}
                size="sm"
                className="gap-2"
              >
                <ImageIcon className="size-4" />
                Images ({imageCount})
              </Button>
              <Button
                variant={filter === "video" ? "default" : "outline"}
                onClick={() => setFilter("video")}
                size="sm"
                className="gap-2"
              >
                <VideoIcon className="size-4" />
                Videos ({videoCount})
              </Button>
            </div>

            {/* Gallery Grid */}
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 shadow-md transition-all hover:shadow-xl hover:scale-[1.02] ${
                      file.type === "video" ? "aspect-video" : "aspect-square"
                    }`}
                  >
                  {file.type === "video" ? (
                    <>
                      <VideoPlayer url={file.url} className="h-full w-full" name={file.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-white font-medium flex-1">
                            {file.name}
                          </p>
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="shrink-0"
                          >
                            <Link href={`/video/${encodeURIComponent(file.id)}?url=${encodeURIComponent(file.url)}`}>
                              <EyeIcon className="size-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                      <>
                        <div className="aspect-square">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="truncate text-sm text-white font-medium">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    <Button
                      onClick={() => handleRemove(file.id)}
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 size-6 rounded-full border-2 border-background shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove file"
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No {filter === "all" ? "files" : filter === "image" ? "images" : "videos"} found.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <ImageIcon className="mx-auto mb-4 size-12 text-zinc-400" />
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              No media uploaded yet
            </h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Start by uploading your first image or video.
            </p>
            <Button asChild>
              <a href="/upload">Upload Media</a>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

