import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SendMessageOptions {
    text?: string;
    file?: File;
    type?: 'image' | 'video' | 'audio' | 'document';
    caption?: string;
    replyToMessageId?: string;
    replyTo?: { id: string; content?: string; type: string }; // For optimistic updates
}

export function useSendMessage(conversationId: string) {
    const [isSending, setIsSending] = useState(false);

    const sendMessageMutation = useMutation(api.messages.send);
    const generateUploadUrlMutation = useMutation(api.files.generateUploadUrl);

    const sendMessage = async ({ text, replyToMessageId }: { text: string, replyToMessageId?: string, replyTo?: any }) => {
        setIsSending(true);
        try {
            await sendMessageMutation({
                conversationId: conversationId as Id<"conversations">,
                content: text,
                type: 'TEXT',
                replyToId: replyToMessageId as Id<"messages"> | undefined,
                isForwarded: false
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        } finally {
            setIsSending(false);
        }
    };

    const sendMedia = async ({ file, storageId, type = 'image', caption, replyToMessageId, mimeType, fileName, fileSize }: { file?: File, storageId?: string, type: string, caption?: string, replyToMessageId?: string, replyTo?: any, mimeType?: string, fileName?: string, fileSize?: number }) => {
        setIsSending(true);
        try {
            let finalStorageId = storageId;
            let finalMimeType = mimeType || file?.type;
            let finalFileName = fileName || file?.name;
            let finalFileSize = fileSize || file?.size;

            if (!finalStorageId && file) {
                // 1. Generate Upload URL
                const postUrl = await generateUploadUrlMutation();

                // 2. Upload File
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId: uploadedId } = await result.json();
                finalStorageId = uploadedId;
                finalMimeType = file.type;
                finalFileName = file.name;
                finalFileSize = file.size;
            } else if (!finalStorageId && !file) {
                throw new Error("Either file or storageId is required");
            }

            // 3. Send Message with Storage ID
            await sendMessageMutation({
                conversationId: conversationId as Id<"conversations">,
                content: caption,
                type: type.toUpperCase(), // IMAGE, VIDEO, etc.
                mediaStorageId: finalStorageId as Id<"_storage">,
                mediaType: finalMimeType,
                fileName: finalFileName,
                fileSize: finalFileSize,
                replyToId: replyToMessageId as Id<"messages"> | undefined,
                isForwarded: false
            });

        } catch (error) {
            console.error("Failed to send media:", error);
            throw error;
        } finally {
            setIsSending(false);
        }
    };

    const sendForward = async ({ content, mediaStorageId, mediaType, type, fileName, fileSize }: { content?: string, mediaStorageId?: string, mediaType?: string, type: string, fileName?: string, fileSize?: number }) => {
        setIsSending(true);
        try {
            await sendMessageMutation({
                conversationId: conversationId as Id<"conversations">,
                content: content,
                type: type,
                mediaStorageId: mediaStorageId as Id<"_storage"> | undefined,
                mediaType: mediaType,
                fileName: fileName,
                fileSize: fileSize,
                isForwarded: true
            });
        } finally {
            setIsSending(false);
        }
    }

    return {
        sendMessage,
        sendMedia,
        sendForward,
        isSending
    };
}
