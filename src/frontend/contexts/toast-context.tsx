'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration)
    }
  }, [removeToast])

  const success = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'success' })
  }, [addToast])

  const error = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'error', duration: 7000 })
  }, [addToast])

  const warning = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'warning' })
  }, [addToast])

  const info = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'info' })
  }, [addToast])

  return (
    <ToastContext.Provider 
      value={{ 
        toasts, 
        addToast, 
        removeToast, 
        success, 
        error, 
        warning, 
        info 
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}