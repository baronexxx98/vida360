
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 500); // Espera a animação de saída
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative flex flex-col items-center">
        {/* Foco total no nome VIDA 360 */}
        <div className="text-center animate-in zoom-in-95 duration-1000">
          <h1 className="text-7xl sm:text-8xl font-[900] italic tracking-tighter uppercase leading-none text-white drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            VIDA <span className="text-red-600">360</span>
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4">
             <div className="h-[2px] w-8 bg-red-600"></div>
             <p className="text-[14px] font-black tracking-[0.6em] text-white/40 uppercase">Resgate Nacional</p>
             <div className="h-[2px] w-8 bg-red-600"></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-16 w-full flex flex-col items-center gap-4">
        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-red-600 animate-[loading_2.5s_linear_forwards]" style={{ width: '100%' }}></div>
        </div>
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Sistema de Resgate Ativo</p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
