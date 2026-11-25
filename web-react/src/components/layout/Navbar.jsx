// 💡 Concept & Analogie : Comme l'enseigne néon épurée et le comptoir d'accueil d'un restaurant moderne, cette barre de navigation assure une orientation instantanée sans surcharge visuelle.
// 🔄 Comparaison React / Flutter : En React, la navbar est une barre intégrée en pilule douce (#EDE6D7) avec sélecteur direct de rôles ; en Flutter, nous combinons une AppBar stylisée et la navigation basse tactile.
// 🎯 À retenir pour la soutenance : "La barre intègre un commutateur de rôle 1-clic ultra-rapide (Étudiant · Commerçant · Admin) accessible directement pour une démonstration fluide devant le jury."

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Plus,
  Globe,
  LogOut,
  ChevronDown,
  GraduationCap,
  Store,
  ShieldCheck,
  Check,
  Zap,
  Lock,
  UserRound,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBag } from '../../context/BagContext.jsx';
import { ROLES } from '@shared/constants.js';

const STUDENT_LINKS = [
  { label: 'Offres', path: '/app' },
  { label: 'Radar 3D', path: '/app/radar' },
  { label: 'Tickets', path: '/app/orders' },
  { label: 'Fidélité', path: '/app/loyalty' },
  { label: 'Mon bilan', path: '/app/dashboard' },
];

const MERCHANT_LINKS = [
  { label: 'Dashboard', path: '/merchant/dashboard' },
  { label: 'Mes offres', path: '/merchant/offers', exact: true },
  { label: 'Commandes', path: '/merchant/orders' },
  { label: 'Scanner', path: '/merchant/scan' },
  { label: 'Boutique', path: '/merchant/store' },
];

const ADMIN_LINKS = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Commerces', path: '/admin/merchants' },
  { label: 'Utilisateurs', path: '/admin/users' },
];

const DEMO_ROLES = [
  { role: ROLES.STUDENT, label: 'Étudiant ESSECT', short: 'Étudiant', icon: GraduationCap },
  { role: ROLES.MERCHANT, label: 'Commerçant Montfleury', short: 'Commerçant', icon: Store },
  { role: ROLES.ADMIN, label: 'Administrateur', short: 'Admin', icon: ShieldCheck },
];

