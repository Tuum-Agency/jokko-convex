import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';

// A single step/block in the dynamic flow builder
export interface FlowStep {
    id: string;
    type: 'message' | 'interactive' | 'action';
    // Message
    content?: string;
    // Interactive
    interactiveType?: 'buttons' | 'list';
    options?: { id: string; title: string }[];
    // Action
    actionType?: string;
}

export interface GuidedFlowAnswers {
    objective: string | null;
    triggerType: string | null;
    triggerKeyword: string | null;
    steps: FlowStep[];
}

interface GuidedFlowState {
    currentStep: number; // 0=Objectif, 1=Déclencheur, 2=Builder, 3=Résumé
    answers: GuidedFlowAnswers;
    generatedNodes: Node[];
    generatedEdges: Edge[];
    flowName: string;
    editingFlowId: string | null;

    // Actions
    setAnswer: <K extends keyof GuidedFlowAnswers>(key: K, value: GuidedFlowAnswers[K]) => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    reset: () => void;
    generateFlow: () => void;
    setFlowName: (name: string) => void;
    hydrateFromFlow: (flowId: string, name: string, nodes: Node[], triggerType: string, triggerConfig?: string) => void;
    addStep: (step: FlowStep) => void;
    updateStep: (stepId: string, updates: Partial<FlowStep>) => void;
    removeStep: (stepId: string) => void;
}

const OBJECTIVE_MESSAGES: Record<string, string> = {
    accueil: "Bonjour ! 👋 Bienvenue. Comment puis-je vous aider aujourd'hui ?",
    support: "Bonjour ! Notre équipe support est là pour vous aider. Décrivez votre problème et nous vous répondrons rapidement.",
    ventes: "Bonjour ! 🎉 Merci de votre intérêt. Voici nos offres du moment.",
    sondage: "Bonjour ! Nous aimerions connaître votre avis. Cela ne prendra qu'une minute.",
    relance: "Bonjour ! Nous voulions prendre de vos nouvelles. Avez-vous des questions ?",
    personnalise: "",
};

const OBJECTIVE_CHOICES: Record<string, { id: string; title: string }[]> = {
    accueil: [
        { id: 'info', title: 'Informations' },
        { id: 'support', title: 'Support' },
        { id: 'ventes', title: 'Ventes' },
    ],
    support: [
        { id: 'technique', title: 'Problème technique' },
        { id: 'facturation', title: 'Facturation' },
        { id: 'autre', title: 'Autre' },
    ],
    ventes: [
        { id: 'catalogue', title: 'Voir le catalogue' },
        { id: 'promo', title: 'Promotions' },
        { id: 'devis', title: 'Demander un devis' },
    ],
    sondage: [
        { id: 'satisfait', title: '😊 Satisfait' },
        { id: 'neutre', title: '😐 Neutre' },
        { id: 'insatisfait', title: '😞 Insatisfait' },
    ],
    relance: [
        { id: 'interesse', title: 'Oui, je suis intéressé' },
        { id: 'plus_tard', title: 'Pas maintenant' },
    ],
    personnalise: [],
};

const OBJECTIVE_NAMES: Record<string, string> = {
    accueil: 'Message de bienvenue',
    support: 'Support client',
    ventes: 'Assistant ventes',
    sondage: 'Sondage satisfaction',
    relance: 'Relance automatique',
    personnalise: 'Automatisation personnalisée',
};

const ACTION_LABELS: Record<string, string> = {
    assign: 'Assigner à un agent',
    tag: 'Ajouter un tag',
    close: 'Clôturer la conversation',
    note: 'Ajouter une note',
    notify: "Notifier l'équipe",
    wait: 'Temporiser',
    resolve: 'Marquer comme résolu',
};

const initialAnswers: GuidedFlowAnswers = {
    objective: null,
    triggerType: null,
    triggerKeyword: null,
    steps: [],
};

function buildNodes(answers: GuidedFlowAnswers): Node[] {
    const nodes: Node[] = [];
    let y = 0;

    // Start node (trigger)
    nodes.push({
        id: 'start-1',
        type: 'start',
        position: { x: 250, y },
        data: {
            label: 'Déclencheur',
            triggerType: answers.triggerType === 'keyword' ? 'keyword' : 'NEW_CONVERSATION',
            keywords: answers.triggerKeyword || '',
        },
    });
    y += 150;

    // Generate nodes from dynamic steps
    for (const step of answers.steps) {
        if (step.type === 'message' && step.content) {
            nodes.push({
                id: step.id,
                type: 'message',
                position: { x: 250, y },
                data: { label: 'Message Texte', content: step.content },
            });
            y += 150;
        }

        if (step.type === 'interactive' && step.options && step.options.length > 0) {
            nodes.push({
                id: step.id,
                type: 'interactive',
                position: { x: 250, y },
                data: {
                    label: 'Choix',
                    content: 'Veuillez choisir une option :',
                    interactiveType: step.interactiveType === 'buttons' ? 'button' : 'list',
                    options: step.options.map(o => ({ id: o.id, title: o.title, label: o.title })),
                },
            });
            y += 150;
        }

        if (step.type === 'action' && step.actionType) {
            nodes.push({
                id: step.id,
                type: 'action',
                position: { x: 250, y },
                data: {
                    label: ACTION_LABELS[step.actionType] || 'Action',
                    actionType: step.actionType,
                    details: '',
                },
            });
            y += 150;
        }
    }

    return nodes;
}

