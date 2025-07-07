import * as React from "react"

import { cn } from "@/lib/utils"

// Use React.InputHTMLAttributes for better prop typing for an input element
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // Base classes for the input element itself. It always takes full width of its parent div.
        className={cn(
          "focusable-input",
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm", // Responsive text size for medium screens and up
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
