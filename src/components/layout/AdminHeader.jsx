import React from 'react';

// NHẬN 2 PROPS TỪ LAYOUT
export default function AdminHeader({ isCollapsed, user }) {
  return (
    <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-20 px-8 transition-all duration-300 w-full`}>
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors">
            search
          </span>
          <input
            className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#ec5b13]/20 focus:bg-white transition-all placeholder:text-slate-400"
            placeholder="Tìm kiếm hệ thống..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 hover:text-[#ec5b13] relative transition-all">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-[#ec5b13] rounded-full border-2 border-white"></span>
          </button>
          <button className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 hover:text-[#ec5b13] transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900 leading-none capitalize">
              {user?.fullName || 'Super Admin'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Admin
            </span>
          </div>
          <div className="size-10 rounded-xl bg-[#ec5b13]/10 text-[#ec5b13] flex items-center justify-center overflow-hidden border border-white shadow-sm group-hover:border-[#ec5b13] transition-all">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF4uA3g6SojVk_lnoqKM4f7PixfD6ib_k9JTdzqEZF3Bi2V_NLeKPK8aRyRmi-bDsbR5YMrJcMHwAzFL9cZx1l7OMgtOfTF_JAj7hzRiY4jbhln_aCAzyulcJEOi-EZwYA4RzJpJl0RAx2s8y_Qitx24bDt1ipKawMKO8by6hC8dFt_fwc7tBd4fGXpi8aRQXQ4_QwmARgNdF0-T05FYVoZH_EikSjzwj9LpBpBr3dYV-aAqLzQfUy_v_iZ_cUa1qOFUIfQ2uOVN8" 
              alt="Admin" 
              onError={(e) => e.target.style.display = 'none'}
            />
            <span className="material-symbols-outlined font-bold">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}