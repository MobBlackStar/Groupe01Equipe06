// 💡 Concept & Analogie : Comme le registre des étudiants et des commerçants de la scolarité centrale de l'ESSECT, cette console permet de vérifier les comptes créés, de vérifier les filières et d'appliquer une suspension conservatoire si nécessaire.
// 🔄 Comparaison React / Flutter : En React, la table propose des filtres de rôles instantanés et des bascules de suspension ; en Flutter, la vue superviseur utilise des tuiles `ListTile` avec badges de statut.
// 🎯 À retenir pour la soutenance : "Cette interface d'administration permet de gérer le cycle de vie des comptes et d'auditer les filières universitaires pour le classement écologique inter-filières."

import React, { useState, useEffect } from 'react';
import { ROLES, USER_STATUS, FILIERES } from '@shared/constants.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTunisDate } from '../../lib/formatters.js';
import {
  Button,
  Card,
  Badge,
  Tabs,
  Modal,
  Toast,
} from '../../components/ui/index.js';

const DEMO_USERS = [
  {
    uid: 'u-01',
    displayName: 'Ritej Bejaoui',
    email: 'donyesbejaoui27@gmail.com',
    role: ROLES.STUDENT,
    filiereId: FILIERES.EBUSINESS_3A,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 240,
    createdAt: '2026-11-16T10:00:00.000Z',
  },
  {
    uid: 'u-02',
    displayName: 'Fedi Touati',
    email: 'fedi.touati@essect.u-tunis.tn',
    role: ROLES.ADMIN,
    filiereId: null,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 0,
    createdAt: '2026-11-15T09:30:00.000Z',
  },
  {
    uid: 'u-03',
    displayName: 'Gérant Baguette & Baguette',
    email: 'contact@baguette.tn',
    role: ROLES.MERCHANT,
    filiereId: null,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 0,
    createdAt: '2026-11-16T11:15:00.000Z',
  },
  {
    uid: 'u-04',
    displayName: 'Amine Karray',
    email: 'amine.karray@essect.u-tunis.tn',
    role: ROLES.STUDENT,
    filiereId: FILIERES.FINANCE,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 120,
    createdAt: '2026-11-16T14:45:00.000Z',
  },
];

// Libellés d'affichage (présentation uniquement)
const ROLE_UI = {
  [ROLES.STUDENT]: { label: 'Étudiant', pill: 'cs-pill-leaf' },
  [ROLES.MERCHANT]: { label: 'Commerçant', pill: 'cs-pill-mustard' },
  [ROLES.ADMIN]: { label: 'Admin', pill: 'cs-pill-ink' },
};

const FILIERE_LABELS = {
  EBUSINESS_3A: '3A E-Business',
  FINANCE: 'Finance',
  MARKETING: 'Marketing',
  GESTION: 'Gestion',
  COMPTABILITE: 'Comptabilité',
};

