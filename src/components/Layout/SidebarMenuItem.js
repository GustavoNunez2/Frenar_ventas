// src/components/Sidebar/SidebarMenuItem.js
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Usaremos NavLink para el estado activo
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';

function SidebarMenuItem({ item, isSidebarCollapsed }) {
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar si el submenú está abierto

  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const toggleSubmenu = (e) => {
    e.preventDefault(); // Previene la navegación si es un link con submenú
    if (hasSubmenu && !isSidebarCollapsed) { // Solo toggle si no está colapsado y tiene submenú
      setIsOpen(!isOpen);
    }
  };

  // Renderizado condicional del ícono de la flecha de submenú
  const renderSubmenuToggle = () => {
    if (hasSubmenu && !isSidebarCollapsed) { // Muestra la flecha solo si tiene submenú y NO está colapsado
      return (
        <span className="submenu-toggle" onClick={toggleSubmenu}>
          {isOpen ? <FaAngleUp /> : <FaAngleDown />}
        </span>
      );
    }
    return null; // No muestra la flecha si no hay submenú o está colapsado
  };

  // Clase condicional para el contenedor del item de menú
  const itemClasses = `sidebar-menu-item ${isOpen ? 'open' : ''} ${hasSubmenu ? 'has-submenu' : ''}`;

  return (
    <li className={itemClasses}>
      {hasSubmenu ? (
        // Si tiene submenú, el header es clickeable para abrir/cerrar
        <div className="menu-item-header" onClick={toggleSubmenu}>
          <NavLink
            to={item.path || '#'} // Usar '#' si no hay path directo para el padre de submenú
            className={({ isActive }) => `menu-link ${isActive && !isSidebarCollapsed ? 'active' : ''} ${isSidebarCollapsed && !hasSubmenu ? 'icon-only-link' : ''}`}
            end={item.path === '/'} // Para que '/' solo sea activo si es exactamente la ruta
          >
            <span className="menu-icon">{item.icon}</span>
            {!isSidebarCollapsed && <span className="menu-text">{item.title}</span>}
          </NavLink>
          {renderSubmenuToggle()} {/* Renderiza la flecha de submenú */}
        </div>
      ) : (
        // Si es un enlace directo
        <NavLink
          to={item.path}
          className={({ isActive }) => `menu-item-header menu-link ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'icon-only-link' : ''}`}
          end={item.path === '/'}
        >
          <span className="menu-icon">{item.icon}</span>
          {!isSidebarCollapsed && <span className="menu-text">{item.title}</span>}
        </NavLink>
      )}

      {hasSubmenu && (
        <ul className={`submenu ${isOpen ? 'open' : ''}`}>
          {item.submenu.map((subItem, subIndex) => (
            <li key={subIndex} className="submenu-item">
              <NavLink
                to={subItem.path}
                className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
              >
                <span className="submenu-icon">{subItem.icon}</span>
                <span className="submenu-text">{subItem.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default SidebarMenuItem;