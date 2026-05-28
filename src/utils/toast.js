const TOAST_EVENT = 'app:toast';

export const showToast = (message, type = 'info') => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        message,
        type,
      },
    }),
  );
};

export default showToast;
