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

export default function AdminUsersPage() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [suspendModalUser, setSuspendModalUser] = useState(null);
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

    try {
      await apiClient.patch(ENDPOINTS.ADMIN_USER_STATUS(targetUser.uid), {
        status: nextStatus,
        statusReason: nextStatus === USER_STATUS.SUSPENDED ? 'Suspension administrative temporaire' : 'Compte réactivé par l administration',
      });
    } catch (err) {
      console.warn('API toggle status fallback:', err.message);
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

    setSuspendModalUser(null);
  }

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#111111]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-anton uppercase tracking-wide text-[#111111]">
                Gestion des Comptes Utilisateurs
              </h1>
              <Badge variant="griddle" size="md">CONSOLE ADMIN</Badge>
            </div>
            <p className="text-xs text-[#666] mt-1 font-medium">
              Supervision des rôles, filières ESSECT et contrôle d'accès au système.
            </p>
          </div>
        </div>

        {/* Toolbar: Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer par nom ou email..."
              className="w-full bg-white text-[#111111] text-xs rounded-full px-4 py-2.5 border border-[#111111]/10 shadow-sm focus:ring-1 focus:ring-[#DA0711] outline-none font-medium"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] text-white uppercase tracking-wider font-anton text-xs">
                <tr>
                  <th className="py-3.5 px-4">Utilisateur</th>
                  <th className="py-3.5 px-4">Rôle Système</th>
                  <th className="py-3.5 px-4">Filière ESSECT</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Inscrit le</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/8">
                {filteredUsers.map((user) => {
                  const isActive =
                    user.status === USER_STATUS.ACTIVE ||
                    user.status === 'ACTIVE' ||
                    user.status === 'ACTIF' ||
                    user.status === 'active' ||
                    !user.status;

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="py-4 px-4 font-bold text-[#111111]">
                        <div>
                          <span className="font-bold text-sm">{user.displayName}</span>
                          <span className="block text-[11px] text-[#666] font-normal font-mono">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            user.role === ROLES.ADMIN
                              ? 'griddle'
                              : user.role === ROLES.MERCHANT
                              ? 'yellow'
                              : 'green'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[#555]">
                        {user.filiereId ? (
                          <span className="font-bold text-[#111111]">
                            {user.filiereId}
                          </span>
                        ) : (
                          <span className="text-[#999] font-mono">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={isActive ? 'green' : 'red'}
                          size="sm"
                          dot={isActive}
                        >
                          {isActive ? 'ACTIF' : 'SUSPENDU'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[#666] font-mono">
                        {user.createdAt?.includes('T') ? formatTunisDate(user.createdAt) : user.createdAt}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {user.role !== ROLES.ADMIN ? (
                          <button
                            type="button"
                            onClick={() => setSuspendModalUser(user)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-anton uppercase tracking-wider transition-all shadow-sm ${
                              isActive
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {isActive ? 'Suspendre' : 'Réactiver'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#888] font-mono font-medium">
                            Protégé
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Confirmation Suspension / Réactivation */}
        <Modal
          isOpen={Boolean(suspendModalUser)}
          onClose={() => setSuspendModalUser(null)}
          title={`Confirmer la ${
            suspendModalUser?.status === USER_STATUS.ACTIVE || suspendModalUser?.status === 'ACTIVE' || suspendModalUser?.status === 'ACTIF' || suspendModalUser?.status === 'active' || !suspendModalUser?.status
              ? 'suspension'
              : 'réactivation'
          } du compte`}
          description="Cette action modifiera immédiatement les droits d'accès de l'utilisateur."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSuspendModalUser(null)}
              >
                Annuler
              </Button>
              <Button
                variant={
                  suspendModalUser?.status === USER_STATUS.ACTIVE || suspendModalUser?.status === 'ACTIVE' || suspendModalUser?.status === 'ACTIF' || suspendModalUser?.status === 'active' || !suspendModalUser?.status
                    ? 'danger'
                    : 'primary'
                }
                size="sm"
                onClick={() => toggleUserStatus(suspendModalUser)}
              >
                Confirmer
              </Button>
            </>
          }
        >
          {suspendModalUser && (
            <p className="text-xs text-[#111111] py-2 font-medium">
              Êtes-vous certain de vouloir{' '}
              {suspendModalUser.status === USER_STATUS.ACTIVE || suspendModalUser.status === 'ACTIVE' || suspendModalUser.status === 'ACTIF' || suspendModalUser.status === 'active' || !suspendModalUser.status
                ? 'suspendre temporairement'
                : 'réactiver'}{' '}
              le compte de{' '}
              <strong className="text-[#DA0711]">{suspendModalUser.displayName}</strong> (
              {suspendModalUser.email}) ?
            </p>
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
