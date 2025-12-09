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
import { Save, ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { CustomNodeMessage } from '../../components/nodes/CustomNodeMessage';
import { CustomNodeStart } from '../../components/nodes/CustomNodeStart';
import { CustomNodeInteractive } from '../../components/nodes/CustomNodeInteractive';
import { CustomNodeAction } from '../../components/nodes/CustomNodeAction';
import { ButtonGroup } from '@/components/ui/button-group';

const nodeTypes = {
    message: CustomNodeMessage,
    start: CustomNodeStart,
    interactive: CustomNodeInteractive,
    action: CustomNodeAction,
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
                <ButtonGroup>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/flows/${flowId}/chat`)}
                        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        <Sparkles className="h-4 w-4" />
                        Modifier avec l'IA
                    </Button>
                    <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700 text-white border border-green-600 hover:border-green-700">
                        <Save className="h-4 w-4" />
                        Sauvegarder
                    </Button>
                </ButtonGroup>
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
                        fitViewOptions={{ maxZoom: 1 }}
                    >
                        <Background color="#aaa" gap={16} />
                        <Controls />
                        <MiniMap />
                        <Panel position="top-left" className="bg-white p-2 rounded shadow-md border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Composants</div>
                            <div className="grid grid-cols-1 gap-2">
                                <div
                                    className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded cursor-grab hover:bg-yellow-100 text-sm flex items-center gap-2 text-yellow-800"
                                    onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'start')}
                                    draggable
                                >
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    Déclencheur
                                </div>
                                <div
                                    className="px-3 py-2 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100 text-sm flex items-center gap-2 text-blue-800"
                                    onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'message')}
                                    draggable
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Message Texte
                                </div>
                                <div
                                    className="px-3 py-2 bg-purple-50 border border-purple-200 rounded cursor-grab hover:bg-purple-100 text-sm flex items-center gap-2 text-purple-800"
                                    onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'interactive')}
                                    draggable
                                >
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    Choix / Menu
                                </div>
                                <div
                                    className="px-3 py-2 bg-red-50 border border-red-200 rounded cursor-grab hover:bg-red-100 text-sm flex items-center gap-2 text-red-800"
                                    onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'action')}
                                    draggable
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Action
                                </div>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Right Sidebar (Properties) */}
                {selectedNode && (
                    <div className="w-80 border-l bg-white p-4 overflow-y-auto">
                        <div className="text-lg font-semibold mb-4 border-b pb-2">Propriétés</div>

                        {/* MESSAGE NODE CONFIG */}
                        {selectedNode.type === 'message' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-blue-700">Message Texte</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                                    <textarea
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:blue-500"
                                        rows={4}
                                        value={selectedNode.data.content as string || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                                        placeholder="Bonjour, comment puis-je vous aider ?"
                                    />
                                </div>
                            </div>
                        )}

                        {/* START NODE CONFIG */}
                        {selectedNode.type === 'start' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-yellow-700">Déclencheur</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de déclencheur</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                        value={selectedNode.data.triggerType as string || 'keyword'}
                                        onChange={(e) => updateNodeData(selectedNode.id, { triggerType: e.target.value })}
                                    >
                                        <option value="keyword">Mot-clé</option>
                                        <option value="new_conversation">Nouvelle Conversation</option>
                                        <option value="no_reply">Pas de réponse (Timeout)</option>
                                    </select>
                                </div>
                                {(selectedNode.data.triggerType === 'keyword' || !selectedNode.data.triggerType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés (séparés par virgule)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                            value={selectedNode.data.keywords as string || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, { keywords: e.target.value })}
                                            placeholder="bonjour, salut, info"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* INTERACTIVE NODE CONFIG */}
                        {selectedNode.type === 'interactive' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-purple-700">Message Interactif</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <div className="flex gap-2 mb-2">
                                        <Button
                                            size="sm"
                                            variant={selectedNode.data.interactiveType === 'list' ? "default" : "outline"}
                                            onClick={() => updateNodeData(selectedNode.id, { interactiveType: 'list' })}
                                            className="flex-1"
                                        >
                                            Liste (Menu)
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={selectedNode.data.interactiveType === 'button' ? "default" : "outline"}
                                            onClick={() => updateNodeData(selectedNode.id, { interactiveType: 'button' })}
                                            className="flex-1"
                                        >
                                            Boutons
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message principal</label>
                                    <textarea
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                        rows={2}
                                        value={selectedNode.data.content as string || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                                        placeholder="Choisissez une option :"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                                    <div className="space-y-2">
                                        {((selectedNode.data.options as any[]) || []).map((opt, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    className="flex-1 rounded-md border border-gray-300 p-1 text-sm"
                                                    value={opt.label || opt.title}
                                                    onChange={(e) => {
                                                        const newOpts = [...((selectedNode.data.options as any[]) || [])];
                                                        newOpts[idx] = { ...newOpts[idx], label: e.target.value, title: e.target.value, id: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                                        updateNodeData(selectedNode.id, { options: newOpts });
                                                    }}
                                                />
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => {
                                                    const newOpts = [...((selectedNode.data.options as any[]) || [])];
                                                    newOpts.splice(idx, 1);
                                                    updateNodeData(selectedNode.id, { options: newOpts });
                                                }}>
                                                    &times;
                                                </Button>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="outline" className="w-full border-dashed" onClick={() => {
                                            const newOpts = [...((selectedNode.data.options as any[]) || [])];
                                            newOpts.push({ id: `opt_${Date.now()}`, title: 'Nouvelle option', label: 'Nouvelle option' });
                                            updateNodeData(selectedNode.id, { options: newOpts });
                                        }}>
                                            + Ajouter une option
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ACTION NODE CONFIG */}
                        {selectedNode.type === 'action' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-red-700">Action Système</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'action</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                        value={selectedNode.data.actionType as string || 'tag'}
                                        onChange={(e) => updateNodeData(selectedNode.id, { actionType: e.target.value })}
                                    >
                                        <option value="tag">Ajouter un Tag</option>
                                        <option value="assign">Assigner à un Agent</option>
                                        <option value="close">Clôturer la conversation</option>
                                    </select>
                                </div>
                                {selectedNode.data.actionType === 'tag' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Tag</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                            value={selectedNode.data.details as string || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, { details: e.target.value })}
                                            placeholder="ex: VIP, Support"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Common: Delete Button */}
                        <div className="pt-4 mt-4 border-t">
                            <Button variant="destructive" size="sm" className="w-full" onClick={() => {
                                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                                setSelectedNode(null);
                            }}>
                                Supprimer le nœud
                            </Button>
                        </div>
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
