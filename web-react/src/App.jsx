// 💡 Concept & Analogie : Comme le châssis d'une voiture sur lequel se fixent le moteur, les sièges et la carrosserie, `App.jsx` enveloppe l'application des contextes globaux, du routeur et d'un bouclier d'erreur (ErrorBoundary) pour éliminer tout risque d'écran blanc.
// 🔄 Comparaison React / Flutter : Équivalent du widget racine `MaterialApp.router` en Flutter enveloppé par les `ChangeNotifierProvider` et `ErrorWidget.builder`.
// 🎯 À retenir pour la soutenance : "Ce composant racine intègre un ErrorBoundary de haut niveau pour capturer les erreurs de rendu et offrir un bouton de reprise instantané."

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppRouter } from './routes/AppRouter.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary CampusSave capturé :', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('campussave_demo_session');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4EFE6] text-[#141210] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-xl bg-white border-2 border-[#141210] shadow-[3px_3px_0px_#141210] flex items-center justify-center text-3xl mb-4">
            🛡️
          </div>
          <h1 className="text-2xl font-black mb-2 font-anton uppercase tracking-wide">
            Campus<span className="text-[#E51C23]">Save</span> — Récupération Système
          </h1>
          <p className="text-sm text-[#555] max-w-md mb-6 font-medium">
            Une interruption temporaire a été interceptée par le bouclier d'erreur. Utilisez les options ci-dessous pour reprendre votre navigation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#E51C23] text-white font-bold text-sm rounded-lg border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#d1141b] transition-transform"
            >
              🔄 Recharger la page
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#FFD000] text-[#141210] font-bold text-sm rounded-lg border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#e6bb00] transition-transform"
            >
              ⚡ Réinitialiser la session de démo
            </button>
            <button
              onClick={() => (window.location.href = '/app')}
              className="px-5 py-2.5 bg-[#FAF6EE] text-[#141210] font-bold text-sm rounded-lg border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#F4EFE6] transition-transform"
            >
              🏠 Retour à l'accueil
            </button>
          </div>
          {this.state.error && (
            <details className="text-xs text-[#555] bg-white p-4 rounded-xl border-2 border-[#141210] shadow-[3px_3px_0px_#141210] max-w-lg text-left overflow-auto font-mono">
              <summary className="cursor-pointer font-bold text-[#E51C23] mb-2">Détails techniques pour le développeur</summary>
              <pre className="text-xs whitespace-pre-wrap">{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
