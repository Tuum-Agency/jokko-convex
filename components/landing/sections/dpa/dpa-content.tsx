"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";

const sections = [
    {
        num: "01",
        title: "Parties",
        body: [
            "Le présent accord est conclu entre **le Client**, entité juridique ayant souscrit au service Jokko, agissant en qualité de responsable de traitement au sens du RGPD (ci-après « le Responsable »), et **Jokko SAS**, société par actions simplifiée au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 919 482 731, dont le siège social est situé 45 rue de Rivoli, 75001 Paris (ci-après « le Sous-traitant »).",
        ],
    },
    {
        num: "02",
        title: "Objet",
        body: [
            "Le Sous-traitant est mandaté par le Responsable pour traiter des données à caractère personnel dans le cadre de l'exploitation de la plateforme Jokko — service SaaS de centralisation des conversations WhatsApp Business.",
            "Les catégories de données traitées incluent : identité des contacts finaux (nom, numéro de téléphone, photo de profil), contenu des conversations (messages texte, médias, statuts de lecture), données techniques (adresse IP, logs d'accès), métadonnées (horodatages, statuts d'envoi).",
        ],
    },
    {
        num: "03",
        title: "Durée",
        body: [
            "Le présent accord prend effet à la date d'activation du service et demeure en vigueur pendant toute la durée du contrat principal entre les parties.",
            "À l'issue du contrat, le Sous-traitant s'engage à restituer ou supprimer, au choix du Responsable, l'ensemble des données personnelles dans un délai maximum de 30 jours.",
        ],
    },
    {
        num: "04",
        title: "Obligations du Sous-traitant",
        body: [
            "Traiter les données uniquement sur instruction documentée du Responsable, y compris en matière de transferts hors UE.",
            "Garantir la confidentialité par une obligation écrite signée par toute personne autorisée à accéder aux données.",
            "Mettre en œuvre les mesures techniques et organisationnelles appropriées (chiffrement AES-256 au repos, TLS 1.3 en transit, MFA pour les accès administrateurs, journalisation des accès).",
            "Assister le Responsable dans l'exercice des droits des personnes concernées (accès, rectification, effacement, portabilité, opposition).",
            "Notifier toute violation de données au Responsable dans un délai maximum de 48 heures après en avoir pris connaissance.",
        ],
    },
    {
        num: "05",
        title: "Sous-traitants ultérieurs",
        body: [
            "Le Responsable autorise le Sous-traitant à recourir aux sous-traitants suivants :",
            "• **Vercel Inc.** (hébergement frontend, CDN) — États-Unis, sous clauses contractuelles types.",
            "• **Convex Inc.** (base de données temps réel, stockage applicatif) — États-Unis, sous clauses contractuelles types.",
            "• **Meta Platforms Ireland Ltd.** (WhatsApp Business API, livraison des messages) — Irlande.",
            "• **Resend Inc.** (envois e-mails transactionnels) — États-Unis, sous clauses contractuelles types.",
            "• **Stripe Payments Europe Ltd.** (facturation et paiements) — Irlande.",
            "Toute modification de cette liste sera notifiée au Responsable par e-mail, avec un préavis de 30 jours, lui permettant de s'opposer au changement.",
        ],
    },
    {
        num: "06",
        title: "Transferts hors UE",
        body: [
            "Les données sont hébergées par défaut dans l'Union européenne (région Francfort, Allemagne).",
            "Les transferts vers les États-Unis nécessaires au fonctionnement du service (Vercel, Convex, Resend) sont encadrés par les clauses contractuelles types adoptées par la Commission européenne (décision 2021/914), complétées par des mesures supplémentaires : chiffrement de bout en bout, pseudonymisation, minimisation des données transférées.",
        ],
    },
    {
        num: "07",
        title: "Sécurité des traitements",
        body: [
            "Le Sous-traitant met en œuvre les mesures suivantes, auditées annuellement par un organisme tiers indépendant :",
            "• Chiffrement AES-256 des données au repos et TLS 1.3 en transit.",
            "• Authentification à deux facteurs obligatoire pour tous les accès aux environnements de production.",
            "• Séparation stricte des environnements (développement / préproduction / production).",
            "• Sauvegardes chiffrées incrémentales quotidiennes avec rétention 30 jours.",
            "• Tests d'intrusion annuels réalisés par un prestataire certifié PASSI.",
            "• Certification ISO 27001 (obtenue en février 2026) et SOC 2 Type II (en cours).",
        ],
    },
    {
        num: "08",
        title: "Droits des personnes concernées",
        body: [
            "Le Sous-traitant met à disposition du Responsable des outils permettant de répondre aux demandes d'exercice des droits (accès, rectification, effacement, portabilité, opposition) dans les délais prévus par le RGPD.",
            "Toute demande reçue directement par le Sous-traitant sera transmise sans délai au Responsable.",
        ],
    },
    {
        num: "09",
        title: "Audit",
        body: [
            "Le Responsable peut, à ses frais et avec un préavis raisonnable (15 jours minimum), réaliser un audit de conformité des traitements, directement ou par l'intermédiaire d'un tiers indépendant soumis à une obligation de confidentialité.",
            "Le Sous-traitant met à disposition les rapports d'audits tiers existants (ISO 27001, SOC 2) en alternative à un audit sur site.",
        ],
    },
    {
        num: "10",
        title: "Terminaison",
        body: [
            "À la fin du contrat, le Sous-traitant s'engage à :",
            "• Restituer l'intégralité des données personnelles au Responsable, dans un format structuré et couramment utilisé (JSON, CSV).",
            "• Supprimer définitivement toutes les copies de ces données dans un délai maximum de 30 jours après restitution, sauf obligation légale de conservation.",
            "• Fournir sur demande une attestation de destruction signée par un dirigeant.",
        ],
    },
];

function renderWithBold(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <Fragment key={i}>{part}</Fragment>;
    });
}

export function DpaContent() {
    return (
        <section className="relative border-t border-border/60 py-20 md:py-24">
            <div className="mx-auto max-w-3xl px-6">
                <div className="space-y-14">
                    {sections.map((s, i) => (
                        <motion.article
                            key={s.num}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.04,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            id={`section-${s.num}`}
                            className="scroll-mt-24"
                        >
                            <div className="flex items-baseline gap-4">
                                <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                                    {s.num}
                                </span>
                                <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                                    {s.title}
                                </h2>
                            </div>
                            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
                                {s.body.map((para, j) => (
                                    <p key={j}>{renderWithBold(para)}</p>
                                ))}
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
