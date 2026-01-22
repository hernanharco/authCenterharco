'use client';

import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar con lógica de roles */}
      <Sidebar userRole="SuperAdmin" projectName="Default_Tenant" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shrink-0">
          <h2 className="font-semibold text-slate-700">Sistema de Gestión Multi-tenant</h2>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}