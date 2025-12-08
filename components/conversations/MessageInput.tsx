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
} from 'lucide-react'

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
    file: File
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

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const { sendMessage, sendMedia, isSending } = useSendMessage(conversationId)
    const { sendTyping } = useTypingIndicator(conversationId)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
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

        const type = file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
                ? 'video'
                : 'document'

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
            // Check if mediaDevices is available (requires HTTPS or localhost)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert(
                    'L\'enregistrement audio necessite une connexion securisee (HTTPS).\n\n' +
                    'Pour tester localement, utilisez localhost:3001 au lieu de lvh.me:3001'
                )
                return
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            // Determine best supported audio format
            let mimeType = 'audio/webm'
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus'
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus'
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4'
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType })

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.start(100) // Collect data every 100ms
            setIsRecording(true)
            setRecordingDuration(0)

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('[MessageInput] Failed to start recording:', error)
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                alert('Acces au microphone refuse. Veuillez autoriser l\'acces dans les parametres du navigateur.')
            } else if (error instanceof DOMException && error.name === 'NotFoundError') {
                alert('Aucun microphone detecte. Verifiez que votre microphone est connecte.')
            } else {
                alert('Impossible d\'acceder au microphone. Verifiez les permissions.')
            }
        }
    }

    // Stop recording and send
    const stopRecordingAndSend = () => {
        if (!mediaRecorderRef.current || !isRecording) return

        const recorder = mediaRecorderRef.current
        const mimeType = recorder.mimeType || 'audio/webm'
        const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'

        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

            // Create a File from the Blob
            const audioFile = new File([audioBlob], `audio_${Date.now()}.${extension}`, {
                type: mimeType,
            })

            // Send the audio
            sendMedia({
                file: audioFile,
                type: 'audio',
            })

            // Cleanup
            cleanupRecording()
        }

        recorder.stop()
    }

    // Cancel recording
    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
        }
        cleanupRecording()
    }

    // Cleanup recording state
    const cleanupRecording = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        mediaRecorderRef.current = null
        audioChunksRef.current = []
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

        if (attachment) {
            sendMedia({
                file: attachment.file,
                type: attachment.type,
                caption: trimmedMessage || undefined,
                replyToMessageId: replyTo?.id,
                replyTo: replyToInfo,
            })
            removeAttachment()
        } else if (trimmedMessage) {
            sendMessage({
                text: trimmedMessage,
                replyToMessageId: replyTo?.id,
                replyTo: replyToInfo,
            })
        } else {
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
        setMessage(e.target.value)
        adjustHeight()
        sendTyping()
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
        <div className="border-t border-gray-200/80 bg-white p-4">
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
                                    {attachment.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
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
                                // All WhatsApp supported document types
                                fileInputRef.current?.setAttribute(
                                    'accept',
                                    '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'
                                )
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
