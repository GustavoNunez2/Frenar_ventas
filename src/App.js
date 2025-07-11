// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import './App.css';

// Importaciones de páginas principales 
import HomePage from './components/pages/HomePage';
import ProductoPage from './components/pages/ProductoPage';
import VentasPage from './components/pages/VentasPage';
import ReportesPage from './components/pages/ReportesPage';
import ConfiguracionPage from './components/pages/ConfiguracionPage';

// Componentes de submenú de Producto
import ListaProductosPage from './components/pages/subpages/producto/ListaProductosPage';
import ProductImportPage from './components/pages/subpages/producto/ProductImportPage';

// Componentes de submenú de Ventas
import SalesListPage from './components/pages/subpages/ventas/SalesListPage';
import SalesCreatePage from './components/pages/subpages/ventas/SalesCreatePage';
// Importamos el nuevo componente de Edición
import SalesEditPage from './components/pages/subpages/ventas/SalesEditPage'; 

// Componentes de submenú de Reportes
import SalesSummaryPage from './components/pages/subpages/reportes/SalesSummaryPage';
import SalesReportPage from './components/pages/subpages/reportes/SalesReportPage';
import InventoryReportPage from './components/pages/subpages/reportes/InventoryReportPage';



function App() {
  return (
    <Layout>
      <Routes>
        {/* Rutas principales del menú */}
        <Route path="/" element={<HomePage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />

        {/* Rutas para los elementos del menú principal que también tienen submenú (opcional) */}
        <Route path="/producto" element={<ProductoPage />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/reportes" element={<ReportesPage />} />

        {/* Rutas de Submenú de Producto */}
        <Route path="/producto/lista" element={<ListaProductosPage />} />
        <Route path="/producto/importar" element={<ProductImportPage />} />

        {/* Rutas de Submenú de Ventas */}
        <Route path="/ventas/lista" element={<SalesListPage />} />
        <Route path="/ventas/crear" element={<SalesCreatePage />} />
        {/* --- RUTA DE EDICIÓN AÑADIDA --- */}
        <Route path="/ventas/editar/:ventaId" element={<SalesEditPage />} />

        {/* Rutas de Submenú de Reportes */}
        <Route path="/reportes/ventas" element={<SalesSummaryPage />} />
        <Route path="/reportes/inventario" element={<InventoryReportPage />} />
        {/* Si tienes una ruta específica para SalesReportPage, agrégala aquí */}

      </Routes>
    </Layout>
  );
}

export default App;