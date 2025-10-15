import React, { useEffect, useState } from 'react';
import { toast, Toast } from '../../utils/logger';
import './ToastContainer.css';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info':
      default: return 'ℹ';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type}`}
          onClick={() => toast.remove(t.id)}
        >
          <div className={`toast-icon toast-icon-${t.type}`}>
            {getIcon(t.type)}
          </div>
          <div className="toast-content">
            <div className="toast-message">{t.message}</div>
            {t.details && <div className="toast-details">{t.details}</div>}
          </div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              toast.remove(t.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
