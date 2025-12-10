/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           components/conversations/MessageBubble.tsx          ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │                                                     │   ║
 * ║     │   [You]                                             │   ║
 * ║     │   Hello, how can I help you?             10:30 AM   │   ║
 * ║     │                                                     │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ║     Supports:                                                 ║
 * ║     - Text, Image, Video, Audio, Document                     ║
 * ║     - Location, Sticker, Reactions                            ║
 * ║     - Reply context, Forward status                           ║
 * ║     - Status (Sent, Delivered, Read)                          ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Bulle de message unique avec support de tous les types.     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    Check,
    CheckCheck,
    Clock,
    AlertCircle,
    MoreVertical,
    Reply,
    Forward,
    Copy,
    RotateCcw,
    MapPin,
    Loader2,
    Bot,
    Unlock,
} from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import type { Message } from '@/hooks/useMessages'
import { AudioPlayer, ImageViewer, VideoPlayer, DocumentPreview, LocationMessage, StickerMessage } from './media'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================
// TYPES
// ============================================

interface MessageBubbleProps {
    message: Message
    showAvatar?: boolean
    isGrouped?: boolean
    onResend?: (messageId: string) => Promise<void>
    onReply?: (message: Message) => void
    onForward?: (message: Message) => void
}

// ============================================
// STATUS ICON
// ============================================

function MessageStatus({ status }: { status: Message['status'] }) {
    switch (status) {
        case 'PENDING':
            return <Clock className="h-3 w-3 text-gray-400" />
        case 'SENT':
            return <Check className="h-3 w-3 text-gray-400" />
        case 'DELIVERED':
            return <CheckCheck className="h-3 w-3 text-gray-400" />
        case 'READ':
            return <CheckCheck className="h-3 w-3 text-blue-500" />
        case 'FAILED':
            return <AlertCircle className="h-3 w-3 text-red-500" />
        default:
            return null
    }
}



// ============================================
// MESSAGE BUBBLE
// ============================================

