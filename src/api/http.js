/**
 * Các hàm HTTP helper dùng chung cho toàn bộ dự án.
 * Thay thế parseResponseBody / extractMessage bị lặp ở mọi page.
 */

/**
 * Parse response body an toàn, trả về object hoặc text.
 */
export async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

/**
 * Trích xuất message lỗi từ payload API (hỗ trợ nhiều format).
 */
export function extractMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
}

/**
 * Lấy token từ localStorage.
 */
export function getToken() {
  return localStorage.getItem('token') || null;
}

/**
 * Tạo headers có Authorization nếu đã đăng nhập.
 */
export function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Tạo headers JSON + Authorization.
 */
export function jsonAuthHeaders() {
  return authHeaders({ 'Content-Type': 'application/json' });
}
