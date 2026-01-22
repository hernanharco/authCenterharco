"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { fetchApi } from "@/utils/api";
import { useRouter } from "next/navigation";

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Iniciando procesamiento...");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStatus("Obteniendo sesión de Supabase...");
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error("Error de sesión:", error);
          router.push("/");
          return;
        }

        // 🚀 SOLUCIÓN A TU IMAGEN: LIMPIEZA VISUAL INMEDIATA
        // Reemplaza la URL con tokens (#access_token=...) por una URL limpia.
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }

        setStatus("Protegiendo tu sesión de forma segura...");

        // Enviamos los tokens por el BODY (Invisible en la URL)
        await fetchApi("/set-cookie", {
          method: "POST",
          body: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          },
        });

        setStatus("Éxito. Entrando al Dashboard...");
        router.push("/dashboard");
      } catch (err) {
        console.error("Error en el flujo de autenticación:", err);
        router.push("/");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white shadow-xl rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h1 className="text-xl font-bold text-slate-800">Finalizando Login</h1>
        <p className="text-slate-500">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;