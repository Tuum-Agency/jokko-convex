'use client';

import { FlowChatBuilder } from '../../components/FlowChatBuilder';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';

interface EditFlowChatClientProps {
    flowId: Id<"flows">;
}

export function EditFlowChatClient({ flowId }: EditFlowChatClientProps) {
    const flow = useQuery(api.flows.get, { flowId });

    if (!flow) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    const initialNodes = flow.nodes ? JSON.parse(flow.nodes) : [];
    const initialEdges = flow.edges ? JSON.parse(flow.edges) : [];

    return (
        <FlowChatBuilder
            initialFlowId={flowId}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            initialName={flow.name}
        />
    );
}
