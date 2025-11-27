// frontend/src/hooks/useSessionRefresher.js (Archivo nuevo)
"use client";

import { useEffect } from 'react';
import { fetchApi } from '@/utils/api'; 
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // Renovar cada 5 minutos (300,000 ms)

export function useSessionRefresher() {
    const router = useRouter();

    useEffect(() => {
        const refreshSession = async () => {
            try {
                // Llamar al nuevo endpoint de Express
                const response = await fetchApi('/auth/refresh-session', {
                    method: 'POST',
                    // No necesita body, Express lee el refreshToken de la cookie
                });
                
                if (response.message) {
                    console.log('Sesión renovada:', response.message);
                }

            } catch (error) {
                console.error('Renovación de sesión fallida:', error.message);
                
                // Si el refresh token falla (401), forzamos el logout.
                router.push('/'); 
            }
        };

        // Iniciar el temporizador
        const intervalId = setInterval(refreshSession, REFRESH_INTERVAL_MS);

        // Limpiar el temporizador al desmontar el componente
        return () => clearInterval(intervalId);
    }, [router]);
}