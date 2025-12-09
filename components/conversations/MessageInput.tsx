/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           components/conversations/MessageInput.tsx           ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │                                                     │   ║
 * ║     │  [😊]  [📎]  [Type your message...          ]  [➤]  │   ║
 * ║     │                                                     │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ║     Supports:                                                 ║
 * ║     - Text messages                                           ║
 * ║     - Image/Video upload                                      ║
 * ║     - Document upload                                         ║
 * ║     - Audio recording                                         ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Input de message avec support medias et envoi.              ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import {
    Paperclip,
    Send,
    Smile,
    X,
    Image as ImageIcon,
    FileText,
    Loader2,
    Mic,
    Camera,
    Square,
    Trash2,
    Reply,
    Zap, // Icon for shortcuts
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
// @ts-ignore
import MicRecorder from 'mic-recorder-to-mp3'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useTypingIndicator } from '@/hooks/useRealtime'
import { cn } from '@/lib/utils'
import type { Message } from '@/hooks/useMessages'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

interface MessageInputProps {
    conversationId: string
    disabled?: boolean
    placeholder?: string
    replyTo?: Message | null
    onCancelReply?: () => void
}

interface Attachment {
    file?: File
    storageId?: string
    preview?: string
    type: 'image' | 'video' | 'document'
}

// File size limits (videos will be compressed on server)
const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024,      // 5 MB
    video: 100 * 1024 * 1024,    // 100 MB (will be compressed to 16MB)
    audio: 16 * 1024 * 1024,     // 16 MB
    document: 100 * 1024 * 1024, // 100 MB
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================
// COMPONENT
// ============================================

