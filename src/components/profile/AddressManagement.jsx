import React from 'react';

export default function AddressManagement({ addresses, onAdd, onEdit, onDelete, onSetDefault }) {
  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Địa chỉ giao hàng</h2>
          <p className="text-[13px] text-lumiere-gray">Quản lý các địa chỉ nhận hàng của bạn.</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-transparent border border-lumiere-charcoal text-lumiere-charcoal text-[11px] tracking-[0.2em] uppercase font-medium px-6 py-3.5 hover:bg-lumiere-charcoal hover:text-white transition-all flex items-center gap-2 justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm địa chỉ mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {addresses.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-lumiere-gray/30 text-lumiere-gray serif italic">
            Bạn chưa lưu địa chỉ giao hàng nào.
          </div>
        ) : (
          addresses.map(addr => (
            <div 
              key={addr.id} 
              className={`p-6 border transition-all ${
                addr.isDefault || addr.default 
                  ? 'border-lumiere-terracotta bg-lumiere-blush/20' 
                  : 'border-lumiere-gray/15 hover:border-lumiere-gray/40'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lumiere-charcoal">{addr.fullName}</span>
                  {(addr.isDefault || addr.default) && (
                    <span className="bg-lumiere-terracotta text-white text-[9px] tracking-widest uppercase px-2 py-0.5 font-medium">Mặc định</span>
                  )}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => onEdit(addr)} className="text-[11px] tracking-widest uppercase font-semibold text-lumiere-gray hover:text-lumiere-charcoal underline">Sửa</button>
                  <button onClick={() => onDelete(addr.id)} className="text-[11px] tracking-widest uppercase font-semibold text-lumiere-terracotta hover:opacity-70 underline">Xóa</button>
                </div>
              </div>
              
              <div className="text-[14px] text-lumiere-gray space-y-1">
                <p>Số điện thoại: {addr.phone}</p>
                <p>{addr.street}</p>
                <p>{addr.ward}, {addr.district}, {addr.province}</p>
              </div>

              {!(addr.isDefault || addr.default) && (
                <button 
                  onClick={() => onSetDefault(addr.id)}
                  className="mt-5 text-[11px] tracking-widest uppercase font-semibold text-lumiere-charcoal border-b border-lumiere-charcoal/30 hover:border-lumiere-charcoal transition-all"
                >
                  Thiết lập mặc định
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
