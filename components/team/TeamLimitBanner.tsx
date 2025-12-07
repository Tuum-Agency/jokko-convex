'use client';

import Link from 'next/link'
import { AlertTriangle, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// ============================================
// TYPES
// ============================================

interface TeamLimitBannerProps {
    current: number
    limit: number
    planName?: string
}

// ============================================
// COMPONENT
// ============================================

export function TeamLimitBanner({
    current,
    limit,
    planName = 'Starter',
}: TeamLimitBannerProps) {
    const percentage = Math.round((current / limit) * 100)

    // Don't show if under 80%
    if (percentage < 80) return null

    const isAtLimit = percentage >= 100
    const isNearLimit = percentage >= 80 && percentage < 100

    return (
        <div
            className={`rounded-xl p-4 border ${isAtLimit
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`p-2 rounded-lg ${isAtLimit ? 'bg-red-100' : 'bg-amber-100'
                        }`}
                >
                    {isAtLimit ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                        <Users className="h-5 w-5 text-amber-600" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4
                        className={`font-medium ${isAtLimit ? 'text-red-700' : 'text-amber-700'
                            }`}
                    >
                        {isAtLimit
                            ? 'Limite de membres atteinte'
                            : 'Vous approchez de la limite'}
                    </h4>

                    <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className={isAtLimit ? 'text-red-600' : 'text-amber-600'}>
                                {current} / {limit} membres ({planName})
                            </span>
                            <span
                                className={`font-medium ${isAtLimit ? 'text-red-700' : 'text-amber-700'
                                    }`}
                            >
                                {percentage}%
                            </span>
                        </div>

                        <Progress
                            value={Math.min(percentage, 100)}
                            className={`h-2 ${isAtLimit
                                    ? '[&>div]:bg-red-500'
                                    : '[&>div]:bg-amber-500'
                                }`}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <p
                            className={`text-sm ${isAtLimit ? 'text-red-600' : 'text-amber-600'
                                }`}
                        >
                            {isAtLimit
                                ? 'Passez a un plan superieur pour ajouter plus de membres.'
                                : 'Bientot a court de places. Pensez a upgrader.'}
                        </p>
                        <Button
                            asChild
                            size="sm"
                            className={
                                isAtLimit
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-amber-600 hover:bg-amber-700'
                            }
                        >
                            <Link href="/billing/plans">
                                Voir les plans
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
