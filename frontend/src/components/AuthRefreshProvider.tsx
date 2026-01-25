'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';

/**
 * 🔐 SISTEMA DE REFRESH AUTOMÁTICO DE TOKENS
 * 
 * Este componente mantiene sincronizada la sesión entre Supabase y tu backend.
 * 
 * Funcionamiento:
 * 1. Supabase maneja el refresh automático de sus propios tokens
 * 2. Cada vez que Supabase refresca, enviamos el nuevo token al backend
 * 3. El backend actualiza la cookie httpOnly con el nuevo token
 * 
 * Beneficios de seguridad:
 * - Tokens de corta duración (1 hora)
 * - El backend nunca almacena refresh tokens
 * - Renovación transparente para el usuario
 */

interface AuthRefreshContextType {
  refreshInProgress: boolean;
}

const AuthRefreshContext = createContext<AuthRefreshContextType>({
  refreshInProgress: false
});

export const useAuthRefresh = () => useContext(AuthRefreshContext);

export const AuthRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refreshInProgress = useRef(false);
  const lastRefreshTime = useRef<number>(0);

  /**
   * Sincroniza el nuevo access token con el backend
   */
  const syncTokenWithBackend = async (accessToken: string) => {
    // Evitar múltiples refreshes simultáneos
    if (refreshInProgress.current) {
      console.log('⏳ Refresh ya en progreso, saltando...');
      return;
    }

    // Rate limiting: No refrescar más de una vez por minuto
    const now = Date.now();
    if (now - lastRefreshTime.current < 60000) {
      console.log('⏱️ Refresh muy reciente, saltando...');
      return;
    }

    refreshInProgress.current = true;
    lastRefreshTime.current = now;

    try {
      // 🎯 CAMBIO CRÍTICO: Usar la ruta del proxy en lugar de URL externa
      // En producción: /api/v1/set-cookie (pasa por el proxy de Vercel)
      // En desarrollo: http://localhost:4000/api/set-cookie (directo al backend local)
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? '/api/v1'  // Usa el proxy configurado en next.config.js
        : 'http://localhost:4000/api';  // Desarrollo local

      console.log('🌐 Backend URL:', backendUrl);
      console.log('🔄 Sincronizando nuevo token con backend...');

      const response = await fetch(`${backendUrl}/set-cookie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // ✅ Permite envío/recepción de cookies
        body: JSON.stringify({
          access_token: accessToken
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondió con ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Token sincronizado exitosamente:', data);
    } catch (error: unknown) {
      console.error('❌ Error al sincronizar token:', error);

      // Si el backend no responde, no forzamos logout
      // El usuario puede seguir usando la app con Supabase
    } finally {
      refreshInProgress.current = false;
    }
  };

  useEffect(() => {
    console.log('🔐 Iniciando sistema de refresh automático...');
    console.log('🌍 Entorno:', process.env.NODE_ENV);

    /**
     * 📡 LISTENER DE EVENTOS DE SUPABASE
     * 
     * Supabase emite eventos cuando:
     * - El usuario hace login (SIGNED_IN)
     * - Se refresca el token automáticamente (TOKEN_REFRESHED)
     * - El usuario hace logout (SIGNED_OUT)
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 Evento de auth: ${event}`);

        switch (event) {
          case 'INITIAL_SESSION':
            // ⚠️ IMPORTANTE: Este evento ocurre al cargar la página
            // Solo sincronizar si hay una sesión activa
            if (session?.access_token) {
              console.log('🔍 Sesión inicial detectada, sincronizando...');
              await syncTokenWithBackend(session.access_token);
            } else {
              console.log('ℹ️ No hay sesión activa');
            }
            break;

          case 'SIGNED_IN':
            console.log('👋 Usuario inició sesión');
            if (session?.access_token) {
              await syncTokenWithBackend(session.access_token);
            }
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refrescado automáticamente');
            if (session?.access_token) {
              await syncTokenWithBackend(session.access_token);
            }
            break;

          case 'SIGNED_OUT':
            console.log('👋 Usuario cerró sesión');
            // Limpiar cookies del backend
            try {
              const backendUrl = process.env.NODE_ENV === 'production' 
                ? '/api/v1' 
                : 'http://localhost:4000/api';
              
              await fetch(`${backendUrl}/logout`, {
                method: 'POST',
                credentials: 'include'
              });
              console.log('✅ Sesión del backend limpiada');
            } catch (error) {
              console.warn('⚠️ No se pudo limpiar sesión del backend:', error);
            }
            break;

          case 'USER_UPDATED':
            console.log('👤 Usuario actualizado');
            break;

          default:
            console.log(`ℹ️ Evento no manejado: ${event}`);
            break;
        }
      }
    );

    // Cleanup: Desuscribirse cuando el componente se desmonte
    return () => {
      console.log('🛑 Deteniendo sistema de refresh...');
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthRefreshContext.Provider value={{ refreshInProgress: refreshInProgress.current }}>
      {children}
    </AuthRefreshContext.Provider>
  );
};