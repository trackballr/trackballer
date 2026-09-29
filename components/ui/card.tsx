import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

export const cardSurfaceVariants = cva(
  "border border-border bg-card text-card-foreground shadow-none",
  {
    variants: {
      radius: {
        sm: "rounded-lg",
        default: "rounded-xl",
        lg: "rounded-2xl",
      },
    },
    defaultVariants: {
      radius: "default",
    },
  },
)

export function cardSurfaceClass(
  options?: VariantProps<typeof cardSurfaceVariants> & { className?: string },
) {
  const { className, ...variants } = options ?? {}
  return cn(cardSurfaceVariants(variants), className)
}

function Card({
  className,
  radius,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardSurfaceVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardSurfaceVariants({ radius }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 border-b border-border px-4 py-3", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base font-semibold leading-none", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-4", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-border px-4 py-3", className)}
      {...props}
    />
  )
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
