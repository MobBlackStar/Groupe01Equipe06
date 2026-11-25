// 💡 Concept & Analogie : Comme le châssis d'une voiture sur lequel se fixent le moteur, les sièges et la carrosserie, `App.jsx` enveloppe l'application des contextes globaux, du routeur et d'un bouclier d'erreur (ErrorBoundary) pour éliminer tout risque d'écran blanc.
// 🔄 Comparaison React / Flutter : Équivalent du widget racine `MaterialApp.router` en Flutter enveloppé par les `ChangeNotifierProvider` et `ErrorWidget.builder`.
// 🎯 À retenir pour la soutenance : "Ce composant racine intègre un ErrorBoundary de haut niveau pour capturer les erreurs de rendu et offrir un bouton de reprise instantané."

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppRouter } from './routes/AppRouter.jsx';
import ApkDownloadMascot from './components/ui/ApkDownloadMascot.jsx';
import MascotToast from './components/ui/MascotToast.jsx';

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
        <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#111111]/10 shadow-sm flex items-center justify-center text-3xl mb-4">
            🛡️
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 font-anton uppercase tracking-wide">
            Campus<span className="text-[#DA0711]">Save</span> — Récupération Système
          </h1>
          <p className="text-sm text-[#666] max-w-md mb-6 font-medium">
            Une interruption temporaire a été interceptée par le bouclier d'erreur. Utilisez les options ci-dessous pour reprendre votre navigation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#DA0711] text-white font-bold text-sm rounded-full shadow-sm hover:opacity-95 transition-all"
            >
              🔄 Recharger la page
            </button>
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-[#FFD000] text-[#111111] font-bold text-sm rounded-full border border-[#111111]/15 shadow-sm hover:opacity-95 transition-all"
            >
              ⚡ Réinitialiser la session de démo
            </button>
            <button
              onClick={() => (window.location.href = '/app')}
              className="px-6 py-2.5 bg-[#EDE6D7] text-[#111111] font-bold text-sm rounded-full border border-[#111111]/10 shadow-sm hover:bg-[#E5DEC7] transition-all"
            >
              🏠 Retour à l'accueil
            </button>
          </div>
          {this.state.error && (
            <details className="text-xs text-[#666] bg-white p-5 rounded-2xl border border-[#111111]/10 shadow-sm max-w-lg text-left overflow-auto font-mono">
              <summary className="cursor-pointer font-bold text-[#DA0711] mb-2">Détails techniques pour le développeur</summary>
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
          <MascotToast />
          <ApkDownloadMascot />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
