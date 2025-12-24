
import React, { useState, useEffect } from 'react';
import { 
  Heart, History, User, Settings, Plus, Flame, Activity, 
  ChevronRight, ShieldCheck, Map as MapIcon, Stethoscope,
  BarChart3, AlertCircle, FileText, Siren, Shield, AlertTriangle,
  Download, Gavel, Globe, Info, Filter, Crosshair, Zap, Baby, Navigation,
  X, Clock, Calendar, Phone, Trash2, Save, Share2, MapPin, ExternalLink, Loader2
} from 'lucide-react';
import { UserProfile, IncidentReport } from '../types';
import { findNearbyHospitals } from '../services/gemini';

interface HealthDashboardProps {
  onStartEmergency: () => void;
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  history: IncidentReport[];
}

const REPORTS_NACIONAIS = [
  { id: 'g1', lat: -23.5505, lng: -46.6333, category: 'CLINICAL', failure: true, label: 'Parada Cardíaca - Atraso SAMU 192', timestamp: Date.now() - 3600000 },
  { id: 'g2', lat: -23.5550, lng: -46.6390, category: 'TRAUMA', failure: false, label: 'Acidente de Trânsito - Resgate Rápido', timestamp: Date.now() - 7200000 },
  { id: 'g3', lat: -23.5600, lng: -46.6500, category: 'PEDIATRIC', failure: false, label: 'Engasgo Infantil - Instrução Eficaz', timestamp: Date.now() - 86400000 },
  { id: 'g4', lat: -23.5400, lng: -46.6200, category: 'CLINICAL', failure: true, label: 'Infarto - Omissão de Socorro', timestamp: Date.now() - 172800000 },
];

