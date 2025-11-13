import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

export function Toast() {
  const { toast, clearToast } = useStore()

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, clearToast])

  if (!toast) return null

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-md',
        colors[toast.type]
      )}>
        <div className="flex-shrink-0">
          {icons[toast.type]}
        </div>
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={clearToast}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
