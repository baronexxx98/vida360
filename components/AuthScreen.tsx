
import React from 'react';
import { Mail, Apple, Globe, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black text-white overflow-y-auto overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Scrollable Content Container */}
      <div className="relative z-10 min-h-full w-full flex flex-col items-center px-6 py-12">
        
        {/* Logo Section - Foco no Nome */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700 shrink-0">
          <h1 className="text-6xl font-[900] italic tracking-tighter uppercase leading-none mb-2">
            VIDA <span className="text-red-600">360</span>
          </h1>
          <p className="text-[11px] font-black tracking-[0.4em] text-white/40 uppercase">Proteção Inteligente Nacional</p>
        </div>

        {/* Value Proposition Box */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] w-full max-w-md mb-10 text-left shadow-2xl shrink-0">
          <h2 className="text-lg font-black uppercase tracking-tight mb-6 italic border-l-4 border-red-600 pl-4">Protocolos de Elite</h2>
          <ul className="space-y-5">
            <li className="flex items-start gap-4">
              <CheckCircle2 className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed tracking-tight">IA de Resgate baseada em Protocolos Oficiais (SAMU/AHA)</p>
            </li>
            <li className="flex items-start gap-4">
              <CheckCircle2 className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed tracking-tight">Geração Automática de Dossiê Jurídico (Prova Digital)</p>
            </li>
            <li className="flex items-start gap-4">
              <CheckCircle2 className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed tracking-tight">Central de Unidades de Saúde e Emergência 24/7</p>
            </li>
          </ul>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white italic tracking-tighter uppercase">Gratuito</span>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Beta Nacional</span>
            </div>
            <div className="bg-red-600/20 px-3 py-1 rounded-full">
              <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Acesso Vitalício</p>
            </div>
          </div>
        </div>

        {/* Auth Buttons Wrapper */}
        <div className="w-full max-w-md space-y-3 shrink-0 pb-10">
          <button 
            onClick={onLogin}
            className="w-full bg-white text-black py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
          >
            <Globe size={18} /> Entrar com Google
          </button>
          
          <button 
            onClick={onLogin}
            className="w-full bg-black border border-white/20 text-white py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Apple size={18} fill="currentColor" /> Entrar com Apple
          </button>

          <button 
            onClick={onLogin}
            className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Mail size={18} /> Entrar com Email
          </button>

          <div className="pt-6 text-center">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] leading-relaxed mx-auto max-w-[280px]">
              Ao entrar, você concorda com nossos <br/> 
              <span className="text-white underline underline-offset-4">Termos</span> e <span className="text-white underline underline-offset-4">Privacidade</span>.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AuthScreen;
