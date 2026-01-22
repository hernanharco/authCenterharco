// frontend/src/components/DashboardLayout.tsx
'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { fetchApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar'

// --- Tipificación de los Datos y Props ---

interface UserProfile {
    id?: number;
    email: string;
    role: string;
}

interface DashboardLayoutProps {
    children: ReactNode;
}


// --- Componente Principal ---

export default function Layout({ children }: DashboardLayoutProps) {
    // 1. Inicializar isMobile en false (para evitar errores de SSR) y ajustarlo en useEffect
    const [isMobile, setIsMobile] = useState(false); 
    // 2. Inicializar la sidebar como ABIERTA por defecto, el useEffect la ajustará en móvil.
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    
    const sidebarWidth = '250px';
    const collapsedWidth = '60px'; 
    const headerHeight = '60px';


    // --- Lógica de Ajuste de Ancho de Pantalla y Sidebar ---
    useEffect(() => {
        // Ejecutamos esta lógica solo en el cliente
        const checkMobile = () => {
            const mobileCheck = window.innerWidth < 768;
            setIsMobile(mobileCheck);
            // Ajusta el estado inicial de la Sidebar basado en el tamaño real del cliente
            setIsSidebarOpen(!mobileCheck); 
        };
        
        // Ejecutar inmediatamente al montar
        checkMobile(); 

        // Escuchar cambios de tamaño de pantalla (para el responsive)
        window.addEventListener('resize', checkMobile);

        // Limpieza: importante para evitar fugas de memoria
        return () => window.removeEventListener('resize', checkMobile);
    }, []); // Se ejecuta solo una vez al montar (y maneja el resize)


    // --- Lógica de Sesión y Perfil ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await fetchApi('/auth/perfil');
                setProfileData(data.userData as UserProfile); 
            } catch (error) {
                let errorMessage = 'Error desconocido al obtener perfil.';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (error && typeof error === 'object' && 'message' in error) {
                    errorMessage = (error as { message: string }).message;
                }
                console.error('Error al obtener perfil:', errorMessage);
                // Si falla la autenticación, redirige
                router.push('/'); 
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);
    
    // Función de logout (sin cambios)
    const handleLogout = async () => {
        try {
            await fetchApi('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            router.push('/');
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    if (loading) return <p>Cargando datos del perfil...</p>;
    if (!profileData) return null; 

    // Calcula el ancho y el margen dinámico
    const currentSidebarWidth = isSidebarOpen ? sidebarWidth : collapsedWidth;
    const currentMargin = isMobile 
        ? '0' // Móvil: margen 0, sidebar es overlay
        : currentSidebarWidth; // Escritorio: margen igual al ancho del sidebar
    
    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            
            {/* El Sidebar (fixed) */}
            <Sidebar 
                handleLogout={handleLogout} 
                profileData={profileData} 
                isOpen={isSidebarOpen} 
                onClose={toggleSidebar} 
                sidebarWidth={currentSidebarWidth} 
                isMobile={isMobile}
            /> 

            {/* Contenido principal */}
            <main style={{ 
                flexGrow: 1, 
                padding: '20px',
                width: '100%',
                marginLeft: currentMargin,
                transition: 'margin-left 0.3s ease-in-out',
                paddingTop: isMobile ? headerHeight : '20px' 
            }}>
                
                {/* Cabecera del Contenido (SIMPLIFICADA) */}
                <header style={{ 
                    marginBottom: '20px', 
                    borderBottom: '1px solid #eee', 
                    paddingBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    height: headerHeight,
                    // Estilos para que la cabecera sea fija en móvil si el sidebar está cerrado
                    // Ajustar el ancho para que no se superponga con el margen del escritorio
                    position: isMobile ? 'fixed' : 'relative',
                    top: isMobile ? '0' : 'auto',
                    // Ajustar left y right para que cubra todo el ancho disponible si es fijo en móvil.
                    left: isMobile ? '0' : 'auto', 
                    right: isMobile ? '0' : 'auto',
                    width: isMobile ? `calc(100% - ${currentMargin})` : 'auto', // Asegurar que solo ocupe el espacio disponible
                    backgroundColor: isMobile ? '#fff' : 'transparent',
                    zIndex: isMobile ? 10 : 'auto',
                    padding: isMobile ? '10px 20px 0 20px' : '0'
                }}>
                    
                    {isMobile && !isSidebarOpen && (
                        <button 
                            onClick={toggleSidebar} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                fontSize: '24px', 
                                cursor: 'pointer', 
                                marginRight: '10px', 
                                color: '#2563eb' 
                            }}
                        >
                            ☰
                        </button>
                    )}

                    <div style={{ marginLeft: '10px', flexGrow: 1 }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>DASHBOARD</h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>USER PANEL</p>
                    </div>

                </header>
                
                {children}
            </main>
        </div>
    );
}