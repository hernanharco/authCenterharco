// frontend/src/components/AuthForm.js

"use client"; // CRÍTICO: Necesario para usar hooks de React (useState, useRouter)

import React, { useState } from "react";
import { supabase } from "../utils/supabase"; // Ajusta la ruta si es necesario
import { fetchApi } from "../utils/api"; // Ajusta la ruta si es necesario
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // ----------------------------------------------------
  // Lógica para Login/Registro por Email/Contraseña
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let authResponse;
      if (isLogin) {
        // 1. Login con Supabase
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        // 1. Registro con Supabase
        authResponse = await supabase.auth.signUp({ email, password });
      }

      if (authResponse.error) {
        throw authResponse.error;
      }

      // 2. Extraer ambos tokens
      const accessToken = authResponse.data.session?.access_token;
      const refreshToken = authResponse.data.session?.refresh_token; // <-- ¡NUEVO!

      if (accessToken && refreshToken) {
        // 3. ¡CRÍTICO!: Intercambio de Tokens con Express
        await fetchApi("/auth/set-cookie", {
          method: "POST",
          // ¡Ahora enviamos AMBOS TOKENS!
          body: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        });

        // 4. Redirigir al dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Error en la autenticación. Revisa credenciales."
      );
    }
  };

  // ----------------------------------------------------
  // FUNCIÓN NUEVA: LOGIN CON GOOGLE (OAuth)
  // ----------------------------------------------------
  const handleGoogleLogin = async () => {
    setError(null);
    try {
      // Inicia el flujo de OAuth, redirigiendo al usuario a Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // La URL a donde Supabase redirigirá al usuario DESPUÉS de Google
          // Luego, el JWT será manejado por la página de callback.
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Nota: No se redirige aquí, la función signInWithOAuth lo hace automáticamente.
    } catch (err) {
      setError(err.message || "Error al iniciar sesión con Google.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "15px" }}
    >
      <h2>{isLogin ? "🔑 Iniciar Sesión" : "📝 Crear Cuenta"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />

      <button type="submit" disabled={!email || !password}>
        {isLogin ? "Entrar" : "Registrar"}
      </button>

      <p style={{ textAlign: "center" }}>— O —</p>

      {/* NUEVO BOTÓN PARA GOOGLE */}
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
}
