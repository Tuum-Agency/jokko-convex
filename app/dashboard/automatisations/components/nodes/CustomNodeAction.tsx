
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Settings, UserPlus, XCircle, Tag as TagIcon } from 'lucide-react';

export function CustomNodeAction({ data, isConnectable }: NodeProps) {
    const actionType = data.actionType || 'generic';

    const getIcon = () => {
        switch (actionType) {
            case 'assign': return <UserPlus className="w-5 h-5" />;
            case 'close': return <XCircle className="w-5 h-5" />;
            case 'tag': return <TagIcon className="w-5 h-5" />;
            default: return <Settings className="w-5 h-5" />;
        }
    };

    const getLabel = () => {
        switch (actionType) {
            case 'assign': return 'Assigner Agent';
            case 'close': return 'Clôturer';
            case 'tag': return 'Ajouter Tag';
            default: return 'Action';
        }
    };

    return (
        <div className="group relative px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-white border border-cyan-100 min-w-[240px]">
            <div className="absolute inset-0 bg-cyan-50/30 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4">
                <div className="rounded-xl w-10 h-10 bg-cyan-100 flex justify-center items-center text-cyan-600 shadow-sm ring-4 ring-cyan-50/50">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm mb-0.5">{getLabel()}</div>
                    <div className="text-gray-500 text-xs truncate">
                        {data.details as string || 'Information'}
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white transition-transform hover:scale-125"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white transition-transform hover:scale-125"
            />
        </div>
    );
}
