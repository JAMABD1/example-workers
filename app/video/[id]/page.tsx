"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"

type UploadedFile = {
  id: string
  url: string
  name: string
  type?: "image" | "video"
}

const STORAGE_KEY = "r2-uploaded-files"

export default function VideoViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = params.id as string
  const urlParam = searchParams.get("url")
  const [video, setVideo] = useState<UploadedFile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    
    // If URL is provided as search param, use it directly
    if (urlParam) {
      const urlParts = urlParam.split("/")
      const fileName = urlParts[urlParts.length - 1]
      const decodedFileName = decodeURIComponent(fileName)
      
      setVideo({
        id: urlParam,
        url: urlParam,
        name: decodedFileName,
        type: "video",
      })
      setLoading(false)
      return
    }
    
    // Check if videoId is actually a URL (starts with http) - decode it first
    const decodedId = decodeURIComponent(videoId)
    if (decodedId.startsWith("http://") || decodedId.startsWith("https://")) {
      const urlParts = decodedId.split("/")
      const fileName = urlParts[urlParts.length - 1]
      const decodedFileName = decodeURIComponent(fileName)
      
      setVideo({
        id: decodedId,
        url: decodedId,
        name: decodedFileName,
        type: "video",
      })
      setLoading(false)
      return
    }

    if (stored) {
      try {
        const files = JSON.parse(stored) as UploadedFile[]
        
        // First, try to find by ID
        let foundVideo = files.find((f) => f.id === videoId && f.type === "video")
        
        // If not found by ID, try to find by URL (in case URL was passed as ID)
        if (!foundVideo) {
          foundVideo = files.find((f) => 
            f.type === "video" && (
              f.url === videoId || 
              f.url.includes(videoId) || 
              videoId.includes(f.url.split("/").pop() || "")
            )
          )
        }
        
        // If still not found, try to find by filename match
        if (!foundVideo) {
          const urlParts = videoId.split("/")
          const fileName = urlParts[urlParts.length - 1]
          foundVideo = files.find((f) => 
            f.type === "video" && f.url.includes(fileName)
          )
        }
        
        if (foundVideo) {
          setVideo(foundVideo)
        }
      } catch (error) {
        console.error("Failed to load video:", error)
      }
    }
    setLoading(false)
  }, [videoId, urlParam])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Loading video...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    // Check if videoId looks like a URL or filename
    const isLikelyVideoUrl = videoId.includes(".mp4") || videoId.includes(".webm") || videoId.includes(".mov") || videoId.startsWith("http")
    
    if (isLikelyVideoUrl && !videoId.startsWith("http")) {
      // Try to construct URL from videoId (assuming it's a filename)
      // This is a fallback - ideally the full URL should be passed
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Video not found in gallery
            </h1>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              The video file "{videoId}" is not in your gallery. Please upload it first or use the full video URL.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/gallery">
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back to Gallery
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/upload">
                  Upload Video
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Video not found
          </h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            The video you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/gallery">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Gallery
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
          <Button
            variant="outline"
            asChild
            className="gap-2"
          >
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-4" />
              Open in new tab
            </a>
          </Button>
        </div>

        {/* Video Player */}
        <div className="mb-6">
          <VideoPlayer
            url={video.url}
            className="w-full"
            name={video.name}
            autoPlay={true}
          />
        </div>

        {/* Video Info */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {video.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Video ID: {video.id}</span>
            <span className="hidden sm:inline">•</span>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              {video.url}
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}