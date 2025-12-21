"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WaitingListDialogProps {
    children: React.ReactNode;
}

export function WaitingListDialog({ children }: WaitingListDialogProps) {
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [representativeName, setRepresentativeName] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const joinWaitingList = useMutation(api.waitingList.join);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            const result = await joinWaitingList({ email, companyName, representativeName });
            toast.success(result.message);
            setIsOpen(false);
            setEmail("");
            setCompanyName("");
            setRepresentativeName("");

        } catch (error) {
            toast.error("Une erreur est survenue. Veuillez réessayer.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rejoindre la liste d'attente</DialogTitle>
                    <DialogDescription>
                        Inscrivez-vous pour obtenir un accès prioritaire dès le lancement.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Nom de la société"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                placeholder="Nom du représentant"
                                value={representativeName}
                                onChange={(e) => setRepresentativeName(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Inscription...
                            </>
                        ) : (
                            "Rejoindre la liste"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
