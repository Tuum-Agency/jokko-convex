'use client'

import React from 'react'
import { Check, Minus, HelpCircle, Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { FadeInView } from '@/components/animations'
import { COMPARISON_TABLE } from '@/lib/plans'

export function PricingComparisonTable() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Comparatif Détaillé</h2>
                    <p className="text-lg text-slate-600">Tout ce que vous devez savoir pour faire le bon choix.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left py-4 px-6 w-1/4 bg-white sticky top-0 z-10"></th>
                                <th className="text-center py-4 px-6 w-1/4 bg-slate-50 rounded-t-xl text-lg font-bold text-slate-900">Starter</th>
                                <th className="text-center py-4 px-6 w-1/4 bg-green-50 rounded-t-xl text-lg font-bold text-green-700 border-t-2 border-green-500">Business</th>
                                <th className="text-center py-4 px-6 w-1/4 bg-slate-50 rounded-t-xl text-lg font-bold text-slate-900">Pro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {COMPARISON_TABLE.map((section, sIndex) => (
                                <React.Fragment key={section.category}>
                                    <tr>
                                        <td colSpan={4} className="py-6 px-6 bg-white">
                                            <h3 className="text-lg font-bold text-slate-900">{section.category}</h3>
                                        </td>
                                    </tr>
                                    {section.items.map((item, iIndex) => (
                                        <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 text-slate-600 font-medium flex items-center gap-2">
                                                {item.name}
                                                {item.help && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-xs text-sm">{item.help}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </td>
                                            {['starter', 'business', 'pro'].map((plan) => {
                                                const value = (item as any)[plan]
                                                return (
                                                    <td key={plan} className={`text-center py-4 px-6 ${plan === 'business' ? 'bg-green-50/30' : ''}`}>
                                                        <div className="flex justify-center items-center">
                                                            {value === true ? (
                                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <Check className="w-4 h-4 text-green-600" />
                                                                </div>
                                                            ) : value === false ? (
                                                                <Minus className="w-4 h-4 text-slate-300" />
                                                            ) : (
                                                                <span className="text-sm font-semibold text-slate-700">{value}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
