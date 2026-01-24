'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useTrackingReader } from '@/utils/useTrackingReader';

// Importamos los tipos externos
import { TrackingData, SupabaseError } from '@/types/auth';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const router = useRouter();

  // 🚨 1. LECTURA DE DATOS DE RASTREO
  const trackingInfo: TrackingData | null = useTrackingReader();

  useEffect(() => {
    if (trackingInfo) {
      console.log('✅ Datos de rastreo recibidos:', trackingInfo.sourceApp);
    }
  }, [trackingInfo]);

  // ----------------------------------------------------
  // Lógica para Login/Registro por Email/Contraseña
  // ----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    try {
      let authResponse: any;

      // --- PASO 1: AUTENTICACIÓN ---
      if (isLogin) {
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        authResponse = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'Viewer',
              source_app: trackingInfo?.sourceApp || 'direct',
            },
          },
        });
      }

      if (authResponse.error) throw authResponse.error;

      const session = authResponse.data.session;

      if (session) {
        // --- PASO 2: PERSISTENCIA EN TU BACKEND (PUERTO 4000) ---
        // Esto genera tus cookies HttpOnly seguras.
        await fetchApi('/set-cookie', {
          method: 'POST',
          body: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          } as any,
        });

        // 🚨 PASO 3: LIMPIEZA DE SESIÓN LOCAL (SUPABASE FRONTEND)
        // Cerramos la sesión en el cliente de Supabase inmediatamente.
        // Esto borra las cookies automáticas (sb-...) y deja solo tu authToken.
        await supabase.auth.signOut();

        // --- PASO 4: CIERRE O REDIRECCIÓN (POPUP CONTROL) ---
        if (window.opener) {
          const userRole = session.user?.user_metadata?.role || 'Viewer';
          const userName = session.user?.user_metadata?.full_name || 'Usuario';

          window.opener.postMessage({
            type: 'auth:success',
            payload: {
              name: userName, // Enviamos el nombre para que el Header lo vea rápido
              role: userRole
            }
          }, "*");

          window.close();
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      let errorMessage = 'Error en la autenticación. Revisa credenciales.';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as SupabaseError).message;
      }
      setError(errorMessage);
    }
  };

  // ----------------------------------------------------
  // LOGIN CON GOOGLE (OAuth)
  // ----------------------------------------------------
  const handleGoogleLogin = async (): Promise<void> => {
    setError(null);
    try {
      let redirectToUrl = `${window.location.origin}/auth/callback`;

      if (trackingInfo) {
        const jsonString = JSON.stringify(trackingInfo);
        const encodedData = encodeURIComponent(jsonString);
        redirectToUrl = `${redirectToUrl}?tracking=${encodedData}`;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToUrl,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error(err);
      let errorMessage = 'Error al iniciar sesión con Google.';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as SupabaseError).message;
      }
      setError(errorMessage);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-4 border rounded-lg shadow-sm bg-white max-w-md mx-auto"
    >
      <h2 className="text-xl font-bold text-center">
        {isLogin ? '🔑 Iniciar Sesión' : '📝 Crear Cuenta'}
      </h2>

      {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

      {trackingInfo && (
        <p className="text-emerald-600 text-xs text-center border border-emerald-100 bg-emerald-50 p-2 rounded">
          Redirigido desde: <span className="font-bold">{trackingInfo.sourceApp}</span>
        </p>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={!email || !password}
        className="bg-slate-900 text-white p-2 rounded font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {isLogin ? 'Entrar' : 'Registrar'}
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">O continuar con</span></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2 bg-[#DB4437] text-white p-2 rounded font-bold hover:bg-[#c5372c] transition-colors"
      >
        <span>Google 🚀</span>
      </button>

      <p
        onClick={() => setIsLogin(!isLogin)}
        className="cursor-pointer text-center text-xs text-slate-500 hover:underline mt-2"
      >
        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
      </p>
    </form>
  );
};

export default AuthForm;