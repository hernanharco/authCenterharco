export default function RolesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Jerarquía de Roles</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Permisos</h3>
        <p className="text-slate-600 mb-6">Define qué puede hacer cada nivel de acceso en la plataforma.</p>
        {/* Aquí iría el componente de RoleManager que mencionamos antes */}
      </div>
    </div>
  );
}