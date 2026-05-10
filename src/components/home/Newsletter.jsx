import React, { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Đăng ký thành công! Kiểm tra email của bạn.');
    setEmail('');
  };

  return (
    <section className="bg-lumiere-terracotta py-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/60 mb-4">
          Đăng ký nhận tin
        </div>
        <h2 className="serif text-[clamp(32px,4vw,52px)] text-white font-light mb-3">
          Đừng bỏ lỡ<br /><em className="italic text-white">những ưu đãi độc quyền</em>
        </h2>
        <p className="text-sm text-white/65 mb-10">
          Nhận ngay 10% cho đơn hàng đầu tiên khi đăng ký.
        </p>
        
        <form 
          onSubmit={handleSubmit}
          className="max-w-[500px] mx-auto flex gap-0 border-b border-white/40 group focus-within:border-white transition-colors"
        >
          <input 
            type="email" 
            placeholder="Địa chỉ email của bạn..." 
            className="flex-1 bg-transparent border-none text-white text-sm py-2.5 outline-none placeholder:text-white/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button 
            type="submit"
            className="bg-transparent border-none text-white text-[11px] tracking-[0.2em] uppercase font-medium px-5 cursor-pointer whitespace-nowrap"
          >
            Đăng ký
          </button>
        </form>
      </div>
    </section>
  );
}
