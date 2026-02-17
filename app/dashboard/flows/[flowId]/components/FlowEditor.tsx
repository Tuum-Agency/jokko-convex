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
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import {
    Save,
    ArrowLeft,
    Sparkles,
    Zap,
    MessageSquare,
    MousePointerClick,
    Settings,
    Plus,
    X,
    LayoutGrid,
    Search,
    Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { CustomNodeMessage } from '../../components/nodes/CustomNodeMessage';
import { CustomNodeStart } from '../../components/nodes/CustomNodeStart';
import { CustomNodeInteractive } from '../../components/nodes/CustomNodeInteractive';
import { CustomNodeAction } from '../../components/nodes/CustomNodeAction';

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
    const [isSaving, setIsSaving] = useState(false);

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
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)),
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
            setSelectedNode(newNode);
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
        setIsSaving(true);
        try {
            await updateFlow({
                flowId: flow._id,
                nodes: JSON.stringify(nodes),
                edges: JSON.stringify(edges),
            });
            // Could add toast here
        } catch (e) {
            console.error("Save failed", e);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
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
        if (selectedNode?.id === id) {
            setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...data } } : null);
        }
    };

    if (!flow) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <p className="text-gray-500 animate-pulse font-medium">Chargement du studio...</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-gray-50/50 overflow-hidden relative font-sans">

            {/* Header - Floating */}
            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
                <Card className="flex-1 bg-white/90 backdrop-blur-md shadow-sm border-gray-200/60 max-w-5xl mx-auto flex items-center justify-between p-2 pl-4 rounded-2xl pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-500 h-8 w-8" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                {flow.name}
                                <Badge variant={flow.isActive ? "default" : "outline"} className={`text-[10px] h-5 px-1.5 ${flow.isActive ? 'bg-green-500 hover:bg-green-600 border-0' : 'text-gray-500 border-gray-300'}`}>
                                    {flow.isActive ? 'ACTIF' : 'BROUILLON'}
                                </Badge>
                            </h1>
                            <p className="text-[10px] text-gray-400 font-medium">Automatisation WhatsApp</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/flows/${flowId}/chat`)}
                            className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 rounded-xl gap-2 h-8 px-3 text-xs font-semibold transition-all border shadow-sm"
                        >
                            <Sparkles className="h-3 w-3" />
                            <span className="hidden sm:inline">IA Builder</span>
                        </Button>
                        <Separator orientation="vertical" className="h-5 mx-1 bg-gray-200" />
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`rounded-xl gap-2 h-8 px-4 text-xs font-medium transition-all shadow-sm ${isSaving ? 'opacity-80' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                        >
                            {isSaving ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Save className="h-3 w-3" />
                            )}
                            Sauvegarder
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Sidebar - Component Palette (Floating Left) */}
            <Card className="absolute left-6 top-24 bottom-6 w-16 hover:w-64 transition-[width] duration-300 ease-in-out z-30 bg-white/95 backdrop-blur shadow-xl border-gray-200/60 rounded-2xl flex flex-col overflow-hidden group">
                <div className="p-4 flex items-center justify-center group-hover:justify-start gap-3 border-b border-gray-100">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                        <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                        Ajouter
                    </span>
                </div>

                <ScrollArea className="flex-1 py-4">
                    <div className="px-2 space-y-6">
                        <div className="px-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                                Essentiels
                            </p>
                            <div className="space-y-2">
                                <DraggableNode
                                    type="start"
                                    label="Déclencheur"
                                    icon={<Zap className="w-5 h-5 text-white" />}
                                    color="bg-yellow-500"
                                    desc="Point de départ"
                                />
                                <DraggableNode
                                    type="message"
                                    label="Message"
                                    icon={<MessageSquare className="w-5 h-5 text-white" />}
                                    color="bg-blue-500"
                                    desc="Envoyer du texte"
                                />
                            </div>
                        </div>

                        <div className="px-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                                Interaction
                            </p>
                            <div className="space-y-2">
                                <DraggableNode
                                    type="interactive"
                                    label="Choix"
                                    icon={<MousePointerClick className="w-5 h-5 text-white" />}
                                    color="bg-purple-500"
                                    desc="Boutons & Listes"
                                />
                                <DraggableNode
                                    type="action"
                                    label="Action"
                                    icon={<Settings className="w-5 h-5 text-white" />}
                                    color="bg-cyan-500"
                                    desc="Actions système"
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-center group-hover:justify-start gap-3 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                        <LayoutGrid className="w-5 h-5" />
                        <span className="text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                            Vue d'ensemble
                        </span>
                    </div>
                </div>
            </Card>

            {/* Properties Panel (Floating Right) */}
            {selectedNode && (
                <Card className="absolute right-6 top-24 bottom-6 w-80 z-30 bg-white/95 backdrop-blur shadow-2xl border-gray-200/60 rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                            <Settings className="w-4 h-4 text-gray-500" />
                            Configuration
                        </h3>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-200/50" onClick={() => setSelectedNode(null)}>
                            <X className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <PropertiesContent selectedNode={selectedNode} updateNodeData={updateNodeData} setNodes={setNodes} setSelectedNode={setSelectedNode} />
                    </ScrollArea>
                </Card>
            )}

            {/* Main Canvas */}
            <div className="flex-1 h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
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
                    fitViewOptions={{ maxZoom: 1.2 }}
                    minZoom={0.2}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#94a3b8' },
                    }}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background
                        color="#e2e8f0"
                        gap={24}
                        size={2}
                        variant={BackgroundVariant.Dots}
                        className="bg-gray-50/50"
                    />
                    <Controls
                        className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden !left-24 !bottom-6 text-gray-600 m-0"
                        showInteractive={false}
                    />
                    <MiniMap
                        className="!right-auto !left-24 !bottom-24 border border-gray-200 shadow-lg rounded-xl overflow-hidden m-0"
                        zoomable
                        pannable
                        nodeColor={(n) => {
                            if (n.type === 'start') return '#eab308';
                            if (n.type === 'message') return '#3b82f6';
                            if (n.type === 'interactive') return '#a855f7';
                            if (n.type === 'action') return '#06b6d4';
                            return '#cbd5e1';
                        }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
}

