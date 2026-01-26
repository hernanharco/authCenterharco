"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter, useSearchParams } from "next/navigation";

const AuthHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>("Iniciando procesamiento...");
  const [error, setError] = useState<boolean>(false);

  // ✅ Lógica auto-gestionada en AuthHandler.tsx
  const getBackendUrl = () => {
    // Si estamos en el navegador, usamos la ruta relativa para activar el Proxy de next.config
    // Esto funcionará tanto en localhost:3000 como en auth-centerharco.vercel.app
    if (typeof window !== "undefined") {
      return "/api/v1/set-cookie";
    }

    // Fallback de seguridad (servidor)
    return (process.env.NEXT_PUBLIC_EXPRESS_URL || "/api/v1") + "/set-cookie";
  };

  const baseUrl = getBackendUrl();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStatus("Obteniendo sesión de Supabase...");

        // 1. Validamos que el SDK de Supabase tenga la sesión activa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error("❌ Sesión de Supabase no encontrada:", sessionError);
          router.push("/?error=no_session");
          return;
        }

        setStatus("Protegiendo tu sesión de forma segura...");

        // ✅ SOLUCIÓN: NO ENVIAR REFRESH TOKEN AL BACKEND
        // El backend solo necesita el access_token para crear la sesión inicial
        // El refresh lo manejará el propio SDK de Supabase del lado del cliente
        //const baseUrl = (process.env.NEXT_PUBLIC_EXPRESS_URL || "/api/v1").replace(/\/$/, "");
        const backendUrl = `${baseUrl}/set-cookie`;

        console.log("🚀 Enviando token a:", backendUrl);

        // 2. Solo enviamos el access_token
        const response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // VITAL: Permite recibir cookies de otro dominio
          body: JSON.stringify({
            access_token: session.access_token,
            // Enviamos el refresh por si el backend decide usarlo a futuro
            refresh_token: session.refresh_token
          }),
        });

        if (!response.ok) {
          const errorMsg = response.status === 404
            ? `Ruta no encontrada (404) en ${backendUrl}`
            : `Error en el servidor: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        // 3. NO cerramos la sesión de Supabase aquí
        // Dejamos que Supabase maneje el refresh automáticamente

        setStatus("Sincronizando con la aplicación...");

        const userRole = session.user?.app_metadata?.role || 'Viewer';
        const userName = session.user?.user_metadata?.full_name || 'Usuario';

        // 4. Finalización del flujo
        if (window.opener) {
          // Intentamos obtener el origen del redirect_to, si no, usamos "*" para desarrollo
          // o capturamos el origen del opener de forma segura
          const redirectTo = searchParams.get('redirect_to');
          let targetOrigin = "*"; // Por defecto en desarrollo para evitar bloqueos

          if (redirectTo) {
            try {
              targetOrigin = new URL(redirectTo).origin;
            } catch {
              targetOrigin = "*";
            }
          }

          window.opener.postMessage({
            type: 'auth:success',
            payload: { name: userName, role: userRole }
          }, targetOrigin); // 👈 targetOrigin ahora será el de la app de Tapicería

          // Un pequeño delay antes de cerrar para asegurar que el mensaje salió
          setTimeout(() => window.close(), 100);
        } else {
          setTimeout(() => router.push("/dashboard"), 800);
        }

      } catch (err: unknown) {
        console.error("🔥 Error en el flujo de autenticación:", err);
        setError(true);
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className={`p-8 bg-white shadow-xl rounded-2xl text-center space-y-4 border-2 ${error ? 'border-red-500' : 'border-slate-100'}`}>
      {!error ? (
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      ) : (
        <div className="text-4xl">⚠️</div>
      )}
      <h1 className="text-xl font-bold text-slate-800">
        {error ? "Fallo de Conexión" : "Finalizando Login"}
      </h1>
      <p className={`text-sm ${error ? 'text-red-600' : 'text-slate-500'}`}>{status}</p>

      {error && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

const AuthCallbackPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <Suspense fallback={<div className="text-slate-400">Cargando módulos de seguridad...</div>}>
        <AuthHandler />
      </Suspense>
    </div>
  );
};

export default AuthCallbackPage;