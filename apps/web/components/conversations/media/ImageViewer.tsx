/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          components/conversations/media/ImageViewer.tsx       ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Visualiseur d'images avec mode lightbox et zoom.            ║
 * ║   Utilise un portail pour le mode plein écran afin d'éviter   ║
 * ║   les problèmes de z-index et overflow-hidden.                ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Download, ZoomIn, ImageIcon, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ImageViewerProps {
    src: string | null
    thumbnailSrc?: string | null
    alt?: string
    caption?: string
    isOutbound?: boolean
}

export function ImageViewer({
    src,
    thumbnailSrc,
    alt = 'Image',
    caption,
    isOutbound = false,
}: ImageViewerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const displaySrc = src || thumbnailSrc
    // Blob URLs load instantly, so don't show loading state for them
    const isBlobUrl = displaySrc?.startsWith('blob:') || false
    const [isLoading, setIsLoading] = useState(!isBlobUrl)
    const [hasError, setHasError] = useState(false)

    // Pour le portail - s'assurer qu'on est côté client
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Bloquer le scroll du body quand le lightbox est ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Fermer avec la touche Échap
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    const handleDownload = async () => {
        if (!src) return

        try {
            const response = await fetch(src)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `image-${Date.now()}.jpg`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    if (!displaySrc || hasError) {
        return (
            <div className="space-y-1">
                <div className={cn(
                    'w-[250px] h-[180px] rounded-xl flex flex-col items-center justify-center gap-2',
                    isOutbound ? 'bg-green-200/50' : 'bg-gray-100'
                )}>
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                    <span className="text-xs text-gray-500">Image non disponible</span>
                </div>
                {caption && <p className="text-sm">{caption}</p>}
            </div>
        )
    }

    return (
        <>
            {/* Thumbnail */}
            <div className="space-y-1">
                <div
                    className="relative rounded-xl overflow-hidden w-[280px] max-h-[300px] cursor-pointer group"
                    onClick={() => setIsOpen(true)}
                >
                    {isLoading && (
                        <div className={cn(
                            'absolute inset-0 flex items-center justify-center min-h-[150px]',
                            isOutbound ? 'bg-green-100' : 'bg-gray-100'
                        )}>
                            <div className="h-8 w-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                        </div>
                    )}
                    <Image
                        src={displaySrc}
                        alt={alt}
                        width={280}
                        height={300}
                        className={cn(
                            'w-[280px] h-auto max-h-[300px] object-cover transition-transform duration-200 group-hover:scale-105',
                            !src && thumbnailSrc && 'blur-sm',
                            isLoading && 'opacity-0'
                        )}
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setIsLoading(false)
                            setHasError(true)
                        }}
                    />
                    {/* Zoom overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                {caption && <p className="text-sm">{caption}</p>}
            </div>

            {/* Lightbox Modal - Utilise un portail pour être au-dessus de tout */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        >
                            {/* Header avec boutons */}
                            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-linear-to-b from-black/60 to-transparent">
                                {/* Bouton retour */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsOpen(false)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    <span className="text-sm font-medium">Retour</span>
                                </button>

                                {/* Boutons d'action */}
                                <div className="flex items-center gap-2">
                                    {/* Download button */}
                                    {src && (
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
                                    )}

                                    {/* Close button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsOpen(false)
                                        }}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        title="Fermer"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Image */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Image
                                    src={src || displaySrc}
                                    alt={alt}
                                    width={1200}
                                    height={800}
                                    className="object-contain max-w-full max-h-[85vh] rounded-lg"
                                />
                            </motion.div>

                            {/* Caption */}
                            {caption && (
                                <>
                                    <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-black/50 to-transparent z-10 pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/60 to-transparent">
                                        <p className="text-white text-sm text-center max-w-2xl mx-auto">
                                            {caption}
                                        </p>
                                    </div>
                                </>
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
