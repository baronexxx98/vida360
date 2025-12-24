
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("VIDA 360: Sistema de Resgate Iniciando...");

const mountApp = () => {
  const container = document.getElementById('root');

  if (!container) {
    console.error("VIDA 360: Erro de Montagem - Container não encontrado.");
    return;
  }

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("VIDA 360: Operacional.");
  } catch (error) {
    console.error("VIDA 360: Erro Fatal na Renderização:", error);
    container.innerHTML = `
      <div style="background:#000;color:#fff;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;font-family:sans-serif;">
        <h1 style="color:#ef4444;font-size:28px;font-weight:900;">ERRO DE CARREGAMENTO</h1>
        <p style="color:#888;margin:15px 0;">Não foi possível carregar os módulos de resgate. Limpe os dados do navegador e tente novamente.</p>
        <button onclick="window.location.reload(true)" style="background:#ef4444;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;">FORÇAR RECARREGAMENTO</button>
      </div>
    `;
  }
};

// Garante que o DOM esteja pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