function buildEdges(nodes: Node[]): Edge[] {
    const edges: Edge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
            id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
            source: nodes[i].id,
            target: nodes[i + 1].id,
            animated: true,
            style: { stroke: '#059669', strokeWidth: 2 },
        });
    }
    return edges;
}

// Reverse-map parsed nodes back to the steps-based answer model
function reverseMapNodes(nodes: Node[], triggerType: string, triggerConfig?: string): GuidedFlowAnswers {
    const answers: GuidedFlowAnswers = {
        objective: 'personnalise',
        triggerType: null,
        triggerKeyword: null,
        steps: [],
    };

    const triggerMap: Record<string, string> = {
        NEW_CONVERSATION: 'new_conversation',
        KEYWORD: 'keyword',
    };
    answers.triggerType = triggerMap[triggerType] || 'new_conversation';

    if (triggerConfig) {
        try {
            const config = JSON.parse(triggerConfig);
            answers.triggerKeyword = config.keywords || null;
        } catch { /* ignore */ }
    }

    for (const node of nodes) {
        if (node.type === 'start') {
            if (!answers.triggerKeyword) {
                answers.triggerKeyword = (node.data as Record<string, unknown>).keywords as string || null;
            }
            continue;
        }

        if (node.type === 'message') {
            answers.steps.push({
                id: node.id,
                type: 'message',
                content: (node.data as Record<string, unknown>).content as string || '',
            });
        }

        if (node.type === 'interactive') {
            const data = node.data as Record<string, unknown>;
            const iType = data.interactiveType as string;
            answers.steps.push({
                id: node.id,
                type: 'interactive',
                interactiveType: iType === 'button' ? 'buttons' : 'list',
                options: ((data.options as { id: string; title: string }[]) || []).map(o => ({ id: o.id, title: o.title })),
            });
        }

        if (node.type === 'action') {
            answers.steps.push({
                id: node.id,
                type: 'action',
                actionType: (node.data as Record<string, unknown>).actionType as string || '',
            });
        }
    }

    return answers;
}

export const useGuidedFlowStore = create<GuidedFlowState>((set, get) => ({
    currentStep: 0,
    answers: { ...initialAnswers },
    generatedNodes: [],
    generatedEdges: [],
    flowName: '',
    editingFlowId: null,

    setAnswer: (key, value) => {
        set((state) => {
            const newAnswers = { ...state.answers, [key]: value };

            // Auto-fill default steps when objective is selected and steps list is empty
            if (key === 'objective' && typeof value === 'string') {
                if (state.answers.steps.length === 0) {
                    const defaultSteps: FlowStep[] = [];
                    const msg = OBJECTIVE_MESSAGES[value];
                    if (msg) {
                        defaultSteps.push({
                            id: `msg-${Date.now()}`,
                            type: 'message',
                            content: msg,
                        });
                    }
                    const choices = OBJECTIVE_CHOICES[value];
                    if (choices && choices.length > 0) {
                        defaultSteps.push({
                            id: `int-${Date.now() + 1}`,
                            type: 'interactive',
                            interactiveType: 'buttons',
                            options: [...choices],
                        });
                    }
                    newAnswers.steps = defaultSteps;
                }
                return {
                    answers: newAnswers,
                    flowName: OBJECTIVE_NAMES[value] || state.flowName,
                };
            }

            return { answers: newAnswers };
        });
    },

    nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
    prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
    goToStep: (step) => set({ currentStep: step }),

    reset: () => set({
        currentStep: 0,
        answers: { ...initialAnswers },
        generatedNodes: [],
        generatedEdges: [],
        flowName: '',
        editingFlowId: null,
    }),

    generateFlow: () => {
        const { answers } = get();
        const nodes = buildNodes(answers);
        const edges = buildEdges(nodes);
        set({ generatedNodes: nodes, generatedEdges: edges });
    },

    setFlowName: (name) => set({ flowName: name }),

    hydrateFromFlow: (flowId, name, nodes, triggerType, triggerConfig) => {
        const answers = reverseMapNodes(nodes, triggerType, triggerConfig);
        const generatedNodes = buildNodes(answers);
        const generatedEdges = buildEdges(generatedNodes);
        set({
            editingFlowId: flowId,
            flowName: name,
            answers,
            generatedNodes,
            generatedEdges,
            currentStep: 0,
        });
    },

    addStep: (step) => {
        set((state) => ({
            answers: {
                ...state.answers,
                steps: [...state.answers.steps, step],
            },
        }));
    },

    updateStep: (stepId, updates) => {
        set((state) => ({
            answers: {
                ...state.answers,
                steps: state.answers.steps.map(s =>
                    s.id === stepId ? { ...s, ...updates } : s
                ),
            },
        }));
    },

    removeStep: (stepId) => {
        set((state) => ({
            answers: {
                ...state.answers,
                steps: state.answers.steps.filter(s => s.id !== stepId),
            },
        }));
    },
}));

export { OBJECTIVE_MESSAGES, OBJECTIVE_CHOICES, OBJECTIVE_NAMES, ACTION_LABELS };
