'use client';

import { Id } from '@/convex/_generated/dataModel';
import { FlowEditor } from './components/FlowEditor';
import { GuidedFlowBuilder } from '../components/GuidedFlowBuilder';

interface FlowEditorClientProps {
    flowId: string;
    mode?: string;
}

export default function FlowEditorClient({ flowId, mode }: FlowEditorClientProps) {
    if (mode === 'guided') {
        return <GuidedFlowBuilder flowId={flowId} />;
    }

    return <FlowEditor flowId={flowId as Id<"flows">} />;
}
