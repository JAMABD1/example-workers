"use client"

import { useState, useRef, useEffect } from "react"
import { PlayIcon, PauseIcon, Volume2Icon, VolumeXIcon, MaximizeIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type VideoPlayerProps = {
  url: string
  thumbnail?: string
  className?: string
  name?: string
  autoPlay?: boolean
}

export function VideoPlayer({ 
  url, 
  thumbnail, 
  className = "",
  name,
  autoPlay = false
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [showControls, setShowControls] = useState(false)
  const [isMuted, setIsMuted] = useState(autoPlay) // Start muted if autoplay (browser requirement)
  const [volume, setVolume] = useState(1)
  const [played, setPlayed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPlaying) {
      setShowThumbnail(false)
    }
  }, [isPlaying])

  useEffect(() => {
    setError(null)
    setIsReady(false)
  }, [url])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Play error:", err)
          setError("Unable to play video. Please try clicking play again.")
        })
      }
    }
    setShowThumbnail(false)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch((err) => {
        console.error("Autoplay error:", err)
        // Autoplay failed, user will need to click play
      })
    }
  }, [autoPlay, url])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime
      const videoDuration = videoRef.current.duration
      if (videoDuration > 0) {
        setPlayed(currentTime / videoDuration)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsReady(true)
    }
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekValue = parseFloat(e.target.value)
    setPlayed(seekValue)
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = seekValue * videoRef.current.duration
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      setError("Failed to load video. Please try opening it in a new tab.")
      setIsPlaying(false)
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [url])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    }
  }

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center aspect-video bg-black/10 rounded-lg", className)}>
        <p className="text-sm text-zinc-500">No video source</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center aspect-video bg-black rounded-lg p-6", className)}>
        <p className="text-sm text-white mb-4 text-center">{error}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Open video in new tab
        </a>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-video bg-black rounded-lg overflow-hidden group", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }}
    >
      {/* Video Player */}
      <div className="relative w-full h-full">
        {!isReady && !error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="mb-2 size-8 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              <p className="text-sm text-white">Loading video...</p>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 w-full h-full object-contain"
          preload="metadata"
          playsInline
          muted={isMuted}
          onLoadedData={() => {
            setIsReady(true)
            setError(null)
          }}
          onError={() => {
            setError("Failed to load video. Please try opening it in a new tab.")
            setIsPlaying(false)
          }}
        />

        {/* Thumbnail Overlay */}
        {showThumbnail && thumbnail && (
          <div className="absolute inset-0 z-10">
            <img
              src={thumbnail}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center transition-opacity hover:opacity-90"
              aria-label="Play video"
            >
              <div className="rounded-full bg-white/90 p-6 hover:bg-white transition-all shadow-2xl hover:scale-110">
                <PlayIcon className="size-12 text-black ml-1" fill="black" />
              </div>
            </button>
          </div>
        )}

        {/* Custom Controls Overlay */}
        {!showThumbnail && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity",
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Progress Bar */}
            <div className="px-4 pb-2">
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={played}
                onChange={handleSeekChange}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${played * 100}%, rgba(255,255,255,0.3) ${played * 100}%, rgba(255,255,255,0.3) 100%)`,
                }}
              />
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between px-4 pb-4 gap-4">
              <div className="flex items-center gap-2">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  className="flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <PauseIcon className="size-5 text-white" fill="white" />
                  ) : (
                    <PlayIcon className="size-5 text-white ml-0.5" fill="white" />
                  )}
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeXIcon className="size-5 text-white" />
                    ) : (
                      <Volume2Icon className="size-5 text-white" />
                    )}
                  </button>
                  {!isMuted && (
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                  )}
                </div>

                {/* Time Display */}
                <div className="text-white text-sm font-medium ml-2">
                  {formatTime(played * duration)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-2">
                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreen}
                  className="flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Fullscreen"
                >
                  <MaximizeIcon className="size-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Play Button Overlay (when paused) */}
        {!showThumbnail && !isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 z-20 flex items-center justify-center transition-opacity hover:opacity-90"
            aria-label="Play video"
          >
            <div className="rounded-full bg-black/50 p-6 hover:bg-black/60 transition-all">
              <PlayIcon className="size-12 text-white ml-1" fill="white" />
            </div>
          </button>
        )}
      </div>

      {/* Video Title (if provided) */}
      {name && showThumbnail && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white text-sm font-medium truncate">{name}</p>
        </div>
      )}
    </div>
  )
}


