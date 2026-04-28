import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/link so the dispatcher button renders a plain <a> we can assert on.
vi.mock('next/link', () => ({
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
        <a href={href} {...rest}>{children}</a>
    ),
}));

// Mock convex/react so CallErrorActionButton's useMutation import does not
// attempt a real network round-trip during the test.
vi.mock('convex/react', () => ({
    useMutation: () => vi.fn(),
}));

vi.mock('@/convex/_generated/api', () => ({
    api: { calls: { requestOutboundCall: 'calls:requestOutboundCall' } },
}));

// Mock the WebRTC hook — only `initiateCall` is read by the retry branch.
vi.mock('@/hooks/use-webrtc-call', () => ({
    useWebRTCCall: () => ({ initiateCall: vi.fn() }),
}));

// Mock the mic-permission child to a trivial placeholder: we don't need to
// exercise its internal mic retry logic in this test.
vi.mock('./mic-permission-button', () => ({
    MicPermissionButton: () => <button>Autoriser le microphone</button>,
}));

import { CallErrorActionButton } from './call-error-action-button';
import { useCallStore } from '@/lib/stores/call-store';
import { mapCallError } from './call-error-messages';

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    // Reset the Zustand store before each test so state does not leak between
    // assertions. setState with `true` replaces the whole state.
    useCallStore.setState({
        activeCallId: null,
        callState: 'idle',
        contactName: null,
        contactPhone: null,
        callDirection: 'INBOUND',
        callStartedAt: null,
        isMuted: false,
        conversationId: null,
        errorMessage: null,
        errorAction: null,
        micStream: null,
    });
});

describe('CallErrorActionButton — contextual fix-it buttons', () => {
    it('renders "Reconnecter WhatsApp" link for reconnect-whatsapp action', () => {
        // Simulate the exact state produced by the provider when the backend
        // reports "CPR failed: 401 - code 190" (expired WhatsApp token).
        const mapped = mapCallError(
            'CPR failed: 401 - {"error":{"message":"Authentication Error","code":190,"type":"OAuthException","fbtrace_id":"Ab12Cd"}}',
        );

        // Sanity check — if this ever fails, the mapping regressed and the
        // whole downstream UI will too.
        expect(mapped.action).toEqual({ type: 'reconnect-whatsapp' });

        useCallStore.setState({
            callState: 'error',
            errorMessage: mapped.message,
            errorAction: mapped.action ?? null,
        });

        render(<CallErrorActionButton />);

        const link = screen.getByRole('link', { name: /Reconnecter WhatsApp/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/dashboard/settings?tab=channels');
    });

    it('renders nothing when there is no errorAction', () => {
        useCallStore.setState({
            callState: 'error',
            errorMessage: 'Some error',
            errorAction: null,
        });

        const { container } = render(<CallErrorActionButton />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the mic permission button for action type "mic"', () => {
        useCallStore.setState({
            callState: 'error',
            errorMessage: "Autorisez l'acces au microphone pour passer des appels.",
            errorAction: { type: 'mic' },
        });

        render(<CallErrorActionButton />);

        expect(
            screen.getByRole('button', { name: /Autoriser le microphone/i }),
        ).toBeInTheDocument();
    });

    it('renders an external link for action type "external"', () => {
        useCallStore.setState({
            callState: 'error',
            errorMessage: 'Probleme de facturation WhatsApp.',
            errorAction: {
                type: 'external',
                href: 'https://business.facebook.com/',
                label: 'Ouvrir Meta Business',
            },
        });

        render(<CallErrorActionButton />);

        const link = screen.getByRole('link', { name: /Ouvrir Meta Business/i });
        expect(link).toHaveAttribute('href', 'https://business.facebook.com/');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('renders a signin link for action type "signin"', () => {
        useCallStore.setState({
            callState: 'error',
            errorMessage: 'Votre session a expire. Reconnectez-vous.',
            errorAction: { type: 'signin' },
        });

        render(<CallErrorActionButton />);

        const link = screen.getByRole('link', { name: /Se reconnecter/i });
        expect(link).toHaveAttribute('href', '/auth/sign-in');
    });

    it('renders a send-template link for action type "send-template"', () => {
        useCallStore.setState({
            callState: 'error',
            errorMessage: 'Ce contact doit vous avoir ecrit dans les dernieres 24 heures.',
            errorAction: { type: 'send-template' },
            // @ts-expect-error — Id type is opaque, ok for test fixture
            conversationId: 'kconv_test_id',
        });

        render(<CallErrorActionButton />);

        const link = screen.getByRole('link', { name: /Envoyer un modele/i });
        expect(link.getAttribute('href')).toContain('kconv_test_id');
        expect(link.getAttribute('href')).toContain('openTemplates=1');
    });
});
