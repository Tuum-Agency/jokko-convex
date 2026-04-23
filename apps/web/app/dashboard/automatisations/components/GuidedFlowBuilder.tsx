'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Check, Sparkles, Save,
    MessageSquareText, Headphones, ShoppingBag, BarChart3, RefreshCw, Wrench,
    MessageCircle, Hash, Radio,
    MousePointerClick, List, X,
    UserPlus, Tag, XCircle, Minus,
    Plus, Loader2, Trash2, Pencil,
    StickyNote, Bell, Clock, CheckCircle2,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    useGuidedFlowStore,
    ACTION_LABELS,
    type FlowStep,
} from '@/lib/stores/guided-flow-store';
import { FlowPreviewPanel } from './FlowPreviewPanel';
import type { Node } from '@xyflow/react';

// ─── Constants ─────────────────────────────────────────

const WIZARD_STEPS = [
    { title: 'Objectif', description: "Quel est l'objectif de votre automatisation ?" },
    { title: 'Déclencheur', description: 'Quand doit-elle se déclencher ?' },
    { title: 'Construire le flux', description: 'Ajoutez les étapes de votre automatisation' },
    { title: 'Résumé', description: 'Vérifiez et sauvegardez votre automatisation' },
];

const OBJECTIVES = [
    { id: 'accueil', title: 'Accueil', description: 'Message de bienvenue pour les nouveaux contacts', icon: MessageSquareText, color: 'from-[#14532d] to-[#059669]' },
    { id: 'support', title: 'Support', description: "Orienter les demandes d'aide client", icon: Headphones, color: 'from-[#166534] to-[#0d9488]' },
    { id: 'ventes', title: 'Ventes', description: 'Présenter vos produits et services', icon: ShoppingBag, color: 'from-[#15803d] to-[#10b981]' },
    { id: 'sondage', title: 'Sondage', description: "Recueillir l'avis de vos contacts", icon: BarChart3, color: 'from-[#14532d] to-[#34d399]' },
    { id: 'relance', title: 'Relance', description: 'Reprendre contact automatiquement', icon: RefreshCw, color: 'from-[#166534] to-[#059669]' },
    { id: 'personnalise', title: 'Personnalisé', description: 'Créer une automatisation sur mesure', icon: Wrench, color: 'from-[#15803d] to-[#0d9488]' },
];

const TRIGGERS = [
    { id: 'new_conversation', title: 'Nouveau message', description: 'Quand un contact envoie un premier message', icon: MessageCircle },
    { id: 'keyword', title: 'Mot-clé spécifique', description: 'Quand un message contient certains mots', icon: Hash },
    { id: 'all', title: 'Tout message', description: 'Se déclenche pour chaque message reçu', icon: Radio },
];

interface StepTypeItem {
    type: 'message' | 'interactive' | 'action';
    subType?: 'buttons' | 'list';
    actionType?: string;
    title: string;
    description: string;
    icon: LucideIcon;
}

interface StepTypeCategory {
    title: string;
    icon: LucideIcon;
    color: string;
    items: StepTypeItem[];
}

const STEP_TYPE_CATEGORIES: StepTypeCategory[] = [
    {
        title: 'Communication',
        icon: MessageSquareText,
        color: 'text-blue-600',
        items: [
            { type: 'message', title: 'Message texte', description: 'Envoyer un message au contact', icon: MessageSquareText },
            { type: 'interactive', subType: 'buttons', title: 'Boutons', description: "Proposer jusqu'à 3 boutons cliquables", icon: MousePointerClick },
            { type: 'interactive', subType: 'list', title: 'Liste déroulante', description: "Proposer un menu avec plusieurs options", icon: List },
        ],
    },
    {
        title: 'Contact & Attribution',
        icon: UserPlus,
        color: 'text-cyan-600',
        items: [
            { type: 'action', actionType: 'assign', title: 'Assigner à un agent', description: 'Transférer la conversation à un membre', icon: UserPlus },
            { type: 'action', actionType: 'tag', title: 'Ajouter un tag', description: 'Catégoriser le contact automatiquement', icon: Tag },
        ],
    },
    {
        title: 'Conversation',
        icon: MessageCircle,
        color: 'text-violet-600',
        items: [
            { type: 'action', actionType: 'close', title: 'Clôturer', description: 'Fermer la conversation automatiquement', icon: XCircle },
            { type: 'action', actionType: 'note', title: 'Ajouter une note', description: 'Note interne visible par votre équipe', icon: StickyNote },
            { type: 'action', actionType: 'resolve', title: 'Marquer résolu', description: 'Indiquer que le sujet est traité', icon: CheckCircle2 },
        ],
    },
    {
        title: 'Automatisation',
        icon: Sparkles,
        color: 'text-amber-600',
        items: [
            { type: 'action', actionType: 'notify', title: "Notifier l'équipe", description: 'Envoyer une alerte à votre équipe', icon: Bell },
            { type: 'action', actionType: 'wait', title: 'Temporiser', description: 'Attendre avant de continuer le flux', icon: Clock },
        ],
    },
];

