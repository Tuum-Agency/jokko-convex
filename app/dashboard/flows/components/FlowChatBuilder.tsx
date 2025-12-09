'use client';

import { useState, useRef, useEffect } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Handle,
    Position,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Bot, Send, ArrowLeft, Loader2, Save, MessageSquare, Sparkles,
    Eye, EyeOff, LayoutTemplate, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Id } from '@/convex/_generated/dataModel';
import { ButtonGroup } from '@/components/ui/button-group';

// --- Components ---

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

const SUGGESTED_PROMPTS = [
    { title: "Réponse Auto", prompt: "Crée un flux de réponse automatique pour les messages entrants hors horaires." },
    { title: "Menu Principal", prompt: "Crée un menu principal avec 3 options : Support, Ventes, Infos." },
    { title: "Sondage", prompt: "Crée un sondage de satisfaction rapide (1 question)." },
    { title: "Relance", prompt: "Envoie un message, attend 24h, puis envoie une relance." }
];

interface FlowChatBuilderProps {
    initialFlowId?: Id<"flows">;
    initialNodes?: Node[];
    initialEdges?: Edge[];
    initialName?: string;
}

export function FlowChatBuilder({ initialFlowId, initialNodes = [], initialEdges = [], initialName = "Nouveau Flux" }: FlowChatBuilderProps) {
    const router = useRouter();
    const generateFlow = useAction(api.ai.generateFlow);
    const createFromAI = useMutation(api.flows.createFromAI);
    const updateFlow = useMutation(api.flows.update);

    // Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [flowName, setFlowName] = useState(initialName);

    // UI State
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>(
        initialFlowId ? [{ role: 'assistant', content: "Je suis prêt à modifier votre flux existant. Dites-moi ce que vous souhaitez changer." }] : []
    );

    // Auto-scroll logic
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text?: string) => {
        const promptText = text || inputValue;
        if (!promptText.trim()) return;

        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: promptText }]);
        setIsLoading(true);

        // Ensure preview is open when generating
        if (!showPreview) setShowPreview(true);

        try {
            const currentNodesStr = JSON.stringify(nodes);
            const currentEdgesStr = JSON.stringify(edges);

            const result = await generateFlow({
                prompt: promptText,
                currentNodes: nodes.length > 0 ? currentNodesStr : undefined,
                currentEdges: edges.length > 0 ? currentEdgesStr : undefined
            });

            if (result.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Désolé, une erreur est survenue : ${result.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "J'ai mis à jour le flux pour vous." }]);
                if (result.nodes) setNodes(result.nodes);
                if (result.edges) setEdges(result.edges);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (initialFlowId) {
                // Update Existing Flow
                await updateFlow({
                    flowId: initialFlowId,
                    name: flowName,
                    nodes: JSON.stringify(nodes),
                    edges: JSON.stringify(edges),
                });
                router.push(`/dashboard/flows/${initialFlowId}`);
            } else {
                // Create New Flow
                // If the user didn't change the default "Nouveau Flux" name, maybe append a timestamp or leave it.
                // But generally users will edit it if we give them an input.
                const flowId = await createFromAI({
                    name: flowName,
                    description: "Généré via l'assistant",
                    nodes: JSON.stringify(nodes),
                    edges: JSON.stringify(edges),
                });
                router.push(`/dashboard/flows/${flowId}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la sauvegarde");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
            {/* Header */}
            <header className="shrink-0 flex items-center justify-between py-3 px-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <Input
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            className="h-8 w-64 font-medium text-gray-700 border-transparent hover:border-gray-200 focus:border-green-500 px-2"
                            placeholder="Nom du flux"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ButtonGroup>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`text-gray-500 border-r ${showPreview ? 'bg-gray-100' : ''}`}
                        >
                            {showPreview ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                            {showPreview ? "Masquer Aperçu" : "Voir Aperçu"}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {initialFlowId ? "Enregistrer les modifications" : "Créer le flux"}
                        </Button>
                    </ButtonGroup>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Chat Panel (Main) */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                        <div className="max-w-3xl mx-auto py-6">

                            {/* Empty State / Welcome (Only for New Flows) */}
                            {!initialFlowId && messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center pt-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-6 shadow-lg shadow-green-200">
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                        Assistant Flow Builder
                                    </h1>
                                    <p className="text-gray-500 text-center text-base max-w-lg mb-10 leading-relaxed">
                                        Je suis là pour créer vos automatisations WhatsApp. Décrivez ce que vous souhaitez faire (message de bienvenue, menu, sondage...) et je m'occupe de la structure.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                        {SUGGESTED_PROMPTS.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSend(item.prompt)}
                                                className="group flex flex-col items-start gap-1 p-4 rounded-xl border border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/30 transition-all hover:shadow-md text-left"
                                            >
                                                <span className="text-sm font-semibold text-gray-900 group-hover:text-green-700 flex items-center gap-2">
                                                    <Zap className="w-3 h-3" /> {item.title}
                                                </span>
                                                <span className="text-xs text-gray-500 line-clamp-2">
                                                    {item.prompt}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Message History */}
                            <div className="space-y-6">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm leading-relaxed ${m.role === 'user'
                                            ? 'bg-green-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-md'
                                            }`}>
                                            {m.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wider opacity-70">
                                                    <Bot className="w-3 h-3" /> Assistant
                                                </div>
                                            )}
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-4 text-sm text-gray-500 flex items-center gap-3 shadow-sm">
                                            <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                                            <span className="animate-pulse">Génération du flux en cours...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="shrink-0 border-t border-gray-100 bg-white p-4 z-20">
                        <div className="max-w-3xl mx-auto relative">
                            <div className="relative shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100 border border-gray-200">
                                <Textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Décrivez votre automatisation..."
                                    className="w-full min-h-[56px] max-h-40 resize-none border-0 bg-transparent focus-visible:ring-0 px-4 py-4 pr-14 text-base"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-2 bottom-2">
                                    <Button
                                        size="icon"
                                        onClick={() => handleSend()}
                                        disabled={!inputValue.trim() || isLoading}
                                        className={cn(
                                            "h-10 w-10 rounded-xl transition-all",
                                            !inputValue.trim() ? "bg-gray-200 text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
                                Appuyez sur Entrée pour envoyer
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Panel (Side) */}
                {showPreview && (
                    <div className="w-[45%] border-l border-gray-200 bg-slate-50 relative flex flex-col shadow-inner">
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
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    nodeTypes={nodeTypes}
                                    fitView
                                    className="bg-slate-50/50"
                                >
                                    <Background color="#94a3b8" gap={20} size={1} className="opacity-40" />
                                    <Controls className="bg-white shadow-sm border border-gray-100" />
                                </ReactFlow>
                            </ReactFlowProvider>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
