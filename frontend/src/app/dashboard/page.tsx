// frontend/src/app/dashboard/page.tsx
"use client";

import React, { FC, useState, useEffect } from "react";
import Image from 'next/image';
import { useAdminCRUD } from "@/hooks/useAdminCRUD";

// --- Definición de tipos ---

interface User {
  id: string;
  image: string; // URL del avatar
  name: string;
  email: string;
  role: string;
  permissions: string;
}

// ⚠️ MOCK DE SESIÓN Y CLIENTE
const mockSession = {
  role: "admin", 
  isAuthenticated: true,
}; 

const apiClient = {
  get: async (url: string) => {
    if (url === "/api/auth/users") {
      if (mockSession.role !== "admin") {
        throw new Error("Acceso denegado. No eres administrador.");
      }
      return [
        {
          id: "u1",
          image: "https://i.pravatar.cc/150?img=1",
          name: "Admin Principal",
          email: "admin@empresa.com",
          role: "admin",
          permissions: "CRUD: All",
        },
        {
          id: "u2",
          image: "https://i.pravatar.cc/150?img=2",
          name: "Manager de Ventas",
          email: "manager@empresa.com",
          role: "manager",
          permissions: "Read: Sales",
        },
        {
          id: "u3",
          image: "https://i.pravatar.cc/150?img=3",
          name: "Usuario Estándar",
          email: "user@empresa.com",
          role: "user",
          permissions: "Read: Public",
        },
      ] as User[];
    }
    throw new Error("URL no simulada.");
  },
};

// --- Componente de Tabla de Usuarios ---
const UsersTable: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const { usersCRUD } = useAdminCRUD();

  console.log("DATOS DE usersCRUD: ", usersCRUD);

  useEffect(() => {
    if (mockSession.role === "admin") {
      const fetchUsers = async () => {
        try {
          const data = await apiClient.get("/api/auth/users");
          setUsers(data as User[]);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Error al cargar los usuarios.");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    } else {
      setLoading(false);
      setError("No tienes permiso para ver esta sección.");
    }
  }, []);

  if (loading) return <div>Cargando usuarios...</div>;

  if (error) return <div style={{ color: "red" }}>❌ {error}</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={tableHeaderStyle}>Imagen</th>
            <th style={tableHeaderStyle}>Nombre</th>
            <th style={tableHeaderStyle}>Correo</th>
            <th style={tableHeaderStyle}>Rol</th>
            <th style={tableHeaderStyle}>Permisos</th>
          </tr>
        </thead>
        <tbody>
          {usersCRUD.map((user) => (
            <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tableCellStyle}>
                <Image
                  src={user.image}
                  alt={user.name}
                  width={40} 
                  height={40} 
                  style={{ borderRadius: "50%" }}
                />
              </td>
              <td style={tableCellStyle}>{user.name}</td>
              <td style={tableCellStyle}>{user.email}</td>
              <td style={tableCellStyle}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: user.role === 'admin' ? '#c8e6c9' : '#e1f5fe',
                    color: user.role === 'admin' ? '#388e3c' : '#0288d1',
                    fontWeight: 'bold',
                  }}
                >
                  {user.role.toUpperCase()}
                </span>
              </td>
              <td style={tableCellStyle}>{user.permissions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Estilos auxiliares para la tabla
const tableHeaderStyle = { padding: "12px 15px", textAlign: "left" as const };
const tableCellStyle = { padding: "10px 15px", textAlign: "left" as const };


// --- Componente auxiliar para los contenedores de gráficos ---
interface CardProps {
  title: string;
  content: string;
  children?: React.ReactNode;
  flex?: number;
}

const Card: FC<CardProps> = ({ title, content, children, flex }) => (
  <div
    style={{
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      flex: flex || "unset",
      minWidth: "250px",
    }}
  >
    <h3>{title}</h3>
    <p>{content}</p>
    {children}
  </div>
);

// --- Página Dashboard ---

const DashboardPage: FC = () => {
  const userRole = mockSession.role; 

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      {userRole === "admin" && (
        <div style={{ gridColumn: "1 / -1" }}>
          <Card 
            title="👤 Gestión de Usuarios (Admin)" 
            content="Lista completa de usuarios, roles y permisos en la plataforma."
          >
            <UsersTable />
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;