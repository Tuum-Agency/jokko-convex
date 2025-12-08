/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          components/conversations/EmptyState.tsx              ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Etat vide affiche quand aucune conversation n'est           ║
 * ║   selectionnee.                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Smartphone } from 'lucide-react'

export function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full px-8 text-center bg-linear-to-b from-gray-50 to-white"
        >
            {/* Illustration */}
            <div className="relative mb-8">
                {/* Phone mockup */}
                <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: [10, 0, 10] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                >
                    <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-gray-50/50 to-transparent" />
                    <div className="w-32 h-48 bg-linear-to-br from-green-400 to-green-600 rounded-3xl shadow-2xl shadow-green-500/30 p-2">
                        <div className="w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center">
                            <MessageSquare className="h-12 w-12 text-green-500 mb-2" />
                            <div className="space-y-1">
                                <div className="h-2 w-16 bg-gray-200 rounded" />
                                <div className="h-2 w-12 bg-gray-100 rounded mx-auto" />
                            </div>
                        </div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-800 rounded-full" />
                </motion.div>

                {/* Floating bubbles */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -left-8 top-8 w-20 h-6 bg-white rounded-2xl shadow-lg flex items-center justify-center"
                >
                    <span className="text-xs text-gray-500">Bonjour!</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -right-12 top-20 w-24 h-6 bg-green-100 rounded-2xl shadow-lg flex items-center justify-center"
                >
                    <span className="text-xs text-green-700">Salut! 👋</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="absolute -right-4 bottom-4 w-16 h-6 bg-white rounded-2xl shadow-lg flex items-center justify-center"
                >
                    <span className="text-xs text-gray-500">...</span>
                </motion.div>
            </div>

            {/* Text content */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Jokko Inbox
            </h2>
            <p className="text-gray-500 max-w-sm mb-6">
                Selectionnez une conversation pour commencer a discuter avec vos clients via WhatsApp.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-3 justify-center">
                {[
                    'Messages en temps reel',
                    'Medias supportes',
                    'Historique complet',
                ].map((feature, i) => (
                    <motion.span
                        key={feature}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="px-3 py-1 text-sm text-green-700 bg-green-50 rounded-full"
                    >
                        {feature}
                    </motion.span>
                ))}
            </div>
        </motion.div>
    )
}
