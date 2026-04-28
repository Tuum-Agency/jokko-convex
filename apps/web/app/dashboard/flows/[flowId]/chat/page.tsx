import { EditFlowChatClient } from './client';
import { Id } from '@/convex/_generated/dataModel';

interface PageProps {
    params: Promise<{ flowId: string }>
}

export default async function EditFlowChatPage({ params }: PageProps) {
    const { flowId } = await params;

    return (
        <EditFlowChatClient
            flowId={flowId as Id<"flows">}
        />
    );
}
