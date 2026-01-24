// types/permissionTypes.ts

/**
 * FUENTE ÚNICA DE VERDAD: 
 * Si quieres cambiar un nombre, añadir un rol o quitarlo, hazlo solo aquí.
 * El orden define el poder: el primero (índice 0) manda sobre todos.
 */
export const ROLES_HIERARCHY = [
  'Owner', 
  'SuperAdmin', 
  'Admin', 
  'Editor', 
  'Viewer'
] as const;

// Tipado automático: 'Owner' | 'SuperAdmin' | 'Admin' | 'Editor' | 'Viewer'
export type UserRole = typeof ROLES_HIERARCHY[number];

/**
 * Función utilitaria para comparar niveles en cualquier parte del proyecto.
 */
export const checkLevel = (userRole: string | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  
  const userIndex = ROLES_HIERARCHY.indexOf(userRole as any);
  const requiredIndex = ROLES_HIERARCHY.indexOf(requiredRole);

  if (userIndex === -1) return false;

  // Menor índice = Más poder
  return userIndex <= requiredIndex;
};