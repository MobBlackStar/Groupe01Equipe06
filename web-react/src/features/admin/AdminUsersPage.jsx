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
  const [editModalUser, setEditModalUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ displayName: '', phone: '', filiereId: '', role: ROLES.STUDENT });
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
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

  function openEditModal(targetUser) {
    setEditModalUser(targetUser);
    setEditFormData({
      displayName: targetUser.displayName || '',
      phone: targetUser.phone || '',
      filiereId: targetUser.filiereId || '',
      role: targetUser.role || ROLES.STUDENT,
    });
  }

  async function handleSaveEdit(e) {
    if (e) e.preventDefault();
    if (!editModalUser) return;
    if (!editFormData.displayName.trim() || editFormData.displayName.trim().length < 2) {
      setToast({ type: 'error', message: 'Le nom doit comporter au moins 2 caractères.' });
      return;
    }

    setEditBusy(true);
    try {
      const payload = {
        displayName: editFormData.displayName.trim(),
        phone: editFormData.phone.trim() || null,
        filiereId: editFormData.filiereId || null,
        role: editFormData.role,
      };
      const res = await apiClient.patch(ENDPOINTS.ADMIN_USER(editModalUser.uid), payload);
      const updatedUser = res.data?.user || { ...editModalUser, ...payload };

      setUsers((prev) =>
        prev.map((u) => (u.uid === editModalUser.uid ? { ...u, ...updatedUser } : u))
      );

      setToast({
        type: 'success',
        message: `Profil de ${updatedUser.displayName} mis à jour avec succès.`,
      });
      setEditModalUser(null);
    } catch (err) {
      console.error('Erreur modification utilisateur:', err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || err?.response?.data?.error?.message || 'Erreur lors de la modification du compte.',
      });
    } finally {
      setEditBusy(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteModalUser) return;
    setDeleteBusy(true);
    try {
      await apiClient.delete(ENDPOINTS.ADMIN_USER(deleteModalUser.uid));
      setUsers((prev) => prev.filter((u) => u.uid !== deleteModalUser.uid));
      setToast({
        type: 'success',
        message: `Compte de ${deleteModalUser.displayName} supprimé avec succès.`,
      });
      setDeleteModalUser(null);
    } catch (err) {
      console.error('Erreur suppression utilisateur:', err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || err?.response?.data?.error?.message || 'Erreur lors de la suppression du compte.',
      });
    } finally {
      setDeleteBusy(false);
    }
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

  const filiereLabel = (user) => {
    if (user.role === ROLES.MERCHANT) {
      const storeName = user.storeName || user.merchantName;
      if (storeName) {
        return (
          <span className="cs-pill cs-pill-mustard !text-xs !py-0.5 !px-2 font-bold inline-flex items-center gap-1">
            <span>🏪</span> {storeName}
          </span>
        );
      }
      return (
        <span className="cs-pill cs-pill-outline !text-xs !py-0.5 !px-2 inline-flex items-center gap-1 text-[#5E5850]">
          <span>🏪</span> Sans boutique
        </span>
      );
    }
    if (user.role === ROLES.ADMIN) {
      return <span className="text-[#5E5850] font-normal">Administration</span>;
    }
    return user.filiereId ? FILIERE_LABELS[user.filiereId] || user.filiereId : <span className="text-[#5E5850]">—</span>;
  };

  const renderAction = (user, block) => {
    if (user.role === ROLES.ADMIN) {
      return <span className="cs-pill cs-pill-outline">Protégé</span>;
    }
    const isActive = isUserActive(user);
    if (block) {
      return (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => openEditModal(user)}
            className="cs-btn cs-btn-sm cs-btn-cream w-full"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => setSuspendModalUser(user)}
            className={`cs-btn cs-btn-sm w-full ${isActive ? 'cs-btn-cream !text-[#DA0711]' : 'cs-btn-ink'}`}
          >
            {isActive ? 'Suspendre' : 'Réactiver'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalUser(user)}
            className="cs-btn cs-btn-sm cs-btn-cream !text-[#DA0711] hover:!bg-[#DA0711] hover:!text-white w-full"
          >
            Supprimer
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => openEditModal(user)}
          className="cs-btn cs-btn-sm cs-btn-cream"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={() => setSuspendModalUser(user)}
          className={`cs-btn cs-btn-sm ${isActive ? 'cs-btn-cream !text-[#DA0711]' : 'cs-btn-ink'}`}
        >
          {isActive ? 'Suspendre' : 'Réactiver'}
        </button>
        <button
          type="button"
          onClick={() => setDeleteModalUser(user)}
          className="cs-btn cs-btn-sm cs-btn-cream !text-[#DA0711] hover:!bg-[#DA0711] hover:!text-white"
        >
          Supprimer
        </button>
      </div>
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
                      <dt className="cs-label">{user.role === ROLES.MERCHANT ? 'Établissement' : 'Filière'}</dt>
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
                    <th>Filière / Établissement</th>
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

        {/* Modal Modifier Utilisateur */}
        <Modal
          isOpen={Boolean(editModalUser)}
          onClose={() => !editBusy && setEditModalUser(null)}
          title="Modifier le compte utilisateur"
          description={`Modification des données administratives pour ${editModalUser?.email || ''}`}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={editBusy}
                onClick={() => setEditModalUser(null)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={editBusy}
                onClick={handleSaveEdit}
              >
                Enregistrer
              </Button>
            </>
          }
        >
          {editModalUser && (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
              <div>
                <label htmlFor="edit-user-name" className="cs-field-label">Nom complet</label>
                <input
                  id="edit-user-name"
                  type="text"
                  required
                  value={editFormData.displayName}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="cs-input"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label htmlFor="edit-user-phone" className="cs-field-label">Téléphone (+216...)</label>
                <input
                  id="edit-user-phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="cs-input"
                  placeholder="+21698000000"
                />
              </div>

              <div>
                <label htmlFor="edit-user-role" className="cs-field-label">Rôle</label>
                <select
                  id="edit-user-role"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="cs-input cursor-pointer"
                >
                  <option value={ROLES.STUDENT}>Étudiant ESSECT</option>
                  <option value={ROLES.MERCHANT}>Commerçant</option>
                  <option value={ROLES.ADMIN}>Administrateur</option>
                </select>
              </div>

              {editFormData.role === ROLES.STUDENT && (
                <div>
                  <label htmlFor="edit-user-filiere" className="cs-field-label">Filière ESSECT</label>
                  <select
                    id="edit-user-filiere"
                    value={editFormData.filiereId || ''}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, filiereId: e.target.value || null }))}
                    className="cs-input cursor-pointer"
                  >
                    <option value="">— Non renseignée —</option>
                    <option value={FILIERES.EBUSINESS_3A}>3A E-Business</option>
                    <option value={FILIERES.FINANCE}>Finance</option>
                    <option value={FILIERES.MARKETING}>Marketing</option>
                    <option value={FILIERES.GESTION}>Gestion</option>
                    <option value={FILIERES.COMPTABILITE}>Comptabilité</option>
                  </select>
                </div>
              )}
            </form>
          )}
        </Modal>

        {/* Modal Supprimer Utilisateur */}
        <Modal
          isOpen={Boolean(deleteModalUser)}
          onClose={() => !deleteBusy && setDeleteModalUser(null)}
          title="Supprimer définitivement l'utilisateur"
          description="Cette action est irréversible et supprimera le compte de la base de données."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={deleteBusy}
                onClick={() => setDeleteModalUser(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteBusy}
                onClick={handleDeleteUser}
              >
                Supprimer définitivement
              </Button>
            </>
          }
        >
          {deleteModalUser && (
            <div className="py-2 text-sm text-[#111111] space-y-2">
              <p>
                Êtes-vous certain de vouloir supprimer le compte de{' '}
                <strong className="font-semibold text-[#DA0711]">{deleteModalUser.displayName}</strong> ?
              </p>
              <p className="text-xs text-[#5E5850]">
                Email : <span className="font-mono">{deleteModalUser.email}</span> · Rôle : <span className="font-semibold">{deleteModalUser.role}</span>
              </p>
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
