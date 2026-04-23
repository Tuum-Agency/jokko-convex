/**
 * Logo Component
 *
 * Composant logo réutilisable avec option de lien.
 * Par défaut, le logo est cliquable et redirige vers l'accueil.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
    /** Désactive le lien (logo statique) */
    noLink?: boolean;
    /** URL de redirection (défaut: "/") */
    href?: string;
    /** Largeur du logo en pixels */
    width?: number;
    /** Hauteur du logo en pixels */
    height?: number;
    /** Classes CSS additionnelles */
    className?: string;
    /** Priorité de chargement de l'image */
    priority?: boolean;
}

export function Logo({
    noLink = false,
    href = "/",
    width = 120,
    height = 40,
    className,
    priority = false,
}: LogoProps) {
    const image = (
        <Image
            src="/logo.png"
            alt="Jokko"
            width={width}
            height={height}
            className={cn("object-contain", className)}
            priority={priority}
        />
    );

    if (noLink) {
        return image;
    }

    return (
        <Link href={href} className="inline-block">
            {image}
        </Link>
    );
}
