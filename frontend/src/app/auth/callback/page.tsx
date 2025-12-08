// frontend/src/app/auth/callback/page.tsx (VERSION FINAL Y COMPATIBLE CON ESLINT)

'use client'; 

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase'; 
import { fetchApi } from '@/utils/api'; 
import { useRouter } from 'next/navigation';

// ===============================================
// INTERFACES
// ===============================================

interface SupabaseError {
    message: string;
}

interface SupabaseSession {
    access_token: string;
    refresh_token: string;
}

interface GetSessionResponse {
    data: {
        session: SupabaseSession | null;
    };
    error: SupabaseError | null; 
}

interface TrackingData {
    sourceApp: string;
    timestamp: string;
    status: string;
}

// Función auxiliar para leer y decodificar el parámetro 'tracking'
// ¡Debe llamarse solo cuando 'window' esté disponible!
const readTrackingDataFromUrl = (): TrackingData | null => {
    // Si esta función se llama, asumimos que 'window' existe.
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('tracking');

    if (encodedData) {
        try {
            const decodedData: string = decodeURIComponent(encodedData);
            const data: TrackingData = JSON.parse(decodedData);
            return data;
        } catch (e) {
            console.error("Error al decodificar o parsear datos de tracking:", e);
        }
    }
    return null;
};

// ===============================================

const AuthCallbackPage: React.FC = () => {
    const router = useRouter();
    const [status, setStatus] = useState<string>("Procesando autenticación...");

    // 🚨 1. ÚNICO useEffect para manejar toda la lógica y el acceso a 'window'.
    useEffect(() => {
        // Ejecutamos la lógica SÓLO si estamos en el cliente (que es lo que garantiza useEffect con []).

        // 🚨 2. Leemos trackingInfo DENTRO del useEffect.
        // Esto garantiza que 'window' ya está definido.
        const trackingInfo: TrackingData | null = readTrackingDataFromUrl();

        const handleOAuthToken = async () => {
            setStatus("Obteniendo sesión de Supabase...");
            
            const { data: { session }, error } = await supabase.auth.getSession() as GetSessionResponse;

            const isSessionValid = session?.access_token && session?.refresh_token;

            if (error || !isSessionValid) {
                console.error("No se pudo obtener la sesión de Supabase:", error || "Tokens faltantes");
                setStatus("Fallo en la autenticación. Redirigiendo...");
                router.push('/'); 
                return;
            }
            
            const accessToken = session!.access_token;
            const refreshToken = session!.refresh_token;

            try {
                setStatus("Intercambiando tokens con Express...");
                
                await fetchApi('/auth/set-cookie', {
                    method: 'POST',
                    body: { 
                        access_token: accessToken, 
                        refresh_token: refreshToken 
                    }
                });

                // LÓGICA CONDICIONAL DE CIERRE/REDIRECCIÓN
                if (trackingInfo) {
                    setStatus("Éxito. Cerrando ventana...");
                    console.log("dato recibido:", trackingInfo);
                    window.close(); 
                } else {
                    setStatus("Éxito. Redirigiendo al Dashboard...");
                    console.log("dato recibido:", trackingInfo);
                    router.push('/dashboard');
                }
                
            } catch (exchangeError) {
                console.error("Error al canjear token con Express:", exchangeError);
                await supabase.auth.signOut(); 
                
                let errorMessage = "Error en el intercambio de tokens.";
                
                if (typeof exchangeError === 'object' && exchangeError !== null && 'message' in exchangeError) {
                    errorMessage = (exchangeError as SupabaseError).message;
                }
                
                setStatus(`Error: ${errorMessage}. Redirigiendo...`);
                router.push('/'); 
            }
        };
        
        handleOAuthToken();
        
    // 🚨 Lista de dependencias vacía. Esto elimina las advertencias del linter 
    // y ejecuta el código una sola vez después del montaje, que es lo que queremos.
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

export default AuthCallbackPage;