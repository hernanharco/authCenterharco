import { Settings, Database } from "lucide-react";

export default function AjustesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajustes del Sistema</h1>
        <p className="text-slate-500">Configura las preferencias globales de tu plataforma Multi-tenant.</p>
      </div>

      <div className="grid gap-6">
        {/* Sección Perfil del Tenant */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">General</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Organización</label>
              <input 
                type="text" 
                placeholder="Ej. Harco SaaS"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dominio Personalizado</label>
              <input 
                type="text" 
                placeholder="harco.saas.com"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Sección de Conectividad (Relacionado con tu Backend en Spring) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">Conexión Neon / DB</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Estado de la persistencia: <span className="text-emerald-600 font-medium">Conectado (ddl-auto: update)</span>
          </p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Ver variables de entorno (DATABASE_URL)
          </button>
        </div>

        {/* Botón de Guardar Cambios */}
        <div className="flex justify-end">
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-all shadow-md active:scale-95">
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}