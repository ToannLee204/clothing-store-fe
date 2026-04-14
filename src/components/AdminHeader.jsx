import React from 'react';

export default function AdminHeader({ user }) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-40 bg-[#FDF9F4]/80 backdrop-blur-md border-b border-[#C4C7C7]/15 flex justify-between items-center h-20 px-10 ml-72">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
          <input
            className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-primary text-sm font-body py-2 pl-10 transition-all"
            placeholder="Tìm kiếm hệ thống..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex gap-6">
          <button className="relative text-[#735A39] hover:text-[#1A1A1A] transition-all">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <button className="text-[#735A39] hover:text-[#1A1A1A] transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant/20"></div>
        <div className="flex items-center gap-3 group">
          <span className="font-label text-[0.6875rem] tracking-widest uppercase text-on-surface-variant">
            {user?.fullName || 'Admin'}
          </span>
          <div className="w-10 h-10 bg-surface-container-highest overflow-hidden">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF4uA3g6SojVk_lnoqKM4f7PixfD6ib_k9JTdzqEZF3Bi2V_NLeKPK8aRyRmi-bDsbR5YMrJcMHwAzFL9cZx1l7OMgtOfTF_JAj7hzRiY4jbhln_aCAzyulcJEOi-EZwYA4RzJpJl0RAx2s8y_Qitx24bDt1ipKawMKO8by6hC8dFt_fwc7tBd4fGXpi8aRQXQ4_QwmARgNdF0-T05FYVoZH_EikSjzwj9LpBpBr3dYV-aAqLzQfUy_v_iZ_cUa1qOFUIfQ2uOVN8" alt="Admin" />
          </div>
        </div>
      </div>
    </header>
  );
}