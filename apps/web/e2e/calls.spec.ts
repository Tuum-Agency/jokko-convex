import { test, expect, Page } from '@playwright/test';

// Tests for the outbound WhatsApp Business call flow.
//
// Regression target: clicking the call button triggered `getUserMedia` twice —
// once in the click handler and once in an effect after PERMISSION_GRANTED.
// The second call ran outside a user gesture and failed with NotAllowedError
// on http:// origins. The fix pre-acquires the stream at click time, stores
// it in the Zustand call-store, and `initiateCall` reuses it. These tests
// lock that behaviour in.

// Port is conductor-workspace dependent (main runs on :3000, worktrees may use
// :1000, :2000, etc.). Override via E2E_PORT when running this spec locally.
const PORT = process.env.E2E_PORT ?? '1000';
const SCHEME = process.env.E2E_SCHEME ?? 'https';
const BASE_URL = `${SCHEME}://be-in-digital.localhost:${PORT}`;
const CONVERSATIONS_URL = `${BASE_URL}/dashboard/conversations`;

// Inject a controllable mock of navigator.mediaDevices.getUserMedia and
// expose a window counter so tests can assert how many times it was invoked.
// `mode` controls whether it resolves or rejects.
async function installMicMock(page: Page, mode: 'grant' | 'deny') {
    await page.addInitScript((m: 'grant' | 'deny') => {
        const w = window as unknown as {
            __micCalls: number;
            __micMode: 'grant' | 'deny';
            __micStopCalls: number;
        };
        w.__micCalls = 0;
        w.__micMode = m;
        w.__micStopCalls = 0;

        const fakeTrack = () => ({
            kind: 'audio',
            enabled: true,
            readyState: 'live',
            stop() {
                w.__micStopCalls += 1;
            },
            addEventListener() {},
            removeEventListener() {},
        });

        const fakeStream = () => {
            const tracks = [fakeTrack()];
            return {
                active: true,
                id: 'mock-stream',
                getTracks: () => tracks,
                getAudioTracks: () => tracks,
                getVideoTracks: () => [],
                addEventListener() {},
                removeEventListener() {},
            };
        };

        const nav = navigator as unknown as { mediaDevices?: MediaDevices };
        if (!nav.mediaDevices) {
            nav.mediaDevices = {} as MediaDevices;
        }
        Object.defineProperty(nav.mediaDevices, 'getUserMedia', {
            configurable: true,
            value: async () => {
                w.__micCalls += 1;
                if (w.__micMode === 'deny') {
                    throw new DOMException('Permission denied', 'NotAllowedError');
                }
                return fakeStream() as unknown as MediaStream;
            },
        });
    }, mode);
}

// Select the call button inside the conversation header. It is a ghost icon
// button wrapping the lucide Phone/PhoneCall/AlertCircle icon. We use the
// svg class as a stable hook.
function callButton(page: Page) {
    return page.locator('button').filter({
        has: page.locator('svg.lucide-phone, svg.lucide-phone-call, svg.lucide-alert-circle'),
    }).first();
}

async function openFirstConversation(page: Page) {
    await page.goto(CONVERSATIONS_URL);
    await page.waitForLoadState('networkidle');

    // Conversation list items — tolerate absence in a clean seed.
    const firstItem = page.locator('[data-conversation-id], [role="listitem"], a[href*="/dashboard/conversations/"]').first();
    if (await firstItem.count() === 0) {
        return false;
    }
    await firstItem.click();
    await page.waitForLoadState('networkidle');
    return true;
}

test.describe('Outbound call flow', () => {
    test('getUserMedia is called exactly once on Appeler click', async ({ page, context }) => {
        await context.grantPermissions(['microphone'], { origin: BASE_URL });
        await installMicMock(page, 'grant');

        const opened = await openFirstConversation(page);
        test.skip(!opened, 'No seeded conversation available');

        const btn = callButton(page);
        await expect(btn).toBeVisible({ timeout: 5000 });
        await btn.click();

        // Allow the click handler to finish before asserting.
        await page.waitForTimeout(500);

        const micCalls = await page.evaluate(() => (window as unknown as { __micCalls: number }).__micCalls);
        expect(micCalls).toBe(1);

        // The click handler should have transitioned the UI to "requesting_permission"
        // or rendered the error bar. Either way, it should not be in idle anymore.
        const barVisible = await page.getByText(/Demande de permission envoyee|Autorisez l'acces au microphone/i).isVisible().catch(() => false);
        expect(barVisible).toBeTruthy();
    });

    test('NotAllowedError surfaces the mic permission button', async ({ page, context }) => {
        await context.grantPermissions(['microphone'], { origin: BASE_URL });
        await installMicMock(page, 'deny');

        const opened = await openFirstConversation(page);
        test.skip(!opened, 'No seeded conversation available');

        const btn = callButton(page);
        await expect(btn).toBeVisible({ timeout: 5000 });
        await btn.click();

        // Error bar with the mic message appears.
        await expect(page.getByText(/Autorisez l'acces au microphone/i)).toBeVisible({ timeout: 3000 });

        // The contextual fix-it button is rendered.
        await expect(page.getByRole('button', { name: /Autoriser le microphone/i })).toBeVisible();
    });

    test('retry via "Autoriser le microphone" re-triggers getUserMedia', async ({ page, context }) => {
        await context.grantPermissions(['microphone'], { origin: BASE_URL });
        await installMicMock(page, 'deny');

        const opened = await openFirstConversation(page);
        test.skip(!opened, 'No seeded conversation available');

        const btn = callButton(page);
        await expect(btn).toBeVisible({ timeout: 5000 });
        await btn.click();

        await expect(page.getByText(/Autorisez l'acces au microphone/i)).toBeVisible({ timeout: 3000 });

        const micCallsBefore = await page.evaluate(() => (window as unknown as { __micCalls: number }).__micCalls);

        // Flip the mock so the next getUserMedia resolves, then click the retry.
        await page.evaluate(() => {
            (window as unknown as { __micMode: 'grant' | 'deny' }).__micMode = 'grant';
        });
        await page.getByRole('button', { name: /Autoriser le microphone/i }).click();

        await page.waitForTimeout(500);

        const micCallsAfter = await page.evaluate(() => (window as unknown as { __micCalls: number }).__micCalls);
        expect(micCallsAfter).toBeGreaterThan(micCallsBefore);

        // Error bar should no longer show the mic message (either cleared or moved to a different pending state).
        await expect(page.getByText(/Autorisez l'acces au microphone/i)).toBeHidden({ timeout: 3000 });
    });
});

// End-to-end coverage of the token-expired (Meta code 190) error display
// is exercised at the unit level in:
//   - components/calls/call-error-messages.test.ts   (20 cases, incl. exact
//     Meta 401 payload → reconnect-whatsapp action)
//   - components/calls/call-error-action-button.test.tsx (UI rendering of the
//     Reconnecter WhatsApp link → /dashboard/settings?tab=channels)
//   - components/calls/fallback-reason.test.ts       (race-resolution: the
//     provider's fallback timer prefers the tracked terminationReason over a
//     generic error when a terminal status has already landed).
//
// A full Playwright reproduction would require either (a) seeded auth +
// conversations + a real WABA with a revoked token, or (b) a test-only hook
// into the Zustand store from page.evaluate(). Both add more friction than
// value beyond the 227-strong unit/integration suite.
