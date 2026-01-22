# 🚀 Flujo de Autenticación con Google (OAuth)
El objetivo sigue siendo el mismo: obtener un JWT de Supabase para poder canjearlo por la HttpOnly cookie en tu backend Express.

1. **Inicio (Frontend):** El usuario hace clic en el botón "Iniciar sesión con Google".

2. **Supabase Redirige:** El cliente de Supabase redirige al usuario a la página de login de Google.

3. **Google Autentica:** Google verifica las credenciales del usuario y lo redirige de vuelta a Supabase, adjuntando un código o token.

4. **Supabase Emite JWT:** Supabase usa la información de Google para crear un usuario y generar un JWT (Access Token).

5. **Redirección Final (Frontend):** Supabase redirige al usuario a tu URL de callback de éxito (/dashboard), y ese JWT se pasa en la URL (hash fragment).

6. **Intercambio de Token (Frontend):** Tu código JavaScript toma el JWT de la URL y lo envía a Express para canjearlo por la HttpOnly cookie.
______
## 🛠️ Paso 1: Configuración en Supabase (Google)
Antes de codificar, debes habilitar el proveedor de Google en tu proyecto Supabase y obtener las claves de la consola de Google.

### A. Obtener Credenciales de Google
1. Ve a la **Google Cloud Console** (Google Developer Console).

2. Crea un nuevo proyecto.

3. Ve a **APIs & Services > Credentials.**

4. Crea una nueva credencial de tipo **OAuth Client ID** (ID de Cliente OAuth).

5. Tipo de Aplicación: **Web Application.**

6. **URIs de Redirección Autorizados (IMPORTANTES):** Debes decirle a Google a dónde enviarte después del login. La URL es fija para Supabase:

    - https://[TU_ID_DE_PROYECTO].supabase.co/auth/v1/callback

    - Para tu proyecto: https://kmvdpbplzshlkowysuti.supabase.co/auth/v1/callback

Obtendrás dos valores: **Client ID y Client Secret.**

### B. Habilitar Google en Supabase
1. En tu panel de Supabase, ve a **Authentication** (Autenticación).

2. Ve a la pestaña **Providers** (Proveedores).

3. Selecciona **Google.** 

4. Pega el **Client ID** y el **Client Secret** que obtuviste de Google.

5. Haz clic en **Save** (Guardar).
________
## ⚛️ Paso 2: Implementación en el Frontend (Next.js)

Modificaremos tu componente AuthForm.js para añadir el botón y la lógica de inicio de sesión con el proveedor de Google.

### A. Modificar AuthForm.js

Añade una nueva función handleGoogleLogin que llama a supabase.auth.signInWithOAuth.
```
// frontend/src/components/AuthForm.js

"use client"; // CRÍTICO: Necesario para usar hooks de React (useState, useRouter)

import React, { useState } from 'react';
import { supabase } from '../utils/supabase'; // Ajusta la ruta si es necesario
import { fetchApi } from '../utils/api';     // Ajusta la ruta si es necesario
import { useRouter } from 'next/navigation';

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                authResponse = await supabase.auth.signInWithPassword({ email, password });
            } else {
                // 1. Registro con Supabase
                authResponse = await supabase.auth.signUp({ email, password });
            }

            if (authResponse.error) {
                throw authResponse.error;
            }

            // 2. Extraer el JWT (access_token)
            const token = authResponse.data.session?.access_token;
            
            if (token) {
                // 3. ¡CRÍTICO!: Intercambio de Token con Express
                await fetchApi('/auth/set-cookie', {
                    method: 'POST',
                    body: { token }
                });
                
                // 4. Redirigir al dashboard
                router.push('/dashboard');
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error en la autenticación. Revisa credenciales.');
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
                provider: 'google',
                options: {
                    // La URL a donde Supabase redirigirá al usuario DESPUÉS de Google
                    // Luego, el JWT será manejado por la página de callback.
                    redirectTo: `${window.location.origin}/auth/callback`, 
                },
            });

            if (error) throw error;
            
            // Nota: No se redirige aquí, la función signInWithOAuth lo hace automáticamente.

        } catch (err) {
            setError(err.message || 'Error al iniciar sesión con Google.');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2>{isLogin ? '🔑 Iniciar Sesión' : '📝 Crear Cuenta'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
            
            <button type="submit" disabled={!email || !password}>
                {isLogin ? 'Entrar' : 'Registrar'}
            </button>
            
            <p style={{ textAlign: 'center' }}>— O —</p>
            
            {/* NUEVO BOTÓN PARA GOOGLE */}
            <button type="button" onClick={handleGoogleLogin} style={{ backgroundColor: '#DB4437', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>
                Iniciar Sesión con Google 🚀
            </button>
            
            <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', textAlign: 'center', fontSize: 'small' }}>
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </p>
        </form>
    );
}
```
### B. Crear la Ruta de Callback (Next.js)
Cuando Google y Supabase terminan la autenticación, redirigen al usuario a la URL que especificaste en redirectTo. Necesitas una página de Next.js (/auth/callback) para capturar el JWT que viene en la URL y enviarlo a Express.

Crea un archivo o estructura de carpeta para la ruta /auth/callback.

frontend/src/app/auth/callback/page.js
```
// frontend/src/app/auth/callback/page.js
'use client'; 

import { useEffect } from 'react';
import { supabase } from '@/utils/supabase'; // Importa tu cliente de Supabase
import { fetchApi } from '@/utils/api'; 
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleOAuthToken = async () => {
            // 1. Obtener el Access Token del usuario después de la redirección de Supabase
            // El token está en la URL (fragment hash)
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session?.access_token) {
                console.error("No se pudo obtener la sesión de Supabase:", error);
                router.push('/'); // Redirigir a Home/Login si falla
                return;
            }

            const token = session.access_token;

            try {
                // 2. Intercambio de Token con Express (¡Tu paso de seguridad!)
                // Envía el JWT a Express para obtener la HttpOnly Cookie
                await fetchApi('/auth/set-cookie', {
                    method: 'POST',
                    body: { token }
                });

                // 3. Redirección final al Dashboard
                router.push('/dashboard');
                
            } catch (exchangeError) {
                console.error("Error al canjear token con Express:", exchangeError);
                router.push('/'); // Fallo en el backend, redirigir a Login
            }
        };
        
        // Ejecutar la lógica de manejo del token
        handleOAuthToken();
        
    }, [router]);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Procesando Autenticación...</h1>
            <p>No cierres esta ventana.</p>
        </div>
    );
}
```
