import * as React from "react"

import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        "data-disabled"?: boolean
    }
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 shadow-sm transition-all overflow-hidden focus-within:ring-0 focus-within:border-green-500 focus-within:bg-white",
                props["data-disabled"] && "cursor-not-allowed opacity-50",
                className
            )}
            {...props}
        />
    )
})
InputGroup.displayName = "InputGroup"

const InputGroupAddon = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        align?: "inline-start" | "inline-end"
    }
>(({ className, align = "inline-start", ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-center px-3 text-sm text-muted-foreground bg-transparent",
                align === "inline-start" && "border-r border-gray-200",
                align === "inline-end" && "border-l border-gray-200",
                className
            )}
            {...props}
        />
    )
})
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                "flex h-full w-full bg-transparent px-3 py-1 text-sm font-medium file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
})
InputGroupInput.displayName = "InputGroupInput"

export { InputGroup, InputGroupAddon, InputGroupInput }