const HealthDashboard: React.FC<HealthDashboardProps> = ({ onStartEmergency, userProfile, onUpdateProfile, history }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  // Settings State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [phoneError, setPhoneError] = useState(false);
  const [editProfile, setEditProfile] = useState(userProfile);
  const [hasChanges, setHasChanges] = useState(false);

  // Nearby Hospitals State
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const [hospitalsResult, setHospitalsResult] = useState<{text: string, sources: any[]} | null>(null);
  const [showHospitalsModal, setShowHospitalsModal] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null
      );
    }
  }, []);

  const failureCount = history.filter(h => h.institutionalFailureObserved).length;
  const successCount = history.length - failureCount;

  const handleUpdateBaseProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile(editProfile);
      setHasChanges(false);
    }
  };

  const handleSearchHospitals = async () => {
    if (!currentLocation) {
      alert("Aguardando localização GPS...");
      return;
    }
    setIsSearchingHospitals(true);
    setShowHospitalsModal(true);
    try {
      const result = await findNearbyHospitals(currentLocation.lat, currentLocation.lng);
      setHospitalsResult(result);
    } catch (e) {
      console.error(e);
      alert("Erro ao localizar hospitais.");
    } finally {
      setIsSearchingHospitals(false);
    }
  };

  const handleShareDossier = async (item: IncidentReport) => {
    const text = `VIDA 360 - Dossiê de Emergência APH Nacional\n\nProtocolo: ${item.diagnosis}\nStatus: ${item.institutionalFailureObserved ? 'FALHA INSTITUCIONAL DETECTADA' : 'ATENDIMENTO CONCLUÍDO'}\nHash de Auditoria: ${item.evidenceHash}\nData: ${new Date(item.startTime).toLocaleString('pt-BR')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dossiê Vida 360',
          text: text,
          url: window.location.href
        });
      } catch (err) { console.log("Share failed"); }
    } else {
      navigator.clipboard.writeText(text);
      alert("Dossiê copiado para a área de transferência!");
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'CLINICAL': return 'bg-red-600';
      case 'TRAUMA': return 'bg-orange-500';
      case 'PEDIATRIC': return 'bg-blue-500';
      case 'ENVIRONMENTAL': return 'bg-emerald-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(ts));
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;
    const digitCount = phone.replace(/\D/g, '').length;
    return phoneRegex.test(phone) && digitCount >= 8;
  };

  const handleAddContact = () => {
    setPhoneError(false);
    if (!newContact.name || !newContact.phone) return;
    if (!isValidPhone(newContact.phone)) {
      setPhoneError(true);
      return;
    }
    if (onUpdateProfile) {
      const updatedProfile = {
        ...userProfile,
        emergencyContacts: [...userProfile.emergencyContacts, newContact]
      };
      onUpdateProfile(updatedProfile);
      setNewContact({ name: '', phone: '', relation: '' });
      setIsAddingContact(false);
    }
  };

  const handleRemoveContact = (index: number) => {
    if (onUpdateProfile) {
      const updatedContacts = [...userProfile.emergencyContacts];
      updatedContacts.splice(index, 1);
      onUpdateProfile({ ...userProfile, emergencyContacts: updatedContacts });
    }
  };

  const renderMapView = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-black">Rede Nacional de Resgate</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tempo de Resposta APH - Território Nacional</p>
        </div>
        <div className="bg-black text-white p-3 rounded-2xl shadow-lg border border-red-600">
          <Siren size={20} />
        </div>
      </div>

      <div className="relative h-[480px] bg-gray-900 rounded-[48px] overflow-hidden border-4 border-black shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        {history.map((h, i) => (
          <button 
            key={h.id}
            onClick={() => setSelectedMarker({...h, label: h.diagnosis, failure: h.institutionalFailureObserved, timestamp: h.startTime})}
            className={`absolute w-10 h-10 rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-xl transition-transform hover:scale-125 z-30 ${getCategoryColor(h.category)}`}
            style={{ 
              top: `${45 + (i * 5)}%`, 
              left: `${35 + (i * 10)}%`,
            }}
          >
            {h.institutionalFailureObserved ? <AlertTriangle size={18} className="text-white" /> : <ShieldCheck size={18} className="text-white" />}
          </button>
        ))}

        {REPORTS_NACIONAIS.map((rep, i) => (
          <button 
            key={rep.id}
            onClick={() => setSelectedMarker(rep)}
            className={`absolute group transition-transform hover:scale-125`}
            style={{ 
              top: `${50 + (rep.lat % 1 * 40)}%`, 
              left: `${40 + (rep.lng % 1 * 40)}%`,
              zIndex: 20
            }}
          >
            <div className={`w-6 h-6 rounded-full border border-white/50 flex items-center justify-center ${getCategoryColor(rep.category)} ${rep.failure ? 'opacity-50' : 'opacity-90'}`}>
               {rep.failure && <div className="absolute -inset-2 border-2 border-red-600 rounded-full animate-ping opacity-30"></div>}
               <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </button>
        ))}

        {currentLocation && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
             <div className="w-12 h-12 bg-red-600/20 rounded-full animate-ping absolute -top-4 -left-4"></div>
             <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-xl relative z-10"></div>
          </div>
        )}

        {selectedMarker && (
          <div className="absolute top-4 left-4 right-4 z-[60] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-black/95 backdrop-blur-xl border border-red-600 p-5 rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <button onClick={() => setSelectedMarker(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getCategoryColor(selectedMarker.category)}`}>
                  {selectedMarker.failure ? <AlertTriangle size={24} className="text-white" /> : <ShieldCheck size={24} className="text-white" />}
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tighter italic">
                    {selectedMarker.label || selectedMarker.diagnosis}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                      <Calendar size={12} className="text-red-600" />
                      {formatDate(selectedMarker.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 bg-black/90 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col gap-2">
           <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Base de Dados APH Nacional</span>
              <span className="text-[8px] font-mono text-red-500 animate-pulse">MONITORAMENTO INTEGRADO // SUS</span>
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div><span className="text-[8px] font-black text-gray-400 uppercase">Clínico</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div><span className="text-[8px] font-black text-gray-400 uppercase">Trauma</span></div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="px-6 mt-12 space-y-10 animate-in fade-in duration-500 pb-24">
      <section>
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <User className="w-4 h-4 text-red-600" /> Gestão de Perfil Vital
          </h3>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">DADOS CRÍTICOS</span>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-[48px] border-2 border-gray-100 space-y-6">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center text-white text-3xl font-black italic shadow-xl">
                {editProfile.name.charAt(0)}
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={editProfile.name} 
                  onChange={(e) => { setEditProfile({...editProfile, name: e.target.value}); setHasChanges(true); }}
                  className="w-full bg-transparent border-b-2 border-gray-200 focus:border-red-600 outline-none text-2xl font-black tracking-tighter uppercase"
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Idade</label>
                <input 
                  type="number" 
                  value={editProfile.age} 
                  onChange={(e) => { setEditProfile({...editProfile, age: parseInt(e.target.value)}); setHasChanges(true); }}
                  className="w-full bg-white p-4 rounded-2xl border border-gray-100 font-black text-lg focus:border-red-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo Sanguíneo</label>
                <select 
                  value={editProfile.bloodType}
                  onChange={(e) => { setEditProfile({...editProfile, bloodType: e.target.value}); setHasChanges(true); }}
                  className="w-full bg-white p-4 rounded-2xl border border-gray-100 font-black text-lg focus:border-red-600 outline-none appearance-none"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Alergias (Separadas por vírgula)</label>
              <input 
                type="text" 
                value={editProfile.allergies.join(', ')} 
                onChange={(e) => { setEditProfile({...editProfile, allergies: e.target.value.split(',').map(s => s.trim())}); setHasChanges(true); }}
                className="w-full bg-white p-4 rounded-2xl border border-gray-100 font-black text-sm uppercase focus:border-red-600 outline-none"
              />
           </div>

           {hasChanges && (
             <button onClick={handleUpdateBaseProfile} className="w-full bg-red-600 text-white py-4 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
               SALVAR ALTERAÇÕES VITAIS
             </button>
           )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Phone className="w-4 h-4 text-red-600" /> Contatos de Emergência
          </h3>
          <button onClick={() => { setIsAddingContact(true); setPhoneError(false); }} className="bg-black text-white p-2 rounded-xl active:scale-90"><Plus size={18} /></button>
        </div>

        {isAddingContact && (
          <div className="mb-6 bg-white p-6 rounded-[32px] border-4 border-red-600 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Novo Contato de Segurança</h4>
                <button onClick={() => { setIsAddingContact(false); setPhoneError(false); }}><X size={16} /></button>
             </div>
             <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="NOME" 
                  value={newContact.name} 
                  onChange={e => setNewContact({...newContact, name: e.target.value})} 
                  className="w-full bg-gray-50 p-4 rounded-2xl font-black text-xs uppercase focus:bg-white transition-colors outline-none" 
                />
                <div className="space-y-1">
                  <input 
                    type="tel" 
                    placeholder="TELEFONE (+55...)" 
                    value={newContact.phone} 
                    onChange={e => {
                      setNewContact({...newContact, phone: e.target.value});
                      if (phoneError) setPhoneError(false);
                    }} 
                    className={`w-full p-4 rounded-2xl font-black text-xs uppercase transition-all outline-none ${phoneError ? 'bg-red-50 border-2 border-red-600' : 'bg-gray-50 border border-transparent focus:bg-white'}`} 
                  />
                  {phoneError && (
                    <p className="text-[8px] font-black text-red-600 uppercase tracking-widest px-2 animate-in fade-in">Formato de telefone inválido (mín. 8 dígitos)</p>
                  )}
                </div>
                <button onClick={handleAddContact} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-transform">SALVAR</button>
             </div>
          </div>
        )}

        <div className="space-y-3">
          {userProfile.emergencyContacts.map((contact, idx) => (
            <div key={idx} className="bg-white p-5 rounded-[32px] border-2 border-gray-100 flex items-center gap-5">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><User size={24} /></div>
              <div className="flex-1">
                <p className="font-black text-gray-900 text-lg leading-none uppercase tracking-tighter">{contact.name}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{contact.phone}</p>
              </div>
              <button onClick={() => handleRemoveContact(idx)} className="text-gray-300 hover:text-red-600"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-32 bg-white min-h-screen relative">
      
      {/* Nearby Hospitals Modal */}
      {showHospitalsModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 bg-black text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <MapPin className="text-red-600" size={24} />
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Hospitais Próximos</h2>
                </div>
                <button onClick={() => setShowHospitalsModal(false)} className="bg-white/10 p-2 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {isSearchingHospitals ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <Loader2 size={48} className="text-red-600 animate-spin" />
                    <p className="font-black uppercase tracking-widest text-xs text-gray-400">Consultando Rede Nacional de Saúde...</p>
                  </div>
                ) : hospitalsResult ? (
                  <div className="space-y-6">
                    <div className="prose prose-sm font-bold text-gray-800 uppercase text-xs leading-relaxed">
                       {hospitalsResult.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                    {hospitalsResult.sources.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Links de Navegação:</p>
                        {hospitalsResult.sources.map((chunk: any, i: number) => (
                          chunk.maps && (
                            <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-all">
                              <span className="font-black text-xs uppercase text-gray-900">{chunk.maps.title || "Ver no Maps"}</span>
                              <ExternalLink size={16} className="text-red-600" />
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-20 font-black text-gray-400 uppercase text-xs">Nenhuma informação disponível.</p>
                )}
              </div>
              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button onClick={() => setShowHospitalsModal(false)} className="w-full bg-black text-white py-5 rounded-[28px] font-black uppercase tracking-widest shadow-xl">Fechar</button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-black p-6 pt-12 pb-24 rounded-b-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start mb-8 px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">SALVAMENTO E PROVA JURÍDICA NACIONAL</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter leading-none italic uppercase">VIDA 360</h1>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="flex-1 bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Status de Proteção</p>
              <div className="flex items-center gap-2"><ShieldCheck className="text-green-500 w-5 h-5" /><span className="font-black text-lg">Ativo (Gratuito)</span></div>
           </div>
           <div className="flex-1 bg-red-600 p-5 rounded-3xl shadow-lg">
              <p className="text-[9px] font-black text-red-200 uppercase tracking-widest mb-1">Risco Local (Brasil)</p>
              <div className="flex items-center gap-2"><AlertTriangle className="text-white w-5 h-5" /><span className="font-black text-lg">Moderado</span></div>
           </div>
        </div>
      </div>

      <div className="-mt-16 flex justify-center relative z-20">
        <button onClick={onStartEmergency} className="w-48 h-48 bg-white rounded-full shadow-2xl border-[12px] border-gray-100 flex flex-col items-center justify-center active:scale-95 transition-all group">
          <div className="w-32 h-32 bg-red-600 rounded-full flex flex-col items-center justify-center text-white emergency-pulse shadow-xl group-hover:bg-red-700">
            <span className="text-5xl font-black italic tracking-tighter">SOS</span>
          </div>
        </button>
      </div>

      {activeTab === 'home' && (
        <div className="px-6 mt-12 space-y-10">
          <section>
             <button 
               onClick={handleSearchHospitals}
               className="w-full bg-gray-50 border-4 border-gray-100 rounded-[48px] p-8 flex items-center gap-6 active:scale-95 transition-all hover:bg-white"
             >
                <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg">
                   <MapPin size={32} />
                </div>
                <div className="text-left">
                   <p className="text-xl font-black uppercase tracking-tighter italic leading-none">Unidades de Saúde</p>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Localizar hospitais mais próximos</p>
                </div>
                <ChevronRight className="ml-auto text-gray-300" />
             </button>
          </section>

          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2"><BarChart3 className="w-4 h-4 text-red-600" /> Efetividade de Resgate Brasil</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-6 rounded-[32px] border-2 border-gray-100">
                <p className="text-4xl font-black text-green-600 tracking-tighter">{successCount}</p>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">Intervenções Eficazes</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-[32px] border-2 border-gray-100">
                <p className="text-4xl font-black text-red-600 tracking-tighter">{failureCount}</p>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">Omissões Oficiais</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2"><FileText className="w-4 h-4 text-red-600" /> Dossiês de Resgate</h3>
            </div>
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="bg-gray-50 rounded-[40px] p-12 text-center border-2 border-dashed border-gray-200">
                  <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest leading-loose text-center">Nenhum evento registrado em território nacional</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[32px] border-2 border-gray-100 group relative overflow-hidden">
                    {item.institutionalFailureObserved && <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-4 py-1 uppercase tracking-widest">Falha de Socorro (Art. 135)</div>}
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.institutionalFailureObserved ? 'bg-black text-red-500' : 'bg-red-50 text-red-600'}`}>
                        {item.category === 'CLINICAL' ? <Heart size={24} /> : <Zap size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-xl tracking-tighter uppercase leading-none">{item.diagnosis}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{formatDate(item.startTime)}</p>
                        <p className="text-[8px] font-mono text-gray-300 mt-1 uppercase">HASH: {item.evidenceHash.substring(0, 16)}...</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleShareDossier(item)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"><Share2 size={18} /></button>
                        <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"><Download size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'map' && renderMapView()}
      {activeTab === 'settings' && renderSettingsView()}
      {activeTab === 'history' && (
        <div className="px-6 mt-12 space-y-4 pb-20">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <History className="w-4 h-4 text-red-600" /> Histórico Completo
          </h3>
          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-400 uppercase font-black text-[10px] tracking-widest">Sem registros</div>
          ) : (
            history.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[32px] border-2 border-gray-100">
                <p className="font-black uppercase italic tracking-tighter text-xl">{item.diagnosis}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{formatDate(item.startTime)}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-sm bg-black/95 backdrop-blur-3xl h-20 rounded-full shadow-2xl border border-white/10 flex items-center justify-around px-8 z-50 pb-safe">
        <button onClick={() => setActiveTab('home')} className={`p-3 transition-all ${activeTab === 'home' ? 'text-white scale-110' : 'text-gray-600'}`}><BarChart3 className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('map')} className={`p-3 transition-all ${activeTab === 'map' ? 'text-white scale-110' : 'text-gray-600'}`}><MapIcon className="w-7 h-7" /></button>
        <div className="relative -top-8"><button onClick={onStartEmergency} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white border-[6px] border-white shadow-[0_0_40px_rgba(239,68,68,0.6)] active:scale-90 transition-all"><Siren className="w-10 h-10" /></button></div>
        <button onClick={() => setActiveTab('history')} className={`p-3 transition-all ${activeTab === 'history' ? 'text-white scale-110' : 'text-gray-600'}`}><History className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 transition-all ${activeTab === 'settings' ? 'text-white scale-110' : 'text-gray-600'}`}><Settings className="w-7 h-7" /></button>
      </div>
    </div>
  );
};

export default HealthDashboard;
