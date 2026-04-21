import React from 'react';

export default function AdminDashboard() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      

      {/* --- Dashboard Content --- */}
      <div className="p-8 space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Tổng doanh thu', val: '1.280.430.000₫', trend: '+12.5%', icon: 'payments', up: true },
            { label: 'Tổng đơn hàng', val: '1,240', trend: '+8.2%', icon: 'shopping_bag', up: true },
            { label: 'Khách hàng mới', val: '320', trend: '+5.4%', icon: 'person_add', up: true },
            { label: 'Phiên hoạt động', val: '85', trend: '-2.1%', icon: 'pulse_alert', up: false },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{card.val}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${card.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span className="material-symbols-outlined text-lg">
                      {card.up ? 'trending_up' : 'trending_down'}
                    </span>
                    <span>{card.trend}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#ff6b00]/10 flex items-center justify-center text-[#ff6b00]">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Section */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Xu hướng doanh thu</h2>
              <p className="text-slate-500 text-sm">Phân tích doanh thu trong 30 ngày qua</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-semibold bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg">
                30 Ngày qua
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                90 Ngày qua
              </button>
            </div>
          </div>
          <div className="h-80 w-full relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b00" stopOpacity="0.3"></stop>
                  <stop offset="95%" stopColor="#ff6b00" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path 
                d="M0,250 Q100,220 200,240 T400,180 T600,200 T800,120 T1000,150 L1000,300 L0,300 Z"
                fill="url(#chartGradient)"
              ></path>
              <path 
                d="M0,250 Q100,220 200,240 T400,180 T600,200 T800,120 T1000,150" 
                fill="none"
                stroke="#ff6b00" 
                strokeLinecap="round" 
                strokeWidth="4"
              ></path>
              <line className="text-slate-200" stroke="currentColor" strokeWidth="1" x1="0" x2="1000" y1="300" y2="300"></line>
            </svg>
            <div className="flex justify-between mt-4 text-xs font-semibold text-slate-400 px-2">
              <span>01 Tháng 4</span>
              <span>07 Tháng 4</span>
              <span>14 Tháng 4</span>
              <span>21 Tháng 4</span>
              <span>28 Tháng 4</span>
              <span>Hôm nay</span>
            </div>
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Selling Products */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Sản phẩm bán chạy</h3>
              <button className="text-[#ff6b00] text-sm font-bold hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4">Đã bán</th>
                    <th className="px-6 py-4">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Váy lụa mùa hè', sales: '1,245', rev: '48.550.000₫', img: 'https://placehold.co/40x40' },
                    { name: 'Bốt da Chelsea', sales: '982', rev: '32.140.000₫', img: 'https://placehold.co/40x40' },
                    { name: 'Áo len đan Wool', sales: '845', rev: '21.800.000₫', img: 'https://placehold.co/40x40' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={row.img} className="w-10 h-10 rounded-lg object-cover" alt={row.name} />
                          <span className="font-medium text-sm text-slate-700">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{row.sales}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#ff6b00]">{row.rev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Đơn hàng gần đây</h3>
              <button className="text-[#ff6b00] text-sm font-bold hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Mã đơn</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Giá trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { id: '#ORD-2589', user: 'Hoàng Toàn', status: 'Đã giao', color: 'emerald', price: '1.280.000₫' },
                    { id: '#ORD-2588', user: 'Minh Trần', status: 'Đang xử lý', color: 'amber', price: '450.000₫' },
                    { id: '#ORD-2587', user: 'Elena Nguyen', status: 'Đang giao', color: 'blue', price: '2.229.000₫' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.user}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase 
                          ${row.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${row.color === 'amber' ? 'bg-amber-100 text-amber-700' : ''}
                          ${row.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        `}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}