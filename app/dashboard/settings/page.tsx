'use client'

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ButtonGroup } from "@/components/ui/button-group";
import { User, Bell, Shield, Globe, Mail, Upload, Loader2, Save, Trash2, Smartphone, Briefcase, MessageSquare, CheckCircle2, AlertCircle, RefreshCw, Phone } from 'lucide-react';
import { useCurrentOrg } from "@/hooks/use-current-org";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
                <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
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

                {/* WhatsApp Tab */}
                <TabsContent value="whatsapp" className="space-y-6">
                    <WhatsAppSettingsTab />
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

// ============================================
// WHATSAPP SETTINGS TAB
// ============================================

interface WhatsAppNumber {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
}

function WhatsAppSettingsTab() {
    const { currentOrg } = useCurrentOrg();
    const fetchNumbers = useAction(api.whatsapp.fetchWhatsAppPhoneNumbers);
    const finalizeRegistration = useAction(api.whatsapp.finalizeWhatsAppRegistration);

    const [status, setStatus] = useState<'IDLE' | 'FETCHING' | 'SELECTING' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([]);
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [wabaId, setWabaId] = useState<string | null>(null);

    const isConnected = !!currentOrg?.whatsapp?.phoneNumberId;

    // Load Facebook SDK
    useEffect(() => {
        if ((window as any).FB) {
            setSdkLoaded(true);
            return;
        }

        (window as any).fbAsyncInit = function () {
            (window as any).FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v19.0'
            });
            setSdkLoaded(true);
        };

        const script = document.createElement('script');
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }
    }, []);

    const launchWhatsAppSignup = () => {
        if (!sdkLoaded) return;
        setErrorMessage(null);

        (window as any).FB.login(function (response: any) {
            if (response.authResponse) {
                handleFetchNumbers(response.authResponse.accessToken);
            } else {
                setErrorMessage("Connexion annulée ou non autorisée.");
            }
        }, {
            scope: 'whatsapp_business_management, whatsapp_business_messaging, business_management'
        });
    };

    async function handleFetchNumbers(token: string) {
        setStatus('FETCHING');
        setAccessToken(token);

        try {
            const data = await fetchNumbers({ accessToken: token });
            setWabaId(data.wabaId);
            setPhoneNumbers(data.phoneNumbers);

            if (data.phoneNumbers.length > 0) {
                setSelectedPhoneId(data.phoneNumbers[0].id);
                setStatus('SELECTING');
            } else {
                setErrorMessage("Aucun numéro WhatsApp trouvé sur ce compte.");
                setStatus('ERROR');
            }
        } catch (error: any) {
            console.error("Fetch failed", error);
            setErrorMessage("Impossible de récupérer vos numéros. Vérifiez vos permissions.");
            setStatus('ERROR');
        }
    }

    async function handleConfirmSelection() {
        if (!accessToken || !wabaId || !selectedPhoneId) return;

        setStatus('SAVING');
        try {
            await finalizeRegistration({
                accessToken,
                wabaId,
                phoneNumberId: selectedPhoneId
            });
            setStatus('SUCCESS');
            toast.success("WhatsApp connecté", {
                description: "Votre numéro WhatsApp a été mis à jour avec succès.",
            });
        } catch (error) {
            console.error("Finalize failed", error);
            setErrorMessage("Erreur lors de la sauvegarde de la configuration.");
            setStatus('ERROR');
        }
    }

    // SELECTING STATE - Show number picker
    if (status === 'SELECTING' || status === 'SAVING') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        Choisissez votre numéro
                    </CardTitle>
                    <CardDescription>
                        Sélectionnez le numéro WhatsApp Business à connecter à Jokko.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-h-[300px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                        <RadioGroup value={selectedPhoneId || ''} onValueChange={setSelectedPhoneId}>
                            {phoneNumbers.map((phone) => (
                                <div key={phone.id} className="flex items-center space-x-2 mb-2 last:mb-0">
                                    <RadioGroupItem value={phone.id} id={`settings-${phone.id}`} />
                                    <Label htmlFor={`settings-${phone.id}`} className="flex flex-col cursor-pointer w-full p-3 rounded-lg border bg-white hover:border-green-500 transition-colors">
                                        <span className="font-semibold text-gray-900">{phone.verified_name || 'Numéro sans nom'}</span>
                                        <span className="text-sm text-gray-500">{phone.display_phone_number}</span>
                                        <span className="text-xs text-green-600 mt-1">Qualité : {phone.quality_rating}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-gray-50/50 border-t p-4">
                    <Button variant="outline" onClick={() => { setStatus('IDLE'); setPhoneNumbers([]); }}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmSelection}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={status === 'SAVING'}
                    >
                        {status === 'SAVING' ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</>
                        ) : (
                            "Confirmer ce numéro"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // SUCCESS STATE
    if (status === 'SUCCESS') {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Numéro mis à jour !</h3>
                    <p className="text-gray-500 text-sm text-center max-w-md">
                        Votre numéro WhatsApp a été connecté avec succès. Les messages seront envoyés et reçus via ce numéro.
                    </p>
                    <Button variant="outline" onClick={() => setStatus('IDLE')}>
                        Retour aux paramètres
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // DEFAULT STATE - Show current config + reconnect button
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    Intégration WhatsApp
                </CardTitle>
                <CardDescription>
                    Gérez la connexion de votre numéro WhatsApp Business.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Current Status */}
                <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${isConnected ? 'bg-green-50/50 border-green-200' : 'bg-orange-50/50 border-orange-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full border shadow-sm ${isConnected ? 'bg-green-100 border-green-200' : 'bg-orange-100 border-orange-200'}`}>
                            <Smartphone className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {isConnected ? 'WhatsApp connecté' : 'WhatsApp non connecté'}
                            </p>
                            {isConnected ? (
                                <p className="text-sm text-gray-500">
                                    Phone ID : {currentOrg?.whatsapp?.phoneNumberId}
                                </p>
                            ) : (
                                <p className="text-sm text-orange-600">
                                    Connectez un numéro pour envoyer et recevoir des messages.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isConnected ? 'Actif' : 'Inactif'}
                    </div>
                </div>

                {isConnected && currentOrg?.whatsapp?.businessAccountId && (
                    <div className="p-4 border rounded-lg bg-gray-50/50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Détails de la connexion</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">WABA ID</span>
                                <p className="font-mono text-gray-900">{currentOrg.whatsapp.businessAccountId}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Phone Number ID</span>
                                <p className="font-mono text-gray-900">{currentOrg.whatsapp.phoneNumberId}</p>
                            </div>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Action */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        {isConnected ? 'Changer de numéro' : 'Connecter WhatsApp Business'}
                    </h3>
                    <p className="text-blue-700 text-sm mb-4">
                        {isConnected
                            ? 'Vous pouvez remplacer le numéro actuel en vous reconnectant via Facebook.'
                            : 'Connectez votre compte Facebook pour lier un numéro WhatsApp Business à Jokko.'}
                    </p>

                    <Button
                        onClick={launchWhatsAppSignup}
                        disabled={!sdkLoaded || status === 'FETCHING'}
                        className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2 px-4 rounded shadow-md flex items-center gap-2"
                    >
                        {status === 'FETCHING' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isConnected ? (
                            <RefreshCw className="w-5 h-5" />
                        ) : (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        )}
                        {status === 'FETCHING' ? "Récupération..." : isConnected ? "Reconnecter avec Facebook" : "Se connecter avec Facebook"}
                    </Button>

                    <p className="text-xs text-gray-500 mt-2">
                        Une fenêtre popup va s'ouvrir. Assurez-vous de désactiver votre bloqueur de popups.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function Check({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
