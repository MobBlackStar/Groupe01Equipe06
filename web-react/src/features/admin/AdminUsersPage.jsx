// 💡 Concept & Analogie : Comme le registre des étudiants et des commerçants de la scolarité centrale de l'ESSECT, cette console permet de vérifier les comptes créés, de vérifier les filières et d'appliquer une suspension conservatoire si nécessaire.
// 🔄 Comparaison React / Flutter : En React, la table propose des filtres de rôles instantanés et des bascules de suspension ; en Flutter, la vue superviseur utilise des tuiles `ListTile` avec badges de statut.
// 🎯 À retenir pour la soutenance : "Cette interface d'administration permet de gérer le cycle de vie des comptes et d'auditer les filières universitaires pour le classement écologique inter-filières."

import React, { useState, useEffect } from 'react';
import { ROLES, USER_STATUS, FILIERES } from '@shared/constants.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
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
    createdAt: '16 Nov 2026',
  },
  {
    uid: 'u-02',
    displayName: 'Fedi Touati',
    email: 'fedi.touati@essect.u-tunis.tn',
    role: ROLES.ADMIN,
    filiereId: null,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 0,
    createdAt: '15 Nov 2026',
  },
  {
    uid: 'u-03',
    displayName: 'Gérant Baguette & Baguette',
    email: 'contact@baguette.tn',
    role: ROLES.MERCHANT,
    filiereId: null,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 0,
    createdAt: '16 Nov 2026',
  },
  {
    uid: 'u-04',
    displayName: 'Amine Karray',
    email: 'amine.karray@essect.u-tunis.tn',
    role: ROLES.STUDENT,
    filiereId: FILIERES.FINANCE,
    status: USER_STATUS.ACTIVE,
    ecoPoints: 120,
    createdAt: '16 Nov 2026',
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
    const nextStatus =
      targetUser.status === USER_STATUS.ACTIVE
        ? USER_STATUS.SUSPENDED
        : USER_STATUS.ACTIVE;

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
      message: `Le compte de ${targetUser.displayName} est désormais ${nextStatus}.`,
    });

    setSuspendModalUser(null);
  }

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#262A33]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Gestion des Comptes Utilisateurs</h1>
              <Badge variant="purple" size="md">CONSOLE ADMIN</Badge>
            </div>
            <p className="text-xs text-[#8A92A6] mt-1">
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
              className="w-full bg-[#161920] text-white text-xs rounded-xl px-3.5 py-2.5 border border-[#262A33] focus:border-[#CCFF00] outline-none"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-[#161920] border-[#262A33] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D0F12] text-[#8A92A6] uppercase tracking-wider border-b border-[#262A33]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Utilisateur</th>
                  <th className="py-3.5 px-4 font-bold">Rôle Système</th>
                  <th className="py-3.5 px-4 font-bold">Filière ESSECT</th>
                  <th className="py-3.5 px-4 font-bold">Statut</th>
                  <th className="py-3.5 px-4 font-bold">Inscrit le</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262A33]">
                {filteredUsers.map((user) => {
                  const isActive = user.status === USER_STATUS.ACTIVE;

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-4 font-bold text-white">
                        <div>
                          <span>{user.displayName}</span>
                          <span className="block text-[11px] text-[#8A92A6] font-normal font-mono">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            user.role === ROLES.ADMIN
                              ? 'purple'
                              : user.role === ROLES.MERCHANT
                              ? 'orange'
                              : 'lime'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[#8A92A6]">
                        {user.filiereId ? (
                          <span className="font-semibold text-gray-200">
                            {user.filiereId}
                          </span>
                        ) : (
                          <span className="text-[#8A92A6]/50">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={isActive ? 'lime' : 'red'}
                          size="sm"
                          dot={isActive}
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[#8A92A6]">
                        {user.createdAt}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {user.role !== ROLES.ADMIN ? (
                          <button
                            type="button"
                            onClick={() => setSuspendModalUser(user)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              isActive
                                ? 'bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/30 hover:bg-[#FF1744]/20'
                                : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30 hover:bg-[#CCFF00]/20'
                            }`}
                          >
                            {isActive ? 'Suspendre' : 'Réactiver'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8A92A6]">
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
        </Card>

        {/* Modal de Confirmation Suspension / Réactivation */}
        <Modal
          isOpen={Boolean(suspendModalUser)}
          onClose={() => setSuspendModalUser(null)}
          title={`Confirmer la ${
            suspendModalUser?.status === USER_STATUS.ACTIVE
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
                  suspendModalUser?.status === USER_STATUS.ACTIVE
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
            <p className="text-xs text-gray-300 py-2">
              Êtes-vous certain de vouloir{' '}
              {suspendModalUser.status === USER_STATUS.ACTIVE
                ? 'suspendre temporairement'
                : 'réactiver'}{' '}
              le compte de{' '}
              <strong className="text-white">{suspendModalUser.displayName}</strong> (
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
