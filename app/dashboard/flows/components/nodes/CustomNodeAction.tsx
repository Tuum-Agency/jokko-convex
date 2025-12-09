
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
        <div className="px-4 py-3 shadow-lg rounded-xl bg-white border-2 border-red-400 min-w-[200px]">
            <div className="flex items-center gap-3">
                <div className="rounded-full w-8 h-8 bg-red-100 flex justify-center items-center text-red-600">
                    {getIcon()}
                </div>
                <div>
                    <div className="font-semibold text-gray-800">{getLabel()}</div>
                    <div className="text-gray-500 text-xs">
                        {data.details as string || 'Configurer...'}
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-red-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-red-400 border-2 border-white"
            />
        </div>
    );
}
