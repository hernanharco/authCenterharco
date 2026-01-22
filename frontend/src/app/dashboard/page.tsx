'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import UserTable from '@/components/dashboard/user-table';
import { User } from '@/lib/types'; // Importamos la interfaz unificada

export default function Dashboard() {
  // CORRECCIÓN: Usamos 'User' en lugar de 'UserProfile'
  const [profileData, setProfileData] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Lógica Multitenant para detectar el proyecto
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const projectName = hostname.split('.')[0] || 'Default';
      setCurrentProject(projectName);
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Obtener perfil del usuario actual
        const myProfile = await fetchApi('/auth/perfil');
        if (myProfile?.user) {
          // Mapeo preventivo para el perfil
          setProfileData({
            ...myProfile.user,
            name: myProfile.user.name || myProfile.user.email?.split('@')[0] || 'Usuario',
            project_slug: myProfile.user.project_slug || 'default',
            role: myProfile.user.role || 'Viewer'
          });
        }

        // 2. Obtener lista completa de usuarios
        const allUsersData = await fetchApi('/auth/admin/all-users');
        if (allUsersData?.data) {
          // MAPEO CRÍTICO: Transformamos la data cruda al tipo 'User' que pide la tabla
          const mappedUsers: User[] = allUsersData.data.map((u: any) => ({
            id: u.id,
            email: u.email,
            // Extraemos de metadata si existe, si no, generamos fallbacks
            name: u.user_metadata?.full_name || u.email.split('@')[0],
            avatar_url: u.user_metadata?.avatar_url || '',
            project_slug: u.user_metadata?.project_slug || 'Default',
            role: (u.app_metadata?.role as any) || 'Viewer'
          }));
          
          setAllUsers(mappedUsers);
        }
      } catch (error: any) {
        console.error('Error cargando Dashboard:', error.message);
        if (!profileData) router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  // ... (handleLogout y handleProfileUpdate se mantienen igual)

  const handleLogout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      router.push('/');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg font-semibold animate-pulse text-primary">Cargando datos...</p>
    </div>
  );

  if (!profileData) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-foreground bg-background">
      <main className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant User Manager</h1>
            <p className="text-muted-foreground mt-1">
              Managing users for project: <span className="font-semibold text-primary">{currentProject}</span>
            </p>
          </div>
        </header>

        {/* Ahora 'allUsers' tiene el tipo correcto y todas las propiedades requeridas */}
        <UserTable initialUsers={allUsers} currentProject={currentProject} />

        <button
          onClick={handleLogout}
          className="mt-8 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
        >
          Cerrar Sesión
        </button>
      </main>
    </div>
  );
}