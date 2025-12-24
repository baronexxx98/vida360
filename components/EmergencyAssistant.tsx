
import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, CheckCircle2, 
  ShieldAlert, Loader2, Ambulance, 
  Flame, Baby, Heart, Zap, UserX,
  ChevronLeft, ArrowRight, User, UserCheck, Shield, AlertTriangle, Save,
  // Removed non-existent icon 'Tool' to fix build error
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
    emergencyType: 'PCR (Protocolo Offline)',
    criticality: 'CRITICAL',
    isCardiacArrest: true,
    immediateInstruction: 'INICIE MASSAGEM CARDÍACA IMEDIATAMENTE',
    nextSteps: [
      { id: 'off1', instruction: 'DEITE A VÍTIMA DE COSTAS em superfície rígida.', type: 'critical' },
      { id: 'off2', instruction: 'POSICIONE AS MÃOS no centro do peito (entre os mamilos).', type: 'critical' },
      { id: 'off3', instruction: 'COMPRIMA COM FORÇA (5-6cm) e rapidez (ritmo de 100-120/min).', type: 'critical' },
      { id: 'off4', instruction: 'Permita o retorno total do tórax entre as compressões.', type: 'action' },
      { id: 'off5', instruction: 'Mantenha sem parar até o resgate chegar ou alguém assumir.', type: 'action' }
    ]
  },
  'AVC (Derrame / Fraqueza)': {
    emergencyType: 'AVC (Protocolo Offline)',
    criticality: 'CRITICAL',
    isCardiacArrest: false,
    immediateInstruction: 'IDENTIFIQUE OS SINAIS DE DERRAME',
    nextSteps: [
      { id: 'off_avc1', instruction: 'SORRISO: Peça para a pessoa sorrir. Veja se a boca está torta.', type: 'critical' },
      { id: 'off_avc2', instruction: 'ABRAÇO: Peça para levantar os braços. Veja se um cai.', type: 'critical' },
      { id: 'off_avc3', instruction: 'MÚSICA: Peça para repetir uma frase. Veja se a fala é arrastada.', type: 'critical' },
      { id: 'off_avc4', instruction: 'TEMPO: Se um desses estiver alterado, corra para o hospital.', type: 'alert' },
      { id: 'off_avc5', instruction: 'Não ofereça água, comida ou remédios.', type: 'alert' }
    ]
  },
  'Engasgo Infantil (OVACE)': {
    emergencyType: 'ENGASGO (Protocolo Offline)',
    criticality: 'CRITICAL',
    isCardiacArrest: false,
    immediateInstruction: 'REALIZE MANOBRA DE DESOBSTRUÇÃO',
    nextSteps: [
      { id: 'off6', instruction: 'BEBÊ: 5 batidas firmes nas costas e 5 compressões no tórax.', type: 'critical' },
      { id: 'off7', instruction: 'ADULTO: Manobra de Heimlich (abraçar por trás e pressionar o abdômen para cima).', type: 'critical' },
      { id: 'off8', instruction: 'Verifique se o objeto saiu. Não coloque o dedo no escuro.', type: 'check' },
      { id: 'off9', instruction: 'Se desmaiar, inicie compressões cardíacas imediatamente.', type: 'alert' }
    ]
  },
  'Hemorragia / Sangramento': {
    emergencyType: 'HEMORRAGIA (Protocolo Offline)',
    criticality: 'HIGH',
    isCardiacArrest: false,
    immediateInstruction: 'PRESSIONE O LOCAL DO SANGRAMENTO',
    nextSteps: [
      { id: 'off10', instruction: 'USE PANO LIMPO para fazer pressão direta e forte sobre a ferida.', type: 'critical' },
      { id: 'off11', instruction: 'Não remova o pano; se encharcar, coloque outro por cima.', type: 'action' },
      { id: 'off12', instruction: 'Se for braço ou perna, mantenha o membro elevado.', type: 'action' },
      { id: 'off13', instruction: 'Evite torniquetes a menos que o sangramento seja incontrolável.', type: 'alert' }
    ]
  }
};

