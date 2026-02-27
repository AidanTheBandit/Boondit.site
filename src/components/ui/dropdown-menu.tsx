import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative inline-block group", className)} {...props} />
  )
)
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded px-3 py-1.5 transition-all ease-in-out text-sm md:text-sm tracking-wide flex items-center justify-center gap-1",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[200px]",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuInner = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-popover/95 backdrop-blur-xl border border-border rounded shadow-2xl overflow-hidden p-1 flex flex-col gap-1",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuInner.displayName = "DropdownMenuInner"

const DropdownMenuItem = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "block px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded text-sm transition-colors text-center whitespace-nowrap font-medium tracking-wide",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuInner,
  DropdownMenuItem,
}
