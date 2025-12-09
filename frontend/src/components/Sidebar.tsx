// frontend/src/components/Sidebar.tsx
import React, { FC } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// --- Definición de Tipos ---

interface UserProfile {
    email: string;
    role: string;
}

interface SidebarProps {
    handleLogout: () => Promise<void>; 
    profileData: UserProfile; 
    isOpen: boolean;
    onClose: () => void; // Esta función se usa para colapsar/expandir
    sidebarWidth: string; 
    isMobile: boolean; 
}

// Componente auxiliar para el perfil (ajustado para colapso)
const UserProfileDisplay: FC<{ username: string, isOpen: boolean }> = ({ username, isOpen }) => (
    <div style={{ 
        padding: isOpen ? '20px' : '10px 0', // Menos padding vertical si está colapsado
        textAlign: 'center', 
        backgroundColor: '#2563eb', // Fondo azul
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
        <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#fff', 
            margin: '0 auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '30px'
        }}>
            {/* Ícono de usuario de la imagen */}
            <span style={{ color: '#2563eb' }}>🤵</span> 
        </div>
        
        <p style={{ 
            color: '#fff', 
            marginTop: '10px', 
            marginBottom: '0',
            fontWeight: 'bold',
            fontSize: '14px',
            display: isOpen ? 'block' : 'none' // Oculta el texto si el sidebar está colapsado
        }}>{username}</p>
    </div>
);


// --- Componente principal ---

const Sidebar: FC<SidebarProps> = ({ handleLogout, profileData, isOpen, onClose, sidebarWidth, isMobile }) => {
    const currentPath = usePathname();
    const username = profileData.email; 

    // Nota: Si quieres restringir 'Permisos' solo para Admins, 
    // debes filtrar este array basándote en profileData.role antes de mapearlo.
    const navItems: { name: string; href: string; icon: string }[] = [
        { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { name: 'Permisos', href: '/dashboard/permissions', icon: '🔑' },        
    ];
    
    const sidebarStyle: React.CSSProperties = {
        width: sidebarWidth, // Ancho dinámico
        backgroundColor: '#2563eb', 
        color: '#fff', 
        height: '100vh', 
        position: 'fixed', 
        top: 0, 
        zIndex: 50, 
        boxShadow: '2px 0 5px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease-in-out', 
        
        // Controla la posición
        transform: isOpen || !isMobile ? 'translateX(0)' : `translateX(-${sidebarWidth})`,
    };
    
    // Estilos del botón de colapso/hamburguesa
    const buttonStyle: React.CSSProperties = {
        position: 'absolute',
        top: '10px',
        right: isOpen ? '10px' : '5px', // Moverlo a la derecha cuando está abierto
        backgroundColor: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: isOpen ? '24px' : '18px',
        cursor: 'pointer',
        padding: '5px',
        zIndex: 60,
        // Usar la hamburguesa en móvil, y flechas en desktop para colapsar/expandir
        ...(isMobile ? {} : { transition: 'transform 0.3s' }), 
    };

    return (
        <>
            {/* Overlay Oscuro (solo se muestra en móvil cuando el menú está abierto) */}
            {isOpen && isMobile && (
                <div 
                    onClick={onClose} 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 40,
                    }}
                />
            )}

            <div style={sidebarStyle}>
                
                {/* Botón de Colapsar (Dentro de la Sidebar) */}
                <button 
                    onClick={onClose} 
                    style={buttonStyle}
                    title={isOpen ? 'Colapsar' : 'Expandir'}
                >
                    {isMobile ? '☰' : (isOpen ? '«' : '»')} 
                </button>

                <UserProfileDisplay username={username} isOpen={isOpen} />

                <nav style={{ padding: '20px 0' }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {navItems.map((item) => (
                            <li key={item.name}>
                                {/* ESTO ES LO QUE GARANTIZA LA NAVEGACIÓN SUAVE */}
                                <Link 
                                    href={item.href} 
                                    // Cierra en móvil al hacer clic
                                    onClick={isMobile ? onClose : undefined} 
                                    style={{ 
                                        display: 'flex', // Usar flexbox para alinear mejor
                                        alignItems: 'center',
                                        padding: '15px 20px', 
                                        textDecoration: 'none', 
                                        color: '#fff', 
                                        // Alinear al centro si está colapsado
                                        justifyContent: isOpen ? 'flex-start' : 'center', 
                                        backgroundColor: currentPath === item.href ? '#3b82f6' : 'transparent',
                                        borderLeft: currentPath === item.href ? '5px solid #fff' : 'none',
                                        transition: 'background-color 0.2s, padding 0.3s'
                                    }}
                                >
                                    {item.icon} 
                                    {/* Muestra el nombre solo si está abierto */}
                                    {isOpen && <span style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}>{item.name}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Botón de Cerrar Sesión (Colapsable) */}
                <div style={{ padding: isOpen ? '20px' : '10px 5px', position: 'absolute', bottom: '10px', width: '100%', boxSizing: 'border-box' }}>
                    <button 
                        onClick={handleLogout} 
                        style={{ 
                            width: isOpen ? '100%' : '50px', 
                            height: '50px',
                            padding: '10px', 
                            backgroundColor: '#ef4444', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            overflow: 'hidden', 
                            transition: 'width 0.3s, background-color 0.2s'
                        }}
                    >
                        {/* Muestra el texto completo si abierto, o solo un ícono/símbolo si está colapsado */}
                        {isOpen ? 'Cerrar Sesión' : <span style={{ fontSize: '20px' }}>⏏</span>} 
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;