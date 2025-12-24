
import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, Copy, QrCode, ArrowRight, Loader2, Landmark } from 'lucide-react';

interface PaymentScreenProps {
  onPaymentSuccess: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [pixCopied, setPixCopied] = useState(false);

  const handleSimulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onPaymentSuccess();
    }, 2000);
  };

  const copyPix = () => {
    // Nova Chave PIX fornecida pelo usuário
    const pixKey = "00020101021126580014br.gov.bcb.pix0136e967d8f5-5dd8-4303-9e10-ebc1082538695204000053039865802BR5922FRANCISCO W S DE JESUS6012SIMOES FILHO62070503***630465EB";
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white flex flex-col overflow-y-auto">
      {loading && (
        <div className="absolute inset-0 z-[1300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <Loader2 size={48} className="text-red-600 animate-spin mb-4" />
          <p className="font-black uppercase tracking-widest text-xs text-center px-6">Confirmando Recebimento na Conta Vida 360...</p>
        </div>
      )}

      <div className="bg-black p-8 pt-16 text-white shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
            <Zap size={24} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Ativar Proteção</h1>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plano Vitalício de Manutenção — R$ 1,00/mês</p>
      </div>

      <div className="p-8 flex-1 space-y-8">
        <section className="bg-gray-50 p-6 rounded-[40px] border-4 border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo do Pedido</p>
              <h2 className="text-2xl font-black uppercase italic">Assinatura Vida 360</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-red-600 italic">R$ 1,00</p>
              <p className="text-[8px] font-black text-gray-400 uppercase">MENSAL</p>
            </div>
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase">
                <CheckCircle2 size={14} className="text-green-500" /> IA de Resgate Ilimitada
             </div>
             <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase">
                <CheckCircle2 size={14} className="text-green-500" /> Dossiê Jurídico de Prova
             </div>
             <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase">
                <CheckCircle2 size={14} className="text-green-500" /> Suporte a Infraestrutura APH
             </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Método de Pagamento</p>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setMethod('PIX')}
              className={`p-6 rounded-3xl border-4 flex flex-col items-center gap-2 transition-all ${method === 'PIX' ? 'border-red-600 bg-red-50' : 'border-gray-100 bg-white'}`}
            >
              <QrCode size={24} className={method === 'PIX' ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase">PIX Instantâneo</span>
            </button>
            <button 
              onClick={() => setMethod('CARD')}
              className={`p-6 rounded-3xl border-4 flex flex-col items-center gap-2 transition-all ${method === 'CARD' ? 'border-red-600 bg-red-50' : 'border-gray-100 bg-white'}`}
            >
              <CreditCard size={24} className={method === 'CARD' ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase">Cartão de Crédito</span>
            </button>
          </div>
        </section>

        {method === 'PIX' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="bg-white border-4 border-gray-100 p-8 rounded-[40px] flex flex-col items-center gap-6 shadow-xl">
               <div className="w-48 h-48 bg-gray-100 rounded-3xl flex items-center justify-center relative overflow-hidden">
                  <QrCode size={120} className="text-black opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[10px] font-black uppercase text-center text-black px-4 leading-tight">QR CODE DINÂMICO<br/>GERADO PARA CONTA VIDA 360</p>
                  </div>
               </div>
               <button onClick={copyPix} className="w-full bg-gray-50 py-4 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <Copy size={18} className="text-gray-400" />
                  <span className="text-xs font-black uppercase">{pixCopied ? 'COPIADO!' : 'COPIAR PIX COPIA E COLA'}</span>
               </button>
            </div>
            
            <div className="bg-gray-50 border-2 border-gray-100 p-6 rounded-[32px] space-y-3">
               <div className="flex items-center gap-3 text-red-600">
                  <Landmark size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Dados do Favorecido</p>
               </div>
               <div className="grid grid-cols-1 gap-1">
                  <p className="text-[9px] font-bold uppercase text-gray-500">Instituição: <span className="text-black">007 - BANCO INTER</span></p>
                  <p className="text-[9px] font-bold uppercase text-gray-500">Agência: <span className="text-black">0001</span></p>
                  <p className="text-[9px] font-bold uppercase text-gray-500">Conta: <span className="text-black">175030960</span></p>
                  <p className="text-[9px] font-bold uppercase text-gray-500">Favorecido: <span className="text-black">FRANCISCO W S DE JESUS</span></p>
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
             <div className="space-y-4">
                <input type="text" placeholder="NÚMERO DO CARTÃO" className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[24px] font-black text-sm uppercase outline-none focus:border-red-600" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="VALIDADE" className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[24px] font-black text-sm uppercase outline-none focus:border-red-600" />
                  <input type="text" placeholder="CVV" className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[24px] font-black text-sm uppercase outline-none focus:border-red-600" />
                </div>
             </div>
          </div>
        )}

        <button 
          onClick={handleSimulatePayment}
          className="w-full bg-red-600 text-white py-8 rounded-[40px] font-black uppercase text-xl shadow-[0_20px_40px_rgba(239,68,68,0.3)] flex items-center justify-center gap-4 active:scale-95 transition-all mt-10"
        >
          CONFIRMAR E ATIVAR <ShieldCheck size={28} />
        </button>

        <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest px-8 pb-10">
          Pagamento processado via API bancária segura. O valor de R$ 1,00 é destinado à manutenção dos servidores de IA e infraestrutura de resgate.
        </p>
      </div>
    </div>
  );
};

export default PaymentScreen;
