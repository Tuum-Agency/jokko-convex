/**
 * Shared logic for the fallback timer in CallNotificationProvider.
 *
 * When an outbound call leaves the `getMyOutboundCall` result set (because it
 * reached a terminal status), the provider starts a 5s timer as a safety net
 * against the primary `trackedCallStatus` effect never firing. At timer fire
 * time, we want to prefer the real Meta reason (e.g. "CPR failed: 401 - code
 * 190") over a generic fallback — if the tracked status has already landed by
 * then, we should use it.
 *
 * Extracted into a pure function so the tricky race-resolution contract can be
 * unit-tested without spinning up Convex + React.
 */

type TerminalStatus = 'FAILED' | 'TERMINATED' | 'REJECTED' | 'MISSED';
const TERMINAL_STATUSES: ReadonlySet<string> = new Set<TerminalStatus>([
    'FAILED',
    'TERMINATED',
    'REJECTED',
    'MISSED',
]);

export interface TrackedCallSnapshot {
    status: string;
    terminationReason?: string | null;
}

/**
 * @param tracked The latest snapshot of `getCallStatusForAgent` (or null if
 *                the query has not resolved yet).
 * @returns The terminationReason to pass to `mapCallError`, or null to fall
 *          back to the generic "L'appel a echoue" message.
 */
export function resolveFallbackReason(
    tracked: TrackedCallSnapshot | null | undefined,
): string | null {
    if (!tracked) return null;
    if (!TERMINAL_STATUSES.has(tracked.status)) return null;
    return tracked.terminationReason ?? null;
}
