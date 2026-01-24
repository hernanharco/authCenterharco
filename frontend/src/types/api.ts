// frontend/src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  profiles?: any[]; // Para la lista de usuarios
  total?: number;   // Para el conteo total
  [key: string]: any; 
}