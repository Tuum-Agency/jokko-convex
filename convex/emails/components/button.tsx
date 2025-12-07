/**
 *  ____        _   _              
 * | __ ) _   _| |_| |_ ___  _ __  
 * |  _ \| | | | __| __/ _ \| '_ \ 
 * | |_) | |_| | |_| || (_) | | | |
 * |____/ \__,_|\__|\__\___/|_| |_|
 *
 * EMAIL BUTTON COMPONENT
 *
 * Reusable button component for React Email templates.
 * Uses Tailwind for styling.
 */

import { Button as EmailButton } from "@react-email/components";
import * as React from "react";

interface ButtonProps {
    href: string;
    children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
    return (
        <EmailButton
            href={href}
            className="bg-emerald-500 text-white px-7 py-3.5 rounded-lg font-semibold text-sm no-underline text-center block"
        >
            {children}
        </EmailButton>
    );
}
