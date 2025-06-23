import * as React from "react"

import { cn } from "@/lib/utils"

// Use React.InputHTMLAttributes for better prop typing for an input element
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      // The className from props (e.g., flex-grow, text-sm) is applied to this wrapper div.
      // This allows the entire component, including its animated border, to participate in flex layouts.
      <div className={cn("relative rounded-md", className)}> 
        <input
          type={type}
          // Base classes for the input element itself. It always takes full width of its parent div.
          // Text sizing (text-base, md:text-sm) is defined here. If `className` on the wrapper
          // includes text sizing (e.g. text-sm from ChatInputBar), it might override due to specificity/inheritance.
          className={cn(
            "focusable-input",
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "md:text-sm" // Responsive text size for medium screens and up
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