// Sub-component for Draggable Nodes
function DraggableNode({ type, label, icon, color, desc }: { type: string, label: string, icon: React.ReactNode, color: string, desc: string }) {
    return (
        <div
            className="relative flex items-center gap-3 p-2 rounded-xl cursor-grab hover:bg-gray-100 transition-colors group/node"
            onDragStart={(event) => event.dataTransfer.setData('application/reactflow', type)}
            draggable
        >
            <div className={`h-10 w-10 shrink-0 rounded-xl ${color} shadow-md flex items-center justify-center transition-transform group-hover/node:scale-110`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                <p className="text-[10px] text-gray-500 truncate">{desc}</p>
            </div>
        </div>
    );
}

// Sub-component for Properties Panel Content
function PropertiesContent({ selectedNode, updateNodeData, setNodes, setSelectedNode }: any) {
    if (!selectedNode) return null;

    // MESSAGE NODE CONFIG
    if (selectedNode.type === 'message') {
        return (
            <div className="space-y-6">
                <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Contenu du message</Label>
                    <Textarea
                        className="min-h-[120px] resize-none text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors focus:ring-1 focus:ring-indigo-500"
                        value={selectedNode.data.content as string || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                        placeholder="Bonjour, comment puis-je vous aider ?"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-right">Markdown supporté</p>
                </div>

                <Separator />

                <DeleteNodeAction onDelete={() => {
                    setNodes((nds: any) => nds.filter((n: any) => n.id !== selectedNode.id));
                    setSelectedNode(null);
                }} />
            </div>
        );
    }

    // START NODE CONFIG
    if (selectedNode.type === 'start') {
        return (
            <div className="space-y-6">
                <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Type de déclencheur</Label>
                    <select
                        className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={selectedNode.data.triggerType as string || 'keyword'}
                        onChange={(e) => updateNodeData(selectedNode.id, { triggerType: e.target.value })}
                    >
                        <option value="keyword">Mot-clé spécifique</option>
                        <option value="new_conversation">Nouvelle Conversation</option>
                        <option value="no_reply">Timeout (Pas de réponse)</option>
                    </select>
                </div>

                {(selectedNode.data.triggerType === 'keyword' || !selectedNode.data.triggerType) && (
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Mots-clés</Label>
                        <Input
                            className="bg-gray-50 border-gray-200"
                            value={selectedNode.data.keywords as string || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { keywords: e.target.value })}
                            placeholder="bonjour, salut, info"
                        />
                        <p className="text-[10px] text-gray-400">Séparez les mots-clés par des virgules</p>
                    </div>
                )}
            </div>
        );
    }

    // INTERACTIVE NODE CONFIG
    if (selectedNode.type === 'interactive') {
        return (
            <div className="space-y-6">
                <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Type d'interaction</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            className={`py-2 px-3 text-xs font-medium rounded-md transition-all ${selectedNode.data.interactiveType === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => updateNodeData(selectedNode.id, { interactiveType: 'list' })}
                        >
                            Liste (Menu)
                        </button>
                        <button
                            className={`py-2 px-3 text-xs font-medium rounded-md transition-all ${selectedNode.data.interactiveType === 'button' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => updateNodeData(selectedNode.id, { interactiveType: 'button' })}
                        >
                            Boutons
                        </button>
                    </div>
                </div>

                <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Message principal</Label>
                    <Textarea
                        className="resize-none text-sm bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        rows={3}
                        value={selectedNode.data.content as string || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                        placeholder="Veuillez choisir une option :"
                    />
                </div>

                <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">
                        Options ({((selectedNode.data.options as any[]) || []).length})
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {((selectedNode.data.options as any[]) || []).map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center group">
                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                                    {idx + 1}
                                </div>
                                <Input
                                    className="h-9 w-full text-sm bg-white"
                                    value={opt.label || opt.title}
                                    onChange={(e) => {
                                        const newOpts = [...((selectedNode.data.options as any[]) || [])];
                                        newOpts[idx] = {
                                            ...newOpts[idx],
                                            label: e.target.value,
                                            title: e.target.value,
                                            id: e.target.value.toLowerCase().replace(/\s/g, '_')
                                        };
                                        updateNodeData(selectedNode.id, { options: newOpts });
                                    }}
                                    placeholder={`Option ${idx + 1}`}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newOpts = [...((selectedNode.data.options as any[]) || [])];
                                        newOpts.splice(idx, 1);
                                        updateNodeData(selectedNode.id, { options: newOpts });
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-all font-normal"
                        onClick={() => {
                            const newOpts = [...((selectedNode.data.options as any[]) || [])];
                            newOpts.push({ id: `opt_${Date.now()}`, title: '', label: '' });
                            updateNodeData(selectedNode.id, { options: newOpts });
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une option
                    </Button>
                </div>

                <Separator />

                <DeleteNodeAction onDelete={() => {
                    setNodes((nds: any) => nds.filter((n: any) => n.id !== selectedNode.id));
                    setSelectedNode(null);
                }} />
            </div>
        );
    }

    // ACTION NODE CONFIG
    if (selectedNode.type === 'action') {
        return (
            <div className="space-y-6">
                <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Type d'action</Label>
                    <select
                        className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Nom du Tag</Label>
                        <Input
                            className="bg-gray-50 border-gray-200"
                            value={selectedNode.data.details as string || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { details: e.target.value })}
                            placeholder="ex: VIP, Support, Lead"
                        />
                    </div>
                )}

                <Separator />

                <DeleteNodeAction onDelete={() => {
                    setNodes((nds: any) => nds.filter((n: any) => n.id !== selectedNode.id));
                    setSelectedNode(null);
                }} />
            </div>
        );
    }

    return <div className="text-sm text-gray-500">Sélectionnez un nœud pour le configurer</div>;
}

function DeleteNodeAction({ onDelete }: { onDelete: () => void }) {
    return (
        <div className="pt-2">
            <Button
                variant="destructive"
                size="sm"
                className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none font-medium text-xs h-9"
                onClick={onDelete}
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ce nœud
            </Button>
        </div>
    );
}

export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <TooltipProvider>
                <FlowEditorContent {...props} />
            </TooltipProvider>
        </ReactFlowProvider>
    );
}
