import React, { useState, useEffect } from 'react';

const AdminVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);

    // State điều khiển Form Modal
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
        maxUsage: ''
    });

    // =================== STATE CHO BỘ LỌC VÀ PHÂN TRANG ===================
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive', 'expired'
    const [filterType, setFilterType] = useState('all');     // 'all', 'fixed', 'percent'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const token = localStorage.getItem('token');
    const API_URL = '/api/v1/admin/vouchers';

    // 1. LẤY DANH SÁCH VOUCHER
    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}?page=0&pageSize=1000`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const text = await response.text();
            let actualData = {};
            if (text) {
                try { actualData = JSON.parse(text); } catch (e) { }
            }

            if (response.ok) {
                let rawData = actualData.data || actualData || {};
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

    // Xử lý Mở / Đóng Form / API CRUD (Giữ nguyên như cũ)
    const handleOpenAdd = () => {
        setFormData({ voucherCode: '', type: 'fixed', discountValue: '', minOrderValue: '', maxDiscountCap: '', startDate: '', expiryDate: '', maxUsage: '' });
        setEditingCode(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (voucher) => {
        setFormData({ voucherCode: voucher.voucherCode, type: voucher.type, discountValue: voucher.discountValue, minOrderValue: voucher.minOrderValue || '', maxDiscountCap: voucher.maxDiscountCap || '', startDate: voucher.startDate, expiryDate: voucher.expiryDate, maxUsage: voucher.maxUsage });
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
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
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
            const response = await fetch(`${API_URL}/${voucherCode}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) fetchVouchers();
        } catch (err) { console.error(err); }
    };

    const handleToggle = async (voucherCode) => {
        try {
            const response = await fetch(`${API_URL}/${voucherCode}/toggle`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) fetchVouchers();
        } catch (err) { console.error(err); }
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

    // =================== LOGIC LỌC (FILTER) & PHÂN TRANG ===================
    // 1. Lọc dữ liệu
    const processedVouchers = vouchers.filter((v) => {
        const isExpired = new Date(v.expiryDate) < new Date();

        // Lọc theo Trạng thái
        if (filterStatus === 'active' && (!v.active || isExpired)) return false;
        if (filterStatus === 'inactive' && v.active) return false; // Inactive là Đã tạm dừng (chưa hết hạn)
        if (filterStatus === 'expired' && !isExpired) return false;

        // Lọc theo Loại mã
        if (filterType !== 'all' && v.type !== filterType) return false;

        return true;
    });

    // 2. Tính toán Phân trang
    const totalPages = Math.ceil(processedVouchers.length / itemsPerPage) || 1;
    const validCurrentPage = Math.min(currentPage, totalPages); // Đảm bảo ko bị kẹt ở trang rỗng khi lọc
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const currentData = processedVouchers.slice(startIndex, startIndex + itemsPerPage);

    // Hàm chuyển đổi filter reset luôn về trang 1
    const changeFilterStatus = (status) => { setFilterStatus(status); setCurrentPage(1); };
    const changeFilterType = (e) => { setFilterType(e.target.value); setCurrentPage(1); };

    // =================== TÍNH TOÁN THỐNG KÊ ===================
    const totalVouchers = vouchers.length;
    const activeVouchers = vouchers.filter(v => v.active && new Date(v.expiryDate) >= new Date()).length;
    const expiredVouchers = vouchers.filter(v => new Date(v.expiryDate) < new Date()).length;
    const totalUsedCount = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);

    return (
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#f8f6f6] font-sans">
            {/* Title & Action */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Quản lý mã giảm giá</h2>
                    <p className="text-slate-500 mt-1">Tạo và quản lý các chương trình khuyến mãi cho khách hàng</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-[#ec5b13] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#d95210] transition-all shadow-lg shadow-[#ec5b13]/20"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Tạo mã mới
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                            <span className="material-symbols-outlined">confirmation_number</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Tổng số mã</p>
                    <h3 className="text-2xl font-black mt-1">{totalVouchers}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Đang hoạt động</p>
                    <h3 className="text-2xl font-black mt-1">{activeVouchers}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined">timer_off</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Đã hết hạn</p>
                    <h3 className="text-2xl font-black mt-1">{expiredVouchers}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#ec5b13]/10 rounded-xl flex items-center justify-center text-[#ec5b13]">
                            <span className="material-symbols-outlined">group_add</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Tổng lượt sử dụng</p>
                    <h3 className="text-2xl font-black mt-1">{totalUsedCount.toLocaleString('vi-VN')}</h3>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                {/* NÚT LỌC (FILTER) HOẠT ĐỘNG */}
                <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => changeFilterStatus('all')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filterStatus === 'all' ? 'bg-[#ec5b13]/10 text-[#ec5b13] border border-[#ec5b13]/20' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => changeFilterStatus('active')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filterStatus === 'active' ? 'bg-[#ec5b13]/10 text-[#ec5b13] border border-[#ec5b13]/20' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Đang hoạt động
                        </button>
                        <button
                            onClick={() => changeFilterStatus('inactive')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filterStatus === 'inactive' ? 'bg-[#ec5b13]/10 text-[#ec5b13] border border-[#ec5b13]/20' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Đã tạm dừng
                        </button>
                        <button
                            onClick={() => changeFilterStatus('expired')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filterStatus === 'expired' ? 'bg-[#ec5b13]/10 text-[#ec5b13] border border-[#ec5b13]/20' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Đã hết hạn
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm">filter_list</span> Lọc theo:
                        </div>
                        <select
                            value={filterType}
                            onChange={changeFilterType}
                            className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-[#ec5b13] focus:border-[#ec5b13] font-bold text-slate-700 outline-none px-3 py-2 cursor-pointer"
                        >
                            <option value="all">Tất cả loại mã</option>
                            <option value="fixed">Giảm giá trực tiếp</option>
                            <option value="percent">Phần trăm</option>
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã Voucher</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá trị</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt dùng</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-500 font-medium bg-slate-50/50">
                                        {vouchers.length === 0 ? "Chưa có mã giảm giá nào. Hãy tạo mã mới!" : "Không tìm thấy mã giảm giá phù hợp với bộ lọc."}
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((v) => {
                                    const isPercent = v.type === 'percent';
                                    const isExpired = new Date(v.expiryDate) < new Date();
                                    const progress = v.maxUsage > 0 ? (v.usedCount / v.maxUsage) * 100 : 0;

                                    return (
                                        <tr key={v.voucherCode} className={`hover:bg-slate-50 transition-colors ${!v.active || isExpired ? 'opacity-70' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-slate-900 ${!v.active ? 'line-through' : ''}`}>{v.voucherCode}</span>
                                                    <span className="text-xs text-slate-500">{v.minOrderValue ? `Đơn tối thiểu: ${formatCurrency(v.minOrderValue)}` : 'Mọi đơn hàng'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isPercent ? (
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">Phần trăm</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded">Trực tiếp</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[#ec5b13]">
                                                {isPercent ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-xs">
                                                    <span>BĐ: {formatDate(v.startDate)}</span>
                                                    <span className={isExpired ? "text-red-500" : "text-slate-500"}>KT: {formatDate(v.expiryDate)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full max-w-[100px]">
                                                    <div className="flex justify-between text-[10px] mb-1 font-bold">
                                                        <span>{v.usedCount}/{v.maxUsage}</span>
                                                        <span>{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#ec5b13] rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggle(v.voucherCode)}
                                                    title="Bấm để Đổi trạng thái"
                                                    className="flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition-opacity"
                                                >
                                                    {v.active && !isExpired ? (
                                                        <><span className="w-2 h-2 bg-green-500 rounded-full"></span><span className="text-green-500">Đang chạy</span></>
                                                    ) : isExpired ? (
                                                        <><span className="w-2 h-2 bg-red-500 rounded-full"></span><span className="text-red-500">Hết hạn</span></>
                                                    ) : (
                                                        <><span className="w-2 h-2 bg-slate-400 rounded-full"></span><span className="text-slate-500">Tạm dừng</span></>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">

                                                    {/* Nút Sửa: Luôn hiện nền xám nhạt, hover đậm hơn */}
                                                    <button
                                                        onClick={() => handleOpenEdit(v)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        <span className="text-xs font-bold">Sửa</span>
                                                    </button>

                                                    {/* Nút Xóa: Luôn hiện nền đỏ nhạt, hover đậm hơn */}
                                                    <button
                                                        onClick={() => handleDelete(v.voucherCode)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        <span className="text-xs font-bold">Xóa</span>
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* NÚT PHÂN TRANG (PAGINATION) HOẠT ĐỘNG */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">
                            Hiển thị <span className="font-bold text-slate-700">{startIndex + 1}</span> - <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, processedVouchers.length)}</span> trong số <span className="font-bold text-slate-700">{processedVouchers.length}</span> mã
                        </p>

                        <div className="flex items-center gap-2">
                            {/* Nút Previous */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={validCurrentPage === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>

                            {/* Danh sách số trang */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${validCurrentPage === page
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 border border-primary'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Nút Next */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={validCurrentPage === totalPages}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL THÊM/SỬA VOUCHER */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

                    <div className="bg-white relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 shrink-0">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#ec5b13]">sell</span>
                                {editingCode ? `Cập nhật mã ${editingCode}` : 'Tạo mã giảm giá mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form id="voucherForm" onSubmit={handleSubmit} className="space-y-6">

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mã Voucher <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            disabled={!!editingCode}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-mono font-bold uppercase disabled:opacity-60 disabled:cursor-not-allowed outline-none"
                                            type="text"
                                            placeholder="VD: FREESHIP, TET2026..."
                                            value={formData.voucherCode}
                                            onChange={e => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại giảm giá <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold text-slate-700 outline-none"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value, maxDiscountCap: '' })}
                                        >
                                            <option value="fixed">Giảm số tiền cố định (VND)</option>
                                            <option value="percent">Giảm theo phần trăm (%)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Mức giảm {formData.type === 'percent' ? '(%)' : '(VND)'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold outline-none"
                                            placeholder={formData.type === 'percent' ? "VD: 10" : "VD: 50000"}
                                            value={formData.discountValue}
                                            onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                        />
                                    </div>
                                    {formData.type === 'percent' ? (
                                        <div className="space-y-2 animate-fade-in">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Giảm tối đa (VND)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold outline-none"
                                                placeholder="VD: 100000 (Để trống nếu ko giới hạn)"
                                                value={formData.maxDiscountCap}
                                                onChange={e => setFormData({ ...formData, maxDiscountCap: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="hidden"></div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đơn tối thiểu (VND)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold outline-none"
                                            placeholder="VD: 200000"
                                            value={formData.minOrderValue}
                                            onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng lượt sử dụng <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold outline-none"
                                            placeholder="VD: 100"
                                            value={formData.maxUsage}
                                            onChange={e => setFormData({ ...formData, maxUsage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày bắt đầu <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold outline-none"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày hết hạn <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] transition-all font-bold outline-none"
                                            value={formData.expiryDate}
                                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-4 shrink-0 bg-slate-50 rounded-b-2xl">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                Hủy bỏ
                            </button>
                            <button type="submit" form="voucherForm" disabled={loading} className="bg-[#ec5b13] text-white px-8 py-3 font-bold rounded-xl hover:bg-[#d95210] shadow-lg shadow-[#ec5b13]/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">save</span>}
                                {editingCode ? 'Lưu thay đổi' : 'Tạo mã Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVouchers;