'use client'

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ButtonGroup } from "@/components/ui/button-group";
import { User, Bell, Shield, Globe, Mail, Upload, Loader2, Save, Trash2, Smartphone, Briefcase } from 'lucide-react';
import { PhoneInput } from "@/components/contacts/PhoneInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
    const user = useQuery(api.users.me);
    const role = useQuery(api.users.currentUserRole);
    const updateProfile = useMutation(api.users.updateProfile);
    const deleteAccount = useMutation(api.users.deleteAccount);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);

    // Form States
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load
    if (user && !isEditing && (name === "" || phone === "")) {
        setName(user.name || "");
        setPhone(user.phone || "");
        setIsEditing(true); // Prevent re-setting
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    const handleUpdateProfile = async () => {
        try {
            setIsLoading(true);
            await updateProfile({ name, phone });
            toast.success("Profil mis à jour", {
                description: "Vos informations ont été enregistrées avec succès.",
            });
        } catch (error) {
            toast.error("Erreur", {
                description: "Impossible de mettre à jour le profil.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);

            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            // 3. Save storage ID to user profile
            await updateProfile({ imageStorageId: storageId });

            toast.success("Avatar mis à jour", {
                description: "Votre nouvelle photo de profil a été téléchargée.",
            });
        } catch (error) {
            console.error(error);
            toast.error("Erreur", {
                description: "L'upload de l'image a échoué.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            window.location.href = "/sign-in"; // Redirect to login
        } catch (error) {
            toast.error("Erreur", {
                description: "Impossible de supprimer le compte pour le moment.",
            });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Paramètres</h1>
                <p className="text-gray-500 mt-2">
                    Gérez les préférences de votre compte professionnel.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="account">Compte</TabsTrigger>
                    <TabsTrigger value="notifications">Notifs</TabsTrigger>
                    <TabsTrigger value="display">Affichage</TabsTrigger>
                </TabsList>

                {/* Profil Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profil Professionnel</CardTitle>
                            <CardDescription>
                                Ces informations sont visibles par votre équipe et vos administrateurs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-2 border-white shadow-lg ring-2 ring-gray-100">
                                        <AvatarImage src={user.image} alt={user.name} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        onClick={triggerFileInput}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Upload className="text-white h-6 w-6" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <h3 className="font-medium text-lg text-gray-900">Photo de profil</h3>
                                    <p className="text-sm text-gray-500 max-w-xs">
                                        JPG, GIF ou PNG. 1MB max.<br />
                                        Utilisez une photo professionnelle.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={triggerFileInput} disabled={isUploading}>
                                        {isUploading ? "Upload en cours..." : "Changer la photo"}
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Info Fields */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom complet</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Votre nom complet"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email professionnel</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                                            <Mail className="h-4 w-4" />
                                        </span>
                                        <Input
                                            id="email"
                                            defaultValue={user.email}
                                            disabled
                                            className="rounded-l-none bg-gray-50/50 text-gray-600"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400">Pour changer votre email, contactez votre administrateur.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <PhoneInput
                                        id="phone"
                                        value={phone}
                                        onChange={(val) => setPhone(val)}
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Rôle / Fonction</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                                            <Briefcase className="h-4 w-4" />
                                        </span>
                                        <Input
                                            id="role"
                                            defaultValue={role || "Membre"}
                                            disabled
                                            className="rounded-l-none bg-gray-50/50 text-gray-600 capitalize"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end bg-gray-50/50 border-t p-4">
                            <ButtonGroup>
                                <Button variant="outline" onClick={() => { setName(user.name || ""); setPhone(user.phone || ""); }}>Annuler</Button>
                                <Button onClick={handleUpdateProfile} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enregistrer
                                </Button>
                            </ButtonGroup>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Compte Tab */}
                <TabsContent value="account" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sécurité & Connexion</CardTitle>
                            <CardDescription>
                                Gérez vos identifiants de connexion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/30 transition-colors hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-full border shadow-sm">
                                        <Shield className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Mot de passe</p>
                                        <p className="text-sm text-gray-500">Dernière modification il y a 3 mois</p>
                                    </div>
                                </div>
                                <Button variant="outline">Modifier le mot de passe</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100">
                        <CardHeader>
                            <CardTitle className="text-red-600">Suppression du compte</CardTitle>
                            <CardDescription>
                                Cette action est irréversible. Toutes vos données personnelles seront effacées.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <div className="flex items-center justify-between border border-red-100 rounded-lg p-4 bg-red-50/30 cursor-pointer hover:bg-red-50 transition-colors">
                                        <div>
                                            <p className="font-medium text-red-900">Supprimer mon compte</p>
                                            <p className="text-sm text-red-700/70">Je veux quitter définitivement l'organisation.</p>
                                        </div>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action ne peut pas être annulée. Cela supprimera définitivement votre compte,
                                            vos préférences et vous retirera de cette organisation.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                                            Oui, supprimer mon compte
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Préférences de notification</CardTitle>
                            <CardDescription>
                                Contrôlez quand et comment vous êtes notifié.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="new-messages" className="flex flex-col space-y-1">
                                    <span className="font-medium">Nouveaux messages assignés</span>
                                    <span className="font-normal text-xs text-muted-foreground">Recevoir une notification push / email lorsqu'une nouvelle conversation m'est assignée.</span>
                                </Label>
                                <Switch id="new-messages" defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="mentions" className="flex flex-col space-y-1">
                                    <span className="font-medium">Mentions & Commentaires</span>
                                    <span className="font-normal text-xs text-muted-foreground">Être notifié quand un membre de l'équipe me mentionne dans une note interne.</span>
                                </Label>
                                <Switch id="mentions" defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2 opacity-50">
                                <Label htmlFor="security-alerts" className="flex flex-col space-y-1">
                                    <span className="font-medium">Alertes système critique</span>
                                    <span className="font-normal text-xs text-muted-foreground">Ces notifications sont obligatoires pour la sécurité de votre compte.</span>
                                </Label>
                                <Switch id="security-alerts" defaultChecked disabled />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end bg-gray-50/50 border-t p-4">
                            <Button className="bg-green-600 hover:bg-green-700">Enregistrer les préférences</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Affichage Tab */}
                <TabsContent value="display" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interface & Apparence</CardTitle>
                            <CardDescription>
                                Personnalisez votre environnement de travail.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Thème</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-20 w-32 rounded-lg bg-gray-100 border-2 border-gray-900 shadow-sm cursor-pointer p-2 flex items-center justify-center relative overflow-hidden">
                                            <div className="space-y-1 w-full p-2 bg-white rounded shadow-sm h-full border border-gray-200 z-10 relative">
                                                <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                                                <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                                            </div>
                                            <div className="absolute top-2 right-2 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium">Clair</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                                        <div className="h-20 w-32 rounded-lg bg-gray-900 border border-gray-700 shadow-sm p-2 flex items-center justify-center">
                                            <div className="space-y-1 w-full p-2 bg-gray-800 rounded shadow-sm h-full border border-gray-700">
                                                <div className="h-2 w-1/2 bg-gray-600 rounded"></div>
                                                <div className="h-2 w-3/4 bg-gray-600 rounded"></div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium">Sombre (Bientôt)</span>
                                    </div>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2">
                                <Label>Langue de l'interface</Label>
                                <div className="flex items-center justify-between p-3 border rounded-lg max-w-sm bg-white">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-900 font-medium">Français</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">Défaut</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Check({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
