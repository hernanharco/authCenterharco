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