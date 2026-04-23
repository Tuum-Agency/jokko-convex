"use client";

import { motion } from "framer-motion";

export function PhoneMockup() {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl"
        >
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-800 relative">
                {/* Fake WhatsApp UI */}
                <div className="absolute top-0 w-full h-24 bg-[#075E54] flex items-end pb-4 px-4 shadow-md z-10">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-white/20"></div>
                        <div className="flex-1">
                            <div className="h-3 w-24 bg-white/90 rounded mb-1"></div>
                            <div className="h-2 w-16 bg-white/60 rounded"></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-5 h-5 bg-white/20 rounded"></div>
                            <div className="w-5 h-5 bg-white/20 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="pt-28 px-4 space-y-4 bg-[#E5DDD5] h-full">
                    {/* Message 1 (Left) */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] text-xs text-gray-800">
                            Bonjour, je voudrais savoir si mon colis est arrivé ? 📦
                        </div>
                    </motion.div>

                    {/* Message 2 (Right - Automated) */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="flex justify-end"
                    >
                        <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[80%] text-xs text-gray-800">
                            <p className="font-bold text-[10px] text-green-700 mb-1">🤖 Assistant Jokko</p>
                            Bonjour ! Oui, votre colis #SN-2024 est disponible au point relais Dakar-Plateau. ✅
                            <br /><br />
                            Voulez-vous la localisation ?
                        </div>
                    </motion.div>

                    {/* Message 3 (Left) */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 3.5 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] text-xs text-gray-800">
                            Oui s'il vous plait !
                        </div>
                    </motion.div>

                    {/* Message 4 (Right - Location) */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 4.5 }}
                        className="flex justify-end"
                    >
                        <div className="bg-[#DCF8C6] p-2 rounded-lg rounded-tr-none shadow-sm max-w-[80%] w-48">
                            <div className="h-24 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-[10px]">
                                📍 Map Preview
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
