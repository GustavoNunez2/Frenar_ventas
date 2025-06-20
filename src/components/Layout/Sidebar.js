// src/components/Sidebar/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Asegúrate de que Link y useLocation estén importados
import { FaHome,FaWrench, FaUsers, FaBox, FaShoppingCart, FaChartBar, FaCog, FaAngleLeft, FaAngleRight, FaAngleDown, FaAngleUp } from 'react-icons/fa'; // Asegúrate de tener FaAngleDown y FaAngleUp

import SidebarMenuItem from './SidebarMenuItem';
import './Sidebar.css';

function Sidebar({ isCollapsed, toggleSidebar }) {
  const menuItems = [
    {
      title: 'Home',
      path: '/',
      icon: <FaHome />,
      // No tiene 'submenu', SidebarMenuItem lo reconocerá como un enlace directo
    },
    {
      title: 'Producto',
      icon: <FaBox />,
      submenu: [
        { title: 'Lista de Productos', path: '/producto/lista', icon: '●' },
        { title: 'Importar Producto', path: '/producto/importar', icon: '●' },
      ],
    },
    {
      title: 'Ventas',
      icon: <FaShoppingCart />,
      submenu: [
        { title: 'Lista de Ventas', path: '/ventas/lista', icon: '●' },
        { title: 'Crear Venta', path: '/ventas/crear', icon: '●' },
      ],
    },
    {
      title: 'Compras',
      icon: <FaChartBar />,
      submenu: [
        { title: 'Lista de Compras', path: '/compras/lista', icon: '●' },
        { title: 'Crear Compra', path: '/compras/crear', icon: '●' },
      ],
    },
    {
      title: 'Reportes',
      icon: <FaCog />, // Usa un ícono diferente para Reportes si FaCog ya está en Configuración
      submenu: [
        { title: 'Resumen de Ventas', path: '/reportes/ventas', icon: '●' },
        { title: 'Reporte de Compras', path: '/reportes/compras', icon: '●' },
        { title: 'Inventario', path: '/reportes/inventario', icon: '●' },
      ],
    },
    {
      title: 'Configuración',
      path: '/configuracion',
      icon: <FaWrench />,
      // No tiene 'submenu', SidebarMenuItem lo reconocerá como un enlace directo
    },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="logo-wrapper">
            {/* Asegúrate de que tu imagen exista en la carpeta 'public' */}
            <img src="/logo192.png" alt="Facturador" className="sidebar-logo" />
            <h2>Facturador</h2> {/* Cambié 'Facturador APP' a 'Facturador' para que coincida con la imagen */}
          </div>
        )}
        <button onClick={toggleSidebar} className="toggle-button">
          {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <SidebarMenuItem
              key={index}
              item={item}
              isSidebarCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;