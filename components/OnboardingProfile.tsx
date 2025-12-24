
import React, { useState } from 'react';
import { User, Heart, ShieldCheck, ArrowRight, UserPlus, Phone } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingProfileProps {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingProfile: React.FC<OnboardingProfileProps> = ({ onComplete }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    age: 0,
    bloodType: "A+",
    allergies: [],
    medications: [],
    emergencyContacts: []
  });

  const [step, setStep] = useState(1);
  const [contact, setContact] = useState({ name: '', phone: '', relation: '' });

  const handleFinish = () => {
    if (profile.name && profile.age > 0) {
      onComplete(profile);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-white flex flex-col overflow-y-auto">
      <div className="bg-black p-8 pt-16 text-white shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
            <User size={24} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Seu Perfil Vital</h1>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Passo {step} de 3 — Dados Obrigatórios</p>
      </div>

      <div className="p-8 flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-black uppercase tracking-tight">Identificação Básica</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  placeholder="EX: JOÃO DA SILVA"
                  className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[28px] font-black text-lg focus:border-red-600 outline-none uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Idade</label>
                  <input 
                    type="number" 
                    value={profile.age || ''}
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                    placeholder="00"
                    className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[28px] font-black text-lg focus:border-red-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo Sanguíneo</label>
                  <select 
                    value={profile.bloodType}
                    onChange={e => setProfile({...profile, bloodType: e.target.value})}
                    className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[28px] font-black text-lg focus:border-red-600 outline-none appearance-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button 
              disabled={!profile.name || !profile.age}
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-6 rounded-[32px] font-black uppercase text-sm shadow-xl mt-8 flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 transition-all"
            >
              PRÓXIMO <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-black uppercase tracking-tight">Saúde e Alergias</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alergias Críticas (Separe por vírgula)</label>
                <textarea 
                  placeholder="EX: PENICILINA, LÁTEX, ABELHA"
                  value={profile.allergies.join(', ')}
                  onChange={e => setProfile({...profile, allergies: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[28px] font-black text-sm h-32 focus:border-red-600 outline-none uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Medicamentos de Uso Contínuo</label>
                <input 
                  type="text" 
                  placeholder="EX: INSULINA, ATORVASTATINA"
                  value={profile.medications.join(', ')}
                  onChange={e => setProfile({...profile, medications: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-[28px] font-black text-sm focus:border-red-600 outline-none uppercase"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-400 py-6 rounded-[32px] font-black uppercase text-sm active:scale-95 transition-all">VOLTAR</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-black text-white py-6 rounded-[32px] font-black uppercase text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                PRÓXIMO <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-black uppercase tracking-tight">Contato de Emergência</h2>
            <div className="space-y-4 bg-gray-50 p-6 rounded-[40px] border-4 border-gray-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Contato</label>
                <input 
                  type="text" 
                  value={contact.name}
                  onChange={e => setContact({...contact, name: e.target.value})}
                  placeholder="NOME"
                  className="w-full bg-white p-4 rounded-2xl font-black text-sm uppercase outline-none focus:border-red-600 border border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone Celular</label>
                <input 
                  type="tel" 
                  value={contact.phone}
                  onChange={e => setContact({...contact, phone: e.target.value})}
                  placeholder="+55 00 00000-0000"
                  className="w-full bg-white p-4 rounded-2xl font-black text-sm outline-none focus:border-red-600 border border-transparent"
                />
              </div>
              <button 
                onClick={() => {
                  if (contact.name && contact.phone) {
                    setProfile({...profile, emergencyContacts: [contact]});
                    setContact({ name: '', phone: '', relation: '' });
                  }
                }}
                className="w-full bg-red-600/10 text-red-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Vincular Contato Principal
              </button>
            </div>

            {profile.emergencyContacts.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 p-5 rounded-3xl flex items-center gap-4">
                <div className="bg-green-600 text-white p-2 rounded-xl"><ShieldCheck size={20}/></div>
                <div>
                  <p className="font-black text-xs uppercase leading-none">{profile.emergencyContacts[0].name}</p>
                  <p className="text-[10px] font-bold text-green-600 mt-1">{profile.emergencyContacts[0].phone}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-400 py-6 rounded-[32px] font-black uppercase text-sm active:scale-95 transition-all">VOLTAR</button>
              <button 
                disabled={profile.emergencyContacts.length === 0}
                onClick={handleFinish} 
                className="flex-[2] bg-red-600 text-white py-6 rounded-[32px] font-black uppercase text-sm shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
              >
                ATIVAR PROTEÇÃO AGORA <ShieldCheck size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingProfile;
