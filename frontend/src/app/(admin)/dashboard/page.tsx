"use client";

import { useEffect, useState } from "react";
import { Users, ShieldCheck, Activity, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { fetchApi } from "@/utils/api";

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalRoles: 0,
    apiUsage: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Hacemos una única petición para obtener todos los perfiles
        const data = await fetchApi("/profiles", {
          method: "GET",
          credentials: "include",
        });

        if (data && data.success && data.profiles) {
          // 1. Usuarios Totales
          const count = data.profiles.length;

          // 2. Roles Únicos
          const uniqueRoles = new Set(data.profiles.map((p: any) => p.role)).size;

          // 3. Simulación de Uso de API (Aquí ya tenemos acceso a 'data')
          // En el futuro, esto podría venir de data.usage si tu backend lo envía
          const simulatedCalls = 450; 
          const limit = 1000;
          const usagePercentage = (simulatedCalls / limit) * 100;

          setStatsData({
            totalUsers: count,
            totalRoles: uniqueRoles,
            apiUsage: usagePercentage,
            isLoading: false
          });
        }
      } catch (error) {
        console.error("Error en el dashboard:", error);
        setStatsData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: "Usuarios Totales", 
      value: statsData.isLoading ? "..." : statsData.totalUsers.toString(), 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50", 
      trend: statsData.isLoading ? "Cargando..." : `+${statsData.totalUsers}` 
    },
    { 
      label: "Roles Definidos", 
      value: statsData.isLoading ? "..." : statsData.totalRoles.toString(), 
      icon: ShieldCheck, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50", 
      trend: "Admin/Editor" 
    },
    { 
      label: "Uso de API (Mes)", 
      value: statsData.isLoading ? "..." : `${statsData.apiUsage}%`, 
      icon: Activity, 
      color: statsData.apiUsage > 90 ? "text-red-600" : "text-emerald-600", 
      bg: statsData.apiUsage > 90 ? "bg-red-50" : "bg-emerald-50", 
      trend: "Límite: 1k reqs" 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resumen de Actividad</h1>
          <p className="text-slate-500 text-sm font-medium">Infraestructura multi-tenant gestionada por Neon.</p>
        </div>
        <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm gap-2">
          <Zap size={14} className="text-amber-500 fill-amber-500" />
          <span>Logs del Sistema</span>
        </Button>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Sección de Acciones y Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200/60 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 text-lg">Acciones de Gestión</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="secondary" className="h-auto p-4 flex flex-col items-start gap-1 text-left hover:shadow-md transition-all">
              <span className="font-bold">Nuevo Usuario</span>
              <span className="text-[10px] opacity-70">Registrar miembro en el Tenant</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-1 text-left hover:bg-slate-50 hover:shadow-md transition-all">
              <span className="font-bold">Configurar Roles</span>
              <span className="text-[10px] opacity-70">Modificar políticas de acceso</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-slate-200/60 shadow-sm flex flex-col items-center justify-center border-dashed border-2 bg-slate-50/30">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            {statsData.isLoading ? (
              <Loader2 className="text-indigo-500 animate-spin" size={24} />
            ) : (
              <Activity className="text-indigo-500 animate-pulse" size={24} />
            )}
          </div>
          <p className="text-slate-600 text-sm font-bold">Estado de Supabase DB</p>
          <p className="text-slate-400 text-xs text-center mt-1">
            {statsData.isLoading ? "Sincronizando métricas..." : `Conexión activa: ${statsData.totalUsers} usuarios.`}
          </p>
        </Card>
      </div>
    </div>
  );
}