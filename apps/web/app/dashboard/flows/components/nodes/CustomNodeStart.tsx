
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

export function CustomNodeStart({ data, isConnectable }: NodeProps) {
    return (
        <div className="group relative px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-white border border-amber-100 min-w-[280px]">
            <div className="absolute inset-0 bg-amber-50/30 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4">
                <div className="rounded-xl w-10 h-10 bg-amber-100 flex justify-center items-center text-amber-600 shadow-sm ring-4 ring-amber-50/50">
                    <Zap className="w-5 h-5 fill-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm mb-0.5">Déclencheur</div>
                    <div className="text-gray-500 text-xs truncate">
                        {(data.label as string) || 'Nouveau message'}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white transition-transform hover:scale-125"
            />
        </div>
    );
}
