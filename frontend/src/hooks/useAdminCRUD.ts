// useAdminCRUD.ts
import { useState, useEffect, useCallback } from 'react';
import { AdminService, UserData } from '@/services/AdminService';

/**
 * Interfaz para el estado devuelto por el hook
 */
export interface AdminCRUDState {
  usersCRUD: UserData[];
  isLoading: boolean;
  error: Error | null;
  /** Función para recargar la lista de usuarios manualmente */
  refetchUsers: () => Promise<void>;
}

/**
 * Hook personalizado para manejar la lógica de CRUD de Administrador (actualmente solo R - Read)
 * Interactúa con la clase AdminService.
 * * @returns {AdminCRUDState} Un objeto con los datos, estado de carga, error y una función de recarga.
 */
export const useAdminCRUD = (): AdminCRUDState => {
  const [usersCRUD, setUsersCRUD] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Función que realiza la llamada a la API y actualiza el estado.
   * Usamos useCallback para que esta función sea estable y evitar problemas con useEffect.
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Llamada al método estático de la clase de servicio
      const userList = await AdminService.getAllUsers();
      
      setUsersCRUD(userList);
    } catch (err) {
      // Manejo de errores de autenticación/autorización y otros
      console.error("Fallo al obtener usuarios en useAdminCRUD:", err);
      // Aseguramos que el error sea de tipo Error para el estado
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error("Ocurrió un error desconocido al cargar los usuarios."));
      }
      setUsersCRUD([]); // Limpiar la lista de usuarios en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías: esta función solo se crea una vez

  // Ejecuta fetchUsers al montar el componente
  useEffect(() => {
    fetchUsers();
    // La dependencia fetchUsers es estable gracias a useCallback
  }, [fetchUsers]); 

  // Función para exponer la recarga de datos al componente
  const refetchUsers = fetchUsers;

  return {
    usersCRUD,
    isLoading,
    error,
    refetchUsers,
  };
};

/*
// Ejemplo de uso en un componente de React:

import { useAdminCRUD } from './useAdminCRUD';

const AdminUserList = () => {
  const { users, isLoading, error, refetchUsers } = useAdminCRUD();

  if (isLoading) {
    return <p>Cargando lista de usuarios...</p>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <p>Error: {error.message}</p>
        <button onClick={refetchUsers}>Intentar Recargar</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Lista de Usuarios (Admin)</h2>
      <button onClick={refetchUsers}>Actualizar</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.email} - **{user.role}**
          </li>
        ))}
      </ul>
      {users.length === 0 && <p>No se encontraron usuarios.</p>}
    </div>
  );
};

export default AdminUserList;
*/