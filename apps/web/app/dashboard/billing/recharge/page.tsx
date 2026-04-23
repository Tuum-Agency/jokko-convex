import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RechargeContent } from "./_recharge-content";

function RechargeLoading() {
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

export default function RechargePage() {
    return (
        <Suspense fallback={<RechargeLoading />}>
            <RechargeContent />
        </Suspense>
    );
}
