// types/permissionTypes.ts

export const ROLES_HIERARCHY = [
  'Owner', 
  'SuperAdmin', 
  'Admin', 
  'Editor', 
  'Viewer'
] as const;

export type UserRole = typeof ROLES_HIERARCHY[number];

/**
 * Type Guard: Verifica si un string es un rol válido.
 */
export const isValidRole = (role: string): role is UserRole => {
  return ROLES_HIERARCHY.includes(role as UserRole);
};

/**
 * Función utilitaria con tipado fuerte.
 */
export const checkLevel = (userRole: string | undefined, requiredRole: UserRole): boolean => {
  if (!userRole || !isValidRole(userRole)) return false;
  
  const userIndex = ROLES_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLES_HIERARCHY.indexOf(requiredRole);

  // Menor índice = Más poder (0 es Owner, 4 es Viewer)
  return userIndex <= requiredIndex;
};