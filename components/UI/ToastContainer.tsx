
import React from 'react';
import { useToast } from '../../context/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-3 w-full max-w-[90%] sm:max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start p-4 rounded-2xl shadow-2xl border glass animate-slide-up relative overflow-hidden group ${
            toast.type === 'success' ? 'border-emerald-100 bg-emerald-50/90 text-emerald-800' :
            toast.type === 'error' ? 'border-red-100 bg-red-50/90 text-red-800' :
            toast.type === 'warning' ? 'border-amber-100 bg-amber-50/90 text-amber-800' :
            'border-blue-100 bg-blue-50/90 text-blue-800'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <i className="fas fa-check-circle text-emerald-500 text-lg"></i>}
            {toast.type === 'error' && <i className="fas fa-exclamation-circle text-red-500 text-lg"></i>}
            {toast.type === 'warning' && <i className="fas fa-triangle-exclamation text-amber-500 text-lg"></i>}
            {toast.type === 'info' && <i className="fas fa-circle-info text-blue-500 text-lg"></i>}
          </div>
          <div className="ml-3 mr-8">
            <p className="text-sm font-black leading-tight uppercase tracking-tight mb-1">
              {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notification'}
            </p>
            <p className="text-sm font-medium leading-relaxed opacity-90">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
          
          {/* Progress bar animation */}
          <div className={`absolute bottom-0 left-0 h-1 transition-all duration-[5000ms] ease-linear w-full origin-left ${
            toast.type === 'success' ? 'bg-emerald-400/30' :
            toast.type === 'error' ? 'bg-red-400/30' :
            toast.type === 'warning' ? 'bg-amber-400/30' :
            'bg-blue-400/30'
          }`} style={{ animation: 'progress 5s linear forwards' }}></div>
        </div>
      ))}
      <style>{`
        @keyframes progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
