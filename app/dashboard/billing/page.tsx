'use client'

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, CreditCard, Download, Zap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
    const role = useQuery(api.users.currentUserRole);
    const user = useQuery(api.users.me);
    const dashboardStats = useQuery(api.analytics.getAppDashboardStats);

    if (role === undefined) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto pb-10 mt-10">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (role === 'AGENT') {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès refusé</AlertTitle>
                    <AlertDescription>
                        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }


    // Mock usage limits
    const maxMessages = 1000;
    const currentMessages = dashboardStats?.stats[2] ? parseInt(dashboardStats.stats[2].value.replace(/,/g, '')) : 0;
    const usagePercent = Math.min(100, Math.round((currentMessages / maxMessages) * 100));

    const invoices = [
        { id: 'INV-001', date: '01/10/2024', amount: '0,00 €', status: 'Payé', plan: 'Free Tier' },
        { id: 'INV-002', date: '01/11/2024', amount: '0,00 €', status: 'Payé', plan: 'Free Tier' },
        { id: 'INV-003', date: '01/12/2024', amount: '0,00 €', status: 'Payé', plan: 'Free Tier' },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Facturation</h1>
                <p className="text-gray-500 mt-2">
                    Gérez votre abonnement et consultez vos factures.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Plan Actuel */}
                <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Plan Actuel</CardTitle>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Actif</Badge>
                        </div>
                        <CardDescription>Vous êtes actuellement sur le plan gratuit.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold tracking-tight text-gray-900">0€</span>
                            <span className="text-sm font-medium text-gray-500">/mois</span>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Jusqu'à 1 000 messages/mois
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                3 Agents inclus
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Support communautaire
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                            <Zap className="mr-2 h-4 w-4" />
                            Passer au plan Pro
                        </Button>
                    </CardFooter>
                </Card>

                {/* Utilisation */}
                <Card>
                    <CardHeader>
                        <CardTitle>Utilisation du mois</CardTitle>
                        <CardDescription>Consommation de vos ressources.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Messages envoyés</span>
                                <span className="text-muted-foreground">{currentMessages} / {maxMessages}</span>
                            </div>
                            <Progress value={usagePercent} className="h-2 bg-gray-100" />
                            <p className="text-xs text-muted-foreground">
                                Votre quota sera réinitialisé le 1er du mois prochain.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="text-sm font-medium text-gray-500">Contacts</div>
                                <div className="mt-1 text-2xl font-bold text-gray-900">
                                    {dashboardStats?.stats[1]?.value || '0'}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="text-sm font-medium text-gray-500">Conversations</div>
                                <div className="mt-1 text-2xl font-bold text-gray-900">
                                    {dashboardStats?.stats[0]?.value || '0'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Méthode de paiement */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Méthode de paiement</CardTitle>
                            <CardDescription>Gérez vos moyens de paiement pour la facturation.</CardDescription>
                        </div>
                        <Button variant="outline">Ajouter une méthode</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-md border shadow-sm">
                                <CreditCard className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Pas de méthode de paiement</p>
                                <p className="text-sm text-gray-500">Ajoutez une carte pour passer au plan Pro.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Historique des factures */}
            <Card>
                <CardHeader>
                    <CardTitle>Historique des factures</CardTitle>
                    <CardDescription>Consultez et téléchargez vos factures passées.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Facture #</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{invoice.plan}</TableCell>
                                    <TableCell>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            PDF
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