// Date d'inscription : ISO / Timestamp Firestore formatés en heure de Tunis, jamais d'ISO brut
function createdLabel(user) {
  const v = user.createdAt;
  if (!v) return '—';
  if (typeof v === 'string' && !/^\d{4}-\d{2}-\d{2}T/.test(v)) return v;
  let input = v;
  if (typeof v?.toDate === 'function') input = v.toDate();
  else if (typeof v?._seconds === 'number') input = v._seconds * 1000;
  else if (typeof v?.seconds === 'number') input = v.seconds * 1000;
  return formatTunisDate(input, { fallback: '—', includeYear: true });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await apiClient.get(ENDPOINTS.ADMIN_USERS);
        if (res.data?.users && res.data.users.length > 0) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.warn('API admin users fallback démo:', err.message);
      }
    }
    loadUsers();
  }, []);

  const tabs = [
    { id: 'ALL', label: 'Tous les Comptes', count: users.length },
    {
      id: ROLES.STUDENT,
      label: 'Étudiants ESSECT',
      count: users.filter((u) => u.role === ROLES.STUDENT).length,
    },
    {
      id: ROLES.MERCHANT,
      label: 'Commerçants',
      count: users.filter((u) => u.role === ROLES.MERCHANT).length,
    },
    {
      id: ROLES.ADMIN,
      label: 'Administrateurs',
      count: users.filter((u) => u.role === ROLES.ADMIN).length,
    },
  ];

  const filteredUsers = users.filter((user) => {
    if (activeTab !== 'ALL' && user.role !== activeTab) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = user.displayName?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  async function toggleUserStatus(targetUser) {
    const isCurrentlyActive =
      targetUser.status === USER_STATUS.ACTIVE ||
      targetUser.status === 'ACTIVE' ||
      targetUser.status === 'ACTIF' ||
      targetUser.status === 'active' ||
      !targetUser.status;

    const nextStatus = isCurrentlyActive ? USER_STATUS.SUSPENDED : USER_STATUS.ACTIVE;

    if (nextStatus === USER_STATUS.SUSPENDED && !suspendReason.trim()) {
      setToast({ type: 'error', message: 'Un motif est obligatoire pour suspendre un compte.' });
      return;
    }

    setStatusBusy(true);
    try {
      await apiClient.patch(ENDPOINTS.ADMIN_USER_STATUS(targetUser.uid), {
        status: nextStatus,
        reason: nextStatus === USER_STATUS.SUSPENDED ? suspendReason.trim() : 'Compte réactivé par l administration',
      });
    } catch (err) {
      // Jamais de faux succès : si le serveur refuse, la liste n'est pas modifiée et la vraie raison est affichée
      setToast({ type: 'error', message: err?.response?.data?.error?.message || 'Action impossible : le serveur a refusé la modification.' });
      setStatusBusy(false);
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.uid === targetUser.uid ? { ...u, status: nextStatus } : u
      )
    );

    setToast({
      type: nextStatus === USER_STATUS.SUSPENDED ? 'warning' : 'success',
      message: `Le compte de ${targetUser.displayName} est désormais ${nextStatus === USER_STATUS.ACTIVE ? 'ACTIF' : 'SUSPENDU'}.`,
    });

    setStatusBusy(false);
    setSuspendReason('');
    setSuspendModalUser(null);
  }

  const isUserActive = (u) =>
    u?.status === USER_STATUS.ACTIVE ||
    u?.status === 'ACTIVE' ||
    u?.status === 'ACTIF' ||
    u?.status === 'active' ||
    !u?.status;

  // Fragments d'affichage partagés entre la table desktop et les cartes mobiles
  const renderRolePill = (user) => {
    const roleUi = ROLE_UI[user.role] || { label: user.role || '—', pill: 'cs-pill-outline' };
    return <span className={`cs-pill ${roleUi.pill}`}>{roleUi.label}</span>;
  };

  const renderStatusPill = (user) => {
    const isActive = isUserActive(user);
    return (
      <span className={`cs-pill shrink-0 ${isActive ? 'cs-pill-leaf' : 'cs-pill-red'}`}>
        {isActive && <span className="w-2 h-2 rounded-full bg-[#1F7A3A]" aria-hidden="true" />}
        {isActive ? 'Actif' : 'Suspendu'}
      </span>
    );
  };

  const filiereLabel = (user) =>
    user.filiereId ? FILIERE_LABELS[user.filiereId] || user.filiereId : <span className="text-[#5E5850]">—</span>;

  const renderAction = (user, block) => {
    if (user.role === ROLES.ADMIN) {
      return <span className="cs-pill cs-pill-outline">Protégé</span>;
    }
    const isActive = isUserActive(user);
    return (
      <button
        type="button"
        onClick={() => setSuspendModalUser(user)}
        className={`cs-btn ${block ? 'cs-btn-block' : 'cs-btn-sm'} ${isActive ? 'cs-btn-cream !text-[#DA0711]' : 'cs-btn-ink'}`}
      >
        {isActive ? 'Suspendre' : 'Réactiver'}
      </button>
    );
  };

  return (
    <div className="bg-[#FAF3E6] text-[#111111] min-h-screen">
      <div className="cs-container cs-page">
        {/* Header */}
        <header className="mb-10 lg:mb-12">
          <p className="cs-eyebrow mb-3">Console admin · Comptes</p>
          <h1 className="cs-display">Utilisateurs</h1>
          <p className="cs-lead mt-4 max-w-3xl">
            Supervision des rôles, des filières ESSECT et contrôle d'accès au système.
          </p>
        </header>

        {/* Toolbar: Tabs & Search Bar */}
        <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="-mx-1 px-1 overflow-x-auto scrollbar-none">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="!flex-nowrap sm:!flex-wrap" />
          </div>

          <div className="w-full xl:w-80 shrink-0">
            <label htmlFor="admin-users-search" className="sr-only">Filtrer par nom ou email</label>
            <input
              id="admin-users-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer par nom ou email..."
              className="cs-input"
            />
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="cs-card p-10 text-center">
            <p className="cs-h3">Aucun compte trouvé</p>
            <p className="cs-body text-[#5E5850] mt-2">Essayez un autre filtre ou une autre recherche.</p>
          </div>
        ) : (
          <>
            {/* Mobile (< md) : une carte empilée par compte */}
            <ul className="md:hidden flex flex-col gap-4">
              {filteredUsers.map((user) => (
                <li key={user.uid} className="cs-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[18px] font-semibold uppercase leading-tight line-clamp-2 min-w-0">
                      {user.displayName || '—'}
                    </h3>
                    {renderStatusPill(user)}
                  </div>
                  <p className="text-[15px] text-[#5E5850] mt-1 break-all">{user.email || '—'}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
                    <div>
                      <dt className="cs-label">Rôle</dt>
                      <dd className="mt-1">{renderRolePill(user)}</dd>
                    </div>
                    <div>
                      <dt className="cs-label">Filière</dt>
                      <dd className="font-semibold mt-1">{filiereLabel(user)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="cs-label">Inscrit le</dt>
                      <dd>{createdLabel(user)}</dd>
                    </div>
                  </dl>
                  <div className="mt-5">{renderAction(user, true)}</div>
                </li>
              ))}
            </ul>

            {/* Desktop (≥ md) : table */}
            <div className="hidden md:block cs-card p-2 overflow-x-auto">
              <table className="cs-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Filière</th>
                    <th>Statut</th>
                    <th>Inscrit le</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid}>
                      <td className="min-w-[200px]">
                        <span className="block text-[17px] font-semibold uppercase leading-tight line-clamp-2">
                          {user.displayName || '—'}
                        </span>
                        <span className="block text-[15px] text-[#5E5850] mt-1 break-all">{user.email || '—'}</span>
                      </td>
                      <td>{renderRolePill(user)}</td>
                      <td className="whitespace-nowrap font-semibold">{filiereLabel(user)}</td>
                      <td>{renderStatusPill(user)}</td>
                      <td className="whitespace-nowrap text-[#5E5850]">{createdLabel(user)}</td>
                      <td className="text-right">{renderAction(user, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Modal de Confirmation Suspension / Réactivation */}
        <Modal
          isOpen={Boolean(suspendModalUser)}
          onClose={() => { setSuspendModalUser(null); setSuspendReason(''); }}
          title={`Confirmer la ${isUserActive(suspendModalUser) ? 'suspension' : 'réactivation'} du compte`}
          description="Cette action modifiera immédiatement les droits d'accès de l'utilisateur."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setSuspendModalUser(null); setSuspendReason(''); }}
              >
                Annuler
              </Button>
              <Button
                variant={isUserActive(suspendModalUser) ? 'danger' : 'primary'}
                size="sm"
                isLoading={statusBusy}
                onClick={() => toggleUserStatus(suspendModalUser)}
              >
                Confirmer
              </Button>
            </>
          }
        >
          {suspendModalUser && (
            <p className="cs-body py-2">
              Êtes-vous certain de vouloir{' '}
              {isUserActive(suspendModalUser) ? 'suspendre temporairement' : 'réactiver'}{' '}
              le compte de{' '}
              <strong className="font-semibold text-[#DA0711]">{suspendModalUser.displayName}</strong> (
              {suspendModalUser.email}) ?
            </p>
          )}
          {suspendModalUser && isUserActive(suspendModalUser) && (
            <div className="pb-2">
              <label htmlFor="suspend-reason" className="cs-field-label">Motif de la suspension (obligatoire)</label>
              <textarea
                id="suspend-reason"
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="ex : Comportement abusif signalé, no-shows répétés…"
                className="cs-input"
              />
            </div>
          )}
        </Modal>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
