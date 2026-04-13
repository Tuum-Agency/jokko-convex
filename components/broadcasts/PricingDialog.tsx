'use client'

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { PRICING_TABLE, USD_TO_FCFA } from '@/lib/whatsapp-pricing';

export function PricingDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[11px] text-gray-400 hover:text-gray-600 gap-1 cursor-pointer"
                >
                    <Info className="h-3 w-3" />
                    Voir les tarifs
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-gray-900">
                        Tarifs WhatsApp Business
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        Messages marketing (templates). Tarifs Meta officiels, convertis en FCFA (1 USD = {USD_TO_FCFA} FCFA).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {PRICING_TABLE.map((group) => (
                        <div key={group.region}>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {group.region}
                            </h4>
                            <div className="rounded-lg border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80">
                                            <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-400">Pays</th>
                                            <th className="text-right px-3 py-1.5 text-[11px] font-medium text-gray-400">USD/msg</th>
                                            <th className="text-right px-3 py-1.5 text-[11px] font-medium text-gray-400">FCFA/msg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.countries.map((c) => (
                                            <tr key={c.prefix} className="border-t border-gray-50 hover:bg-gray-50/50">
                                                <td className="px-3 py-1.5 text-gray-700">
                                                    <span className="mr-1.5">{c.flag}</span>
                                                    {c.name}
                                                    <span className="text-gray-400 text-xs ml-1">({c.prefix})</span>
                                                </td>
                                                <td className="px-3 py-1.5 text-right text-gray-500 font-mono text-xs">
                                                    ${c.rateUSD.toFixed(4)}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-semibold text-gray-900 font-mono text-xs">
                                                    {Math.ceil(c.rateUSD * USD_TO_FCFA)} F
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Source : Meta WhatsApp Business Platform (juillet 2025). Les tarifs peuvent varier.
                        Le coût est facturé par message marketing livré, selon le pays du destinataire.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
