import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Toast[] = [];
  private root: any = null;

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);

    this.root = createRoot(this.container);
  }

  private show() {
    if (!this.container || !this.root) return;

    this.root.render(
      <div className="space-y-2">
        {this.toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={() => this.remove(toast.id)}
          />
        ))}
      </div>
    );
  }

  private remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.show();
  }

  private addToast(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };

    this.toasts.push(newToast);
    this.show();

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, newToast.duration);
  }

  success(title: string, message?: string, duration?: number) {
    this.addToast({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number) {
    this.addToast({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number) {
    this.addToast({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration?: number) {
    this.addToast({ type: 'info', title, message, duration });
  }
}

const ToastComponent = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 border-r-4 border-t border-b ${getColors()}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90">
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={onRemove}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create singleton instance
const toastManager = new ToastManager();

export const toast = {
  success: (title: string, message?: string, duration?: number) => 
    toastManager.success(title, message, duration),
  error: (title: string, message?: string, duration?: number) => 
    toastManager.error(title, message, duration),
  warning: (title: string, message?: string, duration?: number) => 
    toastManager.warning(title, message, duration),
  info: (title: string, message?: string, duration?: number) => 
    toastManager.info(title, message, duration),
};

export default toast;
