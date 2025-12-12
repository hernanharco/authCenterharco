// Nuevo archivo para la ruta /dashboard
import React, { FC } from 'react';

const DashboardIndexPage: FC = () => {
  return (
    <div>
      <h2>🏠 Bienvenido al Dashboard Principal</h2>
      <p>Utiliza el menú lateral para acceder a la gestión de usuarios y permisos.</p>
      {/* Aquí podrías añadir un componente de resumen general si lo deseas */}
    </div>
  );
};

export default DashboardIndexPage;