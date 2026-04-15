import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [
        Google,
        Password({
            profile(params) {
                return {
                    email: params.email as string,
                    name: params.name as string,
                    emailVerified: params.emailVerificationTime as string,
                };
            },
            validatePasswordRequirements: (password: string) => {
                if (password.length < 10) {
                    throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
                }
                if (!/[A-Z]/.test(password)) {
                    throw new Error("Le mot de passe doit contenir au moins une majuscule.");
                }
                if (!/[a-z]/.test(password)) {
                    throw new Error("Le mot de passe doit contenir au moins une minuscule.");
                }
                if (!/[0-9]/.test(password)) {
                    throw new Error("Le mot de passe doit contenir au moins un chiffre.");
                }
            },
        }),
    ],
});
