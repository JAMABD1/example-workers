"use client"

import { useState, useEffect } from "react"
import MultipleFileUpload from "@/components/multiple_files"

type UploadedFile = {
  id: string
  url: string
  name: string
  type?: "image" | "video"
}

const STORAGE_KEY = "r2-uploaded-files"

export default function UploadPage() {
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

  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedFiles))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [uploadedFiles])

  const handleUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            Upload Media
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Upload images and videos directly to Cloudflare R2. Drag and drop or click to select.
            Your media is stored securely and displayed instantly.
          </p>
        </div>

        <div className="mb-8">
          <MultipleFileUpload
            initialFiles={uploadedFiles}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Upload Summary
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {uploadedFiles.length}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total Files
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {uploadedFiles.filter((f) => f.type !== "video").length}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Images
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {uploadedFiles.filter((f) => f.type === "video").length}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Videos
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

