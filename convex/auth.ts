import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [
        Google,
        Password({
            validatePasswordRequirements: (password: string) => {
                if (password.length < 8) {
                    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
                }
            },
        }),
    ],
});
