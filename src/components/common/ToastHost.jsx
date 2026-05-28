import React, { useEffect, useState } from 'react';

const TOAST_EVENT = 'app:toast';
const TOAST_DURATION = 2800;

function normalizeToast(detail) {
  if (!detail || typeof detail !== 'object') {
    return {
      id: String(Date.now()),
      message: 'Đã xảy ra lỗi',
      type: 'info',
    };
  }

  return {
    id: detail.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message: detail.message || 'Đã xảy ra lỗi',
    type: detail.type || 'info',
  };
}

export default function ToastHost() {
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info', id: '' });

  useEffect(() => {
    const handleToast = (event) => {
      const nextToast = normalizeToast(event.detail);
      setToast({
        isOpen: true,
        message: nextToast.message,
        type: nextToast.type,
        id: nextToast.id,
      });

      window.setTimeout(() => {
        setToast((current) => (current.id === nextToast.id ? { isOpen: false, message: '', type: 'info', id: '' } : current));
      }, TOAST_DURATION);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <>
      {toast.isOpen && (
        <div className="fixed left-1/2 top-8 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div
            className={`rounded-2xl border px-5 py-4 shadow-2xl ${
              isSuccess
                ? 'border-emerald-200 bg-emerald-50'
                : isError
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                isSuccess ? 'text-emerald-700' : isError ? 'text-rose-700' : 'text-slate-700'
              }`}
            >
              {isSuccess ? 'Thành công' : isError ? 'Lỗi' : 'Thông báo'}
            </p>
            <p
              className={`mt-2 text-sm font-medium leading-6 ${
                isSuccess ? 'text-emerald-800' : isError ? 'text-rose-800' : 'text-slate-800'
              }`}
            >
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
