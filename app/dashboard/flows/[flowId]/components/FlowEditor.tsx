'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    ReactFlow,
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    Panel,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { CustomNodeMessage } from './nodes/CustomNodeMessage';

const nodeTypes = {
    message: CustomNodeMessage,
};

interface FlowEditorProps {
    flowId: Id<"flows">;
}

function FlowEditorContent({ flowId }: FlowEditorProps) {
    const router = useRouter();
    const flow = useQuery(api.flows.get, { flowId });
    const updateFlow = useMutation(api.flows.update);
    const { screenToFlowPosition } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Initialize from DB
    useEffect(() => {
        if (flow) {
            try {
                const loadedNodes = flow.nodes ? JSON.parse(flow.nodes) : [];
                const loadedEdges = flow.edges ? JSON.parse(flow.edges) : [];
                setNodes(loadedNodes);
                setEdges(loadedEdges);
            } catch (e) {
                console.error("Failed to parse flow data", e);
            }
        }
    }, [flow, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: { label: `${type} node`, content: '' },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleSave = async () => {
        if (!flow) return;
        try {
            await updateFlow({
                flowId: flow._id,
                nodes: JSON.stringify(nodes),
                edges: JSON.stringify(edges),
            });
            alert('Sauvegardé !');
        } catch (e) {
            console.error("Save failed", e);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const updateNodeData = (id: string, data: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            })
        );
        // Update selected node reference as well to reflect changes in Panel
        if (selectedNode?.id === id) {
            setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...data } } : null);
        }
    };

    if (!flow) return <div>Chargement...</div>;

    return (
        <div className="flex h-screen flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">{flow.name}</h1>
                        <p className="text-xs text-gray-500">{flow.isActive ? 'Actif' : 'Brouillon'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/flows/${flowId}/chat`)}
                        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                        <Sparkles className="h-4 w-4" />
                        Modifier avec l'IA
                    </Button>
                    <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4" />
                        Sauvegarder
                    </Button>
                </div>
            </div>

            {/* Editor Body */}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 relative bg-gray-50" onDrop={onDrop} onDragOver={onDragOver}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="#aaa" gap={16} />
                        <Controls />
                        <MiniMap />
                        <Panel position="top-left" className="bg-white p-2 rounded shadow-md border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Ajouter un nœud</div>
                            <div className="flex flex-col gap-2">
                                <div
                                    className="px-3 py-2 bg-white border border-gray-300 rounded cursor-grab hover:bg-gray-50 text-sm flex items-center gap-2"
                                    onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'message')}
                                    draggable
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Message
                                </div>
                                {/* Add more node types here */}
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Right Sidebar (Properties) */}
                {selectedNode && (
                    <div className="w-80 border-l bg-white p-4 overflow-y-auto">
                        <div className="text-lg font-semibold mb-4 border-b pb-2">Propriétés</div>
                        {selectedNode.type === 'message' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du message</label>
                                    <textarea
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:green-500"
                                        rows={4}
                                        value={selectedNode.data.content as string}
                                        onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                                        placeholder="Entrez le texte du message..."
                                    />
                                </div>
                            </div>
                        )}
                        {selectedNode.type !== 'message' && (
                            <div className="text-sm text-gray-500">Sélectionnez un type de nœud connu pour éditer.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <FlowEditorContent {...props} />
        </ReactFlowProvider>
    );
}
