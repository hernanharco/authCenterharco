// frontend/src/app/dashboard/page.js
'use client'; // Necesario para usar hooks de React

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/utils/api'; // Usamos @/utils para importar desde src
import { useRouter } from 'next/navigation'; 

export default function Dashboard() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Llamada a Express: Envía la HttpOnly Cookie y verifica el JWT.
                const data = await fetchApi('/api/perfil');
                setProfileData(data.userData);
            } catch (error) {
                console.error('Error al obtener perfil:', error.message);
                // Si la sesión falla (401/403), redirigimos
                router.push('/'); 
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);
    
    const handleLogout = async () => {
        try {
            // 2. Llama a Express para borrar la HttpOnly Cookie
            await fetchApi('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            router.push('/');
        }
    };

    if (loading) return <p>Cargando datos del perfil...</p>;
    if (!profileData) return null;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Panel de Control 🛡️</h1>
            <p>¡Bienvenido, **{profileData.email}**!</p>
            <p>Tu rol de sesión es: **{profileData.role}**</p>
            <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
    );
}