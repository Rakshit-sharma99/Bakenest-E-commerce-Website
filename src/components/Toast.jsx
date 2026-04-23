/**
 * BakeNest Toast Notification System
 * ─────────────────────────────────────
 * Usage:
 *   import { useToast, ToastContainer } from './Toast';
 *
 *   // In root component:
 *   const { toasts, toast } = useToast();
 *   <ToastContainer toasts={toasts} onClose={toast.dismiss} />
 *
 *   // Anywhere:
 *   toast.success('Order placed!');
 *   toast.error('Payment failed.');
 *   toast.warning('Low stock.');
 *   toast.info('Free delivery applied.');
 */

import { useState, useCallback, useEffect } from 'react';

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

let toastId = 0;

// ── Individual Toast ─────────────────────────────────────────────────────────
function Toast({ id, type = 'info', message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`toast toast-${type} animate-slideInRight`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon" aria-hidden="true">{ICONS[type]}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ── Toast Container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={onClose} />
      ))}
    </div>
  );
}

// ── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type, message) => {
    const id = ++toastId;
    // Keep max 4 toasts at once
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    return id;
  }, []);

  const toast = {
    success: (msg) => show('success', msg),
    error:   (msg) => show('error',   msg),
    warning: (msg) => show('warning', msg),
    info:    (msg) => show('info',    msg),
    dismiss,
  };

  return { toasts, toast };
}

export default ToastContainer;
