'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Zap, Image, Clock } from 'lucide-react'

export function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full px-8 text-center bg-gradient-to-b from-gray-50/50 to-white"
        >
            {/* Icon */}
            <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20">
                    <MessageSquare className="h-10 w-10 text-white" />
                </div>
                {/* Decorative dot */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-400 border-2 border-white"
                />
            </div>

            {/* Text */}
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                Jokko Inbox
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mb-8">
                S&eacute;lectionnez une conversation pour commencer &agrave; discuter avec vos clients via WhatsApp.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-3 gap-3 max-w-sm">
                {[
                    { icon: Zap, label: 'Temps r\u00e9el' },
                    { icon: Image, label: 'M\u00e9dias' },
                    { icon: Clock, label: 'Historique' },
                ].map((feature, i) => (
                    <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white"
                    >
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <feature.icon className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">
                            {feature.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
