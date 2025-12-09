// frontend/src/app/dashboard/page.tsx
"use client";

import React, { FC } from "react";

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
  return (
    // Contenido principal con diseño tipo tarjeta
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      <Card title="📈 Gráfico de Barras" content="Datos de ventas mensuales.">
        <div
          style={{
            height: "200px",
            backgroundColor: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#555",
          }}
        >
          [Espacio para Gráfico de Barras]
        </div>
      </Card>

      <Card
        title="🥧 Gráfico Circular"
        content="Distribución de usuarios por región."
      >
        <div
          style={{
            height: "200px",
            backgroundColor: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#555",
          }}
        >
          [Espacio para Gráfico Circular]
        </div>
      </Card>

      <Card
        title="🚀 Indicador de Ganancias"
        content="Rendimiento del trimestre actual vs. objetivo."
      >
        <div
          style={{
            height: "200px",
            backgroundColor: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#555",
          }}
        >
          [Espacio para Indicador / Gauge]
        </div>
      </Card>

      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <Card
          title="🌐 Mapa de Actividad"
          content="Visualización en tiempo real."
          flex={1}
        />
        <Card
          title="✅ Tareas Pendientes"
          content="Lista de acciones prioritarias."
          flex={1}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
