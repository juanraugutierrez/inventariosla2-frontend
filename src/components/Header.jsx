import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaBars, FaSignOutAlt, FaCalendarAlt, FaWarehouse, FaChevronRight, FaCircle } from 'react-icons/fa';

export default function Header({ collapsed, setCollapsed }) {
  const location = useLocation();
  const [tituloModulo, setTituloModulo] = useState('Panel de Control');

  // Mapeo dinámico y estético de títulos según la URL activa para informar el módulo
  useEffect(() => {
    const ruta = location.pathname.toLowerCase();
    if (ruta.includes('/dashboard')) setTituloModulo('Dashboard General');
    else if (ruta.includes('/usuarios')) setTituloModulo('Control de Usuarios');
    else if (ruta.includes('/perfiles')) setTituloModulo('Matriz de Perfiles y Permisos');
    else if (ruta.includes('/bodegas')) setTituloModulo('Gestión de Bodegas');
    else if (ruta.includes('/productos')) setTituloModulo('Catálogo de Productos / SKUs');
    else if (ruta.includes('/categorias')) setTituloModulo('Categorías de Inventario');
    else if (ruta.includes('/movimientos/entradas')) setTituloModulo('Ingreso de Stock (Entrada)');
    else if (ruta.includes('/movements/outputs')) setTituloModulo('Retiro de Stock (Salida)');
    else if (ruta.includes('/historial-ingresos')) setTituloModulo('Historial de Entradas');
    else if (ruta.includes('/historial-salidas')) setTituloModulo('Historial de Salidas');
    else setTituloModulo('Panel Operativo');
  }, [location]);

 // src/components/Header.jsx (Fragmento de la función de cierre)
const handleCerrarSesion = () => {
  if (window.confirm("¿Desea cerrar su sesión en el sistema ERP de Inventarios?")) {
    localStorage.clear(); // Purgado total
    sessionStorage.clear();
    window.location.replace('/login'); // Elimina el historial para evitar re-ingresos con la flecha atrás
  }
};

  // Obtener fecha formateada profesional
  const fechaActual = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-dark px-3 shadow-sm border-bottom border-secondary border-opacity-25" style={{ height: '60px' }}>
      <div className="d-flex align-items-center w-100 justify-content-between">
        
        {/* LADO IZQUIERDO: Toggle Menú + Nombre del Sistema + Módulo Activo */}
        <div className="d-flex align-items-center gap-3">
          <button 
            className="btn btn-dark border-0 p-2 d-flex align-items-center justify-content-center rounded-3"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            <FaBars size={18} />
          </button>
          
          {/* Identificación Maestra del Sistema */}
          <div className="d-flex align-items-center gap-2 text-white border-start border-secondary border-opacity-50 ps-3">
            <FaWarehouse className="text-secondary opacity-75" size={15} />
            <span className="fw-bold tracking-wide m-0" style={{ fontSize: '0.95rem', letterSpacing: '0.3px' }}>
              Sistema de Gestión de Inventarios
            </span>
          </div>

          {/* 🌟 INFORMACIÓN DEL MÓDULO ACTIVO DE CONTEXTO */}
          <div className="d-none d-xl-flex align-items-center gap-2 text-secondary ps-2" style={{ fontSize: '0.9rem' }}>
            <FaChevronRight size={10} className="text-muted opacity-50" />
            <FaCircle size={6} className="text-success me-1 pulse-dot" />
            <span className="fw-semibold text-white text-opacity-75">{tituloModulo}</span>
          </div>
        </div>

        {/* LADO DERECHO: Fecha del Sistema + Botón Salir Funcional */}
        <div className="d-flex align-items-center gap-4">
          <div className="d-none d-lg-flex align-items-center gap-2 text-secondary small fw-semibold">
            <FaCalendarAlt size={12} />
            <span className="text-capitalize text-opacity-75">{fechaActual}</span>
          </div>

          <button 
            onClick={handleCerrarSesion}
            className="btn btn-sm btn-danger d-flex align-items-center gap-2 px-3 py-1.5 fw-bold text-white shadow-sm border-0 rounded-2"
            style={{ transition: 'all 0.2s ease', letterSpacing: '0.5px' }}
          >
            <FaSignOutAlt size={13} />
            <span>Salir</span>
          </button>
        </div>

      </div>
    </header>
  );
}