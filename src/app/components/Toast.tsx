import { useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'pending';
  message: string;
  onClose: () => void;
  autoDismiss?: boolean;
}

export function Toast({ type, message, onClose, autoDismiss = true }: ToastProps) {
  useEffect(() => {
    if (autoDismiss && type !== 'pending') {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, type, onClose]);

  const icons = {
    success: <CheckCircle className="text-success" size={20} />,
    error: <XCircle className="text-error" size={20} />,
    pending: <Loader2 className="text-accent animate-spin" size={20} />
  };

  const colors = {
    success: 'border-success/20 bg-success/5',
    error: 'border-error/20 bg-error/5',
    pending: 'border-accent/20 bg-accent/5'
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${colors[type]} bg-surface shadow-lg animate-in slide-in-from-right duration-200`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-background rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
