/**
 * Các hàm format dùng chung trong toàn bộ dự án.
 */

export function formatPrice(value) {
  if (!value) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export function formatVND(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;
}

export function formatInt(value) {
  return `${Number(value) || 0}`;
}

export function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '';
  }
}

export function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getImageUrl(url) {
  if (!url) return 'https://placehold.co/400x600?text=No+Image';
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) return url;
  
  // Nếu bắt đầu bằng /uploads/ thì nối với base api
  if (url.startsWith('/uploads/')) return `http://localhost:8080/api/v1${url}`;
  
  // Nếu chỉ là tên file thì nối với path mặc định của product images
  return `http://localhost:8080/api/v1/uploads/products/${url}`;
}
