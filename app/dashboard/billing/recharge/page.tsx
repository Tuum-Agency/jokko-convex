import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RechargeContent } from "./_recharge-content";

function RechargeLoading() {
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

export default function RechargePage() {
    return (
        <Suspense fallback={<RechargeLoading />}>
            <RechargeContent />
        </Suspense>
    );
}
