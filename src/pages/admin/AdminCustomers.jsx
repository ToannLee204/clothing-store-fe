import React, { useEffect, useMemo, useState } from 'react';
import './AdminProducts.css';

const API_ADMIN_CUSTOMERS_URL = '/api/v1/admin/customers';

function formatVND(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;
}

function safeParseJson(res) {
  return res
    .text()
    .then((text) => {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    })
    .catch(() => null);
}

function extractListMetaAndItems(payload) {
  if (!payload) return { meta: null, items: [] };

  const meta = payload.meta || payload.data?.meta || null;
  const rawItems =
    payload.result ||
    payload.data?.result ||
    payload.data?.content ||
    payload.content ||
    payload.data ||
    [];

  return { meta, items: Array.isArray(rawItems) ? rawItems : [] };
}

function extractMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
}

function statusLabel(status) {
  return status ? 'Đang hoạt động' : 'Bị khóa';
}

function genderLabel(gender) {
  if (gender === null || gender === undefined || gender === '') return '—';
  return String(gender);
}

function verifiedLabel(verified) {
  return verified ? 'Đã xác thực' : 'Chưa xác thực';
}

export default function AdminCustomers() {
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });

  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
  });

  const [keywordInput, setKeywordInput] = useState('');

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeCount, lockedCount } = useMemo(() => {
    let active = 0;
    let locked = 0;
    for (const c of customers) {
      if (c?.status) active += 1;
      else locked += 1;
    }
    return { activeCount: active, lockedCount: locked };
  }, [customers]);

  const fetchCustomers = async (page = pagination.current) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: String(page - 1),
        pageSize: String(pagination.pageSize || 20),
      });

      const keyword = (filters.keyword || '').trim();
      if (keyword) queryParams.append('keyword', keyword);
      if (filters.status === 'true') queryParams.append('status', 'true');
      if (filters.status === 'false') queryParams.append('status', 'false');

      const res = await fetch(`${API_ADMIN_CUSTOMERS_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = await safeParseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải danh sách khách hàng (admin).'));

      const { meta, items } = extractListMetaAndItems(payload);
      setCustomers(items);

      if (meta) {
        setPagination({
          current: meta.page !== undefined ? meta.page + 1 : 1,
          pageSize: meta.pageSize || pagination.pageSize || 20,
          total: meta.totals ?? 0,
          pages: meta.pages || 1,
        });
      } else {
        setPagination((prev) => ({ ...prev, total: items.length, pages: 1 }));
      }
    } catch (e) {
      setError(e?.message || 'Không thể kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (userId) => {
    if (!userId) return;

    setDetailsLoading(true);
    setDetailsError('');
    setSelectedCustomer(null);

    try {
      const res = await fetch(`${API_ADMIN_CUSTOMERS_URL}/${userId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = await safeParseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải chi tiết khách hàng.'));

      setSelectedCustomer(payload?.data || payload);
      setIsModalOpen(true);
    } catch (e) {
      setDetailsError(e?.message || 'Lỗi tải chi tiết khách hàng.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [filters.keyword, filters.status]);

  useEffect(() => {
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const canPrev = pagination.current > 1;
  const canNext = pagination.current < pagination.pages;

  const handleClearFilters = () => {
    setKeywordInput('');
    setFilters({ keyword: '', status: '' });
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      setFilters((prev) => ({ ...prev, keyword: keywordInput }));
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý khách hàng</div>
            <div className="pm-subtitle">Tìm kiếm theo tên hoặc email, lọc trạng thái và xem chi tiết khách hàng theo cùng giao diện với trang sản phẩm.</div>
          </div>
          <div className="pm-actions">
            <span className="badge badge-green">Đang hoạt động: {activeCount}</span>
            <span className="badge badge-red">Bị khóa: {lockedCount}</span>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Tổng khách hàng', value: pagination.total, icon: 'group', tone: 'si-blue', detail: 'Toàn bộ khách hàng theo bộ lọc hiện tại' },
            { label: 'Đang hoạt động', value: activeCount, icon: 'verified_user', tone: 'si-teal', detail: 'Tài khoản đang có thể sử dụng' },
            { label: 'Bị khóa', value: lockedCount, icon: 'block', tone: 'si-amber', detail: 'Tài khoản đã bị hạn chế truy cập' },
            { label: 'Trang hiện tại', value: pagination.current, icon: 'format_list_numbered', tone: 'si-gray', detail: `Tổng ${pagination.pages} trang dữ liệu` },
          ].map((stat, idx) => (
            <div key={stat.label} className={`stat-card ${idx === 2 ? 'warn' : ''}`}>
              <div className={`stat-icon ${stat.tone}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-desc">{stat.detail}</div>
            </div>
          ))}
        </div>

        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '17px',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Nhập tên hoặc email... (Enter để tìm)"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <select
              className="fselect"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Bị khóa</option>
            </select>

            {(keywordInput || filters.status) && (
              <button type="button" onClick={handleClearFilters} className="btn-ghost">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>Xóa lọc
              </button>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div className="filter-counts">
            <span className="dot-count"><span className="dot dot-teal" />Trang {pagination.current} / {pagination.pages}</span>
            <span className="dot-count"><span className="dot dot-gray" />Tổng: {pagination.total} khách hàng</span>
            {loading && (
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang tải...
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="table-wrap">
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Đang tải...</div>
          </div>
        ) : customers.length === 0 ? (
          <div className="table-wrap">
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Chưa tìm thấy khách hàng.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <div
              className="tbl-header"
              style={{ gridTemplateColumns: '1.2fr 1.2fr 0.7fr 0.9fr 0.9fr 0.7fr 0.9fr' }}
            >
              <div className="th">Khách hàng</div>
              <div className="th">Email / SĐT</div>
              <div className="th center">Giới tính</div>
              <div className="th center">Trạng thái</div>
              <div className="th center">Xác thực</div>
              <div className="th right"># Đơn hàng</div>
              <div className="th right">Thao tác</div>
            </div>

            {customers.map((c) => (
              <div
                key={String(c.userId)}
                className="tbl-row"
                style={{ gridTemplateColumns: '1.2fr 1.2fr 0.7fr 0.9fr 0.9fr 0.7fr 0.9fr' }}
              >
                <div>
                  <div className="prod-name">{c.fullName || '—'}</div>
                  <div className="prod-meta">
                    <span className="prod-tag">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>badge</span>
                      userId: <span style={{ fontFamily: 'monospace' }}>{c.userId}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="prod-name" style={{ fontSize: '13px', fontWeight: 500 }}>{c.email || '—'}</div>
                  <div className="prod-meta">
                    <span className="prod-tag">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>call</span>
                      {c.phoneNumber || '—'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {genderLabel(c.gender)}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span className={`badge ${c.status ? 'badge-green' : 'badge-red'}`}>{statusLabel(c.status)}</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span className={`badge ${c.emailVerified ? 'badge-green' : 'badge-cat'}`}>{verifiedLabel(c.emailVerified)}</span>
                </div>

                <div className="price-val">{c.totalOrders ?? 0}</div>

                <div>
                  <div className="act-row">
                    <button
                      type="button"
                      onClick={() => fetchCustomerDetail(c.userId)}
                      className="act-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>Xem
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="tbl-footer">
              <span className="footer-text">
                Trang hiện tại: <strong>{pagination.current}</strong> · Tổng: <strong>{pagination.total}</strong> khách hàng
              </span>

              <div className="pager">
                <button
                  disabled={!canPrev}
                  onClick={() => fetchCustomers(pagination.current - 1)}
                  className="page-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                </button>

                <button className="page-btn active">{pagination.current}</button>

                <button
                  disabled={!canNext}
                  onClick={() => fetchCustomers(pagination.current + 1)}
                  className="page-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-900">
                  {selectedCustomer?.fullName || 'Chi tiết khách hàng'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  userId: <span className="font-mono">{selectedCustomer?.userId ?? '—'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-ghost"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-auto p-6">
              {detailsLoading ? (
                <div className="filter-bar" style={{ marginBottom: 0 }}>Đang tải chi tiết...</div>
              ) : detailsError ? (
                <div className="filter-bar" style={{ marginBottom: 0, color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' }}>
                  {detailsError}
                </div>
              ) : !selectedCustomer ? (
                <div className="filter-bar" style={{ marginBottom: 0 }}>Không có dữ liệu.</div>
              ) : (
                <>
                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '16px' }}>
                    <div className="stat-card">
                      <div className="stat-label">Tổng đơn</div>
                      <div className="stat-value">{selectedCustomer.totalOrders ?? 0}</div>
                      <div className="stat-desc">Tất cả đơn hàng của khách</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Completed</div>
                      <div className="stat-value">{selectedCustomer.completedOrders ?? 0}</div>
                      <div className="stat-desc">Đơn hoàn thành</div>
                    </div>
                    <div className="stat-card warn">
                      <div className="stat-label">Cancelled</div>
                      <div className="stat-value">{selectedCustomer.cancelledOrders ?? 0}</div>
                      <div className="stat-desc">Đơn đã hủy</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Tổng chi tiêu</div>
                      <div className="stat-value">{formatVND(selectedCustomer.totalSpent)}</div>
                      <div className="stat-desc">Giá trị mua hàng tích lũy</div>
                    </div>
                  </div>

                  <div className="filter-bar" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <div className="filter-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Email</div>
                        <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>{selectedCustomer.email || '—'}</div>
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>SĐT: {selectedCustomer.phoneNumber || '—'}</div>
                      </div>
                      <div>
                        <div className="filter-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Thông tin</div>
                        <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Giới tính: {genderLabel(selectedCustomer.gender)}</div>
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                          Ngày sinh: {selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="filter-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Trạng thái</div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span className={`badge ${selectedCustomer.status ? 'badge-green' : 'badge-red'}`}>{statusLabel(selectedCustomer.status)}</span>
                          <span className={`badge ${selectedCustomer.emailVerified ? 'badge-green' : 'badge-cat'}`}>{verifiedLabel(selectedCustomer.emailVerified)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <div className="filter-bar" style={{ marginBottom: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
                      <div className="filter-label">5 đơn gần nhất</div>
                      <div style={{ marginTop: '4px', fontSize: '13px', color: '#64748b' }}>Dựa theo ngày tạo đơn.</div>
                    </div>

                    {Array.isArray(selectedCustomer.recentOrders) && selectedCustomer.recentOrders.length > 0 ? (
                      <>
                        <div className="tbl-header" style={{ gridTemplateColumns: '1fr 0.8fr 1fr 0.8fr' }}>
                          <div className="th">Mã đơn</div>
                          <div className="th">Trạng thái</div>
                          <div className="th">Thanh toán</div>
                          <div className="th right">Tổng</div>
                        </div>
                        {selectedCustomer.recentOrders.map((o) => (
                          <div key={String(o.orderId)} className="tbl-row" style={{ gridTemplateColumns: '1fr 0.8fr 1fr 0.8fr' }}>
                            <div>
                              <div className="prod-name">{o.orderCode || `#${o.orderId}`}</div>
                              <div className="prod-meta">
                                <span className="prod-tag">items: {o.itemCount ?? 0}</span>
                              </div>
                            </div>
                            <div>
                              <span className="badge badge-cat">{o.status || '—'}</span>
                            </div>
                            <div>
                              <div className="prod-name" style={{ fontSize: '13px', fontWeight: 500 }}>{o.paymentMethod || '—'}</div>
                              <div className="prod-meta">
                                <span className="prod-tag">{o.paymentStatus ? `Status: ${o.paymentStatus}` : '—'}</span>
                              </div>
                            </div>
                            <div className="price-val">{formatVND(o.total)}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ padding: '20px', color: '#64748b', fontSize: '14px' }}>Khách hàng chưa có đơn nào.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
