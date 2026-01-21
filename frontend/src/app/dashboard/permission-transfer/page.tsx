'use client';

import React, { FC, useState, DragEvent } from 'react';

// --- Definición de Tipos ---

interface Permission {
    name: string;
    description: string;
    id: string; // Añadimos ID para facilitar el seguimiento
}

// Datos Mock Globales (Todos los permisos posibles)
const allPermissions: Permission[] = [
    { id: 'p1', name: 'modify_header', description: 'Permite modificar la cabecera principal del sitio.' },
    { id: 'p2', name: 'manage_users', description: 'Permite crear, editar y eliminar usuarios.' },
    { id: 'p3', name: 'add_permissions', description: 'Permite agregar nuevos permisos a cualquier rol.' },
    { id: 'p4', name: 'read_sales_reports', description: 'Permite acceder a los reportes de ventas.' },
    { id: 'p5', name: 'publish_content', description: 'Permite aprobar y publicar contenido nuevo.' },
    { id: 'p6', name: 'view_dashboard', description: 'Permite ver el dashboard principal (básico).' },
];

// --- Componente Auxiliar: Contenedor de Permisos (Droppable) ---

interface PermissionContainerProps {
    title: string;
    permissions: Permission[];
    roleName: string;
    onDropPermission: (role: string, permissionId: string, targetType: 'assigned' | 'available') => void;
    targetType: 'assigned' | 'available';
    borderColor: string;
}

const PermissionContainer: FC<PermissionContainerProps> = ({ 
    title, 
    permissions, 
    roleName, 
    onDropPermission, 
    targetType, 
    borderColor
}) => {
    
    // 1. Manejar el evento 'drag over' (necesario para que el drop funcione)
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); 
        e.currentTarget.style.backgroundColor = '#e0f7fa'; // Efecto visual de soltar
    };

    // 2. Manejar el evento 'drag leave'
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.backgroundColor = '#f8fafc';
    };

    // 3. Manejar el evento 'drop'
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = '#f8fafc';
        
        // Obtener la ID del permiso arrastrado
        const permissionId = e.dataTransfer.getData("permissionId");
        
        // Ejecutar la función de transferencia de estado
        onDropPermission(roleName, permissionId, targetType);
    };

    return (
        <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            style={{
                backgroundColor: '#f8fafc', 
                padding: '20px', 
                borderRadius: '8px', 
                border: `2px dashed ${borderColor}`,
                minHeight: '350px',
                flex: 1,
            }}
        >
            <h4 style={{ borderBottom: `2px solid ${borderColor}`, paddingBottom: '10px', color: borderColor }}>
                {title} ({permissions.length})
            </h4>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {permissions.map((perm) => (
                    <li 
                        key={perm.id} 
                        draggable // ⭐️ Habilitar el arrastre
                        onDragStart={(e) => {
                            // Almacenar el ID del permiso que se está arrastrando
                            e.dataTransfer.setData("permissionId", perm.id);
                        }}
                        style={{ 
                            marginBottom: '10px', 
                            padding: '10px', 
                            backgroundColor: '#fff', 
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            cursor: 'grab',
                            borderLeft: `3px solid ${targetType === 'assigned' ? '#059669' : '#f59e0b'}`
                        }}
                    >
                        <strong>{perm.name}</strong>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{perm.description}</p>
                    </li>
                ))}
                
                {permissions.length === 0 && (
                     <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                        {targetType === 'assigned' ? 'Arrastra aquí los permisos a asignar.' : 'Todos los permisos han sido asignados.'}
                    </p>
                )}
            </ul>
        </div>
    );
}

// --- Componente Principal: Transferencia de Permisos ---

const PermissionTransfer: FC = () => {
    // ⭐️ Suponemos que queremos editar los permisos del rol 'Admin' ⭐️
    const roleToEdit = 'Admin'; 
    const initialAdminPermissions = allPermissions.filter(p => ['p1', 'p2', 'p3'].includes(p.id));

    // El estado mantendrá la lista de permisos asignados a este rol específico
    const [assignedPermissions, setAssignedPermissions] = useState<Permission[]>(initialAdminPermissions);

    // Los permisos disponibles son la diferencia entre todos y los asignados
    const availablePermissions = allPermissions.filter(
        p => !assignedPermissions.some(ap => ap.id === p.id)
    );
    
    // ⭐️ Lógica de Arrastrar y Soltar (Transferencia de Permiso) ⭐️
    const handleDropPermission = (
        roleName: string, 
        permissionId: string, 
        targetType: 'assigned' | 'available'
    ) => {
        // Encontramos el permiso que se está moviendo
        const permissionToMove = allPermissions.find(p => p.id === permissionId);
        if (!permissionToMove) return;

        // Comprobamos si el permiso ya está en la lista de destino
        const isAlreadyInTarget = targetType === 'assigned' 
            ? assignedPermissions.some(p => p.id === permissionId) 
            : availablePermissions.some(p => p.id === permissionId);

        if (isAlreadyInTarget) return;

        if (targetType === 'assigned') {
            // Mover de Disponibles a Asignados
            setAssignedPermissions(prev => [...prev, permissionToMove]);
        } else {
            // Mover de Asignados a Disponibles
            setAssignedPermissions(prev => prev.filter(p => p.id !== permissionId));
        }
        
        // En un entorno real, aquí se enviaría la actualización al backend
        console.log(`Permiso ${permissionId} movido a ${targetType} para el rol ${roleName}`);
    };
    
    // ⚠️ Simulación de un usuario para mostrar en la interfaz
    const mockUser = { name: "Usuario: Hernan Arango Cortes", email: "hernan.harco@gmail.com" };

    return ( 
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            
            <h2 style={{ marginBottom: '10px' }}>Gestión de Permisos: **{roleToEdit}** 🔑</h2>
            
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f0f0f0' }}>
                <p style={{ margin: 0 }}>**Usuario:** {mockUser.name} | **Correo:** {mockUser.email}</p>
                <p style={{ margin: 0 }}>**Editando Rol:** {roleToEdit}</p>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                
                {/* 1. Contenedor de Permisos Asignados */}
                <PermissionContainer 
                    title="Permisos Asignados"
                    permissions={assignedPermissions}
                    roleName={roleToEdit}
                    onDropPermission={handleDropPermission}
                    targetType="assigned"
                    borderColor="#059669" // Verde
                />
                
                {/* 2. Contenedor de Permisos Disponibles */}
                <PermissionContainer 
                    title="Permisos Disponibles"
                    permissions={availablePermissions}
                    roleName={roleToEdit}
                    onDropPermission={handleDropPermission}
                    targetType="available"
                    borderColor="#f59e0b" // Naranja
                />
            </div>
            
            <div style={{ marginTop: '30px', padding: '15px', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <p>💡 **Instrucciones:** Arrastra un permiso desde un recuadro al otro para asignarlo o desasignarlo del rol **{roleToEdit}**.</p>
            </div>
            
        </div>
    );
}

export default PermissionTransfer;