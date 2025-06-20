import React from 'react';
import './HomePage.css' // Crearemos este CSS
// Importa aquí otros componentes si los usas en el Dashboard, como gráficos, tarjetas, etc.

function HomePage() {
  return (
    <div className="home-page">
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Ventas Hoy</h3>
          <p>$12,345</p>
        </div>
        <div className="dashboard-card">
          <h3>Productos en Stock</h3>
          <p>543</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;