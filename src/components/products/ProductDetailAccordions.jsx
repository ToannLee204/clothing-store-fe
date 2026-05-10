import React, { useState } from 'react';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-lumiere-gray/25">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4.5 text-[12px] tracking-[0.18em] uppercase font-medium text-lumiere-charcoal"
      >
        <span>{title}</span>
        <span className="text-[20px] font-light text-lumiere-gray">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-5' : 'max-h-0'}`}>
        <div className="text-[14px] text-lumiere-gray leading-loose whitespace-pre-line">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ProductDetailAccordions({ product }) {
  return (
    <div className="mt-7">
      <AccordionItem title="Mô tả sản phẩm" defaultOpen={true}>
        {product.description || 'Thông tin mô tả đang được cập nhật.'}
      </AccordionItem>
      <AccordionItem title="Thành phần & chất liệu">
        100% Cotton / Linen cao cấp. Không co rút. Nên giặt tay hoặc máy chế độ nhẹ với nước lạnh. Phơi bóng mát. Có thể ủi ở nhiệt độ trung bình.
      </AccordionItem>
      <AccordionItem title="Hướng dẫn chọn size">
        S: Ngực 82-86cm, Eo 62-66cm, Mông 88-92cm{"\n"}
        M: Ngực 86-90cm, Eo 66-70cm, Mông 92-96cm{"\n"}
        L: Ngực 90-94cm, Eo 70-74cm, Mông 96-100cm{"\n"}
        XL: Ngực 94-98cm, Eo 74-78cm, Mông 100-104cm
      </AccordionItem>
    </div>
  );
}
