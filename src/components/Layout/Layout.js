// src/components/Layout/Layout.js
import React, { useState } from 'react'; // Importa useState
import './Layout.css';
import Sidebar from '../../components/Layout/Sidebar';

function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Estado para controlar si el sidebar está colapsado

  // Función para alternar el estado del sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="layout-container">
      {/* Pasa el estado y la función al Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      {/* Aplica una clase condicional al contenido principal */}
      <main className={`layout-content ${isSidebarCollapsed ? 'collapsed-margin' : ''}`}>
        {children} {/* Aquí se renderizarán los componentes de la página actual */}
      </main>
    </div>
  );
}

export default Layout;