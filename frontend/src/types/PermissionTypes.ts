// frontend/src/types/PermissionTypes.ts

export interface PermissionDefinition {
    id: string; // ID único (ej. UUID)
    name: string; // Nombre técnico (ej. 'manage_users')
    description: string; // Descripción amigable
    createdAt: string; // Metadata
}

export type PermissionFormData = Omit<PermissionDefinition, 'createdAt'>;