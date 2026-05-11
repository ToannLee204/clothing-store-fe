import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { parseResponseBody, extractMessage, jsonAuthHeaders, authHeaders } from '../../api/http';
import { translateInvoiceStatus, translatePaymentStatus } from '../../utils/format';
import './AdminProducts.css';

const API_INVOICES_URL = '/api/v1/admin/invoices';

function formatVND(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;
}

function humanInvoiceStatus(status) {
  return translateInvoiceStatus(status);
}

function getInvoiceStatusBadge(status) {
  if (!status) return 'badge-gray';
  const s = status.toUpperCase();
  switch (s) {
    case 'PAID': return 'badge-green';
    case 'PENDING': case 'UNPAID': return 'badge-amber';
    case 'CANCELLED': return 'badge-red';
    case 'REFUNDED': return 'badge-cat';
    case 'REFUND_REQUESTED': return 'badge-teal';
    default: return 'badge-gray';
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_asc', label: 'Giá tăng dần' },
  { value: 'amount_desc', label: 'Giá giảm dần' },
];

export default function AdminInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0, pages: 1 });
  
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    paymentMethod: '',
    fromDate: '',
    toDate: '',
    sortBy: 'newest'
  });

  const [keywordInput, setKeywordInput] = useState('');

  // Modal Detail
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchInvoices = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        limit: pagination.pageSize || 20,
      });

      if (filters.keyword) queryParams.append('keyword', filters.keyword);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

      const res = await fetch(`${API_INVOICES_URL}?${queryParams.toString()}`, {
        headers: authHeaders(),
      });
      
      const payload = await parseResponseBody(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải danh sách hóa đơn.'));
      
      const data = payload?.data || payload;
      const invoiceList = data.result || data.content || data || [];
      const meta = data.meta || {};

      setInvoices(invoiceList);
      setPagination(prev => ({
        ...prev,
        current: meta.page !== undefined ? meta.page + 1 : page,
        total: meta.totals || meta.totalElements || invoiceList.length,
        pages: meta.pages || meta.totalPages || 1
      }));
    } catch (e) {
      setError(e?.message || 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => {
    fetchInvoices(pagination.current);
  }, [filters, pagination.current]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleKeywordSearch = () => {
    setFilters(prev => ({ ...prev, keyword: keywordInput }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') handleKeywordSearch();
  };

  const clearFilters = () => {
    setKeywordInput('');
    setFilters({ keyword: '', status: '', paymentMethod: '', fromDate: '', toDate: '', sortBy: 'newest' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setIsDetailOpen(true);
    setDetailInvoice(null);
    try {
      const res = await fetch(`${API_INVOICES_URL}/${id}`, {
        headers: authHeaders(),
      });
      const payload = await parseResponseBody(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải chi tiết hóa đơn.'));
      setDetailInvoice(payload?.data || payload);
    } catch (e) {
      alert(e.message);
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportPDF = async (orderId, invoiceCode) => {
    try {
      const res = await fetch(`${API_INVOICES_URL}/order/${orderId}/pdf`, {
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Không thể xuất PDF.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceCode || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const queryParams = new URLSearchParams(filters);
      const res = await fetch(`${API_INVOICES_URL}/export/excel?${queryParams.toString()}`, {
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Lỗi xuất Excel.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(e.message);
    }
  };

  // Grid template for invoices table
  const invoiceGridStyle = { gridTemplateColumns: '160px 180px 1fr 140px 130px 140px 100px', minWidth: '1100px' };

  const summary = useMemo(() => {
    const s = { PAID: 0, PENDING: 0, CANCELLED: 0, REFUNDED: 0 };
    for (const inv of invoices) {
      if (inv.status in s) s[inv.status]++;
    }
    return s;
  }, [invoices]);

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý hóa đơn</div>
            <div className="pm-subtitle">Theo dõi, xuất file và quản lý thanh toán từ khách hàng.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost" onClick={handleExportExcel}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span> Xuất Excel
            </button>
            <button className="btn-primary" onClick={() => fetchInvoices(pagination.current)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span> Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
             <div className="stat-icon si-teal"><span className="material-symbols-outlined">payments</span></div>
             <div className="stat-label">Đã thanh toán</div>
             <div className="stat-value">{summary.PAID}</div>
          </div>
          <div className="stat-card">
             <div className="stat-icon si-amber"><span className="material-symbols-outlined">schedule</span></div>
             <div className="stat-label">Chờ xử lý</div>
             <div className="stat-value">{summary.PENDING}</div>
          </div>
          <div className="stat-card">
             <div className="stat-icon si-red"><span className="material-symbols-outlined">cancel</span></div>
             <div className="stat-label">Đã hủy</div>
             <div className="stat-value">{summary.CANCELLED}</div>
          </div>
          <div className="stat-card">
             <div className="stat-icon si-blue"><span className="material-symbols-outlined">history</span></div>
             <div className="stat-label">Tổng hóa đơn</div>
             <div className="stat-value">{pagination.total}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', color: '#94a3b8' }}>search</span>
              <input
                type="text"
                placeholder="Mã HĐ, Mã đơn, Tên KH... (Enter)"
                className="fselect"
                style={{ width: '100%', paddingLeft: '34px' }}
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
              />
            </div>
            <select className="fselect" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="REFUNDED">Đã hoàn tiền</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <select className="fselect" value={filters.paymentMethod} onChange={e => handleFilterChange('paymentMethod', e.target.value)}>
              <option value="">Phương thức</option>
              <option value="cod">COD</option>
              <option value="vnpay">VNPAY</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="date" className="fselect" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)} />
              <span style={{ fontSize: '12px' }}>→</span>
              <input type="date" className="fselect" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)} />
            </div>
            <select className="fselect" value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            { (filters.keyword || filters.status || filters.paymentMethod || filters.fromDate || filters.toDate) && (
              <button onClick={clearFilters} className="btn-ghost" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <div className="tbl-header" style={invoiceGridStyle}>
            <div className="th">Mã hóa đơn</div>
            <div className="th">Mã đơn hàng</div>
            <div className="th">Khách hàng</div>
            <div className="th">Phương thức</div>
            <div className="th right">Tổng tiền</div>
            <div className="th center">Trạng thái</div>
            <div className="th right">Thao tác</div>
          </div>

          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải hóa đơn...</div>
          ) : invoices.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy hóa đơn nào.</div>
          ) : (
            invoices.map((inv) => (
              <div className="tbl-row" key={inv.invoiceId} style={invoiceGridStyle}>
                <div><div className="prod-name" style={{ color: '#0066A2' }}>{inv.invoiceCode}</div><div className="price-note" style={{ textAlign: 'left' }}>{inv.issuedDate || '—'}</div></div>
                <div className="font-bold text-slate-700">{inv.orderCode}</div>
                <div>
                  <div className="prod-name" style={{ fontSize: '13px' }}>{inv.customerName || '—'}</div>
                  <div className="prod-meta" style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    display: 'block',
                    maxWidth: '100%'
                  }}>
                    {inv.customerEmail || '—'}
                  </div>
                </div>
                <div><div className="text-sm font-bold">{inv.paymentMethod?.toUpperCase()}</div><div className="text-[10px] text-slate-400 uppercase tracking-widest">{translatePaymentStatus(inv.paymentStatus)}</div></div>
                <div className="right font-black text-slate-900">{formatVND(inv.totalAmount)}</div>
                <div className="center"><span className={`badge ${getInvoiceStatusBadge(inv.status)}`}>{humanInvoiceStatus(inv.status)}</span></div>
                <div className="right">
                  <div className="act-row">
                    <button className="act-btn" onClick={() => handleExportPDF(inv.orderId, inv.invoiceCode)} title="Tải PDF">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>picture_as_pdf</span>
                    </button>
                    <button className="act-btn" onClick={() => openDetail(inv.invoiceId)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          <div className="tbl-footer">
            <span className="footer-text">Tổng số: <strong>{pagination.total}</strong> hóa đơn</span>
            <div className="pager">
              <button className="page-btn" disabled={pagination.current <= 1} onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
                <button key={i+1} className={`page-btn ${pagination.current === i+1 ? 'active' : ''}`} onClick={() => setPagination(p => ({ ...p, current: i+1 }))}>{i+1}</button>
              ))}
              <button className="page-btn" disabled={pagination.current >= pagination.pages} onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">Chi tiết hóa đơn {detailInvoice?.invoiceCode}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Phát hành ngày: {detailInvoice?.issuedDate}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="text-center py-20 text-slate-500 font-bold">Đang tải...</div>
              ) : !detailInvoice ? (
                <div className="text-center py-20 text-rose-500 font-bold">Không tìm thấy thông tin.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái thanh toán</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Trạng thái HĐ:</span><span className={`badge ${getInvoiceStatusBadge(detailInvoice.status)}`}>{humanInvoiceStatus(detailInvoice.status)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Phương thức:</span><span className="text-xs font-bold">{detailInvoice.order?.paymentMethod}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Tình trạng:</span><span className="text-xs font-bold text-emerald-600">{translatePaymentStatus(detailInvoice.order?.paymentStatus)}</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin khách hàng</div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900">{detailInvoice.customer?.fullName}</div>
                        <div className="text-xs text-slate-500">{detailInvoice.customer?.email}</div>
                        <div className="text-xs text-slate-500">{detailInvoice.customer?.phone}</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn hàng liên kết</div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#0066A2]">#{detailInvoice.order?.orderCode}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Ngày đặt: {detailInvoice.order?.orderCreatedAt ? new Date(detailInvoice.order.orderCreatedAt).toLocaleString() : '—'}</div>
                        <div className="text-xs text-slate-600 mt-2">Voucher: <span className="font-bold">{detailInvoice.order?.voucherCode || 'Không'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <div className="bg-slate-50 px-4 py-2 font-bold text-xs">Sản phẩm trong hóa đơn</div>
                    <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                           <th className="px-4 py-2">Sản phẩm</th>
                           <th className="px-4 py-2 text-center">SL</th>
                           <th className="px-4 py-2 text-right">Đơn giá</th>
                           <th className="px-4 py-2 text-right">Thành tiền</th>
                         </tr>
                       </thead>
                       <tbody>
                         {detailInvoice.order?.items?.map((item, idx) => (
                           <tr key={idx} className="border-b border-slate-50 text-sm">
                             <td className="px-4 py-3"><div className="font-bold">{item.productName}</div><div className="text-[10px] text-slate-400">{item.color} / {item.size}</div></td>
                             <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                             <td className="px-4 py-3 text-right">{formatVND(item.price)}</td>
                             <td className="px-4 py-3 text-right font-bold">{formatVND(item.price * item.quantity)}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4">
                    <div className="w-64 space-y-2">
                       <div className="flex justify-between text-sm text-slate-500"><span>Tạm tính:</span><span>{formatVND(detailInvoice.subtotalAmount)}</span></div>
                       <div className="flex justify-between text-sm text-rose-500"><span>Giảm giá:</span><span>-{formatVND(detailInvoice.discountAmount)}</span></div>
                       <div className="flex justify-between text-sm text-slate-500"><span>Thuế:</span><span>{formatVND(detailInvoice.taxAmount)}</span></div>
                       <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                         <span className="font-bold text-slate-900">Tổng hóa đơn:</span>
                         <span className="text-xl font-black text-[#0066A2]">{formatVND(detailInvoice.totalAmount)}</span>
                       </div>
                    </div>
                  </div>
                  
                  {detailInvoice.notes && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ghi chú hóa đơn</div>
                      <p className="text-xs text-slate-600 italic">"{detailInvoice.notes}"</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/30">
              <button 
                onClick={() => handleExportPDF(detailInvoice?.order?.orderId, detailInvoice?.invoiceCode)} 
                className="btn-ghost"
                style={{ color: '#0066A2' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span> Tải hóa đơn PDF
              </button>
              <button onClick={() => setIsDetailOpen(false)} className="btn-ghost">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
