'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/utils/api';
import ProfileManager from '@/components/ProfileManager';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const data = await fetchApi('/auth/me');

      if (!data.user || data.user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Error al verificar acceso de administrador:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold animate-pulse">
          Verificando acceso de administrador...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-sm text-gray-500">
                Administrando como: {user.email}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Volver al Dashboard
              </button>
              <button
                onClick={async () => {
                  await fetchApi('/auth/logout', { method: 'POST' });
                  router.push('/');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ProfileManager />
        </div>
      </div>
    </div>
  );
}
