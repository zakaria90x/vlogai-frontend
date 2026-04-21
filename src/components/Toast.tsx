import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-xs"
          style={{
            background: '#1a1a24',
            borderColor:
              toast.type === 'success' ? '#22c55e40' : toast.type === 'error' ? '#ef444440' : '#a855f740',
          }}
        >
          {toast.type === 'success' && <CheckCircle size={16} className="text-success shrink-0" />}
          {toast.type === 'error' && <XCircle size={16} className="text-error shrink-0" />}
          {toast.type === 'info' && <Info size={16} className="text-accent shrink-0" />}
          <p className="text-sm text-gray-200 flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted hover:text-white transition-colors ml-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
