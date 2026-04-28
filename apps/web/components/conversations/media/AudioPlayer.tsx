/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           components/conversations/media/AudioPlayer.tsx      ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │  [▶]   ▂▃▅▇▅▃▂ ▂▃▅▇▅▃▂ ▂▃▅▇▅▃▂   0:45 / 1:23      │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Lecteur audio style WhatsApp avec waveform et controles.    ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
    src: string | null
    isOutbound?: boolean
}

// Generate fake waveform bars for visual effect
const WAVEFORM_BARS = 35
const generateWaveform = () => {
    return Array.from({ length: WAVEFORM_BARS }, () => Math.random() * 0.7 + 0.3)
}

export function AudioPlayer({ src, isOutbound = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [waveform] = useState(generateWaveform)
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Format time as mm:ss
    const formatTime = (time: number) => {
        if (!isFinite(time) || isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Handle play/pause
    const togglePlay = useCallback(() => {
        if (!audioRef.current || !src) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }, [isPlaying, src])

    // Handle time update
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleLoadedMetadata = () => {
            setDuration(audio.duration)
            setIsLoaded(true)
            setIsLoading(false)
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        const handleError = () => {
            setHasError(true)
            setIsLoading(false)
            console.error('[AudioPlayer] Failed to load audio')
        }

        const handleCanPlay = () => {
            setIsLoading(false)
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)
        audio.addEventListener('canplay', handleCanPlay)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
            audio.removeEventListener('canplay', handleCanPlay)
        }
    }, [])

    // Handle waveform click to seek
    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return

        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percentage = clickX / rect.width
        const newTime = percentage * duration

        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
    }

    // Calculate progress percentage
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    if (!src || hasError) {
        return (
            <div className="flex items-center gap-3 min-w-[200px] p-2">
                <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                    isOutbound ? 'bg-green-200' : 'bg-gray-200'
                )}>
                    <Mic className="h-5 w-5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-500">Audio non disponible</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 min-w-[220px] max-w-[300px]">
            {/* Hidden audio element */}
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause button */}
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className={cn(
                    'h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-all',
                    isOutbound
                        ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:bg-gray-100'
                )}
            >
                {isLoading ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                )}
            </button>

            {/* Waveform and time */}
            <div className="flex-1 min-w-0">
                {/* Waveform */}
                <div
                    className="flex items-center gap-[2px] h-8 cursor-pointer"
                    onClick={handleWaveformClick}
                >
                    {waveform.map((height, index) => {
                        const barProgress = (index / WAVEFORM_BARS) * 100
                        const isActive = barProgress <= progress

                        return (
                            <div
                                key={index}
                                className={cn(
                                    'w-[3px] rounded-full transition-colors',
                                    isActive
                                        ? isOutbound
                                            ? 'bg-green-600'
                                            : 'bg-gray-600'
                                        : isOutbound
                                            ? 'bg-green-300'
                                            : 'bg-gray-300'
                                )}
                                style={{ height: `${height * 100}%` }}
                            />
                        )
                    })}
                </div>

                {/* Time */}
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{isLoaded ? formatTime(duration) : '--:--'}</span>
                </div>
            </div>
        </div>
    )
}