export function MessageInput({
    conversationId,
    disabled,
    placeholder = 'Ecrivez votre message...',
    replyTo,
    onCancelReply,
}: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [attachment, setAttachment] = useState<Attachment | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)

    // Shortcuts state
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [shortcutQuery, setShortcutQuery] = useState('')
    const shortcuts = useQuery(api.shortcuts.suggest, showShortcuts ? { search: shortcutQuery } : "skip")

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const recorderRef = useRef<any>(null)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

    const { sendMessage, sendMedia, isSending } = useSendMessage(conversationId)
    const { sendTyping } = useTypingIndicator(conversationId)
    const getDownloadUrl = useMutation(api.files.getDownloadUrl)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (recorderRef.current) {
                recorderRef.current.stop()
            }
        }
    }, [])

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false)
            }
        }

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showEmojiPicker])

    // Handle emoji selection
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const cursorPosition = textareaRef.current?.selectionStart || message.length
        const newMessage =
            message.slice(0, cursorPosition) +
            emojiData.emoji +
            message.slice(cursorPosition)
        setMessage(newMessage)
        setShowEmojiPicker(false)
        textareaRef.current?.focus()
    }

    // Handle shortcut selection
    const handleShortcutSelect = async (shortcut: { shortcut: string, text?: string, type?: string, mediaStorageId?: Id<"_storage"> }) => {
        const cursorPosition = textareaRef.current?.selectionStart || message.length

        // We know shortcutQuery ends at cursorPosition
        const textBeforeCursor = message.slice(0, cursorPosition)

        if (textBeforeCursor.endsWith(shortcutQuery)) {
            const triggerStart = cursorPosition - shortcutQuery.length

            // If it's a media shortcut
            if (shortcut.type && shortcut.type !== 'TEXT' && shortcut.mediaStorageId) {
                // Remove the trigger text
                const newMessage =
                    message.slice(0, triggerStart) +
                    message.slice(cursorPosition)

                setMessage(newMessage)

                // Fetch preview URL
                try {
                    const url = await getDownloadUrl({ storageId: shortcut.mediaStorageId })
                    if (url) {
                        setAttachment({
                            storageId: shortcut.mediaStorageId,
                            type: shortcut.type.toLowerCase() as any,
                            preview: url,
                            // file is undefined
                        })
                        // Set caption if present
                        if (shortcut.text) {
                            setMessage(shortcut.text)
                        }
                    }
                } catch (e) {
                    console.error("Failed to load shortcut media", e)
                    toast.error("Erreur lors du chargement du média")
                }

                setShowShortcuts(false)
                setShortcutQuery('')
                return
            }

            // Text shortcut
            const insertText = shortcut.text || ""
            const newMessage =
                message.slice(0, triggerStart) +
                insertText +
                message.slice(cursorPosition)

            setMessage(newMessage)
            setShowShortcuts(false)
            setShortcutQuery('')

            // Adjust height and focus
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus()
                    // Re-calculate height
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
                }
            }, 0)
        }
    }

    // Auto-resize textarea
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
        }
    }, [])

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // WhatsApp Cloud API Supported Types
        const supportedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

        let type: 'image' | 'video' | 'document' = 'document';
        if (supportedImages.includes(file.type)) {
            type = 'image';
        } else if (file.type.startsWith('video/')) {
            // Try to send all videos as video type first, backend will fallback if supported check fails
            type = 'video';
        }

        // Check file size against limits
        const maxSize = MAX_FILE_SIZES[type]
        if (file.size > maxSize) {
            const limitInfo = type === 'video'
                ? `Limite: ${formatFileSize(maxSize)} (les videos seront comprimees automatiquement)`
                : `Limite WhatsApp pour les ${type === 'image' ? 'images' : 'documents'}: ${formatFileSize(maxSize)}`

            alert(
                `Le fichier est trop volumineux (${formatFileSize(file.size)}).\n\n` +
                `${limitInfo}\n\n` +
                `Veuillez choisir un fichier plus petit.`
            )
            // Reset the input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        const newAttachment: Attachment = { file, type }

        // Create preview for images and videos
        if (type === 'image' || type === 'video') {
            newAttachment.preview = URL.createObjectURL(file)
        }

        console.log('[MessageInput] File selected:', { type, fileName: file.name, size: file.size })
        setAttachment(newAttachment)
    }

    // Remove attachment
    const removeAttachment = () => {
        if (attachment?.preview) {
            URL.revokeObjectURL(attachment.preview)
        }
        setAttachment(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Format recording duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Start audio recording
    const startRecording = async () => {
        try {
            const recorder = new MicRecorder({ bitRate: 128 })
            await recorder.start()
            recorderRef.current = recorder

            setIsRecording(true)
            setRecordingDuration(0)

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('[MessageInput] Failed to start recording:', error)
            alert('Impossible d\'acceder au microphone. Verifiez les permissions.')
        }
    }

    // Stop recording and send
    const stopRecordingAndSend = () => {
        if (!recorderRef.current || !isRecording) return

        recorderRef.current
            .stop()
            .getMp3()
            .then(([buffer, blob]: [any, Blob]) => {
                const audioFile = new File(buffer, `audio_${Date.now()}.mp3`, {
                    type: 'audio/mpeg',
                })

                sendMedia({
                    file: audioFile,
                    type: 'audio',
                })

                cleanupRecording()
            })
            .catch((e: any) => {
                console.error('[MessageInput] Failed to get MP3:', e)
                cleanupRecording()
            })
    }

    // Cancel recording
    const cancelRecording = () => {
        if (recorderRef.current) {
            recorderRef.current.stop()
        }
        cleanupRecording()
    }

    // Cleanup recording state
    const cleanupRecording = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
        recorderRef.current = null
        setIsRecording(false)
        setRecordingDuration(0)
    }

    // Send message
    const handleSend = async () => {
        if (isSending || disabled) return

        const trimmedMessage = message.trim()

        // Build replyTo info for optimistic display
        const replyToInfo = replyTo
            ? { id: replyTo.id, content: replyTo.content, type: replyTo.type }
            : undefined

        try {
            if (attachment) {
                const sendPromise = sendMedia({
                    file: attachment.file, // optional now
                    storageId: attachment.storageId,
                    type: attachment.type,
                    caption: trimmedMessage || undefined,
                    replyToMessageId: replyTo?.id,
                    replyTo: replyToInfo,
                })

                toast.promise(sendPromise, {
                    loading: attachment.type === 'video' ? 'Envoi de la vidéo en cours (veuillez patienter)...' : 'Envoi du fichier en cours...',
                    success: 'Envoyé avec succès !',
                    error: (err) => `Échec de l'envoi: ${err.message}`
                })

                await sendPromise
                removeAttachment()
            } else if (trimmedMessage) {
                await sendMessage({
                    text: trimmedMessage,
                    replyToMessageId: replyTo?.id,
                    replyTo: replyToInfo,
                })
            } else {
                return
            }
        } catch (error) {
            console.error("Error sending message:", error)
            const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
            toast.error(`Erreur lors de l'envoi: ${errorMessage}`)
            return
        }

        setMessage('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
        // Clear reply after sending
        if (onCancelReply) {
            onCancelReply()
        }
    }

    // Handle keyboard
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setMessage(newValue)
        adjustHeight()
        sendTyping()

        // Shortcut detection
        const cursorPosition = e.target.selectionStart
        const textBeforeCursor = newValue.slice(0, cursorPosition)

        // Match a slash that is either at the start or preceded by a space, followed by non-space chars
        // Regex: (?:^|\s)(\/[\w-]*)$
        const match = textBeforeCursor.match(/(?:^|\s)(\/[\w-]*)$/)

        if (match) {
            const query = match[1] // e.g. "/hel"
            setShortcutQuery(query)
            setShowShortcuts(true)
        } else {
            setShowShortcuts(false)
            setShortcutQuery('')
        }
    }

    const canSend = (message.trim() || attachment) && !isSending && !disabled

    // Recording UI
    if (isRecording) {
        return (
            <div className="border-t border-gray-200/80 bg-white p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4"
                >
                    {/* Cancel Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelRecording}
                        className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>

                    {/* Recording Indicator */}
                    <div className="flex-1 flex items-center gap-3">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="h-3 w-3 rounded-full bg-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Enregistrement... {formatDuration(recordingDuration)}
                        </span>
                        {/* Waveform animation */}
                        <div className="flex items-center gap-[2px]">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-[3px] bg-green-500 rounded-full"
                                    animate={{
                                        height: [4, Math.random() * 20 + 8, 4],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.5,
                                        delay: i * 0.05,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Send Button */}
                    <Button
                        onClick={stopRecordingAndSend}
                        size="icon"
                        className="shrink-0 rounded-full bg-green-500 hover:bg-green-600 h-10 w-10"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </motion.div>
            </div>
        )
    }

    // Get reply preview text
    const getReplyPreviewText = (msg: Message): string => {
        if (msg.content) return msg.content
        switch (msg.type) {
            case 'IMAGE': return '📷 Photo'
            case 'VIDEO': return '🎥 Vidéo'
            case 'AUDIO': return '🎵 Audio'
            case 'DOCUMENT': return '📄 Document'
            case 'LOCATION': return '📍 Position'
            case 'STICKER': return '🎨 Sticker'
            default: return 'Message'
        }
    }

    return (
        <div className="border-t border-gray-200/80 bg-white p-4 relative">
            {/* Shortcuts Popup */}
            <AnimatePresence>
                {showShortcuts && shortcuts && shortcuts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-4 mb-2 z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                    >
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-gray-500">Raccourcis rapides</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            {(() => {
                                if (!shortcuts) return null;

                                const groups = {
                                    TEXT: { label: '📝 Messages', items: [] as typeof shortcuts },
                                    IMAGE: { label: '📷 Images', items: [] as typeof shortcuts },
                                    VIDEO: { label: '🎥 Vidéos', items: [] as typeof shortcuts },
                                    DOCUMENT: { label: '📄 Documents', items: [] as typeof shortcuts },
                                }; // Type assertion to handle generic type

                                shortcuts.forEach(s => {
                                    const type = (s.type || 'TEXT') as keyof typeof groups;
                                    if (groups[type]) {
                                        groups[type].items.push(s);
                                    } else {
                                        // Fallback for unknown types if any
                                        if (!groups['TEXT']) groups['TEXT'] = { label: '📝 Messages', items: [] };
                                        groups['TEXT'].items.push(s);
                                    }
                                });

                                return Object.entries(groups).map(([type, group]) => {
                                    if (group.items.length === 0) return null;

                                    return (
                                        <div key={type} className="mb-2 last:mb-0">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                                                {group.label}
                                            </div>
                                            {group.items.map((s) => (
                                                <button
                                                    key={s._id}
                                                    onClick={() => handleShortcutSelect(s)}
                                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm flex flex-col gap-0.5 transition-colors group"
                                                >
                                                    <span className="font-medium text-gray-900 group-hover:text-green-600">
                                                        {s.shortcut}
                                                    </span>
                                                    <span className="text-gray-500 line-clamp-2 text-xs">
                                                        {s.text || <span className="italic opacity-50">Sans texte</span>}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reply Preview */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3"
                    >
                        <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 border-l-4 border-green-500">
                            <Reply className="h-4 w-4 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-green-600">
                                    {replyTo.direction === 'INBOUND' ? 'Client' : 'Vous'}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                    {getReplyPreviewText(replyTo)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onCancelReply}
                                className="h-6 w-6 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachment Preview */}
            <AnimatePresence>
                {attachment && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3"
                    >
                        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                            {attachment.preview ? (
                                attachment.type === 'video' ? (
                                    <video
                                        src={attachment.preview}
                                        className="h-16 w-16 rounded-lg object-cover"
                                        muted
                                    />
                                ) : (
                                    <img
                                        src={attachment.preview}
                                        alt="Preview"
                                        className="h-16 w-16 rounded-lg object-cover"
                                    />
                                )
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.file ? attachment.file.name : "Média"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {attachment.file ? (attachment.file.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={removeAttachment}
                                className="h-8 w-8 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="flex items-end gap-2">
                {/* Emoji Button */}
                <div className="relative" ref={emojiPickerRef}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={cn(
                                    'shrink-0 text-gray-500 hover:text-gray-700',
                                    showEmojiPicker && 'text-green-600 bg-green-50'
                                )}
                            >
                                <Smile className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Emojis</TooltipContent>
                    </Tooltip>

                    {/* Emoji Picker Popup */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg"
                            >
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme={Theme.LIGHT}
                                    width={320}
                                    height={400}
                                    searchPlaceHolder="Rechercher un emoji..."
                                    previewConfig={{ showPreview: false }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Attachment Button */}
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled || isSending}
                                    className="shrink-0 text-gray-500 hover:text-gray-700"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Joindre un fichier</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem
                            onClick={() => {
                                // WhatsApp supported image types: JPEG, PNG, WebP
                                fileInputRef.current?.setAttribute('accept', 'image/jpeg,image/png,image/webp,image/*')
                                fileInputRef.current?.click()
                            }}
                        >
                            <ImageIcon className="mr-2 h-4 w-4 text-blue-500" />
                            Photo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                fileInputRef.current?.setAttribute('accept', 'video/*')
                                fileInputRef.current?.click()
                            }}
                        >
                            <Camera className="mr-2 h-4 w-4 text-purple-500" />
                            Video
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                // Allow all types for document fallback
                                fileInputRef.current?.setAttribute('accept', '*/*')
                                fileInputRef.current?.click()
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4 text-red-500" />
                            Document
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Textarea */}
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || isSending}
                        className={cn(
                            'min-h-[44px] max-h-[150px] resize-none rounded-2xl border-gray-200',
                            'bg-gray-50 focus:bg-white pr-12',
                            'placeholder:text-gray-400'
                        )}
                        rows={1}
                    />
                </div>

                {/* Send/Voice Button */}
                <motion.div
                    initial={false}
                    animate={{ scale: canSend ? 1 : 0.9 }}
                >
                    {canSend ? (
                        <Button
                            onClick={handleSend}
                            disabled={!canSend}
                            size="icon"
                            className="shrink-0 rounded-full bg-green-500 hover:bg-green-600 h-10 w-10"
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </Button>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled || isSending}
                                    onClick={startRecording}
                                    className="shrink-0 text-gray-500 hover:text-green-600 hover:bg-green-50 h-10 w-10"
                                >
                                    <Mic className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Enregistrer un message vocal</TooltipContent>
                        </Tooltip>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
