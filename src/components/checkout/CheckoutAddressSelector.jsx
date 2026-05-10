import React from 'react';

export default function CheckoutAddressSelector({ addresses, selectedId, onSelect, onAddNew }) {
  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-10">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-lumiere-gray/10">
        <h2 className="serif text-2xl text-lumiere-charcoal">Địa chỉ nhận hàng</h2>
        <button 
          onClick={onAddNew}
          className="text-[11px] tracking-[0.15em] uppercase font-bold text-lumiere-terracotta hover:underline transition-all"
        >
          + Thêm địa chỉ mới
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-lumiere-gray/20">
          <p className="serif text-lumiere-gray italic mb-4">Bạn chưa có địa chỉ giao hàng.</p>
          <button 
            onClick={onAddNew}
            className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-6 py-3 hover:bg-lumiere-terracotta transition-all"
          >
            Thêm địa chỉ ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const active = String(addr.id) === String(selectedId);
            return (
              <button
                key={addr.id}
                onClick={() => onSelect(String(addr.id))}
                className={`text-left p-6 border transition-all relative ${
                  active 
                    ? 'border-lumiere-terracotta bg-lumiere-blush/20' 
                    : 'border-lumiere-gray/10 hover:border-lumiere-gray/30 bg-lumiere-cream/10'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lumiere-charcoal uppercase tracking-wider text-[13px]">{addr.fullName}</span>
                  {active && (
                    <span className="material-symbols-outlined text-lumiere-terracotta text-[20px]">check_circle</span>
                  )}
                </div>
                <div className="text-[13px] text-lumiere-gray space-y-1">
                  <p>{addr.phone}</p>
                  <p className="line-clamp-2">{addr.street}, {addr.ward}, {addr.district}, {addr.province}</p>
                </div>
                {(addr.isDefault || addr.default) && (
                  <span className="mt-3 inline-block text-[9px] tracking-widest uppercase font-bold text-lumiere-terracotta bg-lumiere-terracotta/5 px-2 py-0.5 border border-lumiere-terracotta/20">Mặc định</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
