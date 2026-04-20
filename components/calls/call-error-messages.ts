/**
 * Maps backend `terminationReason` strings and browser WebRTC errors into
 * user-friendly French messages AND an optional "fix-it" action that renders
 * a contextual button in the error bar.
 *
 * Reference — Meta error codes encountered in practice:
 *   - 190             : OAuth token expired / invalid / unparseable (needs reconnect)
 *   - 131047 / 131050 : out of 24h messaging window (re-engagement required)
 *   - 131044          : billing issue
 *   - 131051          : unsupported message type
 *   - 131056          : pair rate limit
 *   - 138007          : no call capacity
 *   - 10 / 200        : permission / scope missing
 *   - 4  / 17 / 32    : application-level rate limit
 *   - 368             : account restriction / violation
 *
 * Order matters: most specific matches first, generic fallback last.
 */

export type CallErrorAction =
    /** Re-prompt the browser for microphone access */
    | { type: "mic" }
    /** Redirect the user to Parametres > Canaux to reconnect WhatsApp */
    | { type: "reconnect-whatsapp" }
    /** Retry the call (clears the error and lets the user click Appeler again) */
    | { type: "retry" }
    /** Session expired — redirect to sign-in */
    | { type: "signin" }
    /** Re-engagement: prompt the user to send a template message in this conversation */
    | { type: "send-template" }
    /** External link (e.g. Meta Business Manager) */
    | { type: "external"; href: string; label: string };

export interface CallErrorMessage {
    message: string;
    action?: CallErrorAction;
}

const RECONNECT_WHATSAPP: CallErrorAction = { type: "reconnect-whatsapp" };
const RETRY: CallErrorAction = { type: "retry" };
const MIC: CallErrorAction = { type: "mic" };
const SIGNIN: CallErrorAction = { type: "signin" };
const SEND_TEMPLATE: CallErrorAction = { type: "send-template" };
const META_BUSINESS: CallErrorAction = {
    type: "external",
    href: "https://business.facebook.com/",
    label: "Ouvrir Meta Business",
};

