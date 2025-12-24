
import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, CheckCircle2, 
  ShieldAlert, Loader2, Ambulance, 
  Flame, Baby, Heart, Zap, UserX,
  ChevronLeft, ArrowRight, User, UserCheck, Shield, AlertTriangle, Save,
  Clock, XCircle, MessageSquareWarning, Ban, Gavel, Siren, X, ShieldCheck, RefreshCw,
  Navigation, WifiOff, AlertCircle, ZapOff
} from 'lucide-react';
import { EmergencyStatus, EmergencyAction, UserProfile, SystemicFailureType } from '../types';
import { getEmergencyGuidance } from '../services/gemini';

interface EmergencyAssistantProps {
  userProfile: UserProfile;
  onComplete: (incidentData: any) => void;
  onCancel: () => void;
}

// Protocolos Offline Estáticos (Diretrizes Ministério da Saúde / SAMU / SBC)
const OFFLINE_PROTOCOLS: Record<string, any> = {
  'Parada Cardiorrespiratória': {
    emergencyType: 'PCR (Protocolo de Contingência)',
    criticality: 'CRITICAL',
    isCardiacArrest: true,
    immediateInstruction: 'INICIE MASSAGEM CARDÍACA IMEDIATAMENTE',
    nextSteps: [
      { id: 'off1', instruction: 'DEITE A VÍTIMA DE COSTAS em superfície rígida.', type: 'critical' },
      { id: 'off2', instruction: 'POSICIONE AS MÃOS no centro do peito (entre os mamilos).', type: 'critical' },
      { id: 'off3', instruction: 'COMPRIMA COM FORÇA (5-6cm) e rapidez (100-120/min).', type: 'critical' },
      { id: 'off4', instruction: 'Permita o retorno total do tórax entre as compressões.', type: 'action' }
    ]
  },
  'AVC (Derrame / Fraqueza)': {
    emergencyType: 'AVC (Protocolo de Contingência)',
    criticality: 'CRITICAL',
    isCardiacArrest: false,
    immediateInstruction: 'IDENTIFIQUE OS SINAIS (SAMU)',
    nextSteps: [
      { id: 'off_avc1', instruction: 'SORRISO: Veja se a boca está torta.', type: 'critical' },
      { id: 'off_avc2', instruction: 'ABRAÇO: Veja se um braço cai ao levantar.', type: 'critical' },
      { id: 'off_avc3', instruction: 'MÚSICA: Veja se a fala está arrastada.', type: 'critical' },
      { id: 'off_avc4', instruction: 'Se houver alteração, corra para o hospital IMEDIATAMENTE.', type: 'alert' }
    ]
  },
  'Engasgo Infantil (OVACE)': {
    emergencyType: 'ENGASGO (Protocolo de Contingência)',
    criticality: 'CRITICAL',
    isCardiacArrest: false,
    immediateInstruction: 'REALIZE MANOBRA DE DESOBSTRUÇÃO',
    nextSteps: [
      { id: 'off6', instruction: 'BEBÊ: 5 batidas nas costas e 5 compressões no tórax.', type: 'critical' },
      { id: 'off7', instruction: 'ADULTO: Manobra de Heimlich (pressão no abdômen).', type: 'critical' },
      { id: 'off8', instruction: 'Se desmaiar, inicie compressões cardíacas imediatamente.', type: 'alert' }
    ]
  }
};

const CATEGORIES = [
  { id: 'CLINICAL', icon: <Heart size={24}/>, label: 'Mal Estar / Doença', color: 'bg-red-500', subs: ['Parada Cardiorrespiratória', 'AVC (Derrame / Fraqueza)', 'Dor no Peito (Infarto)', 'Falta de Ar Grave'] },
  { id: 'TRAUMA', icon: <Zap size={24}/>, label: 'Acidentes / Cortes', color: 'bg-orange-600', subs: ['Hemorragia / Sangramento', 'Fratura Exposta / Queda', 'Acidente de Trânsito'] },
  { id: 'PEDIATRIC', icon: <Baby size={24}/>, label: 'Crianças e Bebês', color: 'bg-blue-500', subs: ['Engasgo Infantil (OVACE)', 'Febre com Convulsão', 'Ingestão de Veneno'] },
];

