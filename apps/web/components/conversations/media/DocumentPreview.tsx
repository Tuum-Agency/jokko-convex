/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║         components/conversations/media/DocumentPreview.tsx    ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Apercu de document avec icones par type de fichier.         ║
 * ║   Mode plein écran pour prévisualiser les PDF et autres docs. ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText,
    FileSpreadsheet,
    FileImage,
    FileArchive,
    FileCode,
    File,
    Download,
    ExternalLink,
    X,
    ArrowLeft,
    Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentPreviewProps {
    url: string | null
    fileName?: string | null
    mimeType?: string | null
    fileSize?: number | null
    isOutbound?: boolean
}

// Get file info based on mime type or extension
function getFileInfo(mimeType?: string | null, fileName?: string | null) {
    const extension = fileName?.split('.').pop()?.toLowerCase()

    // PDF
    if (mimeType?.includes('pdf') || extension === 'pdf') {
        return {
            icon: FileText,
            color: 'bg-red-100 text-red-600',
            label: 'PDF',
        }
    }

    // Word documents
    if (
        mimeType?.includes('word') ||
        mimeType?.includes('document') ||
        extension === 'doc' ||
        extension === 'docx'
    ) {
        return {
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
            label: 'Word',
        }
    }

    // Excel/Spreadsheets
    if (
        mimeType?.includes('spreadsheet') ||
        mimeType?.includes('excel') ||
        extension === 'xls' ||
        extension === 'xlsx' ||
        extension === 'csv'
    ) {
        return {
            icon: FileSpreadsheet,
            color: 'bg-green-100 text-green-700',
            label: extension?.toUpperCase() || 'Excel',
        }
    }

    // PowerPoint
    if (
        mimeType?.includes('presentation') ||
        mimeType?.includes('powerpoint') ||
        extension === 'ppt' ||
        extension === 'pptx'
    ) {
        return {
            icon: FileImage,
            color: 'bg-orange-100 text-orange-600',
            label: 'PowerPoint',
        }
    }

    // Archives
    if (
        mimeType?.includes('zip') ||
        mimeType?.includes('archive') ||
        mimeType?.includes('compressed') ||
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')
    ) {
        return {
            icon: FileArchive,
            color: 'bg-yellow-100 text-yellow-700',
            label: extension?.toUpperCase() || 'Archive',
        }
    }

    // Code files
    if (
        mimeType?.includes('javascript') ||
        mimeType?.includes('json') ||
        mimeType?.includes('xml') ||
        mimeType?.includes('html') ||
        ['js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'html', 'css', 'py', 'java'].includes(extension || '')
    ) {
        return {
            icon: FileCode,
            color: 'bg-purple-100 text-purple-600',
            label: extension?.toUpperCase() || 'Code',
        }
    }

    // Text files
    if (mimeType?.includes('text') || extension === 'txt') {
        return {
            icon: FileText,
            color: 'bg-gray-100 text-gray-600',
            label: 'Text',
        }
    }

    // Default
    return {
        icon: File,
        color: 'bg-gray-100 text-gray-600',
        label: extension?.toUpperCase() || 'File',
    }
}

// Format file size
function formatFileSize(bytes?: number | null) {
    if (!bytes) return null

    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Check if file can be previewed
function canPreview(mimeType?: string | null, fileName?: string | null): boolean {
    const extension = fileName?.split('.').pop()?.toLowerCase()

    // PDF can be previewed
    if (mimeType?.includes('pdf') || extension === 'pdf') {
        return true
    }

    // Images can be previewed (though they should use ImageViewer)
    if (mimeType?.includes('image')) {
        return true
    }

    return false
}

export function DocumentPreview({
    url,
    fileName,
    mimeType,
    fileSize,
    isOutbound = false,
}: DocumentPreviewProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [showFullscreen, setShowFullscreen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const fileInfo = getFileInfo(mimeType, fileName)
    const Icon = fileInfo.icon
    const size = formatFileSize(fileSize)
    const isPreviewable = canPreview(mimeType, fileName)
    const isPdf = mimeType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')

    const displayName = fileName || 'Document'
    const truncatedName =
        displayName.length > 25
            ? displayName.slice(0, 22) + '...' + displayName.slice(-8)
            : displayName

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

    const handleDownload = async () => {
        if (!url) return

        setIsDownloading(true)
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = fileName || 'document'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(downloadUrl)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback: open in new tab
            window.open(url, '_blank')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleClick = () => {
        if (isPreviewable && url) {
            setShowFullscreen(true)
        } else {
            handleDownload()
        }
    }

    if (!url) {
        return (
            <div className={cn(
                'flex items-center gap-3 p-3 rounded-xl min-w-[220px]',
                isOutbound ? 'bg-green-200/50' : 'bg-white/70'
            )}>
                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                    <File className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Document non disponible</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                className={cn(
                    'flex items-center gap-3 p-3 rounded-xl min-w-[220px] max-w-[300px] cursor-pointer transition-colors',
                    isOutbound
                        ? 'bg-green-200/50 hover:bg-green-200/70'
                        : 'bg-white/70 hover:bg-white/90'
                )}
                onClick={handleClick}
            >
                {/* File icon */}
                <div className={cn(
                    'h-12 w-12 rounded-lg flex items-center justify-center shrink-0',
                    fileInfo.color
                )}>
                    <Icon className="h-6 w-6" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={displayName}>
                        {truncatedName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{fileInfo.label}</span>
                        {size && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs text-gray-500">{size}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Preview/Download button */}
                <div className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    isOutbound
                        ? 'bg-green-300/50 hover:bg-green-300'
                        : 'bg-gray-100 hover:bg-gray-200'
                )}>
                    {isDownloading ? (
                        <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : isPreviewable ? (
                        <Eye className="h-4 w-4 text-gray-600" />
                    ) : (
                        <Download className="h-4 w-4 text-gray-600" />
                    )}
                </div>
            </div>

            {/* Fullscreen Modal - Utilise un portail pour être au-dessus de tout */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {showFullscreen && url && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-100 bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                                {/* Bouton retour */}
                                <button
                                    onClick={() => setShowFullscreen(false)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    <span className="text-sm font-medium">Retour</span>
                                </button>

                                {/* File name */}
                                <div className="flex items-center gap-2 flex-1 justify-center">
                                    <div className={cn(
                                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                                        fileInfo.color
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-white text-sm font-medium truncate max-w-[300px]">
                                        {displayName}
                                    </span>
                                </div>

                                {/* Boutons d'action */}
                                <div className="flex items-center gap-2">
                                    {/* Open in new tab */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(url, '_blank')
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        title="Ouvrir dans un nouvel onglet"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                        <span className="text-sm font-medium hidden sm:inline">Ouvrir</span>
                                    </button>

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
                                        onClick={() => setShowFullscreen(false)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        title="Fermer"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Document viewer */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="flex-1 overflow-hidden p-4"
                            >
                                {isPdf ? (
                                    <iframe
                                        src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                                        className="w-full h-full rounded-lg bg-white"
                                        title={displayName}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <div className={cn(
                                                'h-24 w-24 rounded-2xl flex items-center justify-center mx-auto mb-4',
                                                fileInfo.color
                                            )}>
                                                <Icon className="h-12 w-12" />
                                            </div>
                                            <p className="text-lg font-medium text-white mb-2">{displayName}</p>
                                            <p className="text-sm mb-4">
                                                {fileInfo.label} {size && `• ${size}`}
                                            </p>
                                            <button
                                                onClick={handleDownload}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                                            >
                                                <Download className="h-5 w-5" />
                                                Télécharger le fichier
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Instruction pour fermer */}
                            <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden sm:block">
                                Appuyez sur Échap pour fermer
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}
