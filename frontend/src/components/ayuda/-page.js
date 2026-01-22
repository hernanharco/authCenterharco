'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Llamada a Express (puerto 4000)
        const data = await fetchApi('/auth/perfil');

        // CORRECCIÓN: El backend envía { success: true, user: {...} }
        // Por lo tanto, usamos data.user
        if (data && data.user) {
          setProfileData(data.user);
        } else {
          throw new Error('No se encontraron datos de usuario');
        }
      } catch (error) {
        console.error('Error al obtener perfil:', error.message);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      router.push('/');
    }
  };

  const handleProfileUpdate = async (newEmail) => {
    try {
      const data = await fetchApi('/auth/profile', {
        method: 'PUT',
        body: { email: newEmail },
      });

      if (data.success) {
        setProfileData(data.user);
        alert('Perfil actualizado correctamente');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error.message);
      alert('Error al actualizar perfil');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold animate-pulse">
          Cargando datos del perfil...
        </p>
      </div>
    );

  // Si llegamos aquí y no hay datos, algo falló en la lógica
  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Panel de Control 🛡️
              </h1>
              <div className="flex space-x-3">
                {profileData.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200"
                  >
                    🛠️ Administración
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Mi Perfil</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium uppercase">
                {profileData.role}
              </span>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 mb-2">Correo Electrónico</p>
                <div className="flex items-center space-x-3">
                  <p className="text-lg font-medium text-gray-900">
                    {profileData.email}
                  </p>
                  <button
                    onClick={() => {
                      const newEmail = prompt(
                        'Nuevo correo electrónico:',
                        profileData.email,
                      );
                      if (newEmail && newEmail !== profileData.email) {
                        handleProfileUpdate(newEmail);
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                </div>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 mb-2">ID de Usuario</p>
                <p className="text-xs font-mono text-gray-400 bg-gray-50 p-2 rounded">
                  {profileData.id}
                </p>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 mb-2">Rol</p>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profileData.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {profileData.role === 'admin'
                      ? '👑 Administrador'
                      : '👤 Usuario'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {profileData.role === 'admin' && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push('/admin')}
                    className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <div className="font-medium">🛠️ Administrar Usuarios</div>
                    <div className="text-sm opacity-75">
                      Gestionar roles y perfiles
                    </div>
                  </button>
                  <button
                    onClick={() => window.open('/auth/admin', '_blank')}
                    className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="font-medium">🔐 Ver API Admin</div>
                    <div className="text-sm opacity-75">
                      Endpoint de administración
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
