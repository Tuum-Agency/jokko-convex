"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
// @ts-ignore
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

/**
 * Download media from WhatsApp Cloud API and store in Convex Storage.
 * WhatsApp only sends a media ID in webhooks — the actual file must be fetched
 * via two API calls:
 *   1. GET /v20.0/{media_id} → { url }
 *   2. GET {url} → binary file
 */
export const downloadMedia = internalAction({
    args: {
        messageId: v.id("messages"),
        organizationId: v.id("organizations"),
        whatsappMediaId: v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });

        const accessToken = org?.whatsapp?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
        if (!accessToken) {
            console.error(`[MEDIA DL] No access token for org ${args.organizationId}`);
            return;
        }

        try {
            // Step 1: Get media download URL from WhatsApp
            const metaRes = await fetch(
                `https://graph.facebook.com/v20.0/${args.whatsappMediaId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!metaRes.ok) {
                console.error(`[MEDIA DL] Failed to get media URL: ${metaRes.status} ${await metaRes.text()}`);
                return;
            }

            const metaData = await metaRes.json();
            const downloadUrl = metaData.url;
            if (!downloadUrl) {
                console.error("[MEDIA DL] No URL in media response:", JSON.stringify(metaData));
                return;
            }

            // Step 2: Download the actual file
            const fileRes = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!fileRes.ok) {
                console.error(`[MEDIA DL] Failed to download file: ${fileRes.status}`);
                return;
            }

            const blob = await fileRes.blob();

            // Step 3: Store in Convex Storage
            const storageId = await ctx.storage.store(blob);

            // Step 4: Update message with storageId
            await ctx.runMutation(internal.utils.patchMessageMedia, {
                messageId: args.messageId,
                mediaStorageId: storageId,
            });

            console.log(`[MEDIA DL] Stored media for message ${args.messageId} → ${storageId}`);
        } catch (error) {
            console.error(`[MEDIA DL] Error downloading media:`, String(error));
        }
    },
});

export const sendMessage = internalAction({
    args: {
        messageId: v.id("messages"),
        organizationId: v.id("organizations"),
        to: v.string(),
        text: v.optional(v.string()),
        type: v.optional(v.string()), // "text", "image", "video", "audio", "document", "interactive"
        interactive: v.optional(v.any()), // JSON payload for interactive messages
        mediaUrl: v.optional(v.string()),
        caption: v.optional(v.string()),
        mimeType: v.optional(v.string()),
        fileName: v.optional(v.string()),
        replyToWhatsAppId: v.optional(v.string()),
        template: v.optional(v.any()), // JSON payload for template messages
    },
    handler: async (ctx, args) => {
        // 1. Get Organization Config
        const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });

        // Resolve Credentials
        // Prioritize org DB config (set via Facebook Embedded Signup)
        // Fall back to ENV vars only for dev/test
        let phoneNumberId = org?.whatsapp?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
        let accessToken = org?.whatsapp?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

        if (!phoneNumberId || !accessToken) {
            console.error(`[OUTBOUND] Missing WhatsApp credentials (DB or ENV) for Org ${args.organizationId}`);
            // ... failure handling ...
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
            return;
        }

        const recipientPhone = args.to.replace(/\D/g, '');

        console.log(`[OUTBOUND] Sending message to ${recipientPhone} (ID: ${phoneNumberId})`);

        // Construct Payload
        let type = (args.type || "text").toLowerCase(); // Ensure lowercase for WhatsApp API

        // Handle Media Conversion (specifically for WebM audio -> OGG Opus/MP4 AAC)
        let mediaId: string | null = null;
        if (type === 'audio' && (args.mimeType?.includes('webm') || args.mediaUrl?.endsWith('.webm'))) {
            try {
                // console.log('[OUTBOUND] Converting WebM Audio to MP4 (AAC)...');
                const response = await fetch(args.mediaUrl!);
                const arrayBuffer = await response.arrayBuffer();
                const tempDir = os.tmpdir();
                const inputPath = path.join(tempDir, `input_${args.messageId}.webm`);
                const outputPath = path.join(tempDir, `output_${args.messageId}.mp4`);

                fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

                if (!ffmpegPath) throw new Error("FFmpeg binary not found");
                try { fs.chmodSync(ffmpegPath, 0o755); } catch { }

                await execFileAsync(ffmpegPath, [
                    '-i', inputPath,
                    '-vn', // No video
                    '-c:a', 'aac',
                    '-y',
                    outputPath
                ]);

                // Upload to WhatsApp
                const fileBuffer = fs.readFileSync(outputPath);
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', new Blob([fileBuffer], { type: 'audio/mp4' }), 'audio.mp4');
                formData.append('messaging_product', 'whatsapp');

                const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData
                });

                const uploadData = await uploadRes.json();
                if (uploadData.id) {
                    mediaId = uploadData.id;
                    console.log(`[OUTBOUND] Converted and uploaded audio. Media ID: ${mediaId}`);
                } else {
                    console.error('[OUTBOUND] Upload failed:', uploadData);
                    type = 'document'; // Fallback if upload fails
                }

                // Cleanup
                try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch { }
            } catch (err) {
                console.error('[OUTBOUND] Audio conversion error:', err);
                type = 'document'; // Fallback
            }
        }

        // ---------------------------------------------------------
        // UNIVERSAL MEDIA UPLOAD STRATEGY
        // ---------------------------------------------------------
        // We prioritize uploading the binary to WhatsApp (fetching from Convex first).
        // For Videos (MOV/AVI), we use a "Container Swap" strategy:
        // We upload them as 'video/mp4' with '.mp4' extension. 
        // WhatsApp's servers often handle H.264 content inside MOVs correctly if labeled as MP4.
        if (["image", "video", "audio", "document"].includes(type) && !mediaId && args.mediaUrl) {
            try {
                console.log(`[OUTBOUND] Fetching media from ${args.mediaUrl} for direct upload...`);
                const mediaRes = await fetch(args.mediaUrl);

                if (mediaRes.ok) {
                    const mediaBuffer = await mediaRes.arrayBuffer();
                    const mimeRaw = args.mimeType || mediaRes.headers.get('content-type') || 'application/octet-stream';

                    // Force MP4 mime for ALL videos to bypass WhatsApp "Format not supported" errors
                    // effectively tricking it to attempt processing the stream
                    let mime = type === 'video' ? 'video/mp4' : mimeRaw;

                    console.log(`[OUTBOUND] Downloaded ${mediaBuffer.byteLength} bytes. Raw Mime: ${mimeRaw} -> Sending as: ${mime}`);

                    // Determine filename
                    let filename = args.fileName || 'file.bin';

                    // Force .mp4 extension for videos
                    if (type === 'video') {
                        const base = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                        filename = `${base}.mp4`;
                    } else if (!args.fileName) {
                        const ext = mime.split('/')[1]?.split(';')[0]?.split('+')[0] || 'bin';
                        filename = `media.${ext}`;
                    }

                    const formData = new FormData();
                    // @ts-ignore
                    // Create Blob with FORCED mime type
                    formData.append('file', new Blob([mediaBuffer], { type: mime }), filename);
                    formData.append('messaging_product', 'whatsapp');

                    console.log(`[OUTBOUND] Uploading ${filename} to WhatsApp Media API...`);
                    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${accessToken}` },
                        body: formData
                    });

                    const uploadData = await uploadRes.json();
                    if (uploadData.id) {
                        mediaId = uploadData.id;
                        console.log(`[OUTBOUND] Media uploaded successfully. ID: ${mediaId}`);
                    } else {
                        console.error('[OUTBOUND] Media upload failed:', uploadData);
                    }
                } else {
                    console.error(`[OUTBOUND] Failed to fetch media from Convex: ${mediaRes.statusText}`);
                }
            } catch (e) {
                console.error('[OUTBOUND] Pre-upload error:', e);
            }
        }

        let messageBody: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhone,
            type: type
        };

        if (args.replyToWhatsAppId) {
            messageBody.context = { message_id: args.replyToWhatsAppId };
        }

        if (type === "text") {
            messageBody.text = { preview_url: false, body: args.text };
        } else if (type === "interactive" && args.interactive) {
            messageBody.interactive = args.interactive;
        } else if (type === "template" && args.template) {
            messageBody.template = args.template;
        } else if (["image", "video", "audio", "document"].includes(type)) {
            // If upload failed, we still try link as fallback if available
            if (!args.mediaUrl && !mediaId) {
                console.error(`[OUTBOUND] Missing mediaUrl for type ${type}`);
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "FAILED"
                });
                return;
            }

            const mediaObj: any = mediaId ? { id: mediaId } : { link: args.mediaUrl };

            if (args.caption && type !== "audio") {
                mediaObj.caption = args.caption;
            }

            if (args.fileName && type === 'document') {
                mediaObj.filename = args.fileName;
            }

            messageBody[type] = mediaObj;
            console.log(`[DEBUG] Media object prepared:`, JSON.stringify(mediaObj));
        } else {
            console.error(`[OUTBOUND] Unsupported properties or type: ${type}`);
            return;
        }

        console.log(`[DEBUG] Sending WhatsApp Payload:`, JSON.stringify(messageBody));

        try {
            const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageBody),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`[OUTBOUND] WhatsApp API Error:`, data);
                // If video failed (e.g. invalid format despite upload), try document fallback
                if (type === 'video' && mediaId) {
                    console.warn(`[OUTBOUND] Video send failed with simple video type. Retrying as document...`);
                    const docBody = JSON.parse(JSON.stringify(messageBody));
                    delete docBody.video;
                    docBody.type = 'document';
                    docBody.document = {
                        id: mediaId,
                        filename: args.fileName || 'video.mp4',
                        caption: args.caption
                    };

                    const retryRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(docBody),
                    });
                    const retryData = await retryRes.json();
                    if (retryRes.ok) {
                        console.log(`[OUTBOUND] Retry as document successful. ID: ${retryData.messages?.[0]?.id}`);
                        await ctx.runMutation(internal.utils.updateMessageStatus, {
                            messageId: args.messageId,
                            status: "SENT",
                            externalId: retryData.messages?.[0]?.id
                        });
                        return;
                    }
                }

                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "FAILED"
                });
            } else {
                console.log(`[OUTBOUND] Message sent. WhatsApp ID: ${data.messages?.[0]?.id}`);
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "SENT",
                    externalId: data.messages?.[0]?.id
                });
            }
        } catch (error) {
            console.error(`[OUTBOUND] Network Error:`, error);
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
        }
    },
});
