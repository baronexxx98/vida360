
import React, { useState, useEffect } from 'react';
import HealthDashboard from './components/HealthDashboard';
import EmergencyAssistant from './components/EmergencyAssistant';
import AuthScreen from './components/AuthScreen';
import SplashScreen from './components/SplashScreen';
import OnboardingProfile from './components/OnboardingProfile';
import PaymentScreen from './components/PaymentScreen';
import { UserProfile, IncidentReport } from './types';

type AppState = 'SPLASH' | 'AUTH' | 'ONBOARDING' | 'PAYMENT' | 'DASHBOARD';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('SPLASH');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    age: 0,
    bloodType: "",
    allergies: [],
    medications: [],
    emergencyContacts: []
  });
  const [incidentHistory, setIncidentHistory] = useState<IncidentReport[]>([]);

  const handleStartEmergency = () => {
    setIsEmergencyMode(true);
  };

  const handleEmergencyComplete = (report: IncidentReport) => {
    setIncidentHistory(prev => [report, ...prev]);
    setIsEmergencyMode(false);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
  };

  const handleSplashFinish = () => {
    setAppState('AUTH');
  };

  const handleLogin = () => {
    setAppState('ONBOARDING');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    // Alterado para pular o pagamento e ir direto para o dashboard (Gratuito no momento)
    setAppState('DASHBOARD');
  };

  const handlePaymentComplete = () => {
    setAppState('DASHBOARD');
  };

  if (appState === 'SPLASH') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (appState === 'AUTH') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (appState === 'ONBOARDING') {
    return <OnboardingProfile onComplete={handleOnboardingComplete} />;
  }

  if (appState === 'PAYMENT') {
    return <PaymentScreen onPaymentSuccess={handlePaymentComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1">
        {isEmergencyMode ? (
          <EmergencyAssistant 
            userProfile={userProfile} 
            onComplete={handleEmergencyComplete}
            onCancel={() => setIsEmergencyMode(false)}
          />
        ) : (
          <HealthDashboard 
            onStartEmergency={handleStartEmergency}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            history={incidentHistory}
          />
        )}
      </main>

      {!isEmergencyMode && (
         <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full px-4">
            <div className="bg-black/90 backdrop-blur-xl px-5 py-2 rounded-full text-white text-[10px] font-black flex items-center justify-center gap-3 border border-white/20 shadow-2xl mx-auto max-w-max uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Vida 360 Ativo // Proteção em Tempo Real
            </div>
         </div>
      )}
    </div>
  );
};

export default App;
