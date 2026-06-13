import React, { useState } from "react";
// 🔑 useLocation y los iconos se conservan intactos para resguardar las rutas de Servilift
import { Link, useLocation } from "react-router-dom";
import { 
  FaBars, FaHome, FaUsers, FaWarehouse, FaBoxes, FaChartBar, FaExchangeAlt, 
  FaChevronDown, FaPlusCircle, FaList, FaHistory
} from "react-icons/fa";

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  
  // 🔑 CORRECCIÓN: Variable de estado única para el control del acordeón estricto
  // Almacena el identificador string del menú que está desplegado. Si es "", todos se cierran.
  const [menuAbierto, setMenuAbierto] = useState("movimientos");

  // Función controladora para alternar menús cerrando los demás en el acto
  const handleToggleMenu = (nombreMenu) => {
    if (collapsed) {
      setCollapsed(false);
    }
    setMenuAbierto(menuAbierto === nombreMenu ? "" : nombreMenu);
  };

  return (
    <div className="bg-dark text-light d-flex flex-column p-2 transition-all min-vh-100" style={{ width: collapsed ? "65px" : "240px", transition: "width 0.3s ease", overflowX: "hidden" }}>
      <div className="d-flex justify-content-center my-2">
        {/* Al presionar el botón de colapso general, reiniciamos el estado del acordeón */}
        <button className="btn btn-sm btn-outline-light w-100 py-2 d-flex justify-content-center align-items-center" onClick={() => { setCollapsed(!collapsed); if (!collapsed) { setMenuAbierto(""); } }}><FaBars /></button>
      </div>
      <hr className="text-secondary my-2" />
      <nav className="flex-grow-1">
        <ul className="list-unstyled d-flex flex-column gap-1">
          <li>
            <Link to="/" className="text-light text-decoration-none d-flex align-items-center gap-3 py-2 px-2 rounded hover-effect" onClick={() => setMenuAbierto("")}><FaHome size={18} />{!collapsed && <span>Dashboard</span>}</Link>
          </li>

          {/* DROPDOWN USUARIOS */}
          <li>
            <div className="text-light d-flex align-items-center justify-content-between py-2 px-2 rounded hover-effect" style={{ cursor: "pointer" }} onClick={() => handleToggleMenu("usuarios")}>
              <div className="d-flex align-items-center gap-3"><FaUsers size={18} />{!collapsed && <span>Usuarios</span>}</div>
              {!collapsed && <FaChevronDown size={12} style={{ transform: menuAbierto === "usuarios" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />}
            </div>
            {menuAbierto === "usuarios" && !collapsed && (
              <ul className="list-unstyled ps-4 bg-secondary bg-opacity-25 rounded mt-1 py-1">
                <li><Link to="/users" className="text-white-50 text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}><FaList size={12} /> Listar Usuarios</Link></li>
                <li><Link to="/users/new" className="text-white-50 text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}><FaPlusCircle size={12} /> Agregar Usuario</Link></li>
              </ul>
            )}
          </li>

          {/* DROPDOWN PRODUCTOS */}
          <li>
            <div className="text-light d-flex align-items-center justify-content-between py-2 px-2 rounded hover-effect" style={{ cursor: "pointer" }} onClick={() => handleToggleMenu("productos")}>
              <div className="d-flex align-items-center gap-3"><FaBoxes size={18} />{!collapsed && <span>Productos</span>}</div>
              {!collapsed && <FaChevronDown size={12} style={{ transform: menuAbierto === "productos" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />}
            </div>
            {menuAbierto === "productos" && !collapsed && (
              <ul className="list-unstyled ps-4 bg-secondary bg-opacity-25 rounded mt-1 py-1">
                <li><Link to="/products" className="text-white-50 text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}><FaList size={12} /> Catálogo Completo</Link></li>
                <li><Link to="/products/new" className="text-white-50 text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}><FaPlusCircle size={12} /> Nuevo Producto</Link></li>
                <li><Link to="/categorias" className="text-white-50 text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}><FaList size={12} /> Categorías</Link></li>
              </ul>
            )}
          </li>

          {/* BODEGAS */}
          <li>
            <Link to="/warehouses" className="text-light text-decoration-none d-flex align-items-center gap-3 py-2 px-2 rounded hover-effect" onClick={() => setMenuAbierto("")}><FaWarehouse size={18} />{!collapsed && <span>Bodegas</span>}</Link>
          </li>
          
          {/* MOVIMIENTOS */}
          <li>
            <div className="text-light d-flex align-items-center justify-content-between py-2 px-2 rounded hover-effect" style={{ cursor: "pointer" }} onClick={() => handleToggleMenu("movimientos")}>
              <div className="d-flex align-items-center gap-3"><FaExchangeAlt size={18} />{!collapsed && <span>Movimientos</span>}</div>
              {!collapsed && <FaChevronDown size={12} style={{ transform: menuAbierto === "movimientos" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />}
            </div>
            {/* Se conserva el id y la estructura de clases del bloque para no interferir con la limpieza automática de los vales */}
            {menuAbierto === "movimientos" && !collapsed && (
              <ul id="collapseMovimientos" className="list-unstyled ps-4 bg-secondary bg-opacity-25 rounded mt-1 py-1 d-flex flex-column gap-1 movimientos">
                <li>
                  <Link to="/movimientos/entradas" className="text-white-50 text-decoration-none d-block py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}>
                    📥 Entradas
                  </Link>
                </li>
                <li>
                  <Link to="/movements/outputs" className="text-white-50 text-decoration-none d-block py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.9rem" }}>
                    📤 Salidas
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/inventario/historial-ingresos"
                    className={`text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect ${location.pathname === '/inventario/historial-ingresos' ? 'text-white fw-bold bg-primary bg-opacity-25' : 'text-white-50'}`} 
                    style={{ fontSize: "0.9rem" }}
                  >
                    <FaHistory size={12} />
                    <span>Historial de Ingresos</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/inventario/historial-salidas"
                    className={`text-decoration-none d-flex align-items-center gap-2 py-2 px-2 rounded hover-sub-effect ${location.pathname === '/inventario/historial-salidas' ? 'text-white fw-bold bg-danger bg-opacity-25' : 'text-white-50'}`} 
                    style={{ fontSize: "0.9rem" }}
                  >
                    <FaHistory size={12} className="text-danger" />
                    <span>Historial de Salidas</span>
                  </Link>
                </li>
            </ul>
            )}
          </li>
          
          {/* REPORTES */}
          <li>
            <div className="text-light d-flex align-items-center justify-content-between py-2 px-2 rounded hover-effect" style={{ cursor: "pointer" }} onClick={() => handleToggleMenu("reportes")}>
              <div className="d-flex align-items-center gap-3"><FaChartBar size={18} />{!collapsed && <span>Reportes</span>}</div>
              {!collapsed && <FaChevronDown size={12} style={{ transform: menuAbierto === "reportes" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />}
            </div>
            {menuAbierto === "reportes" && !collapsed && (
              <ul className="list-unstyled ps-4 bg-secondary bg-opacity-25 rounded mt-1 py-1">
                <li><Link to="/reports/stock" className="text-white-50 text-decoration-none d-block py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.85rem" }}>📈 Stock</Link></li>
                <li><Link to="/reports/entries" className="text-white-50 text-decoration-none d-block py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.85rem" }}>📋 Entradas</Link></li>
                <li><Link to="/reports/outputs" className="text-white-50 text-decoration-none d-block py-2 px-2 rounded hover-sub-effect" style={{ fontSize: "0.85rem" }}>📉 Salidas</Link></li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;