const CATEGORIES = [
  { id: 'CLINICAL', icon: <Heart size={24}/>, label: 'Mal Estar / Doença', color: 'bg-red-500', subs: ['Parada Cardiorrespiratória', 'AVC (Derrame / Fraqueza)', 'Dor no Peito (Infarto)', 'Convulsão (Ataque)', 'Falta de Ar Grave'] },
  { id: 'TRAUMA', icon: <Zap size={24}/>, label: 'Acidentes / Cortes', color: 'bg-orange-600', subs: ['Hemorragia / Sangramento', 'Fratura Exposta / Queda', 'Acidente de Trânsito', 'Bateu a Cabeça (TCE)'] },
  { id: 'PEDIATRIC', icon: <Baby size={24}/>, label: 'Crianças e Bebês', color: 'bg-blue-500', subs: ['Engasgo Infantil (OVACE)', 'Febre com Convulsão', 'Ingestão de Veneno', 'Queda de Criança'] },
  { id: 'ENVIRONMENTAL', icon: <Flame size={24}/>, label: 'Risco Ambiental', color: 'bg-emerald-600', subs: ['Choque Elétrico', 'Afogamento', 'Incêndio / Fumaça', 'Animal Peçonhento (Cobra/Aranha)'] },
];

const FAILURE_OPTIONS = [
  { type: 'DELAYED_RESPONSE', label: 'SAMU/Bombeiro Não Chegou', icon: <Clock size={20} /> },
  { type: 'COMMUNICATION_ERROR', label: 'Erro na Central 192/193', icon: <MessageSquareWarning size={20} /> },
  { type: 'EQUIPMENT_MISSING', label: 'Falta de Material no Resgate', icon: <AlertTriangle size={20} /> },
  { type: 'REFUSAL_OF_CARE', label: 'Negligência / Omissão de Socorro', icon: <Ban size={20} /> },
];

