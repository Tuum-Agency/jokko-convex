import { query, mutation } from "./_generated/server";

/**
 * Diagnostic: Voir l'utilisateur actuellement authentifié
 */
export const whoAmI = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return { authenticated: false };
        }

        // Chercher l'utilisateur dans la DB
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email!))
            .first();

        return {
            authenticated: true,
            email: identity.email,
            name: identity.name,
            userExistsInDB: !!user,
            userId: user?._id,
        };
    },
});

/**
 * Créer l'utilisateur manquant
 */
export const createMissingUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity || !identity.email) {
            throw new Error("Non authentifié");
        }

        // Vérifier si existe déjà
        const existing = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", identity.email!))
            .first();

        if (existing) {
            return {
                success: true,
                message: "L'utilisateur existe déjà",
                userId: existing._id,
            };
        }

        // Créer l'utilisateur
        const userId = await ctx.db.insert("users", {
            email: identity.email,
            name: identity.name || identity.email.split("@")[0],
            image: identity.pictureUrl,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return {
            success: true,
            message: "Utilisateur créé avec succès",
            userId,
        };
    },
});
