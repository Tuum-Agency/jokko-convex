
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { MousePointerClick, List } from 'lucide-react';

interface InteractiveData extends Record<string, unknown> {
    interactiveType?: string;
    content?: string;
    options?: any[];
}

type CustomNode = Node<InteractiveData>;

export function CustomNodeInteractive({ data, isConnectable }: NodeProps<CustomNode>) {
    const isList = data.interactiveType === 'list';

    return (
        <div className="px-4 py-3 shadow-lg rounded-xl bg-white border-2 border-purple-400 min-w-[250px]">
            <div className="flex items-center gap-3">
                <div className="rounded-full w-8 h-8 bg-purple-100 flex justify-center items-center text-purple-600">
                    {isList ? <List className="w-5 h-5" /> : <MousePointerClick className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-gray-800">{isList ? 'Liste de choix' : 'Boutons'}</div>
                    <div className="text-gray-500 text-xs line-clamp-2">
                        {data.content as string || 'Choisir une option...'}
                    </div>
                </div>
            </div>

            {/* Show choices preview */}
            {data.options && Array.isArray(data.options) && (
                <div className="mt-3 space-y-1">
                    {data.options.slice(0, 3).map((opt: any, i: number) => (
                        <div key={i} className="text-xs bg-gray-50 px-2 py-1 rounded text-purple-700 border border-purple-100 truncate">
                            {opt.label || opt.title || 'Option'}
                        </div>
                    ))}
                    {data.options.length > 3 && <div className="text-xs text-gray-400 pl-1">+{data.options.length - 3} autres...</div>}
                </div>
            )}

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-purple-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-purple-400 border-2 border-white"
            />
        </div>
    );
}
