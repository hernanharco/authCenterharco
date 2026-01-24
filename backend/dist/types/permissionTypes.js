"use strict";
// types/permissionTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLevel = exports.ROLES_HIERARCHY = void 0;
/**
 * FUENTE ÚNICA DE VERDAD:
 * Si quieres cambiar un nombre, añadir un rol o quitarlo, hazlo solo aquí.
 * El orden define el poder: el primero (índice 0) manda sobre todos.
 */
exports.ROLES_HIERARCHY = [
    'Owner',
    'SuperAdmin',
    'Admin',
    'Editor',
    'Viewer'
];
/**
 * Función utilitaria para comparar niveles en cualquier parte del proyecto.
 */
const checkLevel = (userRole, requiredRole) => {
    if (!userRole)
        return false;
    const userIndex = exports.ROLES_HIERARCHY.indexOf(userRole);
    const requiredIndex = exports.ROLES_HIERARCHY.indexOf(requiredRole);
    if (userIndex === -1)
        return false;
    // Menor índice = Más poder
    return userIndex <= requiredIndex;
};
exports.checkLevel = checkLevel;
