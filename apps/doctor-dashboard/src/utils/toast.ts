type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners: Set<Listener> = new Set();

export const toast = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    listeners.forEach((listener) => listener([...toasts]));
  },

  show(message: string, type: ToastType = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, message, type }];
    this.notify();

    setTimeout(() => {
      this.dismiss(id);
    }, 4000);
  },

  success(message: string) {
    this.show(message, 'success');
  },

  error(message: string) {
    this.show(message, 'error');
  },

  info(message: string) {
    this.show(message, 'info');
  },

  warning(message: string) {
    this.show(message, 'warning');
  },

  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    this.notify();
  }
};