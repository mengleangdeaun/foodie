"use client"

import { toast as sonnerToast } from "sonner"
import React from "react" // Import React for React.ReactNode

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  className?: string
  action?: React.ReactNode // Support for action elements
  icon?: React.ReactNode   // Added icon support for icons like <CheckCircle />
}

export const toast = ({ title, description, variant, className, action, icon, ...props }: ToastProps) => {
  const options = {
    description: description,
    className: className,
    icon: icon, // Sonner uses this to place elements next to the title
    action: action as any, // Cast to any because Sonner expects a specific object structure for its own buttons
    ...props,
  }

  if (variant === "destructive") {
    return sonnerToast.error(title, options)
  }

  return sonnerToast(title, options)
}

export function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  }
}