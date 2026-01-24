import React, { useState } from 'react';
import { Shield, UserPlus, Globe, Building } from 'lucide-react';

export default function RoleManager() {
  const [newRoleName, setNewRoleName] = useState('');

  const roles = [
    { id: 1, name: 'SuperAdmin', icon: Globe, desc: 'Acceso total a todos los tenants.', color: 'text-purple-500' },
    { id: 2, name: 'Owner', icon: Building, desc: 'Dueño de la empresa contratante.', color: 'text-blue-500' },
    { id: 3, name: 'Admin', icon: Shield, desc: 'Gestor de equipo dentro del tenant.', color: 'text-green-500' },
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Jerarquía de Roles</h2>
          <p className="text-slate-500 text-sm">Define los niveles de acceso para tu plataforma SaaS.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <UserPlus size={18} />
          Crear Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-indigo-200 transition">
            <role.icon className={`${role.color} mb-3`} size={28} />
            <h3 className="font-semibold text-slate-800">{role.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{role.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}