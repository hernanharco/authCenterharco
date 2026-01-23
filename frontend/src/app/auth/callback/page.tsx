"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/utils/supabase";
import { fetchApi } from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";

// Sub-componente para manejar la lógica con hooks de búsqueda
const AuthHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>("Iniciando procesamiento...");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStatus("Obteniendo sesión de Supabase...");
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          router.push("/");
          return;
        }

        setStatus("Protegiendo tu sesión de forma segura...");

        // Sincronizamos cookies con tu Backend de Express (Puerto 4000)
        await fetchApi("/set-cookie", {
          method: "POST",
          body: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          } as any,
        });

        setStatus("Sincronizando con la aplicación...");

        const userRole = session.user?.user_metadata?.role || 'Viewer';

        if (window.opener) {
          // 🚨 SEGURIDAD: Obtenemos el origin desde los parámetros de la URL
          // Si no existe, usamos "*" pero lo ideal es el origin de la tapicería
          const redirectTo = searchParams.get('redirect_to');
          const targetOrigin = redirectTo ? new URL(redirectTo).origin : "*";

          window.opener.postMessage({
            type: 'auth:success',
            payload: {
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              role: userRole
            }
          }, targetOrigin); 

          window.close();
        } else {
          router.push("/dashboard");
        }

      } catch (err) {
        console.error("Error en el flujo:", err);
        router.push("/?error=callback_error");
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="p-8 bg-white shadow-xl rounded-2xl text-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <h1 className="text-xl font-bold text-slate-800">Finalizando Login</h1>
      <p className="text-slate-500">{status}</p>
      <p className="text-[10px] text-slate-400 italic">Esta ventana se cerrará automáticamente</p>
    </div>
  );
};

// Componente principal con Suspense (Requerido por Next.js para useSearchParams)
const AuthCallbackPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Suspense fallback={<div>Cargando...</div>}>
        <AuthHandler />
      </Suspense>
    </div>
  );
};

export default AuthCallbackPage;