const FAILURE_OPTIONS = [
  { type: 'DELAYED_RESPONSE', label: 'SAMU/Bombeiro Não Chegou', icon: <Clock size={20} /> },
  { type: 'COMMUNICATION_ERROR', label: 'Erro na Central 192/193', icon: <MessageSquareWarning size={20} /> },
];

const EmergencyAssistant: React.FC<EmergencyAssistantProps> = ({ userProfile, onComplete, onCancel }) => {
  const [status, setStatus] = useState<EmergencyStatus>(EmergencyStatus.ASSESSING);
  const [victimType, setVictimType] = useState<'me' | 'other' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState<string>('Localizando via GPS...');
  const [protocol, setProtocol] = useState<any>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [actions, setActions] = useState<EmergencyAction[]>([]);
  const [timer, setTimer] = useState(0);
  const [selectedFailureType, setSelectedFailureType] = useState<SystemicFailureType | null>(null);
  const [showFailureSelector, setShowFailureSelector] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const timerRef = useRef<any>(null);
  const [autoCallCountdown, setAutoCallCountdown] = useState(10);
  const [autoCallCancelled, setAutoCallCancelled] = useState(false);
  const [autoCallTriggered, setAutoCallTriggered] = useState(false);

  // FASE 1: Localização Não Bloqueante (Anti-Freeze)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          // Geocodificação reversa em segundo plano
          if (navigator.onLine) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`)
              .then(res => res.json())
              .then(data => setAddress(data.display_name || "Endereço identificado"))
              .catch(() => setAddress(`Coordenadas: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`));
          }
        },
        () => setAddress("Localização via Rede/IP"),
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (status === EmergencyStatus.ACTIVE) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
        if (!isOffline && !autoCallCancelled && !autoCallTriggered) {
          setAutoCallCountdown(c => {
            if (c <= 1) { triggerAutoCall(); return 0; }
            return c - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status, autoCallCancelled, autoCallTriggered, isOffline]);

  const triggerAutoCall = () => {
    if (autoCallTriggered || isOffline) return;
    setAutoCallTriggered(true);
    window.location.href = "tel:192";
  };

  // FASE 2: Ação Instantânea sem Await na UI
  const handleStartAssessment = (subCategory: string) => {
    // 1. Mostrar tela de emergência IMEDIATAMENTE
    setStatus(EmergencyStatus.ACTIVE);
    
    // 2. Usar protocolo offline como fallback instantâneo
    const offlineFallback = OFFLINE_PROTOCOLS[subCategory] || {
      emergencyType: 'Emergência (Protocolo Base)',
      criticality: 'HIGH',
      isCardiacArrest: false,
      immediateInstruction: 'PREPARE-SE PARA O RESGATE',
      nextSteps: [
        { id: 'base1', instruction: 'Verifique se a vítima responde ou respira.', type: 'check' },
        { id: 'base2', instruction: 'Ligue 192 (SAMU) se ainda não o fez.', type: 'action' }
      ]
    };
    
    setProtocol(offlineFallback);
    setActions(offlineFallback.nextSteps.map((s: any) => ({ ...s, completed: false })));

    // 3. Disparar IA em background (Não bloqueante)
    if (!isOffline) {
      setIaLoading(true);
      const context = victimType === 'me' 
        ? `Vítima: ${userProfile.name} (${userProfile.age} anos).`
        : `Vítima: Terceiro (Desconhecido).`;

      getEmergencyGuidance(subCategory, context)
        .then(result => {
          if (result) {
            setProtocol(result);
            setActions(result.nextSteps.map((s: any) => ({ ...s, completed: false })));
          }
        })
        .catch(err => console.warn("Background IA failed, keeping local protocol", err))
        .finally(() => setIaLoading(false));
    }
  };

  const toggleAction = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const handleFinish = () => {
    onComplete({
      id: `BR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      evidenceHash: 'HASH_' + Date.now(),
      startTime: Date.now() - (timer * 1000),
      endTime: Date.now(),
      diagnosis: protocol?.emergencyType || "Resgate APH",
      location: location || { lat: 0, lng: 0, address: address },
      actionsTaken: actions,
      institutionalFailureObserved: !!selectedFailureType
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen overflow-hidden">
      {/* Header Fixo */}
      <div className="bg-black p-5 text-white flex items-center justify-between shrink-0 border-b border-red-600 shadow-xl">
        <div className="flex items-center gap-3">
          {status === EmergencyStatus.ASSESSING && (
            <button onClick={() => victimType ? setVictimType(null) : onCancel()} className="p-2 -ml-2 active:scale-75 transition-transform">
              <ChevronLeft size={28} />
            </button>
          )}
          <h1 className="font-black text-xl italic uppercase tracking-tighter">VIDA 360</h1>
        </div>
        <div className="bg-red-600 px-4 py-1.5 rounded-full font-mono font-black text-sm">
          {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-5 max-w-lg mx-auto w-full">
          
          {/* FASE 0: Menu de Decisão Rápida */}
          {status === EmergencyStatus.ASSESSING && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {!victimType ? (
                <div className="space-y-6 pt-4">
                  <h2 className="text-3xl font-black text-center leading-tight tracking-tighter uppercase">Quem precisa de socorro?</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => setVictimType('me')} className="flex items-center gap-6 p-8 bg-white border-4 border-gray-100 rounded-[40px] shadow-xl active:scale-95 transition-all">
                      <User size={40} className="text-red-600" />
                      <div className="text-left"><span className="block text-2xl font-black uppercase tracking-tight">PARA MIM</span></div>
                    </button>
                    <button onClick={() => setVictimType('other')} className="flex items-center gap-6 p-8 bg-white border-4 border-gray-100 rounded-[40px] shadow-xl active:scale-95 transition-all">
                      <UserCheck size={40} className="text-blue-600" />
                      <div className="text-left"><span className="block text-2xl font-black uppercase tracking-tight">TERCEIRO</span></div>
                    </button>
                  </div>
                </div>
              ) : !selectedCategory ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Selecione a Gravidade</p>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="w-full flex items-center gap-5 p-6 bg-white rounded-[32px] border-4 border-gray-50 shadow-md active:border-black transition-all">
                      <div className={`${cat.color} text-white p-4 rounded-2xl shadow-lg`}>{cat.icon}</div>
                      <span className="font-black text-xl uppercase tracking-tighter">{cat.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="bg-black p-6 rounded-[32px] text-white shadow-xl mb-4">
                     <h2 className="text-2xl font-black uppercase italic">Qual o sinal principal?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCategory.subs.map(sub => (
                      <button key={sub} onClick={() => handleStartAssessment(sub)} className="w-full flex items-center justify-between p-6 bg-white rounded-3xl border-4 border-gray-50 active:border-red-600 shadow-md transition-all">
                        <span className="font-black text-lg text-gray-900 uppercase tracking-tighter text-left leading-tight">{sub}</span>
                        <ArrowRight size={24} className="text-red-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSelectedCategory(null)} className="w-full py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Voltar Categorias</button>
                </div>
              )}
            </div>
          )}

          {/* FASE 2: Suporte à Vida (Interface Ativa) */}
          {status === EmergencyStatus.ACTIVE && protocol && (
            <div className="space-y-6 pb-24 animate-in zoom-in-95 duration-200">
              
              {/* IA Indicator (Não Bloqueante) */}
              {iaLoading && (
                <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full w-max mx-auto animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-widest">IA Otimizando Protocolo...</span>
                </div>
              )}

              {/* Banner de Instrução Principal */}
              <div className={`p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden ${protocol.criticality === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] bg-black/20 px-3 py-1 rounded-full">Salvamento Agora</p>
                  {isOffline && <WifiOff size={14} />}
                </div>
                <h2 className="text-4xl font-black leading-[0.9] tracking-tighter mb-4 italic uppercase">{protocol.immediateInstruction}</h2>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80">
                   <Navigation size={14} /> {address}
                </div>
              </div>

              {/* Chamada Automática */}
              {!autoCallCancelled && !autoCallTriggered && !isOffline && (
                <div className="bg-red-600 text-white rounded-3xl overflow-hidden shadow-2xl border-2 border-red-400 animate-pulse">
                   <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center font-black text-xl shadow-lg">
                          {autoCallCountdown}
                        </div>
                        <p className="text-lg font-black uppercase italic">Chamando SAMU (192)</p>
                      </div>
                      <button onClick={() => setAutoCallCancelled(true)} className="bg-black/40 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                   </div>
                   <div className="h-1.5 bg-black/20 w-full"><div className="h-full bg-white transition-all duration-1000 ease-linear" style={{ width: `${(autoCallCountdown / 10) * 100}%` }}></div></div>
                </div>
              )}

              {/* Lista de Ações (Checklist de Vida) */}
              <div className="space-y-4">
                {actions.map((action, idx) => (
                  <button key={idx} onClick={() => toggleAction(action.id || '')} className={`w-full p-6 rounded-[32px] border-4 flex gap-5 text-left transition-all ${action.completed ? 'bg-green-50 border-green-500 opacity-60' : 'bg-white border-gray-100 shadow-xl'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl ${action.completed ? 'bg-green-600 text-white' : 'bg-black text-white'}`}>
                      {action.completed ? <CheckCircle2 size={24} /> : idx + 1}
                    </div>
                    <p className={`font-black text-lg leading-tight uppercase tracking-tighter ${action.completed ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                      {action.instruction}
                    </p>
                  </button>
                ))}
              </div>

              {/* Ações Rápidas de Rodapé */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => window.location.href="tel:192"} className="p-6 bg-blue-600 border-b-8 border-blue-800 rounded-[32px] text-white flex flex-col items-center gap-2 active:scale-95 shadow-xl">
                  <Ambulance size={32} />
                  <span className="text-[10px] font-black uppercase">Ligar SAMU</span>
                </button>
                <button onClick={() => setShowFailureSelector(!showFailureSelector)} className={`p-6 border-b-8 rounded-[32px] flex flex-col items-center gap-2 active:scale-95 shadow-xl ${selectedFailureType ? 'bg-red-600 border-red-800 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                  <Gavel size={32} />
                  <span className="text-[10px] font-black uppercase">Falha de Resgate</span>
                </button>
              </div>

              {/* Seletor de Falhas (Contexto Jurídico) */}
              {showFailureSelector && (
                <div className="bg-black text-white p-6 rounded-[32px] space-y-4 animate-in slide-in-from-bottom-4">
                  <h3 className="font-black uppercase tracking-widest text-[10px] text-red-500">Documentar Falha Oficial</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {FAILURE_OPTIONS.map(opt => (
                      <button key={opt.type} onClick={() => { setSelectedFailureType(opt.type as SystemicFailureType); setShowFailureSelector(false); }} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${selectedFailureType === opt.type ? 'border-red-600 bg-red-600/20' : 'border-white/10 bg-white/5'}`}>
                        {opt.icon} <span className="text-[10px] font-black uppercase">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleFinish} className="w-full bg-black text-white py-8 rounded-[40px] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-8">
                FINALIZAR E SALVAR
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmergencyAssistant;
