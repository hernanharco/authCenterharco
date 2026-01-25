'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Cambiamos next/router por next/navigation
import { LayoutDashboard, ShieldCheck, Users, Settings, LogOut, Building2 } from 'lucide-react';
import { fetchApi } from '@/utils/api';

interface SidebarProps {
  userRole: 'SuperAdmin' | 'Owner' | 'Viewer' | 'Admin' | 'Editor'; // Actualizado para incluir tus roles reales
  projectName: string;
}

export default function Sidebar({ userRole, projectName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter(); // Inicializamos el router del App Router

  const menuItems = [
    { id: 'dash', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['SuperAdmin', 'Owner', 'Viewer', 'Admin', 'Editor'] },
    { id: 'users', label: 'Usuarios', icon: Users, href: '/users', roles: ['SuperAdmin', 'Owner', 'Admin'] },
    { id: 'roles', label: 'Roles SaaS', icon: ShieldCheck, href: '/roles', roles: ['SuperAdmin'] },
    { id: 'tenant', label: 'Empresa', icon: Building2, href: '/empresa', roles: ['Owner'] },
    { id: 'settings', label: 'Ajustes', icon: Settings, href: '/ajustes', roles: ['SuperAdmin', 'Owner', 'Admin'] },
  ];

  const handleLogout = async () => {
    try {
      // Intentamos con el prefijo del módulo de autenticación
      await fetchApi('/logout', { method: 'POST' });
    } catch {
      console.warn('No se encontró endpoint de logout, limpiando cliente...');
    } finally {
      // Siempre redirigir al finalizar
      router.push('/');
      router.refresh();
    }
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
        <div className="p-1.5 bg-indigo-600 rounded-lg">
          <ShieldCheck className="text-white" size={20} />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">NeonSaaS</span>
      </div>

      {/* Tenant Indicator */}
      <div className="px-4 py-4">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <p className="text-[10px] uppercase font-bold text-slate-500">Tenant</p>
          <p className="text-sm text-indigo-400 font-semibold truncate uppercase">{projectName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const hasAccess = item.roles.includes(userRole);
          const isActive = pathname === item.href;

          if (!hasAccess) return null;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <item.icon
                size={20}
                className={isActive ? "text-white" : "group-hover:text-indigo-400"}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase">
            {userRole ? userRole[0] : 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{userRole}</p>
            <button
              onClick={handleLogout}
              className="text-[10px] text-red-500 hover:text-red-400 font-medium transition-colors flex items-center gap-1"
            >
              <LogOut size={10} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}