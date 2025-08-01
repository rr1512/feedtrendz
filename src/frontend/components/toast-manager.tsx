'use client'

import { useToast } from '@/frontend/contexts/toast-context'
import { ToastContainer } from '@/frontend/components/ui/toast'

export function ToastManager() {
  const { toasts, removeToast } = useToast()

  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}