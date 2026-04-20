import Image from "next/image";
import { cn } from "@/lib/utils";

interface CrmLogoProps {
    provider: string;
    className?: string;
}

const LOGO_SOURCES: Record<string, { src: string; padding: string }> = {
    hubspot: { src: "/logos/crm/hubspot.svg", padding: "p-[18%]" },
    salesforce: { src: "/logos/crm/salesforce.svg", padding: "p-[14%]" },
    pipedrive: { src: "/logos/crm/pipedrive.png", padding: "p-0" },
    sellsy: { src: "/logos/crm/sellsy.png", padding: "p-[12%]" },
    axonaut: { src: "/logos/crm/axonaut.png", padding: "p-0" },
    nocrm: { src: "/logos/crm/nocrm.png", padding: "p-[16%]" },
};

const PROVIDER_LABELS: Record<string, string> = {
    hubspot: "HubSpot",
    salesforce: "Salesforce",
    pipedrive: "Pipedrive",
    sellsy: "Sellsy",
    axonaut: "Axonaut",
    nocrm: "noCRM.io",
};

const FALLBACK_COLORS: Record<string, string> = {
    hubspot: "#FF7A59",
    pipedrive: "#08A742",
    salesforce: "#00A1E0",
    sellsy: "#4A6CF7",
    axonaut: "#1F3F6F",
    nocrm: "#4798EC",
};

export function CrmLogo({ provider, className }: CrmLogoProps) {
    const entry = LOGO_SOURCES[provider];
    const label = PROVIDER_LABELS[provider] ?? provider;

    if (!entry) {
        const initial = provider.charAt(0).toUpperCase();
        const color = FALLBACK_COLORS[provider] ?? "#14532d";
        return (
            <div
                className={cn(
                    "flex items-center justify-center rounded-md font-bold text-white",
                    className,
                )}
                style={{ backgroundColor: color }}
            >
                <span className="text-[0.6em] leading-none">{initial}</span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative flex items-center justify-center",
                entry.padding,
                className,
            )}
        >
            <Image
                src={entry.src}
                alt={`Logo ${label}`}
                width={96}
                height={96}
                className="h-full w-full object-contain"
                unoptimized
            />
        </div>
    );
}
