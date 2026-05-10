import React from 'react';

export default function Marquee() {
  const items = [
    "Miễn phí vận chuyển từ 500K",
    "Đổi trả trong 30 ngày",
    "Thanh toán an toàn 100%",
    "Hàng mới về mỗi tuần"
  ];

  return (
    <div className="bg-lumiere-charcoal text-lumiere-cream py-3.5 overflow-hidden whitespace-nowrap">
      <div className="inline-flex gap-16 animate-marquee">
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>
            {items.map((item, index) => (
              <span key={index} className="text-[11px] tracking-[0.2em] uppercase text-lumiere-gray flex items-center gap-4">
                {item} <span className="text-lumiere-terracotta">✦</span>
              </span>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
