'use client'

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RechargeContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session") as Id<"paymentSessions"> | null;
    const urlStatus = searchParams.get("status"); // success, error, cancel

    const paymentStatus = useQuery(
        api.payments.getPaymentStatus,
        sessionId ? { paymentSessionId: sessionId } : "skip"
    );

    // No session ID in URL
    if (!sessionId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-6 space-y-4">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <p className="text-gray-600">Session de paiement introuvable.</p>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à la facturation
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading state
    if (paymentStatus === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-6 space-y-4">
                        <Loader2 className="h-12 w-12 text-green-500 mx-auto animate-spin" />
                        <p className="text-gray-600">Chargement...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Session not found or unauthorized
    if (paymentStatus === null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-6 space-y-4">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <p className="text-gray-600">Session de paiement introuvable ou non autorisée.</p>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à la facturation
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                {/* PENDING - waiting for webhook confirmation */}
                {paymentStatus.status === "PENDING" && (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3">
                                <Loader2 className="h-14 w-14 text-green-500 animate-spin" />
                            </div>
                            <CardTitle>Paiement en cours</CardTitle>
                            <CardDescription>
                                {urlStatus === "cancel"
                                    ? "Le paiement a été annulé. Si vous avez finalisé le paiement, attendez la confirmation."
                                    : "Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-3">
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-sm text-gray-500">Montant</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(paymentStatus.amount)}
                                </p>
                            </div>
                            <p className="text-xs text-gray-400">
                                Réf: {paymentStatus.publicReference}
                            </p>
                        </CardContent>
                    </>
                )}

                {/* COMPLETED - payment confirmed */}
                {paymentStatus.status === "COMPLETED" && (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3">
                                <CheckCircle2 className="h-14 w-14 text-green-500" />
                            </div>
                            <CardTitle className="text-green-700">Paiement confirmé !</CardTitle>
                            <CardDescription>
                                Vos crédits ont été ajoutés à votre compte.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-green-50 border border-green-100 p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Montant payé</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(paymentStatus.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Crédits ajoutés</span>
                                    <span className="font-semibold text-green-600">
                                        +{new Intl.NumberFormat("fr-FR").format(paymentStatus.credits)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Via</span>
                                    <span className="text-sm text-gray-700">{paymentStatus.provider}</span>
                                </div>
                            </div>
                            <p className="text-xs text-center text-gray-400">
                                Réf: {paymentStatus.publicReference}
                            </p>
                            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                                <Link href="/dashboard/billing">
                                    Retour à la facturation
                                </Link>
                            </Button>
                        </CardContent>
                    </>
                )}

                {/* FAILED */}
                {paymentStatus.status === "FAILED" && (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3">
                                <XCircle className="h-14 w-14 text-red-500" />
                            </div>
                            <CardTitle className="text-red-700">Paiement échoué</CardTitle>
                            <CardDescription>
                                {paymentStatus.failureReason || "Le paiement n'a pas pu être traité."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
                                <p className="text-sm text-gray-600">Montant</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(paymentStatus.amount)}
                                </p>
                            </div>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/dashboard/billing">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour et réessayer
                                </Link>
                            </Button>
                        </CardContent>
                    </>
                )}

                {/* EXPIRED */}
                {paymentStatus.status === "EXPIRED" && (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3">
                                <Clock className="h-14 w-14 text-yellow-500" />
                            </div>
                            <CardTitle className="text-yellow-700">Session expirée</CardTitle>
                            <CardDescription>
                                La session de paiement a expiré (30 minutes). Aucun montant n'a été débité.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/dashboard/billing">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour et réessayer
                                </Link>
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
