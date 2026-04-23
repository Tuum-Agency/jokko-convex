/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          components/conversations/media/VideoPlayer.tsx       ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Lecteur video avec thumbnail et controles style WhatsApp.   ║
 * ║   Utilise un portail pour le mode plein écran afin d'éviter   ║
 * ║   les problèmes de z-index et overflow-hidden.                ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Play, Pause, X, Maximize2, Video as VideoIcon, ArrowLeft, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
    src: string | null
    thumbnailSrc?: string | null
    caption?: string
    isOutbound?: boolean
}

export function VideoPlayer({
    src,
    thumbnailSrc,
    caption,
    isOutbound = false,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const fullscreenVideoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showFullscreen, setShowFullscreen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    // Blob URLs load instantly, so don't show loading state for them
    const isBlobUrl = src?.startsWith('blob:') || false
    const [isLoading, setIsLoading] = useState(!isBlobUrl)
    const [hasError, setHasError] = useState(false)
    const [duration, setDuration] = useState<number | null>(null)

    // Pour le portail - s'assurer qu'on est côté client
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Bloquer le scroll du body quand le fullscreen est ouvert
    useEffect(() => {
        if (showFullscreen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [showFullscreen])

    // Fermer avec la touche Échap
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showFullscreen) {
                setShowFullscreen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showFullscreen])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handlePlayPause = () => {
        if (!videoRef.current) return

        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleVideoClick = () => {
        if (!src) return
        setShowFullscreen(true)
    }

    const handleDownload = async () => {
        if (!src) return

        try {
            const response = await fetch(src)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `video-${Date.now()}.mp4`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    if (!src || hasError) {
        return (
            <div className="space-y-1">
                <div className={cn(
                    'w-[250px] h-[180px] rounded-xl flex flex-col items-center justify-center gap-2',
                    isOutbound ? 'bg-green-200/50' : 'bg-gray-800'
                )}>
                    <VideoIcon className="h-10 w-10 text-gray-400" />
                    <span className="text-xs text-gray-400">Video non disponible</span>
                </div>
                {caption && <p className="text-sm">{caption}</p>}
            </div>
        )
    }

    return (
        <>
            {/* Thumbnail/Preview */}
            <div className="space-y-1">
                <div
                    className="relative rounded-xl overflow-hidden max-w-[280px] bg-black cursor-pointer group"
                    onClick={handleVideoClick}
                >
                    {/* Video element for thumbnail */}
                    <video
                        ref={videoRef}
                        src={src}
                        className="w-full h-auto max-h-[300px] object-cover"
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                            setDuration(e.currentTarget.duration)
                            setIsLoading(false)
                        }}
                        onError={() => {
                            setIsLoading(false)
                            setHasError(true)
                        }}
                    />

                    {/* Loading state */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <div className="h-8 w-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Play overlay */}
                    {!isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                            <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="h-7 w-7 text-gray-800 ml-1" />
                            </div>
                        </div>
                    )}

                    {/* Duration badge */}
                    {duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                            {formatDuration(duration)}
                        </div>
                    )}
                </div>
                {caption && <p className="text-sm">{caption}</p>}
            </div>

            {/* Fullscreen Modal - Utilise un portail pour être au-dessus de tout */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {showFullscreen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                            onClick={() => setShowFullscreen(false)}
                        >
                            {/* Header avec boutons */}
                            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-linear-to-b from-black/60 to-transparent">
                                {/* Bouton retour */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowFullscreen(false)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    <span className="text-sm font-medium">Retour</span>
                                </button>

                                {/* Boutons d'action */}
                                <div className="flex items-center gap-2">
                                    {/* Download button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDownload()
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        title="Télécharger"
                                    >
                                        <Download className="h-5 w-5" />
                                        <span className="text-sm font-medium hidden sm:inline">Télécharger</span>
                                    </button>

                                    {/* Close button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowFullscreen(false)
                                        }}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        title="Fermer"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Video */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <video
                                    ref={fullscreenVideoRef}
                                    src={src}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[85vh] rounded-lg"
                                />
                            </motion.div>

                            {/* Caption */}
                            {caption && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/60 to-transparent">
                                    <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-black/50 to-transparent z-10 pointer-events-none" />
                                    <p className="text-white text-sm text-center max-w-2xl mx-auto">
                                        {caption}
                                    </p>
                                </div>
                            )}

                            {/* Instruction pour fermer */}
                            <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden sm:block">
                                Appuyez sur Échap ou cliquez pour fermer
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}
