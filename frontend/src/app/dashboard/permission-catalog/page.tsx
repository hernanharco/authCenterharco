// frontend/src/app/dashboard/permission-catalog/page.tsx

'use client';

import React, { FC, useState, useEffect, useMemo } from 'react';
import { usePermissionCatalog } from '@/components/permission-catalog/usePermissionCatalog'; 
// Asumiendo que has creado los tipos en esta ruta:
import { PermissionDefinition, PermissionFormData } from '@/types/PermissionTypes'; 

// --- Componente: Tabla para Listar y Editar ---
interface PermissionTableProps {
    permissions: PermissionDefinition[];
    onStartEdit: (permission: PermissionDefinition) => void;
    onDelete: (id: string) => void;
}

const PermissionTable: FC<PermissionTableProps> = ({ permissions, onStartEdit, onDelete }) => {
    
    // Estilos auxiliares
    const headerStyle = { padding: '10px 15px', textAlign: 'left' as const, backgroundColor: '#f0f0f0' };
    const cellStyle = { padding: '8px 15px', borderBottom: '1px solid #eee' };
    const buttonBaseStyle = { 
        padding: '5px 10px', 
        border: 'none', 
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9em'
    };

    return (
        <div style={{ overflowX: 'auto', marginTop: '30px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>Nombre Técnico</th>
                        <th style={headerStyle}>Descripción</th>
                        <th style={headerStyle}>Creado en</th>
                        <th style={{...headerStyle, textAlign: 'center' as const}}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {permissions.length === 0 ? (
                         <tr><td colSpan={4} style={{...cellStyle, textAlign: 'center'}}>No hay permisos definidos.</td></tr>
                    ) : (
                        permissions.map((perm) => (
                            <tr key={perm.id}>
                                <td style={cellStyle}>
                                    <code style={{ backgroundColor: '#e0f7fa', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold', color: '#00796b' }}>{perm.name}</code>
                                </td>
                                <td style={cellStyle}>{perm.description}</td>
                                <td style={cellStyle}>{perm.createdAt}</td>
                                <td style={{...cellStyle, textAlign: 'center' as const}}>
                                    <button 
                                        onClick={() => onStartEdit(perm)}
                                        style={{ 
                                            ...buttonBaseStyle,
                                            marginRight: '10px',
                                            backgroundColor: '#f59e0b', // Amarillo/Naranja
                                            color: '#fff', 
                                        }}
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button 
                                        onClick={() => onDelete(perm.id)}
                                        style={{ 
                                            ...buttonBaseStyle,
                                            backgroundColor: '#ef4444', // Rojo
                                            color: '#fff',
                                        }}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};


// --- Componente: Formulario para Crear/Modificar ---
interface PermissionFormProps {
    currentPermission: PermissionDefinition | null;
    onSave: (permission: PermissionFormData) => void;
    onCancelEdit: () => void;
}

const PermissionForm: FC<PermissionFormProps> = ({ currentPermission, onSave, onCancelEdit }) => {
    
    // Lógica interna de estado de los inputs
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const isEditing = currentPermission !== null;

    // Efecto para sincronizar el formulario con el permiso seleccionado para edición
    useEffect(() => {
        if (currentPermission) {
            setName(currentPermission.name);
            setDescription(currentPermission.description);
        } else {
            // Limpiar formulario al entrar en modo creación
            setName('');
            setDescription('');
        }
    }, [currentPermission]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !description.trim()) {
            alert('Ambos campos son obligatorios.');
            return;
        }

        const newPermissionData: PermissionFormData = {
            // Usamos el ID existente si estamos editando, o uno temporal si es nuevo
            id: currentPermission ? currentPermission.id : Date.now().toString(), 
            // Normalizar el nombre técnico: minúsculas y reemplazar espacios con guiones bajos
            name: name.trim().toLowerCase().replace(/\s/g, '_'), 
            description: description.trim(),
        };

        onSave(newPermissionData);
    };

    const buttonBaseStyle = { 
        padding: '10px 20px', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        fontSize: '1em'
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            
            <h3 style={{ marginTop: 0 }}>{isEditing ? `✏️ Modificar Permiso: ${currentPermission?.name}` : '➕ Crear Nuevo Permiso'}</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre Técnico (Ej: manage_content)</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre único (sin espacios)"
                        disabled={isEditing} // No permitir cambiar el nombre técnico al editar
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    {isEditing && <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0' }}>El nombre técnico no se puede cambiar al editar.</p>}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción Amigable</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Una descripción clara de lo que permite hacer."
                        rows={3}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        type="submit"
                        style={{ ...buttonBaseStyle, backgroundColor: '#10b981', color: '#fff' }}
                    >
                        {isEditing ? 'Guardar Cambios' : 'Crear Permiso'}
                    </button>
                    
                    {isEditing && (
                        <button 
                            type="button" 
                            onClick={onCancelEdit}
                            style={{ ...buttonBaseStyle, backgroundColor: '#94a3b8', color: '#fff' }}
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};


// --- Componente Principal de la Página (Vista Pura) ---

const PermissionCatalogPage: FC = () => {
    
    const {
        permissionCatalog,
        editingPermission,
        handleSavePermission,
        handleDelete,
        handleStartEdit,
        handleCancelEdit,
    } = usePermissionCatalog();
    
    return (
        <div>
            <h2>🔑 Catálogo de Definición de Permisos</h2>
            
            <PermissionForm 
                currentPermission={editingPermission}
                onSave={handleSavePermission}
                onCancelEdit={handleCancelEdit}
            />
            
            <PermissionTable
                permissions={permissionCatalog}
                onStartEdit={handleStartEdit}
                onDelete={handleDelete}
            />
            
            <p style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                **Nota:** Los permisos creados aquí son las &quot;etiquetas&quot; que luego se asignan a los roles en la otra página.
            </p>
        </div>
    );
};

export default PermissionCatalogPage;