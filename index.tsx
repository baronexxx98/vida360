
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("VIDA 360: Inicializando sistemas de emergência...");

const container = document.getElementById('root');

if (!container) {
  throw new Error("Elemento raiz não encontrado no DOM.");
}

try {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("VIDA 360: Interface renderizada com sucesso.");
} catch (error) {
  console.error("VIDA 360: Falha Crítica de Renderização", error);
  container.innerHTML = `
    <div style="background:black;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;font-family:sans-serif;">
      <h1 style="color:#ef4444;font-size:24px;margin-bottom:10px;">ERRO DE SISTEMA</h1>
      <p style="color:#888;max-width:300px;margin-bottom:20px;">Houve um conflito nos módulos de IA da Vercel.</p>
      <button onclick="location.reload(true)" style="background:#ef4444;color:white;border:none;padding:15px 30px;border-radius:12px;font-weight:bold;cursor:pointer;">FORÇAR RESET</button>
    </div>
  `;
}
