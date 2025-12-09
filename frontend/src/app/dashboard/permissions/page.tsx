'use client';

import React, { FC, useState } from 'react';

// --- Definición de Tipos ---

interface Permission {
    name: string;
    description: string;
}

interface RolePermissions {
    role: 'Admin' | 'Editor' | 'Viewer' | string;
    permissions: Permission[];
}

// Datos Mock (simulando datos del backend)
const initialPermissions: RolePermissions[] = [
    {
        role: 'Admin',
        permissions: [
            { name: 'modify_header', description: 'Permite modificar la cabecera principal del sitio.' },
            { name: 'manage_users', description: 'Permite crear, editar y eliminar usuarios.' },
            { name: 'add_permissions', description: 'Permite agregar nuevos permisos a cualquier rol.' },
        ],
    },    
];

// --- Componente Auxiliar: RoleCard (Mejora de legibilidad) ---

interface RoleCardProps {
    roleData: RolePermissions;
    onAddPermission: (roleName: string) => void;
}

const RoleCard: FC<RoleCardProps> = ({ roleData, onAddPermission }) => {
    const isAdmin = roleData.role === 'Admin';
    const roleColor = isAdmin ? '#ef4444' : '#2563eb';
    
    return (
        <div 
            style={{
                backgroundColor: '#fff', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                borderTop: `5px solid ${roleColor}`,
                display: 'flex',
                flexDirection: 'column', // Para que el botón se pegue al fondo
            }}
        >
            
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Rol: **{roleData.role}**
            </h3>
            
            <ul style={{ listStyle: 'none', padding: 0, flexGrow: 1 }}> {/* flexGrow para empujar el botón hacia abajo */}
                {roleData.permissions.map((perm, index) => (
                    <li key={index} style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        <strong style={{ color: '#059669' }}>{perm.name}</strong>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{perm.description}</p>
                    </li>
                ))}
            </ul>

            {/* Botón para agregar más permisos */}
            <button
                onClick={() => onAddPermission(roleData.role)}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#10b981', 
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '15px'
                }}
            >
                + Agregar Permiso a **{roleData.role}**
            </button>
        </div>
    );
}

// --- Componente Principal ---

const PermisosPage: FC = () => {
    const [roles, setRoles] = useState<RolePermissions[]>(initialPermissions);

    // Función para simular la adición de un permiso
    const handleAddPermission = (roleName: string) => {
        const uniqueId = Date.now(); 
        
        const newPermission: Permission = { 
            name: `new_feature_${uniqueId}`, 
            description: `Acceso a una nueva característica experimental (${roleName}).` 
        };

        setRoles(prevRoles =>
            prevRoles.map(roleData => 
                roleData.role === roleName 
                    ? { ...roleData, permissions: [...roleData.permissions, newPermission] }
                    : roleData
            )
        );
        alert(`Permiso '${newPermission.name}' agregado a ${roleName}`);
    };

    return ( 
        // Usar React.Fragment o envolver en un div para buena práctica
        <React.Fragment> 
            <h2 style={{ marginBottom: '20px' }}>Gestión de Permisos por Rol 🔑</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {roles.map((roleData) => (
                    <RoleCard 
                        key={roleData.role}
                        roleData={roleData}
                        onAddPermission={handleAddPermission}
                    />
                ))}
            </div>

            <div style={{ marginTop: '30px', padding: '15px', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <p>⚠️ **Nota de Seguridad:** En un entorno real, esta página debería tener una **protección de ruta** a nivel de *middleware* o *layout* para garantizar que solo los usuarios con el rol &apos;Admin&apos; puedan acceder a ella y realizar cambios.</p>
            </div> 
        </React.Fragment>
    );
}

export default PermisosPage;