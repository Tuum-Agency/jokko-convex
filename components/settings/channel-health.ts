/**
 * Shared logic for detecting channel-level token health issues from the
 * calls history.
 *
 * Motivation: `getChannelStatus` (read-only Meta health check) returns OK for
 * channels whose token still has read scopes but whose calling scopes have
 * expired. The only reliable signal is the terminationReason of a recent
 * FAILED outbound call. We extract the match into a pure function so the
 * regex + window contract can be unit-tested without Convex.
 */

export interface CallForHealthCheck {
    whatsappChannelId?: string | null;
    status: string;
    terminationReason?: string | null;
    updatedAt: number;
}

export interface ChannelTokenIssue {
    channelId: string;
    lastErrorAt: number;
    reason: string;
}

/**
 * 24 hours in milliseconds. Used as the default freshness window for
 * channel-level token error detection.
 */
export const DEFAULT_TOKEN_ERROR_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Heuristic: does the given terminationReason indicate a Meta auth failure
 * (code 190, OAuthException, "access token has expired", etc.)?
 *
 * Mirrors the same signals used by `mapCallError` but returns a boolean
 * instead of a user-facing message.
 */
export function isTokenExpiredReason(raw: string | null | undefined): boolean {
    if (!raw) return false;
    const r = raw.toLowerCase();
    return (
        r.includes('"code":190') ||
        r.includes('(#190)') ||
        r.includes('oauthexception') ||
        r.includes('access token has expired') ||
        r.includes('session has been invalidated') ||
        r.includes('authentication error')
    );
}

/**
 * Given a list of recent calls, return one entry per channel that has at
 * least one FAILED call with a token-expired terminationReason within the
 * freshness window.
 *
 * The returned entry uses the *most recent* matching call for `lastErrorAt`
 * and `reason`, so the UI can show a timestamp the user can act on.
 */
export function findChannelsWithTokenError(
    calls: ReadonlyArray<CallForHealthCheck>,
    now: number = Date.now(),
    windowMs: number = DEFAULT_TOKEN_ERROR_WINDOW_MS,
): ChannelTokenIssue[] {
    const byChannel = new Map<string, ChannelTokenIssue>();

    for (const call of calls) {
        if (call.status !== 'FAILED') continue;
        if (!call.whatsappChannelId) continue;
        if (now - call.updatedAt > windowMs) continue;
        if (!isTokenExpiredReason(call.terminationReason)) continue;

        const existing = byChannel.get(call.whatsappChannelId);
        if (!existing || existing.lastErrorAt < call.updatedAt) {
            byChannel.set(call.whatsappChannelId, {
                channelId: call.whatsappChannelId,
                lastErrorAt: call.updatedAt,
                reason: call.terminationReason ?? '',
            });
        }
    }

    return Array.from(byChannel.values());
}
