const DEFAULT_PAYMENT_RESULT_PATH = '/payment-result';
const DEFAULT_PAYMENT_RESULT_ORIGIN = 'http://localhost:5173';

function getConfiguredPaymentOrigin() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYMENT_RESULT_ORIGIN) {
    return import.meta.env.VITE_PAYMENT_RESULT_ORIGIN;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}

function getPaymentResultUrl() {
  const origin = getConfiguredPaymentOrigin() || DEFAULT_PAYMENT_RESULT_ORIGIN;
  return `${origin}${DEFAULT_PAYMENT_RESULT_PATH}`;
}

export function rewriteVnpayReturnUrl(paymentUrl) {
  if (!paymentUrl || typeof paymentUrl !== 'string') {
    return paymentUrl;
  }

  try {
    const url = new URL(paymentUrl);
    const returnUrl = url.searchParams.get('vnp_ReturnUrl');

    if (returnUrl) {
      url.searchParams.set('vnp_ReturnUrl', getPaymentResultUrl());
    }

    return url.toString();
  } catch (error) {
    return paymentUrl;
  }
}
