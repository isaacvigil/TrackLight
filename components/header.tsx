import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headerVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "bg-background border-b",
        glass: "bg-card/50 backdrop-blur-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface HeaderProps
  extends React.ComponentProps<"header">,
    VariantProps<typeof headerVariants> {}

function Header({ className, variant, ...props }: HeaderProps) {
  return (
    <header
      className={cn(headerVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Header }

