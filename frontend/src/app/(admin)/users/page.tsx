'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import UserTable from '@/components/admin/users/user-table';
import { User, UserRole, ProfileResponse, AllUsersResponse } from '@/lib/types';

export default function PageUsers() {
  const [profileData, setProfileData] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState('');
  const router = useRouter();

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      // Sincronización Políglota: Perfil actual y lista global
      const [myProfileRes, allUsersRes] = await Promise.all([
        fetchApi('/perfil') as Promise<ProfileResponse>,
        fetchApi('/profiles') as Promise<AllUsersResponse>
      ]);

      console.log("myProfileRes", myProfileRes)
      console.log("allUsersRes", allUsersRes)

      // 1. Mapeo del Perfil del Usuario Logueado
      if (myProfileRes?.success && myProfileRes.user) {
        const u = myProfileRes.user;
        setProfileData({
          id: u.sub || u.id, // Resolución del error de propiedad 'sub'
          email: u.email,
          name: u.name || u.email?.split('@')[0] || 'Usuario',
          role: (u.role as UserRole) || 'Viewer',
          project_slug: u.project_slug || 'Default',
          avatar_url: u.avatar_url || ''
        });
      }

      // 2. Mapeo de la Lista de Usuarios desde Neon DB
      if (allUsersRes?.success && Array.isArray(allUsersRes.profiles)) {
        const mappedUsers: User[] = allUsersRes.profiles.map((u: User) => ({
          id: u.id,
          email: u.email,
          role: (u.role as UserRole) || 'Viewer', // Rol real persistido
          name: u.name || u.email.split('@')[0],
          avatar_url: u.avatar_url || '',
          project_slug: u.project_slug || 'Default',
          updated_at: u.updated_at
        }));

        setAllUsers(mappedUsers);
      }
    } catch (error: unknown) {
      console.error('❌ Error en el flujo de datos:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('401') || errorMessage.includes('Sesión')) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentProject(window.location.hostname.split('.')[0] || 'Default');
    }
    loadData(true);
  }, [loadData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse text-muted-foreground">
          Conectando con Infraestructura Políglota...
        </p>
      </div>
    </div>
  );

  if (!profileData) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-foreground bg-background">
      <main className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant Manager</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Dominio: <span className="font-mono font-bold text-indigo-600 uppercase">{currentProject}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-secondary/30 p-3 rounded-xl border border-border/50">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {profileData.role}
              </span>
              <p className="text-xs font-medium mt-1">{profileData.email}</p>
            </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <UserTable
            initialUsers={allUsers}
            onUpdate={() => loadData(false)}
          />
        </section>
      </main>

      <style jsx global>{`
        :root {
          --primary: #6366f1;
        }
      `}</style>
    </div>
  );
}