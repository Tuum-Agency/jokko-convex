import { FlowEditor } from './components/FlowEditor';
import { Id } from '@/convex/_generated/dataModel';

interface PageProps {
    params: Promise<{ flowId: string }>
}

export default async function FlowEditorPage({ params }: PageProps) {
    const { flowId } = await params;

    return (
        <div className="h-full w-full bg-gray-50 flex flex-col">
            <FlowEditor flowId={flowId as Id<"flows">} />
        </div>
    );
}
