import React from "react";

export const CompanyLogo1 = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Entreprise Partenaire 1"
    >
        <rect width="40" height="40" rx="20" fill="#E0F2FE" />
        <path
            d="M20 10C14.4772 10 10 14.4772 10 20C10 25.5228 14.4772 30 20 30C25.5228 30 30 25.5228 30 20"
            stroke="#0284C7"
            strokeWidth="3"
            strokeLinecap="round"
        />
        <path
            d="M20 10V20L27 27"
            stroke="#0284C7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const CompanyLogo2 = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Entreprise Partenaire 2"
    >
        <rect width="40" height="40" rx="20" fill="#DCFCE7" />
        <path
            d="M13 24L20 12L27 24H13Z"
            fill="#16A34A"
            stroke="#15803D"
            strokeWidth="2"
            strokeLinejoin="round"
        />
    </svg>
);

export const CompanyLogo3 = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Entreprise Partenaire 3"
    >
        <rect width="40" height="40" rx="20" fill="#FAE8FF" />
        <rect
            x="12"
            y="12"
            width="16"
            height="16"
            rx="4"
            fill="#C026D3"
        />
        <circle cx="20" cy="20" r="4" fill="#FAE8FF" />
    </svg>
);

export const CompanyLogo4 = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Entreprise Partenaire 4"
    >
        <rect width="40" height="40" rx="20" fill="#FEF3C7" />
        <path
            d="M12 20H18L22 12L24 28L28 20H30"
            stroke="#D97706"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
