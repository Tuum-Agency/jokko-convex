import * as React from "react"
import { cn } from "@/lib/utils"

interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string
    icon?: React.ReactNode
}

function Eyebrow({ text, icon, className, ...props }: EyebrowProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center justify-start gap-2 px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] border border-[rgba(2,6,23,0.08)]",
                className
            )}
            {...props}
        >
            {icon && (
                <span className="text-green-600">
                    {icon}
                </span>
            )}
            <span className="text-sm font-medium text-gray-700">{text}</span>
        </div>
    )
}

export { Eyebrow }
