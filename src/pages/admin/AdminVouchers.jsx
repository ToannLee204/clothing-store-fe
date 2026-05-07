import React, { useEffect, useState } from 'react';
import './AdminProducts.css';

const numberFormatter = new Intl.NumberFormat('vi-VN');

const formatNumberWithDots = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return numberFormatter.format(Number(digits));
};

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    voucherCode: '',
    type: 'fixed',
    discountValue: '',
    minOrderValue: '',
    maxDiscountCap: '',
    startDate: '',
    expiryDate: '',
    maxUsage: '',
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token = localStorage.getItem('token');
  const API_URL = '/api/v1/admin/vouchers';

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}?page=0&pageSize=1000`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      let actualData = {};
      if (text) {
        try {
          actualData = JSON.parse(text);
        } catch (e) {}
      }

      if (response.ok) {
        const rawData = actualData.data || actualData || {};
        let finalArray = [];
        if (Array.isArray(rawData)) finalArray = rawData;
        else if (rawData.content && Array.isArray(rawData.content)) finalArray = rawData.content;
        else if (rawData.result && Array.isArray(rawData.result)) finalArray = rawData.result;
        else if (rawData.items && Array.isArray(rawData.items)) finalArray = rawData.items;

        setVouchers(finalArray);
      } else {
        setVouchers([]);
      }
    } catch (err) {
      console.error('Lỗi API Voucher:', err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      voucherCode: '',
      type: 'fixed',
      discountValue: '',
      minOrderValue: '',
      maxDiscountCap: '',
      startDate: '',
      expiryDate: '',
      maxUsage: '',
    });
    setEditingCode(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher) => {
    setFormData({
      voucherCode: voucher.voucherCode,
      type: voucher.type,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue || '',
      maxDiscountCap: voucher.maxDiscountCap || '',
      startDate: voucher.startDate,
      expiryDate: voucher.expiryDate,
      maxUsage: voucher.maxUsage,
    });
    setEditingCode(voucher.voucherCode);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingCode ? `${API_URL}/${editingCode}` : API_URL;
      const method = editingCode ? 'PUT' : 'POST';
      const payload = { ...formData };
      if (payload.type === 'fixed') payload.maxDiscountCap = null;
      if (editingCode) delete payload.voucherCode;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchVouchers();
      } else {
        const text = await response.text();
        alert('Lỗi: ' + text);
      }
    } catch (err) {
      alert('Lỗi kết nối Server!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (voucherCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mã ${voucherCode}?`)) return;
    try {
      const response = await fetch(`${API_URL}/${voucherCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (voucherCode) => {
    try {
      const response = await fetch(`${API_URL}/${voucherCode}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const processedVouchers = vouchers.filter((v) => {
    const isExpired = new Date(v.expiryDate) < new Date();

    if (filterStatus === 'active' && (!v.active || isExpired)) return false;
    if (filterStatus === 'inactive' && v.active) return false;
    if (filterStatus === 'expired' && !isExpired) return false;
    if (filterType !== 'all' && v.type !== filterType) return false;

    return true;
  });

  const totalPages = Math.ceil(processedVouchers.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const currentData = processedVouchers.slice(startIndex, startIndex + itemsPerPage);

  const changeFilterStatus = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const changeFilterType = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter((v) => v.active && new Date(v.expiryDate) >= new Date()).length;
  const expiredVouchers = vouchers.filter((v) => new Date(v.expiryDate) < new Date()).length;
  const totalUsedCount = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý mã giảm giá</div>
            <div className="pm-subtitle">Tạo, lọc và quản lý các chương trình khuyến mãi theo cùng giao diện với trang sản phẩm.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost" onClick={fetchVouchers}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>Làm mới
            </button>
            <button className="btn-primary" onClick={handleOpenAdd}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>Tạo mã mới
            </button>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Tổng số mã', value: totalVouchers, icon: 'confirmation_number', tone: 'si-gray', detail: 'Toàn bộ mã voucher trong hệ thống' },
            { label: 'Đang hoạt động', value: activeVouchers, icon: 'check_circle', tone: 'si-teal', detail: 'Có thể áp dụng ngay lúc này' },
            { label: 'Đã hết hạn', value: expiredVouchers, icon: 'timer_off', tone: 'si-amber', detail: 'Không còn hiệu lực sử dụng' },
            { label: 'Tổng lượt dùng', value: totalUsedCount.toLocaleString('vi-VN'), icon: 'group_add', tone: 'si-blue', detail: 'Tổng lượt áp dụng của tất cả mã' },
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                ['all', 'Tất cả'],
                ['active', 'Đang hoạt động'],
                ['inactive', 'Đã tạm dừng'],
                ['expired', 'Đã hết hạn'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => changeFilterStatus(value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: filterStatus === value ? '1px solid rgba(0,102,162,0.2)' : '1px solid transparent',
                    background: filterStatus === value ? 'rgba(0,102,162,0.08)' : 'transparent',
                    color: filterStatus === value ? '#0066A2' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>filter_list</span>
                Lọc theo
              </div>
              <select className="fselect" value={filterType} onChange={changeFilterType}>
                <option value="all">Tất cả loại mã</option>
                <option value="fixed">Giảm giá trực tiếp</option>
                <option value="percent">Phần trăm</option>
              </select>
            </div>
          </div>

          <div className="filter-counts">
            <span className="dot-count"><span className="dot dot-teal" />{activeVouchers} đang hoạt động</span>
            <span className="dot-count"><span className="dot dot-gray" />{processedVouchers.length} kết quả</span>
            {loading && (
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Đang tải...
              </span>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <div
            className="tbl-header"
            style={{ gridTemplateColumns: '1.3fr 0.9fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr' }}
          >
            <div className="th">Mã Voucher</div>
            <div className="th">Loại</div>
            <div className="th">Giá trị</div>
            <div className="th">Thời gian</div>
            <div className="th">Lượt dùng</div>
            <div className="th">Trạng thái</div>
            <div className="th right">Thao tác</div>
          </div>

          {currentData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              {vouchers.length === 0 ? 'Chưa có mã giảm giá nào. Hãy tạo mã mới.' : 'Không tìm thấy mã giảm giá phù hợp với bộ lọc.'}
            </div>
          ) : (
            currentData.map((v) => {
              const isPercent = v.type === 'percent';
              const isExpired = new Date(v.expiryDate) < new Date();
              const progress = v.maxUsage > 0 ? (v.usedCount / v.maxUsage) * 100 : 0;

              return (
                <div
                  key={v.voucherCode}
                  className="tbl-row"
                  style={{
                    gridTemplateColumns: '1.3fr 0.9fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr',
                    opacity: !v.active || isExpired ? 0.72 : 1,
                  }}
                >
                  <div>
                    <div className="prod-name" style={{ textTransform: 'uppercase' }}>{v.voucherCode}</div>
                    <div className="prod-meta">
                      <span className="prod-tag">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>shopping_bag</span>
                        {v.minOrderValue ? `Đơn tối thiểu: ${formatCurrency(v.minOrderValue)}` : 'Mọi đơn hàng'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="badge badge-cat" style={{ color: isPercent ? '#1d4ed8' : '#7c3aed' }}>
                      {isPercent ? 'Phần trăm' : 'Trực tiếp'}
                    </span>
                  </div>

                  <div>
                    <div className="price-val" style={{ textAlign: 'left', color: '#0066A2' }}>
                      {isPercent ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                    </div>
                    {isPercent && v.maxDiscountCap ? (
                      <div className="price-note" style={{ textAlign: 'left' }}>Trần: {formatCurrency(v.maxDiscountCap)}</div>
                    ) : (
                      <div className="price-note" style={{ textAlign: 'left' }}>Không giới hạn trần</div>
                    )}
                  </div>

                  <div>
                    <div className="prod-meta" style={{ display: 'block' }}>
                      <div className="prod-tag">BĐ: {formatDate(v.startDate)}</div>
                      <div className="prod-tag" style={{ marginTop: '4px', color: isExpired ? '#dc2626' : '#64748b' }}>
                        KT: {formatDate(v.expiryDate)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ width: '100%', maxWidth: '110px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px', fontWeight: 700, color: '#64748b' }}>
                        <span>{v.usedCount}/{v.maxUsage}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#0066A2', borderRadius: '999px' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleToggle(v.voucherCode)}
                      className={`badge ${v.active && !isExpired ? 'badge-green' : 'badge-red'}`}
                      title="Bấm để đổi trạng thái"
                    >
                      <span className="dot" style={{ marginRight: '4px' }} />
                      {v.active && !isExpired ? 'Đang chạy' : isExpired ? 'Hết hạn' : 'Tạm dừng'}
                    </button>
                  </div>

                  <div>
                    <div className="act-row">
                      <button className="act-btn edit" onClick={() => handleOpenEdit(v)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>Sửa
                      </button>
                      <button className="act-btn del" onClick={() => handleDelete(v.voucherCode)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="tbl-footer">
              <span className="footer-text">
                Hiển thị <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, processedVouchers.length)}</strong> / <strong>{processedVouchers.length}</strong> mã
              </span>

              <div className="pager">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-btn ${validCurrentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

            <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="shrink-0 border-b border-slate-100 px-8 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      <span className="material-symbols-outlined text-[#0066A2]">sell</span>
                      {editingCode ? `Cập nhật mã ${editingCode}` : 'Tạo mã giảm giá mới'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Quản lý thông tin ưu đãi theo cùng ngôn ngữ giao diện với trang sản phẩm.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="page-btn"
                    style={{ width: '36px', height: '36px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
              </div>

              <div className="custom-scrollbar overflow-y-auto p-8">
                <form id="voucherForm" onSubmit={handleSubmit} className="space-y-6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Mã Voucher <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        required
                        disabled={!!editingCode}
                        type="text"
                        placeholder="VD: FREESHIP, TET2026..."
                        value={formData.voucherCode}
                        onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          outline: 'none',
                          boxSizing: 'border-box',
                          opacity: editingCode ? 0.65 : 1,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Loại giảm giá <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <select
                        className="fselect"
                        style={{ width: '100%', paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px' }}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value, maxDiscountCap: '' })}
                      >
                        <option value="fixed">Giảm số tiền cố định (VND)</option>
                        <option value="percent">Giảm theo phần trăm (%)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Mức giảm {formData.type === 'percent' ? '(%)' : '(VND)'} <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        required
                        type={formData.type === 'percent' ? 'number' : 'text'}
                        inputMode={formData.type === 'percent' ? undefined : 'numeric'}
                        min="1"
                        placeholder={formData.type === 'percent' ? 'VD: 10' : 'VD: 50.000'}
                        value={formData.type === 'percent' ? formData.discountValue : formatNumberWithDots(formData.discountValue)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountValue: formData.type === 'percent' ? e.target.value : e.target.value.replace(/\D/g, ''),
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Giảm tối đa (VND)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        min="1"
                        disabled={formData.type === 'fixed'}
                        placeholder="VD: 100.000"
                        value={formatNumberWithDots(formData.maxDiscountCap)}
                        onChange={(e) => setFormData({ ...formData, maxDiscountCap: e.target.value.replace(/\D/g, '') })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                          opacity: formData.type === 'fixed' ? 0.5 : 1,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Đơn tối thiểu (VND)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        min="0"
                        placeholder="VD: 200.000"
                        value={formatNumberWithDots(formData.minOrderValue)}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value.replace(/\D/g, '') })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Tổng lượt sử dụng <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="VD: 100"
                        value={formData.maxUsage}
                        onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Ngày bắt đầu <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                        Ngày hết hạn <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="tbl-footer" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" form="voucherForm" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{loading ? 'sync' : 'save'}</span>
                  {editingCode ? 'Lưu thay đổi' : 'Tạo mã Voucher'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminVouchers;
