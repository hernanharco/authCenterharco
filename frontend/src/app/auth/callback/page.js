//frontend/src/app/auth/callback/page.js
'use client'; 

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase'; // Importa tu cliente de Supabase
import { fetchApi } from '@/utils/api'; 
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Procesando autenticación...");

    useEffect(() => {
        const handleOAuthToken = async () => {
            setStatus("Obteniendo sesión de Supabase...");
            
            // 1. Obtener la sesión actual de Supabase (el token está en el hash de la URL)
            const { data: { session }, error } = await supabase.auth.getSession();

            // Verificar si la sesión y los tokens existen
            // CRÍTICO: Necesitamos ambos tokens para el backend de Express.
            if (error || !session?.access_token || !session?.refresh_token) {
                console.error("No se pudo obtener la sesión de Supabase o faltan tokens:", error || "Tokens faltantes");
                setStatus("Fallo en la autenticación. Redirigiendo...");
                router.push('/'); // Redirigir a Home/Login si falla
                return;
            }
            
            // 2. Extraemos ambos tokens para el intercambio
            const accessToken = session.access_token;
            const refreshToken = session.refresh_token;

            try {
                setStatus("Intercambiando tokens con Express...");
                
                // 3. Intercambio de Tokens con Express
                // Envía AMBOS TOKENS a Express, ya que son requeridos por tu ruta /auth/set-cookie
                await fetchApi('/auth/set-cookie', {
                    method: 'POST',
                    body: { 
                        access_token: accessToken, 
                        refresh_token: refreshToken 
                    }
                });

                // 4. Éxito: Redirección final al Dashboard
                setStatus("Éxito. Redirigiendo al Dashboard...");
                router.push('/dashboard');
                
            } catch (exchangeError) {
                console.error("Error al canjear token con Express:", exchangeError);
                // Si el backend falla, limpiamos la sesión del cliente y redirigimos
                await supabase.auth.signOut(); 
                setStatus(`Error: ${exchangeError.message}. Redirigiendo...`);
                router.push('/'); 
            }
        };
        
        handleOAuthToken();
        
    }, [router]);

    return (
        <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#f9f9f9', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <h1 style={{ color: '#0070f3', marginBottom: '10px' }}>🚀 OAuth en curso</h1>
            <p style={{ color: '#333' }}>{status}</p>
            <p style={{ marginTop: '20px', fontSize: 'small', color: '#666' }}>No cierres esta ventana.</p>
        </div>
    );
}