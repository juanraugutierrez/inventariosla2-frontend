import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaUsers, FaUserShield, FaBoxes, FaWarehouse, FaChartPie, 
  FaSignOutAlt, FaPlusCircle, FaMinusCircle, FaHistory, 
  FaClipboardList, FaChevronDown, FaChevronRight, FaUserCircle,
  FaBalanceScale // 🔑 Ícono importado para el mantenedor paramétrico
} from 'react-icons/fa';

export default function Sidebar({ collapsed }) {
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de control para las categorías del menú (Accordion)
  const [openSeguridad, setOpenSeguridad] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openOperaciones, setOpenOperaciones] = useState(false);
  const [openAuditoria, setOpenAuditoria] = useState(false);

  const toggleSeccion = (seccion) => {
    setOpenSeguridad(seccion === 'seguridad' ? !openSeguridad : false);
    setOpenConfig(seccion === 'config' ? !openConfig : false);
    setOpenOperaciones(seccion === 'operaciones' ? !openOperaciones : false);
    setOpenAuditoria(seccion === 'auditoria' ? !openAuditoria : false);
  };

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('usuario_sesion');
    if (sesionGuardada) {
      try {
        const datosParseados = JSON.parse(sesionGuardada);
        const userObj = datosParseados.usuario ? datosParseados.usuario : datosParseados;
        
        setUsuario(userObj);

        // AUTO-EXPANSIÓN DE SEGURIDAD OPERATIVA
        const perfilNormalizado = String(userObj.perfil_nombre || userObj.perfil || userObj.cargo || '').toUpperCase().trim();
        if (perfilNormalizado === 'BODEGUERO' || perfilNormalizado === 'TECNICO') {
          setOpenOperaciones(true);
        }
      } catch (e) {
        console.error("Error cargando sesión en Sidebar", e);
      }
    }
    setLoading(false);
  }, [location]);

  useEffect(() => {
    const ruta = location.pathname.toLowerCase();
    if (ruta.includes('/users') || ruta.includes('/perfiles')) {
      setOpenSeguridad(true); setOpenConfig(false); setOpenOperaciones(false); setOpenAuditoria(false);
    } else if (ruta.includes('/warehouses') || ruta.includes('/products') || ruta.includes('/categorias')) {
      setOpenSeguridad(false); setOpenConfig(true); setOpenOperaciones(false); setOpenAuditoria(false);
    } else if (ruta.includes('/movimientos/') || ruta.includes('/movements/')) {
      setOpenSeguridad(false); setOpenConfig(false); setOpenOperaciones(true); setOpenAuditoria(false);
    } else if (ruta.includes('/inventario/historial-')) {
      setOpenSeguridad(false); setOpenConfig(false); setOpenOperaciones(false); setOpenAuditoria(true);
    }
  }, [location]);

  // 🛡️ DESCODIFICADOR MAESTRO DE PERMISOS REAL
  const tienePermiso = (codigoPermiso) => {
    if (loading || !usuario) return false;

    const perfilNormalizado = String(usuario.perfil_nombre || usuario.perfil || usuario.cargo || '').toUpperCase().trim();
    if (perfilNormalizado === 'ADMINISTRADOR') return true;

    if (perfilNormalizado === 'BODEGUERO') {
      if (codigoPermiso === 'Ingresar Stock' || codigoPermiso === 'Retirar Stock') return true;
    }
    if (perfilNormalizado === 'TECNICO') {
      if (codigoPermiso === 'Retirar Stock') return true;
    }

    const listaOriginal = usuario.permisos || [];
    if (!Array.isArray(listaOriginal)) return false;

    const permisosAplanados = listaOriginal.map(p => {
      if (typeof p === 'string') return p.toLowerCase().trim();
      if (p && typeof p === 'object') {
        if (p.nombre) return String(p.nombre).toLowerCase().trim();
        if (p.permiso && p.permiso.nombre) return String(p.permiso.nombre).toLowerCase().trim();
      }
      return String(p).toLowerCase().trim();
    });

    return permisosAplanados.includes(codigoPermiso.toLowerCase().trim());
  };

  const puedeVerSeguridad = tienePermiso('Administrar Roles') || tienePermiso('Ver y Editar Usuarios');
  const puedeVerInfraestructura = tienePermiso('Crear Bodegas') || tienePermiso('Visualizar Reportes') || tienePermiso('Ingresar Stock') || tienePermiso('Retirar Stock'); 
  const puedeVerOperaciones = tienePermiso('Ingresar Stock') || tienePermiso('Retirar Stock');
  const puedeVerAuditoria = tienePermiso('Visualizar Reportes'); 

  const obtenerClaseRuta = (ruta) => {
    const active = location.pathname === ruta;
    return active 
      ? 'nav-link d-flex align-items-center gap-3 py-2 px-3 fw-bold active bg-dark text-white shadow-sm' 
      : 'nav-link d-flex align-items-center gap-3 py-2 px-3 fw-semibold text-secondary link-dark rounded-2 hover-bg-light';
  };

  const handleCerrarSesion = () => {
    if (window.confirm("¿Desea cerrar su sesión en el sistema ERP?")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  if (loading) return <div className="p-3 text-muted text-center"><small>Cargando menú...</small></div>;

  const perfilVisual = String(usuario?.perfil_nombre || usuario?.perfil || usuario?.cargo || 'OPERADOR').toUpperCase().trim();

  return (
    <div 
      className="d-flex flex-column flex-shrink-0 p-3 bg-white border-end shadow-sm" 
      style={{ 
        width: collapsed ? '78px' : '260px', 
        minHeight: '100vh',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
    >
      <div className={`d-flex align-items-center px-2 mb-3 ${collapsed ? 'justify-content-center' : 'gap-2'}`}>
        <span className="fs-5">📦</span>
        {!collapsed && <span className="fs-5 fw-bold text-dark tracking-tight">Menú Sistema</span>}
      </div>
      <hr className="my-1 text-muted opacity-25" />
      
      <ul className="nav nav-pills flex-column mb-auto gap-1 mt-2" style={{ fontSize: '0.88rem' }}>
        
        {tienePermiso('Visualizar Dashboard') && (
          <li className="nav-item">
            <Link to="/dashboard" className={obtenerClaseRuta('/dashboard')}>
              <FaChartPie size={16} /> 
              {!collapsed && <span>Dashboard General</span>}
            </Link>
          </li>
        )}

        {/* 1. SECCIÓN SEGURIDAD */}
        {puedeVerSeguridad && (
          <li className="nav-item">
            {!collapsed ? (
              <>
                <div 
                  className="d-flex align-items-center justify-content-between text-uppercase text-muted fw-bold px-2 mt-3 mb-1" 
                  style={{ fontSize: '0.68rem', letterSpacing: '0.8px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSeccion('seguridad')}
                >
                  <span>Seguridad y Accesos</span>
                  {openSeguridad ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </div>
                {openSeguridad && (
                  <div className="d-flex flex-column gap-1">
                    {tienePermiso('Ver y Editar Usuarios') && (
                      <Link to="/users" className={obtenerClaseRuta('/users')}>
                        <FaUsers size={16} /> <span>Control Usuarios</span>
                      </Link>
                    )}
                    {tienePermiso('Administrar Roles') && (
                      <Link to="/perfiles" className={obtenerClaseRuta('/perfiles')}>
                        <FaUserShield size={16} className="text-primary" /> <span>Perfiles y Permisos</span>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="border-bottom my-2 opacity-25" title="Seguridad"></div>
            )}
          </li>
        )}

        {/* 2. SECCIÓN INFRAESTRUCTURA */}
        {puedeVerInfraestructura && (
          <li className="nav-item">
            {!collapsed ? (
              <>
                <div 
                  className="d-flex align-items-center justify-content-between text-uppercase text-muted fw-bold px-2 mt-3 mb-1" 
                  style={{ fontSize: '0.68rem', letterSpacing: '0.8px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSeccion('config')}
                >
                  <span>Infraestructura</span>
                  {openConfig ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </div>
                {openConfig && (
                  <div className="d-flex flex-column gap-1">
                    {tienePermiso('Crear Bodegas') && (
                      <Link to="/warehouses" className={obtenerClaseRuta('/warehouses')}>
                        <FaWarehouse size={16} /> <span>Bodegas</span>
                      </Link>
                    )}
                    
                    <Link to="/products" className={obtenerClaseRuta('/products')}>
                      <FaBoxes size={16} /> <span>Productos / SKUs</span>
                    </Link>

                    <Link to="/categorias" className={obtenerClaseRuta('/categorias')}>
                      <FaClipboardList size={16} /> <span>Categorías y Subs</span>
                    </Link>

                    {/* 🔑 NUEVA OPCIÓN DINÁMICA PARAMÉTRICA VINCULADA */}
                    <Link to="/categorias/unidades" className={obtenerClaseRuta('/categorias/unidades')}>
                      <FaBalanceScale size={16} className="text-primary" /> <span>Unidades de Medida</span>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="border-bottom my-2 opacity-25" title="Infraestructura"></div>
            )}
          </li>
        )}

        {/* 3. SECCIÓN OPERACIONES */}
        {puedeVerOperaciones && (
          <li className="nav-item">
            {!collapsed ? (
              <>
                <div 
                  className="d-flex align-items-center justify-content-between text-uppercase text-muted fw-bold px-2 mt-3 mb-1" 
                  style={{ fontSize: '0.68rem', letterSpacing: '0.8px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSeccion('operaciones')}
                >
                  <span>Operaciones</span>
                  {openOperaciones ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </div>
                {openOperaciones && (
                  <div className="d-flex flex-column gap-1">
                    {tienePermiso('Ingresar Stock') && (
                      <Link to="/movimientos/entradas" className={obtenerClaseRuta('/movimientos/entradas')}>
                        <FaPlusCircle size={16} className="text-success" /> <span>Ingresar Stock</span>
                      </Link>
                    )}
                    {tienePermiso('Retirar Stock') && (
                      <Link to="/movements/outputs" className={obtenerClaseRuta('/movements/outputs')}>
                        <FaMinusCircle size={16} className="text-danger" /> <span>Retirar Stock</span>
                      </Link>
                    )}
                    <Link to="/movimientos/traspasos" className={obtenerClaseRuta('/movimientos/traspasos')}>
                      <FaSignOutAlt size={16} className="text-warning" style={{ transform: 'rotate(180deg)' }} /> <span>Traspaso Interno</span>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="border-bottom my-2 opacity-25" title="Operaciones"></div>
            )}
          </li>
        )}

        {/* 4. SECCIÓN HISTORIALES */}
        {puedeVerAuditoria && (
          <li className="nav-item">
            {!collapsed ? (
              <>
                <div 
                  className="d-flex align-items-center justify-content-between text-uppercase text-muted fw-bold px-2 mt-3 mb-1" 
                  style={{ fontSize: '0.68rem', letterSpacing: '0.8px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSeccion('auditoria')}
                >
                  <span>Historiales e Informes</span>
                  {openAuditoria ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </div>
                {openAuditoria && (
                  <div className="d-flex flex-column gap-1">
                    <Link to="/inventario/historial-ingresos" className={obtenerClaseRuta('/inventario/historial-ingresos')}>
                      <FaHistory size={16} /> <span>Historial Entradas</span>
                    </Link>
                    <Link to="/inventario/historial-salidas" className={obtenerClaseRuta('/inventario/historial-salidas')}>
                      <FaHistory size={16} /> <span>Historial Salidas</span>
                    </Link>
                    <Link to="/reports/compras-automaticas" className={obtenerClaseRuta('/reports/compras-automaticas')}>
                      <FaClipboardList size={16} className="text-info" /> <span>Propuestas de Compra</span>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="border-bottom my-2 opacity-25" title="Auditoría"></div>
            )}
          </li>
        )}
      </ul>

      {/* PANEL INFERIOR: INFORMACIÓN DEL OPERADOR ACTIVO */}
      <hr className="my-2 text-muted opacity-25" />
      <div className={`p-2 bg-light rounded-3 border d-flex flex-column ${collapsed ? 'align-items-center' : 'gap-1'}`} style={{ fontSize: '0.82rem' }}>
        {collapsed ? (
          <FaUserCircle size={22} className="text-dark" title={`Operador: ${usuario?.nombre || 'Conectado'}`} />
        ) : (
          <div>
            <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Operador activo:</small>
            <strong className="text-dark d-block text-truncate" style={{ maxWidth: '210px' }}>
              {usuario?.nombre || 'PRUEBA'}
            </strong>
            <span className="badge bg-dark px-2 py-0.5 mt-1 text-uppercase font-sans" style={{ fontSize: '0.62rem', letterSpacing: '0.3px' }}>
              {perfilVisual === '' ? 'BODEGUERO' : perfilVisual}
            </span>
          </div>
        )}
        
        {!collapsed && (
          <button 
            onClick={handleCerrarSesion}
            className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-1 fw-bold mt-1"
            style={{ borderRadius: '4px', fontSize: '0.75rem' }}
          >
            <FaSignOutAlt size={11} /> Cerrar Sesión
          </button>
        )}
      </div>
    </div>
  );
}