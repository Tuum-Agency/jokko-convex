
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MousePointerClick, List } from 'lucide-react';

export function CustomNodeInteractive({ data, isConnectable }: NodeProps) {
    const isList = data.interactiveType === 'list';

    return (
        <div className="group relative px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-white border border-violet-100 min-w-[280px]">
            <div className="absolute inset-0 bg-violet-50/30 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 mb-3">
                <div className="rounded-xl w-10 h-10 bg-violet-100 flex justify-center items-center text-violet-600 shadow-sm ring-4 ring-violet-50/50">
                    {isList ? <List className="w-5 h-5" /> : <MousePointerClick className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm mb-0.5">{isList ? 'Liste de choix' : 'Boutons'}</div>
                    <div className="text-gray-500 text-xs line-clamp-1">
                        {data.content as string || 'Choisir une option...'}
                    </div>
                </div>
            </div>

            {/* Show choices preview */}
            {data.options && Array.isArray(data.options) && (data.options as any[]).length > 0 ? (
                <div className="mt-2 space-y-1.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                    {(data.options as any[]).slice(0, 3).map((opt: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-300"></div>
                            <span className="text-xs text-gray-600 font-medium truncate flex-1">
                                {opt.label || opt.title || 'Option'}
                            </span>
                        </div>
                    ))}
                    {(data.options as any[]).length > 3 && (
                        <div className="text-[10px] text-gray-400 pl-3.5 font-medium">+{(data.options as any[]).length - 3} autres...</div>
                    )}
                </div>
            ) : null}

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white transition-transform hover:scale-125"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white transition-transform hover:scale-125"
            />
        </div>
    );
}
