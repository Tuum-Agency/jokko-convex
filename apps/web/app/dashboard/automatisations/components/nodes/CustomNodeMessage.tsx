
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

export function CustomNodeMessage({ data, isConnectable }: NodeProps) {
    return (
        <div className="group relative px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-white border border-blue-100 min-w-[280px]">
            <div className="absolute inset-0 bg-blue-50/30 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4">
                <div className="rounded-xl w-10 h-10 bg-blue-100 flex justify-center items-center text-blue-600 shadow-sm ring-4 ring-blue-50/50">
                    <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm mb-0.5">Message Texte</div>
                    <div className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                        {typeof data.content === 'string' && data.content ? data.content : 'Pas de contenu défini'}
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white transition-transform hover:scale-125"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white transition-transform hover:scale-125"
            />
        </div>
    );
}
