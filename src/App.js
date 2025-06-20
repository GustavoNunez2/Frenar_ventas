// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import './App.css';

// Importaciones de páginas principales (están directamente en src/components/pages/)
import HomePage from './components/pages/HomePage';
import ProductoPage from './components/pages/ProductoPage';
import VentasPage from './components/pages/VentasPage';
import ComprasPage from './components/pages/ComprasPage';
import ReportesPage from './components/pages/ReportesPage';
import ConfiguracionPage from './components/pages/ConfiguracionPage';

// ¡CORRECCIÓN AQUÍ! Importa SOLO los componentes que necesitas de 'subpages'
// Componentes de submenú de Producto
import ListaProductosPage from './components/pages/subpages/producto/ListaProductosPage';
import ProductImportPage from './components/pages/subpages/producto/ProductImportPage';

// Componentes de submenú de Ventas
import SalesListPage from './components/pages/subpages/ventas/SalesListPage';
import SalesCreatePage from './components/pages/subpages/ventas/SalesCreatePage';

// Componentes de submenú de Compras
import PurchasesListPage from './components/pages/subpages/compras/PurchasesListPage';
import PurchasesCreatePage from './components/pages/subpages/compras/PurchasesCreatePage';

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
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/reportes" element={<ReportesPage />} />

        {/* Rutas de Submenú de Producto */}
        <Route path="/producto/lista" element={<ListaProductosPage />} />
        <Route path="/producto/importar" element={<ProductImportPage />} />

        {/* Rutas de Submenú de Ventas */}
        <Route path="/ventas/lista" element={<SalesListPage />} />
        <Route path="/ventas/crear" element={<SalesCreatePage />} />

        {/* Rutas de Submenú de Compras */}
        <Route path="/compras/lista" element={<PurchasesListPage />} />
        <Route path="/compras/crear" element={<PurchasesCreatePage />} />

        {/* Rutas de Submenú de Reportes */}
        <Route path="/reportes/ventas" element={<SalesSummaryPage />} />
        <Route path="/reportes/compras" element={<SalesReportPage />} />
        <Route path="/reportes/inventario" element={<InventoryReportPage />} />

      </Routes>
    </Layout>
  );
}

export default App;