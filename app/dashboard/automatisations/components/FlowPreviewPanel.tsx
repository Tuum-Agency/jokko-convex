'use client';

import {
    ReactFlow,
    Background,
    Controls,
    ReactFlowProvider,
    type Node,
    type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LayoutTemplate } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomNodeMessage } from './nodes/CustomNodeMessage';
import { CustomNodeStart } from './nodes/CustomNodeStart';
import { CustomNodeInteractive } from './nodes/CustomNodeInteractive';
import { CustomNodeAction } from './nodes/CustomNodeAction';

const nodeTypes = {
    message: CustomNodeMessage,
    start: CustomNodeStart,
    interactive: CustomNodeInteractive,
    action: CustomNodeAction,
};

interface FlowPreviewPanelProps {
    nodes: Node[];
    edges: Edge[];
}

export function FlowPreviewPanel({ nodes, edges }: FlowPreviewPanelProps) {
    return (
        <div className="hidden lg:flex w-full h-full border-l border-gray-200 bg-slate-50 relative flex-col shadow-inner">
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white/50 backdrop-blur-sm z-10">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <LayoutTemplate className="w-3 h-3" />
                    Aperçu en temps réel
                </span>
                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                    Live
                </Badge>
            </div>
            <div className="flex-1 w-full h-full">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-50/50"
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                    >
                        <Background color="#94a3b8" gap={20} size={1} className="opacity-40" />
                        <Controls className="bg-white shadow-sm border border-gray-100" />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}