export function MessageBubble({
    message,
    isGrouped = false,
    onResend,
    onReply,
    onForward,
}: MessageBubbleProps) {
    const isOutbound = message.direction === 'OUTBOUND'
    const hasMedia = message.media && message.media.length > 0
    const media = message.media?.[0]
    const isFailed = message.status === 'FAILED'

    // Format time
    const time = useMemo(() => {
        return format(new Date(message.timestamp), 'HH:mm', { locale: fr })
    }, [message.timestamp])

    // Handle resend
    const handleResend = () => {
        if (onResend && isFailed) {
            onResend(message.id)
        }
    }

    // Render content based on type
    const renderContent = () => {
        // Location message
        if (message.type === 'LOCATION' && message.latitude && message.longitude) {
            return <LocationMessage message={message} />
        }

        // Media messages
        if (hasMedia && media) {
            const isPending = message.status === 'PENDING'
            const mediaContent = (() => {
                switch (message.type) {
                    case 'IMAGE':
                        return (
                            <ImageViewer
                                src={media.url}
                                thumbnailSrc={media.thumbnailUrl}
                                caption={message.content || undefined}
                                isOutbound={isOutbound}
                            />
                        )
                    case 'VIDEO':
                        return (
                            <VideoPlayer
                                src={media.url}
                                thumbnailSrc={media.thumbnailUrl}
                                caption={message.content || undefined}
                                isOutbound={isOutbound}
                            />
                        )
                    case 'AUDIO':
                        return (
                            <AudioPlayer
                                src={media.url}
                                isOutbound={isOutbound}
                            />
                        )
                    case 'DOCUMENT':
                        return (
                            <DocumentPreview
                                url={media.url}
                                fileName={media.fileName}
                                mimeType={media.mimeType}
                                isOutbound={isOutbound}
                            />
                        )
                    case 'STICKER':
                        return <StickerMessage url={media.url} />
                    default:
                        return null
                }
            })()

            // Show upload overlay for pending media (all types)
            if (isPending) {
                // For images and videos, show overlay on top of the preview
                if (message.type === 'IMAGE' || message.type === 'VIDEO') {
                    return (
                        <div className="relative">
                            {mediaContent}
                            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2 text-white">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <span className="text-xs font-medium">Envoi en cours...</span>
                                </div>
                            </div>
                        </div>
                    )
                }
                // For documents and audio, show inline indicator
                if (message.type === 'DOCUMENT' || message.type === 'AUDIO') {
                    return (
                        <div className="relative opacity-70">
                            {mediaContent}
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Envoi en cours...</span>
                            </div>
                        </div>
                    )
                }
            }

            return mediaContent
        }

        // Interactive Message
        if (message.type === 'INTERACTIVE') {
            const interactive = message.interactive
            if (interactive) {
                const { header, body, footer, action } = interactive

                return (
                    <div className="space-y-2">
                        {/* Header */}
                        {header?.type === 'text' && (
                            <p className="font-bold text-sm">{header.text}</p>
                        )}

                        {/* Body */}
                        {body?.text && (
                            <p className="whitespace-pre-wrap">{body.text}</p>
                        )}

                        {/* Footer */}
                        {footer?.text && (
                            <p className="text-xs text-gray-500">{footer.text}</p>
                        )}

                        {/* Actions - Buttons */}
                        {action?.buttons && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {action.buttons.map((btn: any, i: number) => (
                                    <div key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-indigo-600 font-medium shadow-xs">
                                        {btn.reply?.title || 'Button'}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions - List */}
                        {action?.sections && (
                            <div className="mt-2 text-sm text-gray-900 border border-gray-100 rounded-lg overflow-hidden bg-white/50">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 font-medium text-gray-500 text-xs flex items-center justify-between">
                                    <span>LISTE D'OPTIONS</span>
                                    {action.button && <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{action.button}</span>}
                                </div>
                                <div className="p-2 space-y-3">
                                    {action.sections.map((section: any, i: number) => (
                                        <div key={i}>
                                            {section.title && <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">{section.title}</p>}
                                            <ul className="space-y-1">
                                                {section.rows?.map((row: any, j: number) => (
                                                    <li key={j} className="flex flex-col px-2 py-1 bg-white rounded border border-gray-100">
                                                        <span className="font-medium">{row.title}</span>
                                                        {row.description && <span className="text-xs text-gray-500">{row.description}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        }

        // Text message with emoji detection for large emoji display
        if (message.content) {
            // Check if message is only emojis (1-3 emojis)
            const emojiOnlyRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,3}$/u
            const isEmojiOnly = emojiOnlyRegex.test(message.content.trim())

            if (isEmojiOnly) {
                return <span className="text-4xl leading-tight">{message.content}</span>
            }

            return <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
        }

        // Reaction
        if (message.type === 'REACTION' && message.reaction) {
            return <span className="text-3xl">{message.reaction}</span>
        }

        return null
    }

    // Check if this is a media-only message (no text caption)
    const isMediaOnly = hasMedia && !message.content
    const isReaction = message.type === 'REACTION'
    const isSticker = message.type === 'STICKER'

    // For stickers and reactions, don't show bubble background
    if (isSticker || isReaction) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    'flex',
                    isOutbound ? 'justify-end' : 'justify-start',
                    !isGrouped && 'mt-2'
                )}
            >
                <div className="relative max-w-[85%] md:max-w-[70%]">
                    <div className="text-sm text-gray-900">{renderContent()}</div>
                    <div className={cn(
                        'flex items-center gap-1 mt-1',
                        isOutbound ? 'justify-end' : 'justify-start'
                    )}>
                        <span className="text-[10px] text-gray-500">{time}</span>
                        {isOutbound && <MessageStatus status={message.status} />}
                    </div>
                </div>
            </motion.div>
        )
    }

    // Handle reply click
    const handleReply = () => {
        if (onReply) {
            onReply(message)
        }
    }

    // Handle forward click
    const handleForward = () => {
        if (onForward) {
            onForward(message)
        }
    }

    // Handle copy
    const handleCopy = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content)
        }
    }

    // Check if we have any actions available
    const hasActions = onReply || onForward || message.content

    // Menu button component
    const MenuButton = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        'p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity self-center',
                        'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                    )}
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={isOutbound ? 'end' : 'start'}
                className="min-w-[140px]"
            >
                {onReply && (
                    <DropdownMenuItem onClick={handleReply}>
                        <Reply className="h-4 w-4 mr-2" />
                        Répondre
                    </DropdownMenuItem>
                )}
                {onForward && (
                    <DropdownMenuItem onClick={handleForward}>
                        <Forward className="h-4 w-4 mr-2" />
                        Transférer
                    </DropdownMenuItem>
                )}
                {message.content && (
                    <DropdownMenuItem onClick={handleCopy}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex',
                isOutbound ? 'justify-end' : 'justify-start',
                !isGrouped && 'mt-2'
            )}
        >
            {/* Wrapper to position menu button beside bubble */}
            <div className={cn(
                'flex items-start gap-1 group max-w-[85%] md:max-w-[70%]',
                isOutbound ? 'flex-row-reverse' : 'flex-row'
            )}>
                {/* Message bubble */}
                <div
                    className={cn(
                        'relative rounded-2xl',
                        // Padding varies based on content type
                        isMediaOnly ? 'p-1' : 'px-3 py-2',
                        isOutbound
                            ? 'bg-green-100 rounded-br-sm'
                            : 'bg-white rounded-bl-sm shadow-sm',
                        // Add tail effect
                        !isMediaOnly && isOutbound
                            ? 'before:absolute before:right-0 before:bottom-0 before:w-3 before:h-3 before:bg-green-100 before:rounded-bl-full before:translate-x-1'
                            : !isMediaOnly && 'before:absolute before:left-0 before:bottom-0 before:w-3 before:h-3 before:bg-white before:rounded-br-full before:-translate-x-1'
                    )}
                >
                    {/* Forwarded indicator */}
                    {message.isForwarded && (
                        <div className="flex items-center gap-1 mb-1 text-[11px] text-gray-500 italic">
                            <Forward className="h-3 w-3" />
                            <span>Transféré</span>
                        </div>
                    )}

                    {/* Reply context */}
                    {message.replyTo && (
                        <div className={cn(
                            'mb-2 p-2 rounded-lg border-l-2 border-green-500',
                            isOutbound ? 'bg-green-200/50' : 'bg-gray-100'
                        )}>
                            <p className="text-xs text-gray-600 truncate">
                                {message.replyTo.content || `[${message.replyTo.type}]`}
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    <div className="text-sm text-gray-900">
                        {isOutbound && !message.senderId && (
                            <div className="flex items-center gap-1.5 mb-1 text-xs text-indigo-600 font-medium pb-1 border-b border-indigo-100">
                                <Bot className="h-3 w-3" />
                                <span>Automation</span>
                            </div>
                        )}
                        {renderContent()}
                    </div>

                    {/* Time and status */}
                    <div className={cn(
                        'flex items-center gap-1 mt-1',
                        isOutbound ? 'justify-end' : 'justify-start',
                        isMediaOnly && 'px-2 pb-1'
                    )}>
                        <span className={cn(
                            'text-[10px]',
                            isMediaOnly ? 'text-gray-600 bg-black/20 px-1.5 py-0.5 rounded' : 'text-gray-500'
                        )}>
                            {time}
                        </span>
                        {isOutbound && <MessageStatus status={message.status} />}
                    </div>

                    {/* Retry button for failed messages */}
                    {isFailed && isOutbound && onResend && (
                        <button
                            onClick={handleResend}
                            className="flex items-center gap-1.5 mt-2 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <RotateCcw className="h-3 w-3" />
                            <span>Réessayer</span>
                        </button>
                    )}
                </div>

                {/* Context Menu Button - positioned beside the bubble */}
                {hasActions && <MenuButton />}
            </div>
        </motion.div>
    )
}