const EmergencyAssistant: React.FC<EmergencyAssistantProps> = ({ userProfile, onComplete, onCancel }) => {
  const [status, setStatus] = useState<EmergencyStatus>(EmergencyStatus.ASSESSING);
  const [victimType, setVictimType] = useState<'me' | 'other' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [userInput, setUserInput] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState<string>('Localizando...');
  const [protocol, setProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<EmergencyAction[]>([]);
  const [timer, setTimer] = useState(0);
  const [selectedFailureType, setSelectedFailureType] = useState<SystemicFailureType | null>(null);
  const [showFailureSelector, setShowFailureSelector] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const timerRef = useRef<any>(null);

  const [autoCallCountdown, setAutoCallCountdown] = useState(10);
  const [autoCallCancelled, setAutoCallCancelled] = useState(false);
  const [autoCallTriggered, setAutoCallTriggered] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        if (navigator.onLine) {
          try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
            const data = await resp.json();
            setAddress(data.display_name || "Endereço não identificado");
          } catch (e) {
            setAddress(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          }
        } else {
          setAddress("Coordenadas GPS disponíveis (Offline)");
        }
      }, null, { timeout: 5000 });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, autoCallCancelled, autoCallTriggered, isOffline]);

  const triggerAutoCall = () => {
    if (autoCallTriggered || isOffline) return;
    setAutoCallTriggered(true);
    window.location.href = "tel:192";
  };

  const cancelAutoCall = () => setAutoCallCancelled(true);
  const handleManualCall = () => { cancelAutoCall(); window.location.href = "tel:192"; };

  const handleStartAssessment = async (subCategory?: string) => {
    const finalInput = subCategory || userInput;
    if (!finalInput.trim() && !isOffline) return;
    
    if (isOffline || (subCategory && OFFLINE_PROTOCOLS[subCategory])) {
      const offlineResult = OFFLINE_PROTOCOLS[subCategory || ''] || {
        emergencyType: 'Emergência (Modo Offline)',
        criticality: 'HIGH',
        isCardiacArrest: false,
        immediateInstruction: 'PROCURE AJUDA E MANTENHA A VÍTIMA CALMA',
        nextSteps: [
          { id: 'off99', instruction: 'Verifique consciência e respiração da vítima.', type: 'check' },
          { id: 'off100', instruction: 'Tente contato telefônico com 192 (SAMU) ou 193 (Bombeiros).', type: 'action' }
        ]
      };
      setProtocol(offlineResult);
      setActions(offlineResult.nextSteps.map((s: any) => ({ ...s, completed: false })));
      setStatus(EmergencyStatus.ACTIVE);
      return;
    }

    setLoading(true);
    try {
      const context = victimType === 'me' 
        ? `Vítima: ${userProfile.name} (${userProfile.age} anos). Sangue: ${userProfile.bloodType}. Alergias: ${userProfile.allergies.join(', ')}.`
        : `Vítima: TERCEIRO (Desconhecido).`;

      const result = await getEmergencyGuidance(finalInput || "Análise da situação", context);
      if (result) {
        setProtocol(result);
        setActions(result.nextSteps.map((s: any) => ({ ...s, completed: false })));
        setStatus(EmergencyStatus.ACTIVE);
        setAutoCallCountdown(10);
        setAutoCallCancelled(false);
        setAutoCallTriggered(false);
      }
    } catch (e) {
      console.error(e);
      handleStartAssessment(subCategory);
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const handleBack = () => {
    if (showFailureSelector) setShowFailureSelector(false);
    else if (selectedCategory) setSelectedCategory(null);
    else if (victimType) setVictimType(null);
    else onCancel();
  };

  const handleFinish = () => {
    const endTime = Date.now();
    onComplete({
      id: `BR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      evidenceHash: Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      startTime: endTime - (timer * 1000),
      endTime: endTime,
      diagnosis: protocol?.emergencyType || "Atendimento Emergencial APH",
      category: selectedCategory?.id || 'CLINICAL',
      location: location || { lat: 0, lng: 0, address: address },
      actionsTaken: actions,
      emergencyServicesNotified: !isOffline,
      institutionalFailureObserved: !!selectedFailureType,
      failureDetails: selectedFailureType ? {
        type: selectedFailureType,
        description: FAILURE_OPTIONS.find(f => f.type === selectedFailureType)?.label || "Falha não especificada"
      } : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen overflow-hidden font-sans">
      {isOffline && (
        <div className="bg-orange-600 text-white px-5 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest z-[300] shadow-md">
          <WifiOff size={14} /> Modo Offline - Protocolos Locais de Emergência Ativos
        </div>
      )}

      <div className="bg-black p-5 text-white flex items-center justify-between shrink-0 shadow-xl border-b border-red-600">
        <div className="flex items-center gap-3">
          {(status === EmergencyStatus.ASSESSING || showFailureSelector) && (
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-all active:scale-75">
              <ChevronLeft size={28} />
            </button>
          )}
          <h1 className="font-black text-xl uppercase tracking-tighter italic">VIDA 360</h1>
        </div>
        <div className="bg-red-600 px-4 py-1.5 rounded-full font-mono font-black text-sm border border-red-400">
          {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {loading && (
          <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-gray-100 rounded-full"></div>
              <div className="w-24 h-24 border-8 border-red-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <h2 className="text-3xl font-black uppercase mt-8 tracking-tighter text-black">IA Atendimento</h2>
            <p className="font-bold text-gray-400 mt-2 uppercase tracking-widest text-xs text-center">Consultando diretrizes do Ministério da Saúde...</p>
          </div>
        )}

        <div className="p-5">
          {status === EmergencyStatus.ASSESSING && (
            <div className="space-y-6">
              {!victimType ? (
                <div className="pt-4 space-y-6">
                  <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-[32px] flex items-center gap-4 shadow-sm">
                    <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black italic text-2xl shrink-0">
                      {userProfile.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">DADOS DO TITULAR:</p>
                      <p className="font-black text-base uppercase tracking-tight text-gray-900 truncate">
                        {userProfile.name.split(' ')[0]}, {userProfile.age} ANOS
                      </p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase">TIPO: {userProfile.bloodType}</span>
                        {userProfile.allergies.length > 0 && (
                          <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase truncate max-w-[150px]">
                            ALERGIA: {userProfile.allergies[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <h2 className="text-3xl font-black text-center mb-4 leading-none tracking-tighter uppercase">Situação de Emergência?</h2>
                  
                  <div className="space-y-4">
                    <button onClick={() => setVictimType('me')} className="w-full flex items-center gap-6 p-8 bg-white border-4 border-gray-100 rounded-[40px] shadow-2xl active:border-red-600 transition-all">
                      <User size={48} className="text-red-600" />
                      <div className="text-left">
                        <span className="block text-2xl font-black uppercase tracking-tight leading-none">PARA MIM</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usar meus dados vitais</span>
                      </div>
                    </button>
                    <button onClick={() => setVictimType('other')} className="w-full flex items-center gap-6 p-8 bg-white border-4 border-gray-100 rounded-[40px] shadow-2xl active:border-blue-600 transition-all">
                      <UserCheck size={48} className="text-blue-600" />
                      <div className="text-left">
                        <span className="block text-2xl font-black uppercase tracking-tight leading-none">TERCEIRO</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vítima sem registro</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : !selectedCategory ? (
                <div className="space-y-4">
                  {victimType === 'me' && (
                    <div className="animate-in slide-in-from-top duration-300">
                       <div className={`p-6 rounded-[32px] border-2 shadow-sm flex items-start gap-4 ${userProfile.allergies.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <div className={`p-3 rounded-2xl shrink-0 ${userProfile.allergies.length > 0 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                            <ShieldAlert size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Atenção Médica (Alergias):</p>
                            {userProfile.allergies.length > 0 ? (
                              <p className="font-black text-red-700 text-lg uppercase tracking-tight">
                                {userProfile.allergies.join(', ')}
                              </p>
                            ) : (
                              <p className="font-black text-green-700 text-lg uppercase tracking-tight">Nenhuma alergia registrada</p>
                            )}
                          </div>
                       </div>
                    </div>
                  )}

                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-2 pt-2">Selecione a Categoria:</p>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="w-full flex items-center gap-5 p-6 bg-gray-50 rounded-[32px] border-2 border-transparent active:border-black active:bg-white transition-all">
                      <div className={`${cat.color} text-white p-4 rounded-2xl shadow-lg`}>{cat.icon}</div>
                      <div className="text-left">
                         <span className="font-black text-xl text-gray-900 uppercase tracking-tight">{cat.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                  <div className="bg-black p-6 rounded-[32px] text-white shadow-xl mb-6">
                     <h2 className="text-2xl font-black uppercase leading-tight italic">Qual o sinal principal?</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedCategory.subs.map(sub => (
                      <button key={sub} onClick={() => handleStartAssessment(sub)} className={`w-full flex items-center justify-between p-6 bg-white rounded-3xl border-4 border-gray-50 active:border-red-600 shadow-md transition-all ${isOffline && !OFFLINE_PROTOCOLS[sub] ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-3 text-left">
                           <span className="font-black text-xl text-gray-900 uppercase tracking-tighter leading-tight">{sub}</span>
                           {OFFLINE_PROTOCOLS[sub] && <div className="bg-orange-100 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-orange-200 uppercase">Local</div>}
                        </div>
                        <ArrowRight size={24} className="text-red-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                  
                  {!isOffline && (
                    <div className="pt-4">
                      <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ou descreva a situação..." className="w-full h-24 p-6 rounded-[32px] border-4 border-gray-100 focus:border-red-600 font-bold text-lg bg-gray-50 mb-4" />
                      <button onClick={() => handleStartAssessment()} disabled={loading || !userInput.trim()} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl uppercase active:scale-95 transition-transform">
                        GERAR PROTOCOLO IMEDIATO
                      </button>
                    </div>
                  )}

                  {isOffline && (
                    <div className="bg-gray-100 p-8 rounded-[40px] border-2 border-dashed border-gray-300 flex flex-col items-center gap-3">
                      <WifiOff size={32} className="text-gray-400" />
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-relaxed">Sua conexão está instável. A IA está em standby.<br/>Use os protocolos locais otimizados acima.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {status === EmergencyStatus.ACTIVE && protocol && (
            <div className="space-y-6 pb-20 animate-in zoom-in-95 duration-200">
              
              <div className="bg-gray-100 p-4 rounded-3xl border border-gray-200 flex items-center gap-3">
                <Navigation size={18} className="text-red-600 shrink-0" />
                <p className="text-[10px] font-black uppercase text-gray-600 leading-tight">
                  <span className="text-black">Localização atual:</span><br/>{address}
                </p>
              </div>

              {protocol.isCardiacArrest && (
                <div className="bg-black text-white p-6 rounded-[40px] flex flex-col items-center gap-4 border-4 border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                   <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-[pulse_0.54s_infinite] shadow-lg">
                      <Heart size={40} fill="currentColor" />
                   </div>
                   <div className="text-center">
                      <p className="text-3xl font-black italic uppercase tracking-tighter">Siga o Ritmo</p>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">110 COMPRESSÕES POR MINUTO</p>
                   </div>
                   <p className="text-xs text-gray-400 font-bold text-center">Afunde o peito 5-6 cm e deixe retornar totalmente.</p>
                </div>
              )}

              {!isOffline && !autoCallCancelled && !autoCallTriggered && (
                <div className="bg-red-600 text-white rounded-3xl overflow-hidden shadow-2xl animate-pulse relative border-2 border-red-400">
                  <div className="p-5 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center font-black text-2xl shadow-lg">
                        {autoCallCountdown}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-80">Chamada Automática</p>
                        <p className="text-lg font-black uppercase tracking-tighter">SAMU (192) em instantes</p>
                      </div>
                    </div>
                    <button onClick={cancelAutoCall} className="bg-black/40 px-4 py-2 rounded-2xl text-[10px] font-black uppercase border border-white/20">CANCELAR</button>
                  </div>
                  <div className="h-2 bg-black/20 w-full relative">
                    <div className="h-full bg-white transition-all duration-1000 ease-linear" style={{ width: `${(autoCallCountdown / 10) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {autoCallTriggered && (
                <div className="bg-blue-600 text-white p-5 rounded-3xl flex items-center justify-between shadow-lg border-2 border-blue-400">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg">
                      <Ambulance size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Atendimento Iniciado</p>
                      <p className="text-lg font-black uppercase tracking-tighter">Solicitação de Resgate 192</p>
                    </div>
                  </div>
                  <ShieldCheck size={28} className="text-blue-200" />
                </div>
              )}

              {showFailureSelector ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Gavel className="text-red-500" size={24} />
                      <h2 className="text-2xl font-black uppercase leading-none">Prova de Falha (Art. 135)</h2>
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-tight">Documente a falha do resgate oficial para fins jurídicos.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {FAILURE_OPTIONS.map(opt => (
                      <button key={opt.type} onClick={() => { setSelectedFailureType(opt.type as SystemicFailureType); setShowFailureSelector(false); }}
                        className={`w-full p-6 rounded-[32px] border-4 flex items-center gap-5 transition-all ${selectedFailureType === opt.type ? 'border-red-600 bg-red-50' : 'border-gray-100 bg-white shadow-lg'}`}>
                        <div className={`p-4 rounded-2xl ${selectedFailureType === opt.type ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{opt.icon}</div>
                        <span className="text-lg font-black uppercase text-gray-900 text-left">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className={`p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden ${protocol.criticality === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] bg-black/20 px-3 py-1 rounded-full">SALVAMENTO AGORA</p>
                      {isOffline && <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">Guia Local</span>}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black leading-[0.9] tracking-tighter mb-4 italic uppercase">{protocol.immediateInstruction}</h2>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80">
                       <Siren size={16} /> Protocolo: {protocol.emergencyType}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {actions.map((action, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => toggleAction(action.id || '')} 
                        className={`w-full p-6 rounded-[32px] border-4 flex gap-5 text-left transition-all relative overflow-hidden ${
                          action.completed 
                            ? 'bg-green-50 border-green-500 opacity-70' 
                            : action.type === 'critical' 
                              ? 'bg-white border-red-200 shadow-[0_10px_20px_-5px_rgba(239,68,68,0.1)]' 
                              : 'bg-white border-gray-100 shadow-lg'
                        }`}
                      >
                        {action.type === 'critical' && !action.completed && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>
                        )}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-2xl ${
                          action.completed 
                            ? 'bg-green-600 text-white' 
                            : action.type === 'critical'
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-black text-white'
                        }`}>
                          {action.completed ? <CheckCircle2 size={32} /> : idx + 1}
                        </div>
                        <div className="flex flex-col">
                          {action.type === 'critical' && !action.completed && (
                            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">Ação Crítica Vital</span>
                          )}
                          <p className={`font-black text-xl leading-tight ${action.completed ? 'text-green-900 line-through' : 'text-gray-900'} ${action.type === 'critical' ? 'uppercase' : ''}`}>
                            {action.instruction}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleManualCall} 
                      className={`p-8 rounded-[36px] shadow-2xl text-white flex flex-col items-center justify-center gap-3 active:scale-95 border-b-8 ${isOffline ? 'bg-gray-400 border-gray-500 opacity-50' : 'bg-blue-600 border-blue-800'}`}
                      disabled={isOffline}
                    >
                      <Ambulance size={40} />
                      <span className="text-xs font-black uppercase tracking-widest">Ligar SAMU 192</span>
                      {isOffline && <span className="text-[7px] font-black uppercase tracking-tight">Rede Indisponível</span>}
                    </button>
                    <button onClick={() => setShowFailureSelector(true)} className={`p-8 rounded-[36px] border-4 flex flex-col items-center justify-center gap-3 active:scale-95 border-b-8 ${selectedFailureType ? 'bg-red-600 text-white border-red-700' : 'bg-gray-50 text-gray-400 border-gray-100 border-b-gray-300'}`}>
                      <Gavel size={40} />
                      <span className="text-xs font-black uppercase leading-tight text-center tracking-tight">{selectedFailureType ? 'Falha Registrada' : 'Ocorreu Falha?'}</span>
                    </button>
                  </div>

                  <div className="pt-8 border-t-4 border-gray-100 mt-10">
                    <button onClick={handleFinish} className="w-full bg-black text-white py-8 rounded-[40px] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                      <Save size={32} /> FINALIZAR E SALVAR PROVA
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyAssistant;