const STEP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    message: { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700' },
    interactive: { bg: 'bg-violet-500', border: 'border-violet-200', text: 'text-violet-700' },
    action: { bg: 'bg-cyan-500', border: 'border-cyan-200', text: 'text-cyan-700' },
};

const slideVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

// ─── Main Component ────────────────────────────────────

interface GuidedFlowBuilderProps {
    flowId?: string;
}

export function GuidedFlowBuilder({ flowId }: GuidedFlowBuilderProps) {
    const router = useRouter();
    const createFromAI = useMutation(api.flows.createFromAI);
    const updateFlowMutation = useMutation(api.flows.update);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingStep, setIsAddingStep] = useState(false);
    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
    const hydratedRef = useRef(false);

    const isEditMode = !!flowId;
    const flow = useQuery(
        api.flows.get,
        flowId ? { flowId: flowId as Id<"flows"> } : "skip"
    );

    const {
        currentStep, answers, generatedNodes, generatedEdges, flowName, editingFlowId,
        setAnswer, nextStep, prevStep, generateFlow, setFlowName, reset,
        hydrateFromFlow, addStep, updateStep, removeStep,
    } = useGuidedFlowStore();

    // Reset store when mounting in creation mode
    useEffect(() => {
        if (!flowId) {
            reset();
        }
    }, [flowId, reset]);

    // Hydrate store from existing flow data (edit mode, only once)
    useEffect(() => {
        if (flow && flowId && !hydratedRef.current) {
            hydratedRef.current = true;
            const nodes: Node[] = flow.nodes ? JSON.parse(flow.nodes) : [];
            hydrateFromFlow(flowId, flow.name, nodes, flow.triggerType, flow.triggerConfig ?? undefined);
        }
    }, [flow, flowId, hydrateFromFlow]);

    useEffect(() => {
        hydratedRef.current = false;
    }, [flowId]);

    // Regenerate flow preview whenever answers change
    useEffect(() => {
        generateFlow();
    }, [answers.objective, answers.triggerType, answers.triggerKeyword, answers.steps, generateFlow]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            generateFlow();
            const { generatedNodes: nodes, generatedEdges: edges, answers: currentAnswers, editingFlowId: editId } = useGuidedFlowStore.getState();

            const triggerTypeMap: Record<string, string> = {
                new_conversation: 'NEW_CONVERSATION',
                keyword: 'KEYWORD',
                all: 'NEW_CONVERSATION',
            };
            const backendTriggerType = triggerTypeMap[currentAnswers.triggerType || 'new_conversation'] || 'NEW_CONVERSATION';
            const triggerConfig = currentAnswers.triggerKeyword
                ? JSON.stringify({ keywords: currentAnswers.triggerKeyword })
                : undefined;

            if (editId) {
                await updateFlowMutation({
                    flowId: editId as Id<"flows">,
                    name: flowName || 'Nouvelle automatisation',
                    triggerType: backendTriggerType,
                    triggerConfig,
                    nodes: JSON.stringify(nodes),
                    edges: JSON.stringify(edges),
                });
                toast.success('Automatisation mise à jour !');
                reset();
                router.push(`/dashboard/automatisations/${editId}`);
            } else {
                const newFlowId = await createFromAI({
                    name: flowName || 'Nouvelle automatisation',
                    description: "Créé via l'assistant guidé",
                    triggerType: backendTriggerType,
                    triggerConfig,
                    nodes: JSON.stringify(nodes),
                    edges: JSON.stringify(edges),
                });
                toast.success('Automatisation créée avec succès !');
                reset();
                router.push(`/dashboard/automatisations/${newFlowId}`);
            }
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: return !!answers.objective;
            case 1: return !!answers.triggerType && (answers.triggerType !== 'keyword' || !!answers.triggerKeyword);
            case 2: return answers.steps.length > 0;
            case 3: return true;
            default: return false;
        }
    };

    const handleAddStepType = (item: StepTypeItem) => {
        const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newStep: FlowStep = { id, type: item.type };

        if (item.type === 'message') {
            newStep.content = '';
        } else if (item.type === 'interactive') {
            newStep.interactiveType = item.subType || 'buttons';
            newStep.options = [
                { id: `opt-${Date.now()}`, title: '' },
                { id: `opt-${Date.now() + 1}`, title: '' },
            ];
        } else if (item.type === 'action') {
            newStep.actionType = item.actionType;
        }

        addStep(newStep);
        setIsAddingStep(false);
        // Auto-expand the new step for editing (unless it's a simple action)
        if (item.type !== 'action') {
            setExpandedStepId(id);
        }
    };

    const handleRemoveStep = (stepId: string) => {
        removeStep(stepId);
        if (expandedStepId === stepId) setExpandedStepId(null);
    };

    return (
        <div className="-m-3 sm:-m-4 lg:-m-6 flex h-[calc(100vh-64px)] bg-white">
            {/* Left Panel - Wizard */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header with progress */}
                <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Input
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                                className="h-8 w-64 font-medium text-gray-700 border-transparent hover:border-gray-200 focus:border-green-500 px-2"
                                placeholder="Nom de l'automatisation"
                            />
                        </div>
                        <span className="text-xs text-gray-400">
                            Étape {currentStep + 1} / {WIZARD_STEPS.length}
                        </span>
                    </div>
                    <div className="flex gap-1.5">
                        {WIZARD_STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                                    i <= currentStep ? 'bg-green-500' : 'bg-gray-200'
                                )}
                            />
                        ))}
                    </div>
                </header>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-2xl mx-auto">
                        {/* Assistant avatar + question */}
                        <div className="flex items-start gap-3 mb-8">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] flex items-center justify-center shrink-0 shadow-lg shadow-green-900/20">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                    {WIZARD_STEPS[currentStep].title}
                                </p>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {WIZARD_STEPS[currentStep].description}
                                </h2>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                            >
                                {/* Step 0: Objective */}
                                {currentStep === 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {OBJECTIVES.map((obj) => {
                                            const Icon = obj.icon;
                                            const selected = answers.objective === obj.id;
                                            return (
                                                <button
                                                    key={obj.id}
                                                    onClick={() => setAnswer('objective', obj.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center cursor-pointer",
                                                        selected
                                                            ? 'border-green-500 bg-green-50/50 shadow-md'
                                                            : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/20'
                                                    )}
                                                >
                                                    <div className={cn("h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", obj.color)}>
                                                        <Icon className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{obj.title}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{obj.description}</p>
                                                    </div>
                                                    {selected && (
                                                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Step 1: Trigger */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {TRIGGERS.map((trigger) => {
                                                const Icon = trigger.icon;
                                                const selected = answers.triggerType === trigger.id;
                                                return (
                                                    <button
                                                        key={trigger.id}
                                                        onClick={() => setAnswer('triggerType', trigger.id)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center cursor-pointer",
                                                            selected
                                                                ? 'border-green-500 bg-green-50/50 shadow-md'
                                                                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/20'
                                                        )}
                                                    >
                                                        <Icon className={cn("h-6 w-6", selected ? 'text-green-600' : 'text-gray-400')} />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{trigger.title}</p>
                                                            <p className="text-[11px] text-gray-500 mt-0.5">{trigger.description}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {answers.triggerType === 'keyword' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-4"
                                            >
                                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                    Entrez vos mots-clés (séparés par des virgules)
                                                </label>
                                                <Input
                                                    value={answers.triggerKeyword || ''}
                                                    onChange={(e) => setAnswer('triggerKeyword', e.target.value)}
                                                    placeholder="bonjour, salut, info, aide..."
                                                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl"
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Dynamic Flow Builder */}
                                {currentStep === 2 && (
                                    <div className="space-y-3">
                                        {/* Steps Timeline */}
                                        {answers.steps.length === 0 && !isAddingStep && (
                                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                                                <MessageSquareText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-500 mb-1">Votre flux est vide</p>
                                                <p className="text-xs text-gray-400 mb-4">
                                                    Ajoutez des étapes pour construire votre automatisation
                                                </p>
                                                <Button
                                                    onClick={() => setIsAddingStep(true)}
                                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                                                    size="sm"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Ajouter une étape
                                                </Button>
                                            </div>
                                        )}

                                        {answers.steps.map((step, index) => (
                                            <StepCard
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                isLast={index === answers.steps.length - 1}
                                                isExpanded={expandedStepId === step.id}
                                                onToggle={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                                                onUpdate={(updates) => updateStep(step.id, updates)}
                                                onRemove={() => handleRemoveStep(step.id)}
                                            />
                                        ))}

                                        {/* Add Step Button */}
                                        {answers.steps.length > 0 && !isAddingStep && (
                                            <button
                                                onClick={() => setIsAddingStep(true)}
                                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/30 transition-all cursor-pointer"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Ajouter une étape
                                            </button>
                                        )}

                                        {/* Step Type Selector */}
                                        {isAddingStep && (
                                            <StepTypeSelector
                                                onSelect={handleAddStepType}
                                                onCancel={() => setIsAddingStep(false)}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Summary */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-3">
                                            <SummaryRow
                                                label="Objectif"
                                                value={OBJECTIVES.find(o => o.id === answers.objective)?.title || '-'}
                                            />
                                            <SummaryRow
                                                label="Déclencheur"
                                                value={TRIGGERS.find(t => t.id === answers.triggerType)?.title || '-'}
                                            />
                                            {answers.triggerKeyword && (
                                                <SummaryRow label="Mots-clés" value={answers.triggerKeyword} />
                                            )}
                                            <div className="border-t border-gray-200 pt-3 mt-3">
                                                <p className="text-xs font-medium text-gray-500 mb-2">
                                                    Étapes du flux ({answers.steps.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {answers.steps.map((step, i) => (
                                                        <div key={step.id} className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                                                            <div className={cn("h-2 w-2 rounded-full shrink-0", STEP_COLORS[step.type].bg)} />
                                                            <span className="text-sm text-gray-900">{getStepSummary(step)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="w-full h-11 bg-gradient-to-r from-[#14532d] to-[#059669] hover:from-[#166534] hover:to-[#0d9488] text-white rounded-xl shadow-lg shadow-green-900/20 gap-2"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            {isEditMode ? 'Enregistrer les modifications' : "Créer l'automatisation"}
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation buttons */}
                {currentStep < 3 && (
                    <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="gap-2 text-gray-500"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Button>
                            <Button
                                onClick={nextStep}
                                disabled={!canProceed()}
                                className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                            >
                                Continuer
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
                        <div className="max-w-2xl mx-auto flex items-center justify-start">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                className="gap-2 text-gray-500"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel - Preview */}
            <div className="hidden lg:flex w-[40%]">
                <FlowPreviewPanel nodes={generatedNodes} edges={generatedEdges} />
            </div>
        </div>
    );
}

// ─── Helper: Step summary text ─────────────────────────

function getStepSummary(step: FlowStep): string {
    if (step.type === 'message') {
        return step.content
            ? `Message : ${step.content.substring(0, 50)}${step.content.length > 50 ? '...' : ''}`
            : 'Message texte';
    }
    if (step.type === 'interactive') {
        const count = step.options?.length || 0;
        return step.interactiveType === 'buttons'
            ? `${count} bouton(s)`
            : `Liste de ${count} option(s)`;
    }
    if (step.type === 'action') {
        return ACTION_LABELS[step.actionType || ''] || 'Action';
    }
    return '';
}

// ─── Sub-component: Step Card ──────────────────────────

function StepCard({
    step, index, isLast, isExpanded, onToggle, onUpdate, onRemove,
}: {
    step: FlowStep;
    index: number;
    isLast: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (updates: Partial<FlowStep>) => void;
    onRemove: () => void;
}) {
    const colors = STEP_COLORS[step.type];
    const icon = getStepIcon(step);
    const Icon = icon;

    return (
        <div className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[16px]" />}
            </div>

            {/* Step content */}
            <div className={cn("flex-1 rounded-xl border transition-all mb-1", isExpanded ? colors.border : 'border-gray-200')}>
                {/* Header (always visible) */}
                <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={onToggle}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-400">{index + 1}.</span>
                        <span className={cn("text-sm font-medium", colors.text)}>
                            {getStepTypeLabel(step)}
                        </span>
                        {!isExpanded && step.type === 'message' && step.content && (
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                — {step.content.substring(0, 40)}{step.content.length > 40 ? '...' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-gray-600"
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Expanded editor */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 space-y-3">
                                <StepEditor step={step} onUpdate={onUpdate} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Sub-component: Step Editor (inline) ───────────────

function StepEditor({
    step,
    onUpdate,
}: {
    step: FlowStep;
    onUpdate: (updates: Partial<FlowStep>) => void;
}) {
    if (step.type === 'message') {
        return (
            <Textarea
                value={step.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Tapez le message que vos contacts recevront..."
                className="min-h-[100px] border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg text-sm leading-relaxed resize-none"
            />
        );
    }

    if (step.type === 'interactive') {
        const options = step.options || [];
        const maxOptions = step.interactiveType === 'buttons' ? 3 : 10;

        return (
            <div className="space-y-3">
                {/* Type selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onUpdate({ interactiveType: 'buttons' })}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all",
                            step.interactiveType === 'buttons'
                                ? 'border-violet-400 bg-violet-50 text-violet-700'
                                : 'border-gray-200 text-gray-500 hover:border-violet-300'
                        )}
                    >
                        <MousePointerClick className="h-3.5 w-3.5 inline mr-1.5" />
                        Boutons
                    </button>
                    <button
                        onClick={() => onUpdate({ interactiveType: 'list' })}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all",
                            step.interactiveType === 'list'
                                ? 'border-violet-400 bg-violet-50 text-violet-700'
                                : 'border-gray-200 text-gray-500 hover:border-violet-300'
                        )}
                    >
                        <List className="h-3.5 w-3.5 inline mr-1.5" />
                        Liste
                    </button>
                </div>

                {/* Options */}
                {options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                        <Input
                            value={opt.title}
                            onChange={(e) => {
                                const updated = [...options];
                                updated[i] = { ...updated[i], title: e.target.value };
                                onUpdate({ options: updated });
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 border-gray-200 focus:border-green-500 rounded-lg h-9 text-sm"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500"
                            onClick={() => onUpdate({ options: options.filter((_, idx) => idx !== i) })}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
                {options.length < maxOptions && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onUpdate({
                                options: [...options, { id: `opt-${Date.now()}`, title: '' }],
                            })
                        }
                        className="h-8 gap-1.5 text-xs rounded-full"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter une option
                    </Button>
                )}
            </div>
        );
    }

    if (step.type === 'action') {
        return (
            <div className="text-sm text-gray-500">
                {ACTION_LABELS[step.actionType || ''] || 'Action'}
                <p className="text-xs text-gray-400 mt-1">
                    Cette action sera exécutée automatiquement à cette étape du flux.
                </p>
            </div>
        );
    }

    return null;
}

// ─── Sub-component: Step Type Selector ─────────────────

function StepTypeSelector({
    onSelect,
    onCancel,
}: {
    onSelect: (item: StepTypeItem) => void;
    onCancel: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Choisir un type d&apos;étape</p>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onCancel}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-4 space-y-5">
                {STEP_TYPE_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                        <div key={cat.title}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <CatIcon className={cn("h-3.5 w-3.5", cat.color)} />
                                <p className={cn("text-xs font-semibold uppercase tracking-wider", cat.color)}>
                                    {cat.title}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {cat.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <button
                                            key={`${item.type}-${item.subType || item.actionType || ''}`}
                                            onClick={() => onSelect(item)}
                                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50/30 transition-all text-left cursor-pointer group"
                                        >
                                            <ItemIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                <p className="text-[11px] text-gray-500 leading-tight">{item.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ─── Helpers ───────────────────────────────────────────

function getStepTypeLabel(step: FlowStep): string {
    if (step.type === 'message') return 'Message texte';
    if (step.type === 'interactive') {
        return step.interactiveType === 'buttons' ? 'Boutons' : 'Liste';
    }
    if (step.type === 'action') {
        return ACTION_LABELS[step.actionType || ''] || 'Action';
    }
    return '';
}

function getStepIcon(step: FlowStep): LucideIcon {
    if (step.type === 'message') return MessageSquareText;
    if (step.type === 'interactive') {
        return step.interactiveType === 'buttons' ? MousePointerClick : List;
    }
    if (step.type === 'action') {
        const icons: Record<string, LucideIcon> = {
            assign: UserPlus,
            tag: Tag,
            close: XCircle,
            note: StickyNote,
            notify: Bell,
            wait: Clock,
            resolve: CheckCircle2,
        };
        return icons[step.actionType || ''] || Sparkles;
    }
    return Sparkles;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-medium text-gray-500 shrink-0">{label}</span>
            <span className="text-sm text-gray-900 text-right">{value}</span>
        </div>
    );
}
