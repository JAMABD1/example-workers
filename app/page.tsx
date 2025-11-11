"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type UploadedFile = {
  id: string
  url: string
  name: string
  type?: "image" | "video"
}

const STORAGE_KEY = "r2-uploaded-files"

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

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

  const imageCount = uploadedFiles.filter((f) => f.type !== "video").length
  const videoCount = uploadedFiles.filter((f) => f.type === "video").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <main className="container mx-auto px-4 py-16 md:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                width={48}
                height={48}
                priority
              />
            </div>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-6xl lg:text-7xl">
            Cloudflare R2
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Media Platform
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
            Upload, store, and manage your images and videos with Cloudflare R2.
            Fast, secure, and scalable cloud storage.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/upload">
                Upload Media
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/gallery">View Gallery</Link>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        {uploadedFiles.length > 0 && (
          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
              <div className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {uploadedFiles.length}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Files
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
              <div className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {imageCount}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Images
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
              <div className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {videoCount}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Videos
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Features
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Fast Upload
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Upload images and videos directly to Cloudflare R2 with drag and drop support.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Video Streaming
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Stream videos directly from R2 with a beautiful video player interface.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Secure Storage
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Your media is stored securely on Cloudflare's global network with CDN delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Uploads
              </h2>
              <Button asChild variant="ghost">
                <Link href="/gallery">
                  View All
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {uploadedFiles.slice(0, 6).map((file) => (
                <Link
                  key={file.id}
                  href="/gallery"
                  className="group relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 aspect-square shadow-md transition-all hover:shadow-xl hover:scale-105"
                >
                  {file.type === "video" ? (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                      <span className="text-xs font-medium text-white">VIDEO</span>
                    </div>
                  ) : (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
