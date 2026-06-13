import React from "react";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";

export default function Header({ onLogout }) {
  // Rescatamos de forma dinámica el nombre que guardó el login al autenticarse
  const nombreUsuario = localStorage.getItem("usuario_nombre") || "Usuario Activo";
  const rolUsuario = localStorage.getItem("usuario_rol") || "Operario";

  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-dark px-3 shadow-sm border-bottom border-secondary border-opacity-25">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        
        {/* Marca / Identificador Corporativo */}
        <span className="navbar-brand fw-bold m-0 fs-5 text-uppercase tracking-wider">
          📦 Sistema de Inventario Central
        </span>

        {/* Bloque Informativo de Sesión y Botón de Desconexión */}
        <div className="d-flex align-items-center gap-3">
          
          {/* Badge Informativo de Usuario */}
          <div className="d-none d-sm-flex flex-column text-end">
            <span className="text-white small fw-bold mb-0">
              <FaUserCircle className="me-1 text-info" /> {nombreUsuario}
            </span>
            <span className="text-muted" style={{ fontSize: "10px", fontWeight: "600" }}>
              {rolUsuario}
            </span>
          </div>

          {/* 🔑 EL BOTÓN DE SALIR AUSENTE: Ahora implementado con acción directa */}
          <button
            type="button"
            className="btn btn-sm btn-danger fw-bold d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm rounded border-0"
            onClick={onLogout}
            title="Cerrar sesión de forma segura"
          >
            <FaSignOutAlt size={13} />
            <span className="d-none d-md-inline" style={{ marginLeft: "4px" }}>Salir</span>
          </button>

        </div>

      </div>
    </header>
  );
}