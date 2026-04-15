/**
 * One-time migration: encrypt existing plaintext tokens in wabas and organizations tables.
 * Run via Convex dashboard after deploying encryption code.
 */
import { internalMutation } from "../_generated/server";
import { encrypt } from "./encryption";

function isAlreadyEncrypted(value: string): boolean {
    if (!value.includes(":")) return false;
    const parts = value.split(":");
    if (parts.length !== 2) return false;
    try {
        atob(parts[0]);
        atob(parts[1]);
        return true;
    } catch {
        return false;
    }
}

export const migrateTokensToEncrypted = internalMutation({
    args: {},
    handler: async (ctx) => {
        let wabasMigrated = 0;
        let orgsMigrated = 0;

        // 1. Encrypt WABA tokens
        const wabas = await ctx.db.query("wabas").collect();
        for (const waba of wabas) {
            if (waba.accessTokenRef && !isAlreadyEncrypted(waba.accessTokenRef)) {
                const encrypted = await encrypt(waba.accessTokenRef);
                await ctx.db.patch(waba._id, { accessTokenRef: encrypted });
                wabasMigrated++;
            }
        }

        // 2. Encrypt org legacy tokens
        const orgs = await ctx.db.query("organizations").collect();
        for (const org of orgs) {
            if (org.whatsapp?.accessToken && !isAlreadyEncrypted(org.whatsapp.accessToken)) {
                const encrypted = await encrypt(org.whatsapp.accessToken);
                await ctx.db.patch(org._id, {
                    whatsapp: {
                        ...org.whatsapp,
                        accessToken: encrypted,
                    },
                });
                orgsMigrated++;
            }
        }

        console.log(`[ENCRYPTION MIGRATION] Migrated ${wabasMigrated} WABAs and ${orgsMigrated} organizations`);
        return { wabasMigrated, orgsMigrated };
    },
});
