
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

export function CustomNodeStart({ data, isConnectable }: NodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-xl bg-white border-2 border-yellow-400 min-w-[250px]">
            <div className="flex items-center gap-3">
                <div className="rounded-full w-8 h-8 bg-yellow-100 flex justify-center items-center text-yellow-600">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-semibold text-gray-800">Déclencheur</div>
                    <div className="text-gray-500 text-xs text-wrap">
                        {data.label || 'Nouveau message'}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-yellow-400 border-2 border-white"
            />
        </div>
    );
}
