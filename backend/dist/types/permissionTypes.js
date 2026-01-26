"use strict";
// types/permissionTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLevel = exports.isValidRole = exports.ROLES_HIERARCHY = void 0;
exports.ROLES_HIERARCHY = [
    'Owner',
    'SuperAdmin',
    'Admin',
    'Editor',
    'Viewer'
];
/**
 * Type Guard: Verifica si un string es un rol válido.
 */
const isValidRole = (role) => {
    return exports.ROLES_HIERARCHY.includes(role);
};
exports.isValidRole = isValidRole;
/**
 * Función utilitaria con tipado fuerte.
 */
const checkLevel = (userRole, requiredRole) => {
    if (!userRole || !(0, exports.isValidRole)(userRole))
        return false;
    const userIndex = exports.ROLES_HIERARCHY.indexOf(userRole);
    const requiredIndex = exports.ROLES_HIERARCHY.indexOf(requiredRole);
    // Menor índice = Más poder (0 es Owner, 4 es Viewer)
    return userIndex <= requiredIndex;
};
exports.checkLevel = checkLevel;
