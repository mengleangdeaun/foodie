"use client"

import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  // add other old shadcn props if you use them
}

export const toast = ({ title, description, variant, ...props }: ToastProps) => {
  // Map 'destructive' variant to Sonner's error method
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description: description,
      ...props,
    })
  }

  // Default toast
  return sonnerToast(title, {
    description: description,
    ...props,
  })
}

export function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  }
}
