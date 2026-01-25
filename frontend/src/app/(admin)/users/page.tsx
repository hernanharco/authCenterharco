'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import UserTable from '@/components/admin/users/user-table';
import { User, UserRole } from '@/lib/types';

export default function PageUsers() {
  const [profileData, setProfileData] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState('');
  const router = useRouter();

  // Función para cargar o refrescar datos
  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const [myProfile, allUsersData] = await Promise.all([
        fetchApi('/perfil'),
        fetchApi('/admin/all-users')
      ]);

      console.log('myProfile:', myProfile);
      console.log('allUsersData:', allUsersData);

      if (myProfile?.user) {
        setProfileData({
          ...myProfile.user,
          name: myProfile.user.name || myProfile.user.email?.split('@')[0] || 'Usuario',
          role: (myProfile.user.role as UserRole) || 'Viewer'
        });
      }

      if (allUsersData?.data) {
        const mappedUsers: User[] = allUsersData.data.map((u: any) => ({
          id: u.id,
          email: u.email,
          // IMPORTANTE: Priorizamos el rol de user_metadata que actualizamos en el PATCH
          role: (u.user_metadata?.role as UserRole) || (u.role as UserRole) || 'Viewer',
          name: u.user_metadata?.full_name || u.name || u.email.split('@')[0],
          avatar_url: u.user_metadata?.avatar_url || u.picture || '',
          project_slug: u.project_slug || u.user_metadata?.project_slug || 'Default',
        }));

        setAllUsers(mappedUsers);
      }
    } catch (error: unknown) {
      console.error('Error cargando PageUsers:', error);

      // 1. Extraemos el mensaje de forma segura
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 2. Ahora sí podemos usar .includes() sobre un string garantizado
      if (errorMessage.includes('Sesión')) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setCurrentProject(hostname.split('.')[0] || 'Default');
    }
    loadData(true);
  }, [loadData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Sincronizando con Supabase...</p>
      </div>
    </div>
  );

  if (!profileData) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-foreground bg-background">
      <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant User Manager</h1>
            <p className="text-muted-foreground mt-1">
              Proyecto: <span className="font-semibold text-indigo-600 uppercase">{currentProject}</span>
            </p>
          </div>
        </header>

        {/* Pasamos loadData como prop onUpdate */}
        <UserTable
          initialUsers={allUsers}
          currentProject={currentProject}
          onUpdate={() => loadData(false)}
        />
      </main>
    </div>
  );
}