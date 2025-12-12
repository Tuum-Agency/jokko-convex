'use client'

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, CreditCard, Download, Zap, AlertCircle, Plus, History } from 'lucide-react';
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
import { useState } from "react";
import { toast } from "sonner";

export default function BillingPage() {
    const role = useQuery(api.users.currentUserRole);
    const creditBalance = useQuery(api.credits.getBalance);
    const transactions = useQuery(api.credits.getTransactions, { limit: 10 });

    // For simulation/demo purposes: allow "buying" credits directly
    const addCredits = useMutation(api.credits.debugAddCredits);

    const handleRecharge = () => {
        addCredits({ amount: 5000 }).then(() => {
            toast.success("5 000 FCFA ajoutés (Simulation)");
        }).catch(() => {
            toast.error("Erreur lors de la recharge");
        });
    };

    if (role === undefined || creditBalance === undefined) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto pb-10 mt-10">
                <Skeleton className="h-12 w-48" />
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Portefeuille & Facturation</h1>
                <p className="text-gray-500 mt-2">
                    Gérez vos crédits marketing et votre abonnement.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Crédits Marketing */}
                <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Solde Marketing</CardTitle>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                Pay-As-You-Go
                            </Badge>
                        </div>
                        <CardDescription>
                            Utilisé pour les campagnes (Broadcasts) et l'IA avancée.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-4xl font-bold tracking-tight text-gray-900">
                                {formatCurrency(creditBalance || 0)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            ~ {(creditBalance || 0) / 60} messages marketing estimés
                        </p>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleRecharge}>
                            <Plus className="mr-2 h-4 w-4" />
                            Recharger (Simuler)
                        </Button>
                    </CardFooter>
                </Card>

                {/* Abonnement Fixe */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Abonnement Service</CardTitle>
                            <Badge variant="secondary">Pro</Badge>
                        </div>
                        <CardDescription>Couvre le service client et la maintenance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold tracking-tight text-gray-900">70 000 F</span>
                            <span className="text-sm font-medium text-gray-500">/mois</span>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Agents Illimités
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Réception Gratuite
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">
                            Gérer l'abonnement
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Historique des transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" />
                        Historique des transactions
                    </CardTitle>
                    <CardDescription>Vos recharges et consommations de crédits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead className="text-right">Solde Après</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!transactions || transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Aucune transaction récente.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx._id}>
                                        <TableCell>
                                            {new Date(tx.createdAt).toLocaleDateString('fr-SN', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>{tx.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                tx.type === 'RECHARGE' || tx.type === 'BONUS' ? 'default' :
                                                    tx.type === 'USAGE' ? 'secondary' : 'outline'
                                            } className={
                                                tx.type === 'RECHARGE' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                    tx.type === 'USAGE' ? 'bg-gray-100 text-gray-700' : ''
                                            }>
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-500">
                                            {formatCurrency(tx.balanceAfter)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
