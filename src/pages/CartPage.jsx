import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CHI_TIET_GIO_HANG, 
  BIEN_THE_SAN_PHAM, 
  SAN_PHAM, 
  MA_GIAM_GIA 
} from '../data/mockData';

const CartPage = () => {
  const [details, setDetails] = useState(CHI_TIET_GIO_HANG);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Map dữ liệu quan hệ
  const cartItems = useMemo(() => {
    return details.map(item => {
      const variant = BIEN_THE_SAN_PHAM.find(v => v.maBienThe === item.maBienThe);
      const product = SAN_PHAM.find(p => p.maSP === variant.maSP);
      return { ...item, tenSP: product.ten, anh: product.anhDaiDien, mau: variant.mauSac, size: variant.kichCo };
    });
  }, [details]);

  // Logic tiền tệ
  const tamTinh = useMemo(() => cartItems.reduce((sum, i) => sum + (i.donGia * i.soLuong), 0), [cartItems]);
  const phiShip = 45000;
  
  const handleVoucher = () => {
    const v = MA_GIAM_GIA.find(m => m.maVoucher === voucherCode.toUpperCase());
    if (v && tamTinh >= v.dieuKien) {
      setAppliedVoucher(v);
    } else {
      alert("Mã không hợp lệ hoặc chưa đủ điều kiện đơn hàng!");
    }
  };

  const giamGia = appliedVoucher ? (appliedVoucher.loai === 'phan_tram' ? (tamTinh * appliedVoucher.giaTriGiam / 100) : appliedVoucher.giaTriGiam) : 0;
  const tongCong = tamTinh + phiShip - giamGia;

  const formatVND = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

  return (
    <div className="bg-[#fdf9f4] min-h-screen pt-32 pb-24 px-12 max-w-[1920px] mx-auto transition-all duration-300">
      {/* Header */}
      <header className="mb-16">
        <h1 className="font-headline text-[3.5rem] tracking-tighter leading-none mb-4 italic">Giỏ hàng của bạn</h1>
        <div className="flex items-center space-x-2 text-[0.6875rem] font-label tracking-widest uppercase text-[#444748]">
          <span>Giỏ hàng</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="opacity-40">Thanh toán</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="opacity-40">Thanh toán (Bước cuối)</span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-16">
        {/* Danh sách sản phẩm - Chiếm 8 cột */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-12 pb-6 border-b border-[#c4c7c7]/30 text-[0.6875rem] font-label tracking-widest uppercase text-[#444748]">
            <div className="col-span-6">Chi tiết sản phẩm</div>
            <div className="col-span-2 text-center">Giá</div>
            <div className="col-span-2 text-center">Số lượng</div>
            <div className="col-span-2 text-right">Tổng cộng</div>
          </div>

          <div className="divide-y divide-[#c4c7c7]/10">
            {cartItems.map((item) => (
              <div key={item.maChiTiet} className="grid grid-cols-12 py-10 items-center">
                <div className="col-span-6 flex gap-8">
                  <div className="w-32 aspect-[3/4] bg-[#f7f3ee] overflow-hidden">
                    <img className="w-full h-full object-cover" src={item.anh} alt={item.tenSP} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-headline text-xl mb-1 italic">{item.tenSP}</h3>
                    <p className="text-[#444748] text-sm mb-4">Màu: {item.mau} / Size: {item.size}</p>
                    <div className="flex items-center text-xs text-[#735a39] gap-1">
                      <span className="material-symbols-outlined text-[14px] fill-1">check_circle</span>
                      <span className="font-label tracking-wider uppercase">Còn hàng (Sẵn sàng giao)</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-center font-body text-sm">{formatVND(item.donGia)}</div>
                
                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center border border-[#c4c7c7]/30 px-3 py-2 bg-white">
                    <button onClick={() => setDetails(prev => prev.map(d => d.maChiTiet === item.maChiTiet ? {...d, soLuong: Math.max(1, d.soLuong - 1)} : d))} className="hover:text-black"><span className="material-symbols-outlined text-sm">remove</span></button>
                    <span className="mx-6 text-sm font-medium">{item.soLuong}</span>
                    <button onClick={() => setDetails(prev => prev.map(d => d.maChiTiet === item.maChiTiet ? {...d, soLuong: d.soLuong + 1} : d))} className="hover:text-black"><span className="material-symbols-outlined text-sm">add</span></button>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-body text-lg font-medium">{formatVND(item.donGia * item.soLuong)}</span>
                    <button onClick={() => setDetails(prev => prev.filter(d => d.maChiTiet !== item.maChiTiet))} className="mt-2 text-[#444748] hover:text-red-600 transition-colors flex items-center gap-1 group">
                      <span className="material-symbols-outlined text-lg">close</span>
                      <span className="text-[0.6875rem] font-label tracking-widest uppercase border-b border-transparent group-hover:border-red-600">Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span className="font-label text-[0.6875rem] tracking-widest uppercase border-b border-black/20 pb-1 group-hover:border-black transition-all">Tiếp tục mua sắm</span>
            </Link>
            <div className="flex items-center gap-4 text-xs font-label text-[#444748] tracking-wider uppercase">
              <span className="material-symbols-outlined text-[16px] animate-pulse text-[#735a39]">sync</span> 
              Trạng thái kho hàng cập nhật thời gian thực
            </div>
          </div>
        </div>

        {/* Sidebar - Tóm tắt đơn hàng */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="bg-white p-10 sticky top-32 border border-[#c4c7c7]/10 shadow-[0px_20px_40px_rgba(28,28,25,0.03)]">
            <h2 className="font-headline text-2xl mb-8 italic">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-6 mb-10 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-[#444748]">Tạm tính</span>
                <span>{formatVND(tamTinh)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#444748]">Phí vận chuyển dự kiến</span>
                <span>{formatVND(phiShip)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-[#735a39] font-medium">
                  <span>Giảm giá voucher ({appliedVoucher.maVoucher})</span>
                  <span>-{formatVND(giamGia)}</span>
                </div>
              )}
            </div>

            <div className="mb-10">
              <label className="block text-[0.6875rem] font-label tracking-widest uppercase text-[#444748] mb-3">Mã khuyến mãi</label>
              <div className="flex">
                <input 
                  type="text" 
                  value={voucherCode} 
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="w-full bg-transparent border-b border-[#c4c7c7]/30 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-[#c4c7c7] uppercase tracking-widest" 
                  placeholder="NHẬP MÃ" 
                />
                <button onClick={handleVoucher} className="ml-4 text-[0.6875rem] font-label tracking-widest uppercase text-black font-bold border-b border-black pb-1 hover:opacity-60">Áp dụng</button>
              </div>
            </div>

            <div className="border-t border-[#c4c7c7]/30 pt-8 mb-10">
              <div className="flex justify-between items-baseline">
                <span className="font-label text-xs tracking-widest uppercase">Tổng thanh toán</span>
                <span className="font-headline text-3xl italic">{formatVND(tongCong)}</span>
              </div>
              <p className="text-[10px] text-[#444748] text-right mt-2 italic">Đã bao gồm VAT (nếu có)</p>
            </div>

            <button className="w-full bg-black text-white py-5 font-label text-[0.75rem] tracking-[0.2rem] uppercase hover:bg-[#444748] transition-all flex items-center justify-center gap-3">
              Tiếp tục thanh toán <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
            
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 bg-[#f7f3ee] text-center">
                <span className="material-symbols-outlined text-2xl mb-2 text-[#444748]">verified_user</span>
                <span className="text-[9px] font-label uppercase tracking-wider text-[#444748]">Thanh toán bảo mật</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-[#f7f3ee] text-center">
                <span className="material-symbols-outlined text-2xl mb-2 text-[#444748]">local_shipping</span>
                <span className="text-[9px] font-label uppercase tracking-wider text-[#444748]">Miễn phí trả hàng</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;