export function mapCallError(reason: string | undefined | null): CallErrorMessage {
    if (typeof window !== "undefined") {
        console.warn("[mapCallError] raw reason:", reason);
    }

    if (!reason) {
        return {
            message: "L'appel a echoue. Reessayez plus tard.",
            action: RETRY,
        };
    }

    const r = reason.toLowerCase();

    // --- Browser / WebRTC errors (very specific signatures) ---
    if (r.includes("notallowederror") || r.includes("permission dismissed")) {
        return {
            message: "Autorisez l'acces au microphone pour passer des appels.",
            action: MIC,
        };
    }
    if (r.includes("notfounderror") || r.includes("no audio device") || r.includes("devicenotfound")) {
        return {
            message: "Aucun microphone detecte sur cet appareil.",
        };
    }
    if (r.includes("notreadableerror") || r.includes("trackstarterror")) {
        return {
            message: "Votre microphone est deja utilise par une autre application.",
            action: RETRY,
        };
    }
    if (r.includes("overconstrainederror")) {
        return {
            message: "Microphone incompatible. Essayez un autre peripherique audio.",
        };
    }

    // --- Convex mutation guardrails ---
    if (r.includes("cannot start call") || r.includes("expected permission_granted")) {
        return {
            message: "L'appel n'est plus disponible. Recommencez depuis le bouton Appeler.",
            action: RETRY,
        };
    }
    if (r.includes("contact has no phone")) {
        return { message: "Ce contact n'a pas de numero de telephone valide." };
    }
    if (r.includes("not authenticated")) {
        return {
            message: "Votre session a expire. Reconnectez-vous.",
            action: SIGNIN,
        };
    }

    // --- Meta OAuth token / credentials problems ---
    if (
        r.includes("\"code\":190") ||
        r.includes("(#190)") ||
        r.includes("oauthexception") ||
        r.includes("invalid oauth") ||
        r.includes("cannot parse access token") ||
        r.includes("access token has expired") ||
        r.includes("session has expired") ||
        r.includes("access token is invalid")
    ) {
        return {
            message: "Votre connexion WhatsApp a expire. Reconnectez votre compte WhatsApp Business.",
            action: RECONNECT_WHATSAPP,
        };
    }
    if (r.includes("missing whatsapp credentials") || r.includes("credentials")) {
        return {
            message: "Configuration WhatsApp incomplete. Connectez votre compte WhatsApp Business.",
            action: RECONNECT_WHATSAPP,
        };
    }
    if (r.includes("\"code\":10") || r.includes("(#10)") || r.includes("permission scope")) {
        return {
            message: "Permissions WhatsApp manquantes. Reauthentifiez votre compte WhatsApp Business.",
            action: RECONNECT_WHATSAPP,
        };
    }
    if (r.includes("\"code\":200") || r.includes("(#200)")) {
        return {
            message: "Permissions insuffisantes. Reconnectez votre compte WhatsApp Business.",
            action: RECONNECT_WHATSAPP,
        };
    }

    // --- Calling feature not enabled on the phone number ---
    if (
        r.includes("calling is not enabled") ||
        r.includes("calling_not_enabled") ||
        r.includes("calling is disabled")
    ) {
        return {
            message: "Les appels ne sont pas actives sur ce numero. Activez-les dans Parametres > Canaux.",
            action: RECONNECT_WHATSAPP,
        };
    }

    // --- 24h messaging window (CPR must be within active conversation) ---
    if (
        r.includes("131047") ||
        r.includes("131050") ||
        r.includes("re-engagement") ||
        r.includes("reengagement") ||
        r.includes("24 hour") ||
        r.includes("24-hour") ||
        r.includes("messaging window") ||
        r.includes("message was sent to a recipient who has not opted in") ||
        r.includes("outside of the allowed window")
    ) {
        return {
            message:
                "Ce contact doit vous avoir ecrit dans les dernieres 24 heures. Envoyez-lui un modele pour reouvrir la conversation.",
            action: SEND_TEMPLATE,
        };
    }

    // --- Billing / payment ---
    if (r.includes("131044") || r.includes("(#131044)") || r.includes("payment") || r.includes("billing")) {
        return {
            message: "Probleme de facturation WhatsApp. Verifiez les paiements dans Meta Business Manager.",
            action: META_BUSINESS,
        };
    }

    // --- Rate limiting ---
    if (
        r.includes("131056") ||
        r.includes("rate limit") ||
        r.includes("is_transient") ||
        r.includes("throttl") ||
        r.includes("(#4)") ||
        r.includes("(#17)") ||
        r.includes("(#32)") ||
        r.includes("too many requests")
    ) {
        return {
            message: "Limite d'appels atteinte. Reessayez dans quelques minutes.",
            action: RETRY,
        };
    }

    // --- No call capacity ---
    if (r.includes("138007") || r.includes("call capacity")) {
        return {
            message: "Capacite d'appels atteinte cote WhatsApp. Reessayez plus tard.",
            action: RETRY,
        };
    }

    // --- Account restriction / policy violation ---
    if (r.includes("368") || r.includes("account restricted") || r.includes("policy violation")) {
        return {
            message: "Votre compte WhatsApp Business est restreint. Consultez Meta Business Manager.",
            action: META_BUSINESS,
        };
    }

    // --- Unsupported message type ---
    if (r.includes("131051") || r.includes("unsupported message type")) {
        return {
            message: "Les appels ne sont pas disponibles pour ce contact (type de message non supporte).",
        };
    }

    // --- CPR already sent (1/24h per contact, 2/7j max) ---
    if (
        (r.includes("already") && r.includes("permission")) ||
        r.includes("one permission request") ||
        r.includes("permission request limit")
    ) {
        return {
            message: "Une demande d'appel a deja ete envoyee. Attendez sa reponse (max 1 par 24h).",
        };
    }

    // --- Permission denied/rejected by the contact ---
    if (r.includes("call_permission_request_rejected") || r.includes("permission_denied")) {
        return { message: "Ce contact a refuse votre demande d'appel." };
    }

    // --- Internal expiry labels we store in terminationReason ---
    if (r.includes("permission_expired")) {
        return {
            message: "La permission d'appel a expire (plus de 72 heures). Envoyez une nouvelle demande.",
            action: RETRY,
        };
    }
    if (r.includes("cpr_expired")) {
        return {
            message: "Ce contact n'a pas repondu a votre demande d'appel dans les 24 heures.",
            action: RETRY,
        };
    }

    // --- Blocked country (USA, Canada, Egypt, Vietnam, Nigeria, Turkey) ---
    if (
        r.includes("not supported in this country") ||
        r.includes("country not supported") ||
        r.includes("region not supported")
    ) {
        return { message: "Les appels ne sont pas disponibles dans le pays de ce contact." };
    }

    // --- Generic fallback — keep the raw reason for debugging ---
    const truncated = reason.length > 160 ? reason.slice(0, 160) + "..." : reason;
    return {
        message: `L'appel a echoue : ${truncated}`,
        action: RETRY,
    };
}

/** Backwards-compatible string-only mapper (message field only). */
export function mapCallErrorMessage(reason: string | undefined | null): string {
    return mapCallError(reason).message;
}
