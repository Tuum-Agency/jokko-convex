'use client'

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    Clock,
    Wallet,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export function RechargeContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session") as Id<"paymentSessions"> | null;
    const urlStatus = searchParams.get("status");

    const paymentStatus = useQuery(
        api.payments.getPaymentStatus,
        sessionId ? { paymentSessionId: sessionId } : "skip"
    );

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(amount);

    // No session ID in URL
    if (!sessionId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                            <XCircle className="h-7 w-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-900">Session introuvable</h2>
                            <p className="text-sm text-gray-500">La session de paiement est introuvable.</p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer mt-2"
                        >
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Retour &agrave; la facturation
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
                <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                            <Loader2 className="h-7 w-7 text-white animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-900">Chargement</h2>
                            <p className="text-sm text-gray-500">V&eacute;rification de votre paiement...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Session not found or unauthorized
    if (paymentStatus === null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                            <XCircle className="h-7 w-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-900">Session introuvable</h2>
                            <p className="text-sm text-gray-500">Session de paiement introuvable ou non autoris&eacute;e.</p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-full cursor-pointer mt-2"
                        >
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Retour &agrave; la facturation
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm overflow-hidden">
                {/* PENDING */}
                {paymentStatus.status === "PENDING" && (
                    <CardContent className="pt-8 pb-8 space-y-5">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <Loader2 className="h-7 w-7 text-white animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-gray-900">Paiement en cours</h2>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    {urlStatus === "cancel"
                                        ? "Le paiement a été annulé. Si vous avez finalisé le paiement, attendez la confirmation."
                                        : "Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement."}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-4 text-center space-y-1">
                            <p className="text-xs font-medium text-gray-500">Montant</p>
                            <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                {formatCurrency(paymentStatus.amount)}
                            </p>
                        </div>

                        <p className="text-[11px] text-gray-400 text-center">
                            R&eacute;f: {paymentStatus.publicReference}
                        </p>
                    </CardContent>
                )}

                {/* COMPLETED */}
                {paymentStatus.status === "COMPLETED" && (
                    <CardContent className="pt-8 pb-8 space-y-5">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                                <CheckCircle2 className="h-7 w-7 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-gray-900">Paiement confirm&eacute; !</h2>
                                <p className="text-sm text-gray-500">Vos cr&eacute;dits ont &eacute;t&eacute; ajout&eacute;s &agrave; votre compte.</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-green-100 bg-green-50/30 overflow-hidden">
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-500">Montant pay&eacute;</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {formatCurrency(paymentStatus.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-500">Cr&eacute;dits ajout&eacute;s</span>
                                    <span className="text-sm font-semibold text-green-600">
                                        +{new Intl.NumberFormat("fr-FR").format(paymentStatus.credits)}
                                    </span>
                                </div>
                            </div>
                            <Separator className="bg-green-100" />
                            <div className="p-4 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Via</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center">
                                        <Wallet className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{paymentStatus.provider}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 justify-center">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>R&eacute;f: {paymentStatus.publicReference}</span>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                className="w-full h-9 text-xs font-medium bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#14532d]/90 hover:to-[#059669]/90 cursor-pointer rounded-full"
                            >
                                <Link href="/dashboard/billing">
                                    Retour &agrave; la facturation
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                )}

                {/* FAILED */}
                {paymentStatus.status === "FAILED" && (
                    <CardContent className="pt-8 pb-8 space-y-5">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                                <XCircle className="h-7 w-7 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-gray-900">Paiement &eacute;chou&eacute;</h2>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    {paymentStatus.failureReason || "Le paiement n'a pas pu être traité."}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-red-50/30 p-4 text-center space-y-1">
                            <p className="text-xs font-medium text-gray-500">Montant</p>
                            <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                {formatCurrency(paymentStatus.amount)}
                            </p>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs rounded-full cursor-pointer"
                        >
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Retour et r&eacute;essayer
                            </Link>
                        </Button>
                    </CardContent>
                )}

                {/* EXPIRED */}
                {paymentStatus.status === "EXPIRED" && (
                    <CardContent className="pt-8 pb-8 space-y-5">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-900/20">
                                <Clock className="h-7 w-7 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-gray-900">Session expir&eacute;e</h2>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    La session de paiement a expir&eacute; (30 minutes). Aucun montant n&apos;a &eacute;t&eacute; d&eacute;bit&eacute;.
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs rounded-full cursor-pointer"
                        >
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Retour et r&eacute;essayer
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
