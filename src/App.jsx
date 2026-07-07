import { Route, Routes, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Componentes de Layout
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Footer from "./components/Footer.jsx";
import FormularioProducto from "./components/FormularioProducto.jsx";
import FormularioUsuario from "./components/FormularioUsuario.jsx";

// Páginas Maestras y Catálogos
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Users from "./pages/Users.jsx";
import Warehouses from "./pages/Warehouses.jsx";
import Products from "./pages/Products.jsx";
import Reports from "./pages/Reports.jsx";
import Categories from "./pages/Categories.jsx";
import PerfilesYPermisos from "./pages/PerfilesYPermisos.jsx"; 

// Módulos Operativos e Historiales
import StockIngress from "./pages/StockIngress.jsx";
import StockOutput from "./pages/StockOutput.jsx";
import ResumenIngresos from "./pages/IngresosHistorial.jsx";
import SalidasHistorial from "./pages/SalidasHistorial.jsx";

// Gestión de bodegas e integraciones Servilift
import TraspasosInventario from "./pages/TraspasosInventario.jsx";
import SugerenciasCompra from "./pages/SugerenciasCompra.jsx";
import UbicacionesBodega from "./pages/UbicacionesBodega.jsx";
import UbicarArticulo from "./pages/UbicarArticulo.jsx";
import StockPorBodega from "./pages/StockPorBodega.jsx";
import UnidadesMedida from "./pages/UnidadesMedida.jsx";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  
  // 🛡️ GUARDA ATÓMICA DE INICIALIZACIÓN
  const [sesionActiva, setSesionActiva] = useState(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (!sesion) return false;
    try {
      const datos = JSON.parse(sesion);
      return !!(datos.token || datos.usuario?.token || datos.id);
    } catch (e) {
      return false;
    }
  });

  const hideLayout = location.pathname === "/login";

  useEffect(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    
    if (sesion) {
      try {
        const datos = JSON.parse(sesion);
        if (datos.token || datos.usuario?.token || datos.id) {
          setSesionActiva(true);
        } else {
          throw new Error("Sesión inválida.");
        }
      } catch (e) {
        localStorage.clear();
        sessionStorage.clear();
        setSesionActiva(false);
        navigate("/login");
      }
    } else {
      setSesionActiva(false);
      if (location.pathname !== "/login") {
        navigate("/login");
      }
    }

    // Control de inactividad de 5 minutos
    const LIMITE_INACTIVIDAD = 5 * 60 * 1000;

    const verificarInactividad = () => {
      const ultimaActividad = localStorage.getItem('ultima_actividad_erp');
      if (!ultimaActividad) return;

      const ahora = Date.now();
      const registroTiempo = parseInt(ultimaActividad);

      if (isNaN(registroTiempo) || registroTiempo > ahora) {
        localStorage.setItem('ultima_actividad_erp', ahora.toString());
        return;
      }

      const tiempoTranscurrido = ahora - registroTiempo;
      
      if (tiempoTranscurrido >= LIMITE_INACTIVIDAD) {
        console.warn("🔒 Sesión expirada por inactividad prolongada.");
        localStorage.clear();
        sessionStorage.clear();
        setSesionActiva(false);
        window.location.replace('/login');
      }
    };

    const actualizarTimestamp = () => {
      if (localStorage.getItem('usuario_sesion')) {
        localStorage.setItem('ultima_actividad_erp', Date.now().toString());
      }
    };

    window.addEventListener('mousemove', actualizarTimestamp);
    window.addEventListener('keydown', actualizarTimestamp);
    window.addEventListener('click', actualizarTimestamp);
    window.addEventListener('scroll', actualizarTimestamp);

    verificarInactividad();
    const intervaloMonitoreo = setInterval(verificarInactividad, 15000);

    return () => {
      window.removeEventListener('mousemove', actualizarTimestamp);
      window.removeEventListener('keydown', actualizarTimestamp);
      window.removeEventListener('click', actualizarTimestamp);
      window.removeEventListener('scroll', actualizarTimestamp);
      clearInterval(intervaloMonitoreo);
    };
  }, [location.pathname, navigate]);

  return (
    <div className="d-flex flex-column min-h-screen bg-light text-dark">
      {!hideLayout && sesionActiva && <Header collapsed={collapsed} setCollapsed={setCollapsed} />}
      
      <div className="d-flex flex-grow-1">
        {!hideLayout && sesionActiva && <Sidebar collapsed={collapsed} />}
        
        <main className="flex-grow-1 p-3 bg-light" style={{ minWidth: 0 }}>
          <Routes>
            {/* 🔑 RUTAS MAESTRAS PROTEGIDAS */}
            <Route path="/" element={sesionActiva ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/dashboard" element={sesionActiva ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* SEGURIDAD Y ACCESOS */}
            <Route path="/users" element={sesionActiva ? <Users /> : <Navigate to="/login" replace />} />
            <Route path="/users/new" element={sesionActiva ? <FormularioUsuario /> : <Navigate to="/login" replace />} />
            <Route path="/perfiles" element={sesionActiva ? <PerfilesYPermisos /> : <Navigate to="/login" replace />} />
            
            {/* INFRAESTRUCTURA, BODEGAS Y UBICACIONES */}
            <Route path="/warehouses" element={sesionActiva ? <Warehouses /> : <Navigate to="/login" replace />} />
            <Route path="/warehouses/ubicaciones" element={sesionActiva ? <UbicacionesBodega /> : <Navigate to="/login" replace />} />
            <Route path="/warehouses/ubicar-articulo" element={sesionActiva ? <UbicarArticulo /> : <Navigate to="/login" replace />} />
            <Route path="/warehouses/stock" element={sesionActiva ? <StockPorBodega /> : <Navigate to="/login" replace />} />
            
            {/* PRODUCTOS Y CLASIFICACIONES PARAMÉTRICAS */}
            <Route path="/products" element={sesionActiva ? <Products /> : <Navigate to="/login" replace />} />
            <Route path="/products/new" element={sesionActiva ? <FormularioProducto /> : <Navigate to="/login" replace />} />
            <Route path="/categorias" element={sesionActiva ? <Categories /> : <Navigate to="/login" replace />} />
            <Route path="/categorias/unidades" element={sesionActiva ? <UnidadesMedida /> : <Navigate to="/login" replace />} />
            
            {/* MOVIMIENTOS LOGÍSTICOS */}
            <Route path="/movimientos/entradas" element={sesionActiva ? <StockIngress /> : <Navigate to="/login" replace />} />
            <Route path="/movements/outputs" element={sesionActiva ? <StockOutput /> : <Navigate to="/login" replace />} />
            <Route path="/movimientos/traspasos" element={sesionActiva ? <TraspasosInventario /> : <Navigate to="/login" replace />} />
            
            {/* AUDITORÍA HISTÓRICA E INFORMES */}
            <Route path="/inventario/historial-ingresos" element={sesionActiva ? <ResumenIngresos /> : <Navigate to="/login" replace />} />
            <Route path="/inventario/historial-salidas" element={sesionActiva ? <SalidasHistorial /> : <Navigate to="/login" replace />} />
            <Route path="/reports" element={sesionActiva ? <Reports /> : <Navigate to="/login" replace />} />
            <Route path="/reports/compras-automaticas" element={sesionActiva ? <SugerenciasCompra /> : <Navigate to="/login" replace />} />
            
            {/* Comodín de seguridad absoluto */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
      
      {!hideLayout && sesionActiva && <Footer />} 
    </div>
  );
}

// 🔑 CORRECCIÓN DE EXPORTACIÓN: Ahora exporta el componente App maestro de forma correcta
export default App;