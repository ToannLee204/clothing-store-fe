import React from 'react';

export default function AdminDashboard() {
  return (
    <>
      <header className="mb-12 flex justify-between items-end">
        <div>
          <p className="font-label text-[0.6875rem] tracking-widest uppercase text-secondary mb-2">Thứ Hai, 24 Tháng 3</p>
          <h2 className="text-4xl font-headline font-medium">Tổng quan Hệ thống</h2>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-2 border-b border-on-surface font-label text-[0.6875rem] tracking-widest uppercase hover:bg-surface-container-low transition-colors">
            Tải Báo Cáo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 flex flex-col justify-between min-h-[180px] border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <span className="font-label text-[0.6875rem] tracking-widest uppercase opacity-60">DOANH THU THÁNG</span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div>
            <h3 className="text-3xl font-headline mt-4">1.280.000.000đ</h3>
            <p className="text-xs font-body text-green-600 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12.5% so với tháng trước
            </p>
          </div>
        </div>
        <div className="bg-white p-8 flex flex-col justify-between min-h-[180px] border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <span className="font-label text-[0.6875rem] tracking-widest uppercase opacity-60">ĐƠN HÀNG MỚI</span>
            <span className="material-symbols-outlined text-secondary">shopping_cart</span>
          </div>
          <div>
            <h3 className="text-3xl font-headline mt-4">842</h3>
            <p className="text-xs font-body text-green-600 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +5.2% hôm nay
            </p>
          </div>
        </div>
        <div className="bg-white p-8 flex flex-col justify-between min-h-[180px] border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <span className="font-label text-[0.6875rem] tracking-widest uppercase opacity-60">KHÁCH HÀNG MỚI</span>
            <span className="material-symbols-outlined text-secondary">person_add</span>
          </div>
          <div>
            <h3 className="text-3xl font-headline mt-4">156</h3>
            <p className="text-xs font-body text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">remove</span> Ổn định
            </p>
          </div>
        </div>
        <div className="bg-black text-white p-8 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-label text-[0.6875rem] tracking-widest uppercase opacity-60 text-white/60">TỒN KHO THẤP</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h3 className="text-3xl font-headline mt-4 text-white">12</h3>
            <p className="text-xs font-body text-secondary mt-2">Cần nhập thêm hàng ngay</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white p-10 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-headline">Doanh thu 7 ngày</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-secondary"></span>
                <span className="font-label text-[0.625rem] tracking-widest uppercase">Tuần này</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-outline-variant"></span>
                <span className="font-label text-[0.625rem] tracking-widest uppercase">Tuần trước</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 relative">
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              <div className="border-b border-black w-full"></div>
              <div className="border-b border-black w-full"></div>
              <div className="border-b border-black w-full"></div>
              <div className="border-b border-black w-full"></div>
            </div>
            {[40, 65, 55, 85, 70, 95, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4">
                <div className="w-full bg-[#735a39]/10 relative h-32">
                  <div className="absolute bottom-0 w-full bg-[#735a39]" style={{ height: `${h}%` }}></div>
                </div>
                <span className="font-label text-[0.625rem]">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#f1ede8] p-10 flex flex-col">
          <h3 className="text-2xl font-headline mb-8">Sản phẩm bán chạy</h3>
          <div className="space-y-6 flex-1">
            {[
              { name: 'Váy Dạ Hội Lụa', val: 124, p: '90%' },
              { name: 'Áo Khoác Dạ Wool', val: 98, p: '75%' },
              { name: 'Áo Sơ Mi Linen Mùa Hè', val: 86, p: '65%' },
              { name: 'Dép Nhung Cao Cấp', val: 42, p: '35%' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="font-body text-sm">{item.name}</span>
                  <span className="font-body text-sm font-semibold">{item.val}</span>
                </div>
                <div className="w-full bg-black/10 h-[1.5px]">
                  <div className="bg-black h-full" style={{ width: item.p }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 text-center font-label text-[0.6875rem] tracking-widest uppercase underline underline-offset-8">Xem tất cả</button>
        </div>
      </div>
    </>
  );
}