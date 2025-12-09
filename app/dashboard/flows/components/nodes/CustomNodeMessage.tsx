import { Handle, Position, NodeProps } from '@xyflow/react';

export function CustomNodeMessage({ data, isConnectable }: NodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-xl bg-white border-2 border-blue-400 min-w-[250px]">
            <div className="flex items-center gap-3">
                <div className="rounded-full w-8 h-8 bg-blue-100 flex justify-center items-center text-blue-600">
                    {/* Icon placeholder or use Lucide MessageSquare */}
                    <span className="text-xs">msg</span>
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-gray-800">Message Texte</div>
                    <div className="text-gray-500 text-xs line-clamp-2">
                        {typeof data.content === 'string' && data.content ? data.content : 'Pas de contenu'}
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-blue-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-blue-400 border-2 border-white"
            />
        </div>
    );
}