export default function Navbar() {
  const { user, profile, role, authMode, switchToRealMode, switchToDemoMode, logout, loginDemo } = useAuth();
  const { totals, openBag } = useBag();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Fermeture automatique au clic extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDemoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ferme le tiroir mobile à chaque changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleRoleSwitch = async (targetRole) => {
    setDemoMenuOpen(false);
    setMobileMenuOpen(false);
    await loginDemo(targetRole);
    if (targetRole === ROLES.STUDENT) navigate('/app/explore');
    else if (targetRole === ROLES.MERCHANT) navigate('/merchant/dashboard');
    else if (targetRole === ROLES.ADMIN) navigate('/admin/dashboard');
  };

  const isActive = (link) => {
    const { pathname } = location;
    if (link.path === '/app') {
      return pathname === '/app' || pathname === '/app/explore' || pathname.startsWith('/app/offers') || pathname.startsWith('/app/checkout');
    }
    if (link.exact) return pathname === link.path || pathname.startsWith(`${link.path}/`) && !pathname.endsWith('/new');
    return pathname.startsWith(link.path);
  };

  let links = STUDENT_LINKS;
  if (role === ROLES.MERCHANT) links = MERCHANT_LINKS;
  else if (role === ROLES.ADMIN) links = ADMIN_LINKS;

  const currentDemo = DEMO_ROLES.find((d) => d.role === role) || DEMO_ROLES[0];
  const rawPoints = Number(profile?.ecoPoints ?? profile?.ecoPointsBalance);
  const ecoPoints = Number.isFinite(rawPoints) ? rawPoints : 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF3E6] border-b-2 border-[#111111]">
      <div className="cs-container h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Wordmark */}
        <Link to="/" className="shrink-0 flex items-center gap-2 group" aria-label="CampusSave — accueil">
          <img src="/assets/brand/mascot-sticker-256.png" alt="" width="40" height="40" className="h-8 sm:h-10 w-auto shrink-0 group-hover:-rotate-6 transition-transform" decoding="async" />
          <span className="font-title text-[1.4rem] min-[400px]:text-[1.75rem] sm:text-[2rem] leading-none tracking-[-0.04em] text-[#DA0711] group-hover:-rotate-2 transition-transform">
            CampusSave
          </span>
          <span className="hidden sm:inline font-sticker text-sm text-[#111111] -rotate-6">ESSECT</span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Navigation principale">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3.5 py-2 whitespace-nowrap font-semibold uppercase text-[1.0625rem] tracking-[0.01em] transition-colors ${
                  active ? 'text-[#DA0711]' : 'text-[#111111] hover:text-[#DA0711]'
                }`}
              >
                {link.label}
                <span
                  className={`absolute left-3.5 right-3.5 -bottom-0.5 h-[3px] rounded-full bg-[#DA0711] origin-left transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Actions : une action principale + un seul menu de compte (au lieu de 5 boutons côte à côte) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {role === ROLES.MERCHANT && (
            <Link to="/merchant/offers/new" className="cs-btn cs-btn-red cs-btn-sm hidden md:inline-flex whitespace-nowrap">
              <Plus className="w-4 h-4" strokeWidth={3} />
              Publier
            </Link>
          )}

          {role === ROLES.STUDENT && (
            <>
              <button
                type="button"
                onClick={openBag}
                aria-label={`Ouvrir mon sac (${totals.totalCount} article${totals.totalCount > 1 ? 's' : ''})`}
                className="inline-flex items-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-full bg-white border-2 border-[#111111] font-semibold uppercase text-[0.9rem] hover:bg-[#FFD000] transition-colors whitespace-nowrap cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                <span className="hidden min-[380px]:inline">SAC</span>
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#DA0711] text-white font-mono text-xs font-bold tabular-nums">
                  {totals.totalCount}
                </span>
              </button>

              <Link
                to="/app/loyalty"
                className="hidden md:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#FFD000] border-2 border-[#111111] font-semibold uppercase text-[0.95rem] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
                title="Mes EcoPoints"
              >
                <span className="font-display text-[1.45rem] leading-none tabular-nums">{ecoPoints}</span>
                <span>pts</span>
              </Link>
            </>
          )}

          <Link
            to="/impact"
            className="hidden lg:inline-flex items-center gap-1.5 h-10 px-3 font-semibold uppercase text-[0.95rem] hover:text-[#DA0711] transition-colors whitespace-nowrap"
          >
            <Globe className="w-4 h-4" />
            Impact
          </Link>

          {user || authMode === 'DEMO' ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setDemoMenuOpen((o) => !o)}
                aria-expanded={demoMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu du compte"
                className="inline-flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-full border-2 border-[#111111] bg-[#FAF3E6] hover:bg-white font-semibold uppercase text-[0.95rem] transition-colors whitespace-nowrap max-w-[16rem]"
              >
                {authMode === 'DEMO' ? (
                  <>
                    <currentDemo.icon className="w-4 h-4 text-[#DA0711] shrink-0" />
                    <span className="hidden sm:inline font-bold text-[0.7rem] leading-none bg-[#FFD000] px-1.5 py-1 rounded border border-[#111111]">DÉMO</span>
                    <span className="hidden sm:inline">{currentDemo.short}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00875A] shrink-0" />
                    <span className="hidden sm:inline truncate normal-case">{user?.email?.split('@')[0] || 'Mon compte'}</span>
                  </>
                )}
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${demoMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {demoMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[1.25rem] bg-[#FAF3E6] border-2 border-[#111111] p-2 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45)] z-50 animate-fadeIn"
                >
                  {authMode === 'DEMO' ? (
                    <>
                      <p className="cs-label px-3 pt-2 pb-2.5">⚡ Mode démo jury · changer de rôle</p>
                      {DEMO_ROLES.map((d) => {
                        const selected = d.role === role;
                        return (
                          <button
                            key={d.role}
                            role="menuitem"
                            type="button"
                            onClick={() => handleRoleSwitch(d.role)}
                            className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left font-semibold uppercase text-base transition-colors ${
                              selected ? 'bg-[#111111] text-[#FAF3E6]' : 'hover:bg-[#EDE6D7]'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <d.icon className="w-[18px] h-[18px]" />
                              {d.label}
                            </span>
                            {selected && <Check className="w-[18px] h-[18px] text-[#FFD000]" />}
                          </button>
                        );
                      })}
                      <div className="my-2 border-t-2 border-[#111111]/15" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          setDemoMenuOpen(false);
                          await switchToRealMode();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left font-semibold uppercase text-base hover:bg-[#EDE6D7] transition-colors"
                        title="Basculer en mode compte réel pour tester l'inscription ou la connexion"
                      >
                        <Lock className="w-[18px] h-[18px] text-[#DA0711]" />
                        Tester un vrai compte
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-3 pt-2 pb-2.5">
                        <p className="cs-label">🟢 Compte réel</p>
                        <p className="font-semibold text-base truncate" title={user?.email}>{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#111111] text-[#FAF3E6] text-xs font-bold uppercase">
                          {role === ROLES.ADMIN ? 'Admin' : role === ROLES.MERCHANT ? 'Commerçant' : 'Étudiant'}
                        </span>
                      </div>
                      <div className="my-2 border-t-2 border-[#111111]/15" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          setDemoMenuOpen(false);
                          await switchToDemoMode('student');
                          navigate('/app/explore');
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left font-semibold uppercase text-base hover:bg-[#EDE6D7] transition-colors"
                        title="Revenir au mode démo 1-clic pour le jury"
                      >
                        <Zap className="w-[18px] h-[18px] text-[#DA0711]" />
                        Revenir en démo jury
                      </button>
                    </>
                  )}

                  <div className="my-2 border-t-2 border-[#111111]/15" />
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setDemoMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left font-semibold uppercase text-base hover:bg-[#EDE6D7] transition-colors"
                  >
                    <UserRound className="w-[18px] h-[18px]" />
                    Mon profil
                  </Link>

                  {user && (
                    <>
                      <div className="my-2 border-t-2 border-[#111111]/15" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDemoMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left font-semibold uppercase text-base hover:bg-[#EDE6D7] transition-colors"
                      >
                        <LogOut className="w-[18px] h-[18px]" />
                        Se déconnecter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="cs-btn cs-btn-red cs-btn-sm whitespace-nowrap">
              Connexion
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            className="cs-icon-btn xl:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tiroir mobile / tablette */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t-2 border-[#111111] bg-[#FAF3E6] animate-fadeIn">
          <nav className="cs-container py-6 flex flex-col" aria-label="Navigation mobile">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-display uppercase text-[2.75rem] leading-[1.05] py-1 transition-colors ${
                  isActive(link) ? 'text-[#DA0711]' : 'text-[#111111] hover:text-[#DA0711]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/impact" className="font-display uppercase text-[2.75rem] leading-[1.05] py-1 hover:text-[#DA0711]">
              Impact campus
            </Link>
            <Link to="/profile" className="font-display uppercase text-[2.75rem] leading-[1.05] py-1 hover:text-[#DA0711]">
              Mon profil
            </Link>

            <div className="mt-6 pt-6 border-t-2 border-[#111111] flex flex-col gap-3">
              {authMode === 'DEMO' ? (
                <>
                  <p className="cs-label">⚡ Mode Démo Jury actif</p>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_ROLES.map((d) => (
                      <button
                        key={d.role}
                        type="button"
                        onClick={() => handleRoleSwitch(d.role)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border-2 border-[#111111] ${d.role === role ? 'bg-[#111111] text-[#FAF3E6]' : 'bg-white text-[#111111]'}`}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await switchToRealMode();
                      navigate('/login');
                    }}
                    className="cs-btn cs-btn-cream text-xs"
                  >
                    <Lock className="w-4 h-4 text-[#DA0711]" /> 🔐 Tester un Vrai Compte
                  </button>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase text-[#00875A] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00875A]" />
                    <span>🟢 Compte Réel : {user?.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await switchToDemoMode('student');
                      navigate('/app/explore');
                    }}
                    className="cs-btn cs-btn-mustard text-xs"
                  >
                    <Zap className="w-4 h-4" /> ⚡ Revenir en Démo Jury
                  </button>
                </>
              )}

              {role === ROLES.MERCHANT && (
                <Link to="/merchant/offers/new" className="cs-btn cs-btn-red">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Publier une offre
                </Link>
              )}
              {user && (
                <button type="button" onClick={logout} className="cs-btn cs-btn-cream">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
