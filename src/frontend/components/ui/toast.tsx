'use client'

import React from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/frontend/lib/utils'
import { Toast as ToastType } from '@/frontend/contexts/toast-context'

interface ToastProps {
  toast: ToastType
  onRemove: (id: string) => void
}

const toastVariants = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-900',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-900',
    iconClassName: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    iconClassName: 'text-yellow-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-900',
    iconClassName: 'text-blue-500'
  }
}

export function Toast({ toast, onRemove }: ToastProps) {
  const variant = toastVariants[toast.type]
  const Icon = variant.icon

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm",
      "animate-in slide-in-from-right-full duration-300",
      variant.className
    )}>
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", variant.iconClassName)} />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm mb-1">
            {toast.title}
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {toast.message}
        </div>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: { 
  toasts: ToastType[]
  onRemove: (id: string) => void 
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}