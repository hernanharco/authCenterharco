// frontend/src/components/AuthForm.tsx (MODIFICADO)

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { fetchApi } from "../utils/api";
import { useRouter } from "next/navigation";
import { useTrackingReader } from "../utils/useTrackingReader";

// ===============================================
// INTERFACES
// ===============================================

interface SupabaseError {
  message: string;
}

interface AuthSessionResponse {
  error: SupabaseError | null;
  data: {
    session: {
      access_token: string;
      refresh_token: string;
    } | null;
  };
}

interface TrackingData {
  sourceApp: string;
  timestamp: string;
  status: string;
}

// ===============================================

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const router = useRouter();

  // 🚨 1. LECTURA DE DATOS DE RASTREO
  const trackingInfo: TrackingData | null = useTrackingReader();

  useEffect(() => {
    if (trackingInfo) {
      console.log("✅ Datos de rastreo recibidos:", trackingInfo.sourceApp);
    }
  }, [trackingInfo]);

  // ----------------------------------------------------
  // Lógica para Login/Registro por Email/Contraseña
  // (Sin cambios, ya maneja trackingInfo)
  // ----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    try {
      let authResponse: AuthSessionResponse;

      if (isLogin) {
        authResponse = (await supabase.auth.signInWithPassword({
          email,
          password,
        })) as AuthSessionResponse;
      } else {
        authResponse = (await supabase.auth.signUp({
          email,
          password,
        })) as AuthSessionResponse;
      }

      if (authResponse.error) {
        throw authResponse.error;
      }

      const session = authResponse.data.session;
      const accessToken: string | undefined = session?.access_token;
      const refreshToken: string | undefined = session?.refresh_token;

      if (accessToken && refreshToken) {
        await fetchApi("/auth/set-cookie", {
          method: "POST",
          body: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        });

        // 🚨 LÓGICA DE CIERRE DE VENTANA / REDIRECCIÓN (para Email/Password)
        //console.log("estoy en la parte if tranckingInfo: ", trackingInfo);
        if (trackingInfo) {
          if (window.opener) {
            window.opener.postMessage({ type: "auth:refresh" }, "*");
          }
          window.close();
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      let errorMessage = "Error en la autenticación. Revisa credenciales.";
      if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = (err as SupabaseError).message;
      }
      setError(errorMessage);
    }
  };

  // ----------------------------------------------------
  // FUNCIÓN NUEVA: LOGIN CON GOOGLE (OAuth) (MODIFICADO)
  // ----------------------------------------------------
  const handleGoogleLogin = async (): Promise<void> => {
    setError(null);
    try {
      // 🚨 1. Preparamos el URL de redirección base
      let redirectToUrl = `${window.location.origin}/auth/callback`;

      // 🚨 2. Si existe trackingInfo, lo añadimos a la URL
      if (trackingInfo) {
        // Debemos recodificar la data para pasarla a la URL de redirección
        const jsonString: string = JSON.stringify(trackingInfo);
        const encodedData: string = encodeURIComponent(jsonString);

        // Adjuntamos el parámetro 'tracking' al redirectTo
        redirectToUrl = `${redirectToUrl}?tracking=${encodedData}`;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectToUrl, // Usamos la URL modificada
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error(err);
      let errorMessage = "Error al iniciar sesión con Google.";
      if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = (err as SupabaseError).message;
      }
      setError(errorMessage);
    }
  };

  return (
    // ... (JSX sin cambios)
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "15px" }}
    >
      <h2>{isLogin ? "🔑 Iniciar Sesión" : "📝 Crear Cuenta"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {trackingInfo && (
        <p
          style={{
            color: "green",
            fontSize: "small",
            textAlign: "center",
            border: "1px solid #ccc",
            padding: "5px",
          }}
        >
          Redirigido desde: **{trackingInfo.sourceApp}**
        </p>
      )}

      <input
        type="email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        placeholder="Contraseña"
        required
      />

      <button type="submit" disabled={!email || !password}>
        {isLogin ? "Entrar" : "Registrar"}
      </button>

      <p style={{ textAlign: "center" }}>— O —</p>

      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{
          backgroundColor: "#DB4437",
          color: "white",
          border: "none",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        Iniciar Sesión con Google 🚀
      </button>

      <p
        onClick={() => setIsLogin(!isLogin)}
        style={{ cursor: "pointer", textAlign: "center", fontSize: "small" }}
      >
        {isLogin
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia Sesión"}
      </p>
    </form>
  );
};

export default AuthForm;
