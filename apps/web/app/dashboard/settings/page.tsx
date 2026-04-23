'use client'

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    User,
    Bell,
    Shield,
    Globe,
    Mail,
    Upload,
    Loader2,
    Save,
    Trash2,
    Briefcase,
    MessageSquare,
    AlertCircle,
    Phone,
    Hash,
    Check,
    Palette,
    Building2,
    Clock,
    Bot,
    Zap,
    MapPin,
    Link,
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChannelsSettings } from '@/components/settings/ChannelsSettings';
import { useCurrentOrg } from "@/hooks/use-current-org";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PhoneInput } from "@/components/contacts/PhoneInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
        setIsEditing(true);
    }

    if (!user) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-full max-w-[700px] bg-gray-100 rounded-lg animate-pulse" />
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="h-24 w-24 rounded-full bg-gray-100 animate-pulse mx-auto sm:mx-0" />
                            <div className="grid gap-4 md:grid-cols-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
        } catch {
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
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
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
            window.location.href = "/sign-in";
        } catch {
            toast.error("Erreur", {
                description: "Impossible de supprimer le compte pour le moment.",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* ==================== HEADER ==================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Paramètres
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Gérez les préférences de votre compte professionnel.
                    </p>
                </div>
            </div>

            {/* ==================== TABS ==================== */}
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="flex w-full overflow-x-auto no-scrollbar lg:grid lg:grid-cols-6 lg:w-[650px]">
                    <TabsTrigger value="profile" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <User className="h-3.5 w-3.5" />
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <Building2 className="h-3.5 w-3.5" />
                        Organisation
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <MessageSquare className="h-3.5 w-3.5" />
                        WhatsApp
                    </TabsTrigger>
                    <TabsTrigger value="account" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <Shield className="h-3.5 w-3.5" />
                        Compte
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <Bell className="h-3.5 w-3.5" />
                        Notifs
                    </TabsTrigger>
                    <TabsTrigger value="display" className="shrink-0 gap-1.5 text-xs cursor-pointer">
                        <Palette className="h-3.5 w-3.5" />
                        Affichage
                    </TabsTrigger>
                </TabsList>

                {/* ==================== PROFIL TAB ==================== */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                            Profil Professionnel
                                        </CardTitle>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Informations visibles par votre équipe
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <div className="relative group">
                                    <Avatar className="h-20 w-20 border-2 border-white shadow-lg ring-2 ring-gray-100">
                                        <AvatarImage src={user.image} alt={user.name} className="object-cover" />
                                        <AvatarFallback className="text-xl bg-gradient-to-br from-[#14532d] to-[#059669] text-white font-semibold">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        onClick={triggerFileInput}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Upload className="text-white h-5 w-5" />
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
                                            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5 text-center sm:text-left">
                                    <h3 className="text-sm font-semibold text-gray-900">Photo de profil</h3>
                                    <p className="text-[11px] text-gray-400">
                                        JPG, GIF ou PNG. 1MB max.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs rounded-full cursor-pointer mt-1"
                                        onClick={triggerFileInput}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Upload en cours..." : "Changer la photo"}
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-gray-100" />

                            {/* Info Fields */}
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-medium text-gray-500">Nom complet</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Votre nom complet"
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-medium text-gray-500">Email professionnel</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-400">
                                            <Mail className="h-3.5 w-3.5" />
                                        </span>
                                        <Input
                                            id="email"
                                            defaultValue={user.email}
                                            disabled
                                            className="rounded-l-none bg-gray-50/50 text-gray-500 h-9 text-sm"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400">Pour changer votre email, contactez votre administrateur.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-medium text-gray-500">Téléphone</Label>
                                    <PhoneInput
                                        id="phone"
                                        value={phone}
                                        onChange={(val) => setPhone(val)}
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="role" className="text-xs font-medium text-gray-500">Rôle / Fonction</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-400">
                                            <Briefcase className="h-3.5 w-3.5" />
                                        </span>
                                        <Input
                                            id="role"
                                            defaultValue={role || "Membre"}
                                            disabled
                                            className="rounded-l-none bg-gray-50/50 text-gray-500 capitalize h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                            <ButtonGroup>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs rounded-full cursor-pointer"
                                    onClick={() => { setName(user.name || ""); setPhone(user.phone || ""); }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                                    onClick={handleUpdateProfile}
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                    Enregistrer
                                </Button>
                            </ButtonGroup>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* ==================== ORGANISATION TAB ==================== */}
                <TabsContent value="organization" className="space-y-6">
                    <OrganizationSettingsTab />
                </TabsContent>

                {/* ==================== WHATSAPP TAB ==================== */}
                <TabsContent value="whatsapp" className="space-y-6">
                    <ChannelsSettings />
                </TabsContent>

                {/* ==================== COMPTE TAB ==================== */}
                <TabsContent value="account" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#166534] to-[#0d9488] flex items-center justify-center shadow-sm">
                                    <Shield className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Sécurité & Connexion
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Gérez vos identifiants de connexion
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
                                        <Shield className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Mot de passe</p>
                                        <p className="text-[11px] text-gray-400">Dernière modification il y a 3 mois</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="h-8 text-xs rounded-full cursor-pointer w-full sm:w-auto shrink-0">
                                    Modifier le mot de passe
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-red-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center shadow-sm">
                                    <Trash2 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-red-700">
                                        Suppression du compte
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Cette action est irréversible
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-red-100 rounded-xl p-4 bg-red-50/30 cursor-pointer hover:bg-red-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-red-900">Supprimer mon compte</p>
                                            <p className="text-[11px] text-red-600/70">Toutes vos données personnelles seront effacées.</p>
                                        </div>
                                        <Button variant="destructive" size="sm" className="h-8 text-xs rounded-full w-full sm:w-auto shrink-0 cursor-pointer">
                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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

                {/* ==================== NOTIFICATIONS TAB ==================== */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#15803d] to-[#10b981] flex items-center justify-center shadow-sm">
                                    <Bell className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Préférences de notification
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Contrôlez quand et comment vous êtes notifié
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-0 pt-4">
                            {[
                                {
                                    id: "new-messages",
                                    title: "Nouveaux messages assignés",
                                    description: "Recevoir une notification push / email lorsqu’une nouvelle conversation m’est assignée.",
                                    enabled: true,
                                    disabled: false,
                                },
                                {
                                    id: "mentions",
                                    title: "Mentions & Commentaires",
                                    description: "Être notifié quand un membre de l’équipe me mentionne dans une note interne.",
                                    enabled: true,
                                    disabled: false,
                                },
                                {
                                    id: "security-alerts",
                                    title: "Alertes système critique",
                                    description: "Ces notifications sont obligatoires pour la sécurité de votre compte.",
                                    enabled: true,
                                    disabled: true,
                                },
                            ].map((notif, index) => (
                                <div key={notif.id}>
                                    {index > 0 && <Separator className="bg-gray-100" />}
                                    <div className={cn(
                                        "flex items-center justify-between gap-4 py-4",
                                        notif.disabled && "opacity-50"
                                    )}>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{notif.description}</p>
                                        </div>
                                        <Switch id={notif.id} defaultChecked={notif.enabled} disabled={notif.disabled} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                            <Button
                                size="sm"
                                className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                            >
                                Enregistrer les préférences
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* ==================== AFFICHAGE TAB ==================== */}
                <TabsContent value="display" className="space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#34d399] flex items-center justify-center shadow-sm">
                                    <Palette className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                        Interface & Apparence
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Personnalisez votre environnement de travail
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-500">Thème</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-20 w-32 rounded-xl bg-gray-50 border-2 border-gray-900 shadow-sm cursor-pointer p-2 flex items-center justify-center relative overflow-hidden">
                                            <div className="space-y-1 w-full p-2 bg-white rounded-lg shadow-sm h-full border border-gray-200 z-10 relative">
                                                <div className="h-2 w-1/2 bg-gray-200 rounded-full" />
                                                <div className="h-2 w-3/4 bg-gray-200 rounded-full" />
                                            </div>
                                            <div className="absolute top-2 right-2 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                                                <Check className="h-2.5 w-2.5 text-white" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-900">Clair</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 opacity-40 cursor-not-allowed">
                                        <div className="h-20 w-32 rounded-xl bg-gray-900 border border-gray-700 shadow-sm p-2 flex items-center justify-center">
                                            <div className="space-y-1 w-full p-2 bg-gray-800 rounded-lg shadow-sm h-full border border-gray-700">
                                                <div className="h-2 w-1/2 bg-gray-600 rounded-full" />
                                                <div className="h-2 w-3/4 bg-gray-600 rounded-full" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Sombre (Bientôt)</span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-gray-100" />

                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-500">Langue de l&apos;interface</Label>
                                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl max-w-sm bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 font-medium">Français</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-medium">
                                        Défaut
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ============================================
// ORGANISATION SETTINGS TAB
// ============================================

const TIMEZONES = [
    { value: "Africa/Dakar", label: "Dakar (GMT+0)" },
    { value: "Africa/Abidjan", label: "Abidjan (GMT+0)" },
    { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
    { value: "Africa/Douala", label: "Douala (GMT+1)" },
    { value: "Africa/Casablanca", label: "Casablanca (GMT+1)" },
    { value: "Europe/Paris", label: "Paris (GMT+1)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (GMT+2)" },
    { value: "Africa/Nairobi", label: "Nairobi (GMT+3)" },
    { value: "Europe/London", label: "Londres (GMT+0)" },
    { value: "America/New_York", label: "New York (GMT-5)" },
];

const DAYS = [
    { key: "monday", label: "Lundi" },
    { key: "tuesday", label: "Mardi" },
    { key: "wednesday", label: "Mercredi" },
    { key: "thursday", label: "Jeudi" },
    { key: "friday", label: "Vendredi" },
    { key: "saturday", label: "Samedi" },
    { key: "sunday", label: "Dimanche" },
];

const DEFAULT_BUSINESS_HOURS: Record<string, { enabled: boolean; open: string; close: string }> = {
    monday: { enabled: true, open: "08:00", close: "18:00" },
    tuesday: { enabled: true, open: "08:00", close: "18:00" },
    wednesday: { enabled: true, open: "08:00", close: "18:00" },
    thursday: { enabled: true, open: "08:00", close: "18:00" },
    friday: { enabled: true, open: "08:00", close: "18:00" },
    saturday: { enabled: false, open: "09:00", close: "13:00" },
    sunday: { enabled: false, open: "09:00", close: "13:00" },
};

function OrganizationSettingsTab() {
    const orgSettings = useQuery(api.organizations.getOrgSettings);
    const updateOrg = useMutation(api.organizations.updateOrganization);
    const updateSettings = useMutation(api.organizations.updateOrgSettings);
    const assignmentSettings = useQuery(api.assignments.getAssignmentSettings);
    const updateAssignment = useMutation(api.assignments.updateAssignmentSettings);

    // Org profile state
    const [orgName, setOrgName] = useState("");
    const [sector, setSector] = useState("");
    const [website, setWebsite] = useState("");
    const [orgPhone, setOrgPhone] = useState("");
    const [address, setAddress] = useState("");
    const [timezone, setTimezone] = useState("");
    const [orgInitialized, setOrgInitialized] = useState(false);

    // Auto-reply state
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [autoReplyMessage, setAutoReplyMessage] = useState("");
    const [autoReplyInitialized, setAutoReplyInitialized] = useState(false);

    // Business hours state
    const [businessHours, setBusinessHours] = useState(DEFAULT_BUSINESS_HOURS);
    const [hoursInitialized, setHoursInitialized] = useState(false);

    // Assignment state
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
    const [maxConcurrentChats, setMaxConcurrentChats] = useState(5);
    const [excludeOfflineAgents, setExcludeOfflineAgents] = useState(true);
    const [assignmentInitialized, setAssignmentInitialized] = useState(false);

    // Loading states
    const [savingOrg, setSavingOrg] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingAssignment, setSavingAssignment] = useState(false);

    // Initialize org profile
    if (orgSettings && !orgInitialized) {
        setOrgName(orgSettings.name || "");
        setSector(orgSettings.businessSector || "");
        setWebsite(orgSettings.website || "");
        setOrgPhone(orgSettings.phone || "");
        setAddress(orgSettings.address || "");
        setTimezone(orgSettings.timezone || "Africa/Dakar");
        setOrgInitialized(true);
    }

    // Initialize auto-reply
    if (orgSettings?.settings && !autoReplyInitialized) {
        setAutoReplyEnabled(orgSettings.settings.autoReplyEnabled || false);
        setAutoReplyMessage(orgSettings.settings.autoReplyMessage || "Merci pour votre message. Un agent vous répondra dans les plus brefs délais.");
        setAutoReplyInitialized(true);
    }

    // Initialize business hours
    if (orgSettings?.settings && !hoursInitialized) {
        if (orgSettings.settings.businessHours) {
            const bh = orgSettings.settings.businessHours as any;
            if (bh?.schedule) {
                // New format: convert schedule array to Record
                const converted = { ...DEFAULT_BUSINESS_HOURS };
                for (const item of bh.schedule) {
                    if (item.day && converted[item.day]) {
                        converted[item.day] = {
                            enabled: item.enabled ?? false,
                            open: item.start || "08:00",
                            close: item.end || "18:00",
                        };
                    }
                }
                setBusinessHours(converted);
            } else {
                // Legacy format: direct Record
                setBusinessHours({ ...DEFAULT_BUSINESS_HOURS, ...bh });
            }
        }
        setHoursInitialized(true);
    }

    // Initialize assignment
    if (assignmentSettings && !assignmentInitialized) {
        setAutoAssignEnabled(assignmentSettings.autoAssignEnabled ?? true);
        setMaxConcurrentChats(assignmentSettings.maxConcurrentChats ?? 5);
        setExcludeOfflineAgents(assignmentSettings.excludeOfflineAgents ?? true);
        setAssignmentInitialized(true);
    }

    const handleSaveOrg = async () => {
        try {
            setSavingOrg(true);
            await updateOrg({
                name: orgName,
                businessSector: sector,
                website: website || undefined,
                phone: orgPhone || undefined,
                address: address || undefined,
                timezone,
            });
            toast.success("Organisation mise à jour", {
                description: "Les informations de votre organisation ont été enregistrées.",
            });
        } catch {
            toast.error("Erreur", { description: "Impossible de mettre à jour l'organisation." });
        } finally {
            setSavingOrg(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            await updateSettings({
                autoReplyEnabled,
                autoReplyMessage,
                businessHours: {
                    enabled: Object.values(businessHours).some(d => d.enabled),
                    schedule: Object.entries(businessHours).map(([day, cfg]) => ({
                        day,
                        enabled: cfg.enabled,
                        start: cfg.open,
                        end: cfg.close,
                    })),
                },
            });
            toast.success("Paramètres mis à jour", {
                description: "Les paramètres de réponse automatique et horaires ont été enregistrés.",
            });
        } catch {
            toast.error("Erreur", { description: "Impossible de mettre à jour les paramètres." });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveAssignment = async () => {
        try {
            setSavingAssignment(true);
            await updateAssignment({
                autoAssignEnabled,
                maxConcurrentChats,
                excludeOfflineAgents,
            });
            toast.success("Attribution mise à jour", {
                description: "Les règles d'attribution automatique ont été enregistrées.",
            });
        } catch {
            toast.error("Erreur", { description: "Impossible de mettre à jour les règles d'attribution." });
        } finally {
            setSavingAssignment(false);
        }
    };

    const updateDayHours = (day: string, field: string, value: any) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    if (!orgSettings) {
        return (
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* ---- PROFIL DE L'ORGANISATION ---- */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                            <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Profil de l'organisation
                            </CardTitle>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Informations générales de votre entreprise
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="org-name" className="text-xs font-medium text-gray-500">Nom de l'organisation</Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-400">
                                    <Building2 className="h-3.5 w-3.5" />
                                </span>
                                <Input
                                    id="org-name"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Nom de votre entreprise"
                                    className="rounded-l-none h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="org-sector" className="text-xs font-medium text-gray-500">Secteur d'activité</Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-400">
                                    <Briefcase className="h-3.5 w-3.5" />
                                </span>
                                <Input
                                    id="org-sector"
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                    placeholder="Ex: E-commerce, Santé, Éducation..."
                                    className="rounded-l-none h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="org-website" className="text-xs font-medium text-gray-500">Site web</Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-400">
                                    <Link className="h-3.5 w-3.5" />
                                </span>
                                <Input
                                    id="org-website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://votresite.com"
                                    className="rounded-l-none h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="org-phone" className="text-xs font-medium text-gray-500">Téléphone</Label>
                            <PhoneInput
                                id="org-phone"
                                value={orgPhone}
                                onChange={(val) => setOrgPhone(val)}
                                placeholder="+221 77 123 45 67"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="org-address" className="text-xs font-medium text-gray-500">Adresse</Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-400">
                                    <MapPin className="h-3.5 w-3.5" />
                                </span>
                                <Input
                                    id="org-address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Adresse de votre entreprise"
                                    className="rounded-l-none h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="org-timezone" className="text-xs font-medium text-gray-500">Fuseau horaire</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map((tz) => (
                                        <SelectItem key={tz.value} value={tz.value} className="text-sm">
                                            {tz.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                    <Button
                        size="sm"
                        className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                        onClick={handleSaveOrg}
                        disabled={savingOrg}
                    >
                        {savingOrg && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Enregistrer
                    </Button>
                </CardFooter>
            </Card>

            {/* ---- RÉPONSE AUTOMATIQUE ---- */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#166534] to-[#10b981] flex items-center justify-center shadow-sm">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    Réponse automatique
                                </CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Message envoyé automatiquement quand aucun agent n'est disponible
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={autoReplyEnabled}
                            onCheckedChange={setAutoReplyEnabled}
                        />
                    </div>
                </CardHeader>
                {autoReplyEnabled && (
                    <CardContent className="pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="auto-reply-msg" className="text-xs font-medium text-gray-500">
                                Message de réponse automatique
                            </Label>
                            <Textarea
                                id="auto-reply-msg"
                                value={autoReplyMessage}
                                onChange={(e) => setAutoReplyMessage(e.target.value)}
                                placeholder="Merci pour votre message. Un agent vous répondra dans les plus brefs délais."
                                rows={3}
                                className="text-sm resize-none"
                            />
                            <p className="text-[11px] text-gray-400">
                                Ce message sera envoyé aux clients en dehors des horaires d'ouverture ou quand aucun agent n'est en ligne.
                            </p>
                        </div>
                    </CardContent>
                )}
                <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                    <Button
                        size="sm"
                        className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                    >
                        {savingSettings && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Enregistrer
                    </Button>
                </CardFooter>
            </Card>

            {/* ---- HORAIRES D'OUVERTURE ---- */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#15803d] to-[#34d399] flex items-center justify-center shadow-sm">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                Horaires d'ouverture
                            </CardTitle>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Définissez les heures de disponibilité de votre équipe
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-0">
                        {DAYS.map((day, index) => (
                            <div key={day.key}>
                                {index > 0 && <Separator className="bg-gray-100" />}
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <div className="flex items-center gap-3 min-w-[120px]">
                                        <Switch
                                            checked={businessHours[day.key]?.enabled ?? false}
                                            onCheckedChange={(checked) => updateDayHours(day.key, "enabled", checked)}
                                        />
                                        <span className={cn(
                                            "text-sm font-medium",
                                            businessHours[day.key]?.enabled ? "text-gray-900" : "text-gray-400"
                                        )}>
                                            {day.label}
                                        </span>
                                    </div>
                                    {businessHours[day.key]?.enabled ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={businessHours[day.key]?.open || "08:00"}
                                                onChange={(e) => updateDayHours(day.key, "open", e.target.value)}
                                                className="h-8 w-28 text-xs"
                                            />
                                            <span className="text-xs text-gray-400">à</span>
                                            <Input
                                                type="time"
                                                value={businessHours[day.key]?.close || "18:00"}
                                                onChange={(e) => updateDayHours(day.key, "close", e.target.value)}
                                                className="h-8 w-28 text-xs"
                                            />
                                        </div>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500 font-medium">
                                            Fermé
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                    <Button
                        size="sm"
                        className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                    >
                        {savingSettings && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Enregistrer les horaires
                    </Button>
                </CardFooter>
            </Card>

            {/* ---- RÈGLES D'ATTRIBUTION ---- */}
            <Card className="bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-sm">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                                    Attribution automatique
                                </CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Distribuer automatiquement les conversations aux agents disponibles
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={autoAssignEnabled}
                            onCheckedChange={setAutoAssignEnabled}
                        />
                    </div>
                </CardHeader>
                {autoAssignEnabled && (
                    <CardContent className="pt-4 space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="max-chats" className="text-xs font-medium text-gray-500">
                                Conversations simultanées max par agent
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="max-chats"
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={maxConcurrentChats}
                                    onChange={(e) => setMaxConcurrentChats(parseInt(e.target.value) || 5)}
                                    className="h-9 w-24 text-sm"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Limite le nombre de conversations actives qu'un agent peut gérer en parallèle.
                                </p>
                            </div>
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Exclure les agents hors ligne</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Ne pas attribuer de conversations aux agents qui ne sont pas en ligne.
                                </p>
                            </div>
                            <Switch
                                checked={excludeOfflineAgents}
                                onCheckedChange={setExcludeOfflineAgents}
                            />
                        </div>
                    </CardContent>
                )}
                <CardFooter className="flex justify-end border-t border-gray-100 p-4 bg-gray-50/30">
                    <Button
                        size="sm"
                        className="h-8 text-xs rounded-full bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer"
                        onClick={handleSaveAssignment}
                        disabled={savingAssignment}
                    >
                        {savingAssignment && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Enregistrer les règles
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}

