import { Handle, Position, NodeProps } from '@xyflow/react';

export function CustomNodeMessage({ data, isConnectable }: NodeProps) {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400 min-w-[200px]">
            <div className="flex items-center">
                <div className="rounded-full w-3 h-3 bg-blue-500 flex justify-center items-center mr-2">
                    {/* Icon */}
                </div>
                <div className="ml-2">
                    <div className="text-lg font-bold text-gray-700">Message</div>
                    <div className="text-gray-500 text-sm line-clamp-2">{typeof data.content === 'string' && data.content ? data.content : 'Pas de contenu'}</div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-slate-400"
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-slate-400"
            />
        </div>
    );
}
