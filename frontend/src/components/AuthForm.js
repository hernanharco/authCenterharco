// frontend/src/components/AuthForm.js
"use client"

import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { fetchApi } from '../utils/api';
import { useRouter } from 'next/navigation'; // Usamos next/navigation para App Router

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();

    // Este componente DEBE ser 'use client' si estás usando App Router (que es el default moderno)
    // Agrega 'use client' al principio del archivo si da error.
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            let authResponse;
            if (isLogin) {
                authResponse = await supabase.auth.signInWithPassword({ email, password });
            } else {
                authResponse = await supabase.auth.signUp({ email, password });
            }

            if (authResponse.error) {
                throw authResponse.error;
            }

            const token = authResponse.data.session?.access_token;
            
            if (token) {
                // 1. Intercambio de Token con Express (establece la HttpOnly Cookie)
                await fetchApi('/auth/set-cookie', {
                    method: 'POST',
                    body: { token }
                });
                
                // 2. Redirigir al dashboard
                router.push('/dashboard');
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error en la autenticación. Revisa email/contraseña.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>{isLogin ? '🔑 Iniciar Sesión' : '📝 Crear Cuenta'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
            
            <button type="submit">{isLogin ? 'Entrar' : 'Registrar'}</button>
            
            <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer' }}>
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </p>
        </form>
    );
}