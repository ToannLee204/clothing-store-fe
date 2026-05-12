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

/**
 * Chuyển đổi trạng thái đơn hàng sang tiếng Việt
 */
export function translateOrderStatus(status) {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'shipping': return 'Đang giao hàng';
    case 'completed': return 'Đã hoàn tất';
    case 'cancelled': return 'Đã hủy';
    case 'payment_failed': return 'Thanh toán lỗi';
    case 'refund_requested': 
    case 'return_requested': return 'Yêu cầu trả hàng';
    case 'return_approved': return 'Chấp nhận trả hàng';
    case 'returning':
    case 'return_confirmed':
    case 'returned': return 'Đã nhận hàng trả';
    case 'rejected_refund': 
    case 'rejected_return':
    case 'recjected_refund': return 'Từ chối trả hàng';
    case 'refunded': return 'Đã hoàn tiền';
    default: return status || '—';
  }
}

/**
 * Lấy màu sắc tương ứng với trạng thái đơn hàng
 */
export function getOrderStatusColor(status) {
  switch (status) {
    case 'pending': return 'text-blue-600 bg-blue-50';
    case 'confirmed': return 'text-amber-600 bg-amber-50';
    case 'shipping': return 'text-teal-600 bg-teal-50';
    case 'completed': return 'text-emerald-600 bg-emerald-50';
    case 'cancelled': return 'text-rose-600 bg-rose-50';
    case 'payment_failed': return 'text-rose-600 bg-rose-50';
    case 'refund_requested':
    case 'return_requested': return 'text-orange-600 bg-orange-50';
    case 'return_approved': return 'text-indigo-600 bg-indigo-50';
    case 'returning':
    case 'return_confirmed':
    case 'returned': return 'text-indigo-600 bg-indigo-50';
    case 'rejected_refund': return 'text-rose-600 bg-rose-50';
    case 'refunded': return 'text-purple-600 bg-purple-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Chuyển đổi trạng thái thanh toán sang tiếng Việt
 */
export function translatePaymentStatus(status) {
  if (!status) return '—';
  const s = status.toLowerCase();
  switch (s) {
    case 'unpaid': return 'Chưa thanh toán';
    case 'pending': return 'Chờ thanh toán';
    case 'paid': return 'Đã thanh toán';
    case 'failed': return 'Thanh toán lỗi';
    case 'refund_requested':
    case 'return_requested': return 'Yêu cầu hoàn tiền';
    case 'rejected_refund':
    case 'rejected_return':
    case 'recjected_refund': return 'Từ chối hoàn tiền';
    case 'refunded': return 'Đã hoàn tiền';
    default: return status;
  }
}

/**
 * Chuyển đổi trạng thái hóa đơn sang tiếng Việt
 */
export function translateInvoiceStatus(status) {
  if (!status) return '—';
  const s = status.toLowerCase();
  switch (s) {
    case 'unpaid': return 'Chưa thanh toán';
    case 'paid': return 'Đã thanh toán';
    case 'refund_requested':
    case 'return_requested': return 'Yêu cầu hoàn tiền';
    case 'refunded': return 'Đã hoàn tiền';
    case 'pending': return 'Chờ xử lý';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
}
