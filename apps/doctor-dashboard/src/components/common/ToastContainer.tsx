import React, { useEffect, useState } from 'react';
import { toast, ToastMessage } from '../../utils/toast';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => setMessages(updated));
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {messages.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
            t.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : t.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : t.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
            <span>{t.message}</span>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="p-1 rounded-lg hover:bg-black/5">
            <X className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ))}
    </div>
  );
};