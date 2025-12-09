// frontend/src/app/logout/page.tsx (MODIFICADO para CERRAR PESTAÑA)

"use client";

import React, { useEffect, useState } from "react";
// import { useRouter } from 'next/navigation'; // Ya no se necesita
import { supabase } from "@/utils/supabase";
import { fetchApi } from "@/utils/api";
const LogoutPage: React.FC = () => {
  // const router = useRouter(); // Ya no se necesita
  const [status, setStatus] = useState<string>("Cerrando sesión...");

  useEffect(() => {
    const handleLogout = async () => {
      // 1. Limpiar la sesión en el cliente (Supabase)
      setStatus("Limpiando sesión local...");
      await supabase.auth.signOut(); // 2. Llamar al Backend para que limpie las Cookies de Sesión

      setStatus("Notificando al servidor para borrar cookies...");
      try {
        await fetchApi("/auth/logout", {
          method: "POST",
          credentials: "include",
        }); // 3. CERRAR VENTANA (Acción Solicitada)
        setStatus("Sesión cerrada con éxito. Cerrando ventana..."); // 🚨 ADVERTENCIA: Esto cerrará la pestaña completa del navegador.
        if (window.opener) {
          window.opener.postMessage({ type: "auth:refresh" }, "*");
        }
        window.close();
      } catch (backendError) {
        console.error(
          "Error de servidor durante el logout, no se puede cerrar la ventana:",
          backendError
        ); // Si falla el backend, no podemos cerrar la ventana de forma segura
        setStatus(
          "Error de servidor. Por favor, cierre esta pestaña manualmente."
        ); // Aquí no se redirige, solo se muestra el error.
      }
    };

    handleLogout();
  }, []); // Lista de dependencias vacía, ya que no usamos router

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#0070f3" }}>👋 Adiós</h1>
      <p style={{ color: "#333" }}>{status}</p>
    </div>
  );
};

export default LogoutPage;
