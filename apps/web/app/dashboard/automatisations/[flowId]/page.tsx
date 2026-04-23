import FlowEditorClient from './client';

export default async function FlowEditorPage({
    params,
    searchParams,
}: {
    params: Promise<{ flowId: string }>;
    searchParams: Promise<{ mode?: string }>;
}) {
    const { flowId } = await params;
    const { mode } = await searchParams;
    return <FlowEditorClient flowId={flowId} mode={mode} />;
}
