// 💡 Concept & Analogie : Comme le châssis d'une voiture sur lequel se fixent le moteur, les sièges et la carrosserie, `App.jsx` enveloppe l'application des contextes globaux, du routeur et d'un bouclier d'erreur (ErrorBoundary) pour éliminer tout risque d'écran blanc.
// 🔄 Comparaison React / Flutter : Équivalent du widget racine `MaterialApp.router` en Flutter enveloppé par les `ChangeNotifierProvider` et `ErrorWidget.builder`.
// 🎯 À retenir pour la soutenance : "Ce composant racine intègre un ErrorBoundary de haut niveau pour capturer les erreurs de rendu et offrir un bouton de reprise instantané."
// Module : Structure & Routage

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
        <div className="min-h-screen bg-[#0D0F12] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#161920] border border-[#262A33] flex items-center justify-center text-3xl mb-4 shadow-xl">
            🛡️
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Campus<span className="text-[#CCFF00]">Save</span> — Récupération Système
          </h1>
          <p className="text-sm text-[#8A92A6] max-w-md mb-6">
            Une interruption temporaire a été interceptée par le bouclier d'erreur. Utilisez les options ci-dessous pour reprendre votre navigation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#CCFF00] text-[#0D0F12] font-semibold text-sm rounded-xl hover:bg-[#b8e600] transition-colors"
            >
              🔄 Recharger la page
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#1E232B] text-white font-medium text-sm rounded-xl border border-[#2B313D] hover:bg-[#252B36] transition-colors"
            >
              ⚡ Réinitialiser la session de démo
            </button>
            <button
              onClick={() => (window.location.href = '/app')}
              className="px-5 py-2.5 bg-[#161920] text-[#8A92A6] font-medium text-sm rounded-xl border border-[#262A33] hover:text-white transition-colors"
            >
              🏠 Retour à l'accueil
            </button>
          </div>
          {this.state.error && (
            <details className="text-xs text-[#8A92A6] bg-[#161920] p-4 rounded-xl border border-[#262A33] max-w-lg text-left overflow-auto">
              <summary className="cursor-pointer font-mono text-[#CCFF00] mb-2">Détails techniques pour le développeur</summary>
              <pre className="font-mono text-xs whitespace-pre-wrap">{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
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
