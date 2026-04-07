'use client';

import { Sparkles, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
    onSelectMode: (mode: 'guided' | 'diagram') => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Comment souhaitez-vous créer votre automatisation ?
                </h2>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    Choisissez le mode qui vous convient. Vous pourrez toujours modifier votre automatisation plus tard.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                {/* Mode Assistant IA */}
                <button
                    onClick={() => onSelectMode('guided')}
                    className={cn(
                        "group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200",
                        "bg-white hover:border-green-400 hover:bg-green-50/30 transition-all hover:shadow-lg",
                        "text-left cursor-pointer"
                    )}
                >
                    <Badge className="absolute top-3 right-3 bg-green-100 text-green-700 border-green-200 text-[10px] font-semibold">
                        Recommandé
                    </Badge>
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform">
                        <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            Assistant IA
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Je vous guide pas à pas avec des questions simples. Aucune compétence technique requise.
                        </p>
                    </div>
                </button>

                {/* Mode Diagramme */}
                <button
                    onClick={() => onSelectMode('diagram')}
                    className={cn(
                        "group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200",
                        "bg-white hover:border-gray-400 hover:bg-gray-50/30 transition-all hover:shadow-lg",
                        "text-left cursor-pointer"
                    )}
                >
                    <Badge variant="outline" className="absolute top-3 right-3 text-[10px] font-semibold text-gray-500">
                        Avancé
                    </Badge>
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg shadow-gray-900/20 group-hover:scale-110 transition-transform">
                        <GitBranch className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                            Éditeur Diagramme
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Créez visuellement avec un éditeur glisser-déposer. Pour les utilisateurs expérimentés.
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
