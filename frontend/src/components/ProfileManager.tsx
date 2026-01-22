'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/utils/api';

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const ProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await fetchApi('/auth/profiles');
      setProfiles(data.profiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    if (!newRole || !['user', 'admin', 'moderator'].includes(newRole)) {
      setError('Rol inválido. Usa: user, admin, o moderator');
      return;
    }

    try {
      await fetchApi(`/auth/profiles/${userId}/role`, {
        method: 'PUT',
        body: { role: newRole },
      });

      setProfiles(
        profiles.map((profile: Profile) =>
          profile.id === userId ? { ...profile, role: newRole } : profile,
        ),
      );
      setEditingRole(null);
      setNewRole('');
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.',
      )
    ) {
      return;
    }

    try {
      await fetchApi(`/auth/profiles/${userId}`, {
        method: 'DELETE',
      });

      setProfiles(profiles.filter((profile: Profile) => profile.id !== userId));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg font-semibold animate-pulse">
          Cargando perfiles...
        </div>
      </div>
    );
  }

  if (error && profiles.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Administración de Perfiles
        </h2>
        <button
          onClick={fetchProfiles}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Profiles Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actualización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {profile.email}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {profile.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRole === profile.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() =>
                            handleRoleChange(profile.id, profile.role)
                          }
                          className="text-green-600 hover:text-green-800"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingRole(null);
                            setNewRole('');
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(profile.role)}`}
                        >
                          {profile.role}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRole(profile.id);
                            setNewRole(profile.role);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(profile.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(profile.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(profile.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay perfiles para mostrar
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Usuarios</h3>
          <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Administradores</h3>
          <p className="text-2xl font-bold text-red-600">
            {profiles.filter((p) => p.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Usuarios Normales
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {profiles.filter((p) => p.role === 'user').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
