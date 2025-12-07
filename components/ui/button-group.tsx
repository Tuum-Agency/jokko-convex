"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonGroupVariants = cva(
    "inline-flex items-center [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:last-child)]:border-r-0",
    {
        variants: {
            orientation: {
                horizontal:
                    "flex-row [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:last-child)]:border-r-0",
                vertical:
                    "flex-col [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none [&>*:not(:last-child)]:border-b-0 [&>*]:border-r",
            },
        },
        defaultVariants: {
            orientation: "horizontal",
        },
    }
)

interface ButtonGroupProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> { }

function ButtonGroup({
    className,
    orientation,
    ...props
}: ButtonGroupProps) {
    return (
        <div
            role="group"
            data-slot="button-group"
            className={cn(buttonGroupVariants({ orientation, className }))}
            {...props}
        />
    )
}

interface ButtonGroupTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    asChild?: boolean
}

function ButtonGroupText({
    className,
    asChild = false,
    ...props
}: ButtonGroupTextProps) {
    const Comp = asChild ? Slot : "span"

    return (
        <Comp
            data-slot="button-group-text"
            className={cn(
                "flex items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium",
                className
            )}
            {...props}
        />
    )
}

export { ButtonGroup, ButtonGroupText, buttonGroupVariants }
