import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, CheckCircle2, Lock, LogOut, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../constants/translations';

export const Toast = ({ message, type }) => {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
        {type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
};

export const Header = ({ lang, setLang }) => {
  const { user, isAdmin, logout, requireAuth } = useAuth();
  const curText = t[lang];
  const navigate = useNavigate();

  const handleLoginClick = () => {
    requireAuth('manual_login', () => {});
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[100]">
      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
        <div className="rounded-xl overflow-hidden shadow-lg shadow-blue-600/20 w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
          <img src="/pwa-512x512.png" alt="logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-black text-base md:text-lg text-slate-900 tracking-tight">
          LP <span className="text-blue-600">Audit Agent</span>
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          <button onClick={() => setLang('en')} className={`px-2.5 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${lang==='en'?'bg-white shadow-sm text-blue-600':'text-slate-400 hover:text-slate-600'}`}>EN</button>
          <button onClick={() => setLang('zh')} className={`px-2.5 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${lang==='zh'?'bg-white shadow-sm text-blue-600':'text-slate-400 hover:text-slate-600'}`}>中文</button>
        </div>

        {user ? (
          <div className="flex gap-2 items-center">
             <div className="hidden md:flex flex-col items-end mr-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Logged In</span>
               <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate">{user.email}</span>
             </div>
             {isAdmin && (
               <button onClick={() => navigate('/admin')} className="bg-purple-600 text-white p-2 md:px-4 md:py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">
                 <Shield size={16}/>
                 <span className="hidden lg:inline">Admin Panel</span>
               </button>
             )}
             <button onClick={async () => { await logout(); navigate('/'); }} className="bg-slate-100 text-slate-700 p-2 md:px-4 md:py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">
               <LogOut size={16}/>
               <span className="hidden md:inline">Log Out</span>
             </button>
          </div>
        ) : (
          <button onClick={handleLoginClick} className="bg-slate-900 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]">
            <Lock size={16}/>
            <span>{curText.loginBtn}</span>
          </button>
        )}
      </div>
    </header>
  );
};
