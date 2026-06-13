import { Route, Routes, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// 🗂️ Componentes de Estructura / Layout
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Footer from "./components/Footer.jsx";
import FormularioProducto from "./components/FormularioProducto.jsx";
import FormularioUsuario from "./components/FormularioUsuario.jsx";

// 📄 Páginas Maestras y Catálogos
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Users from "./pages/Users.jsx";
import Warehouses from "./pages/Warehouses.jsx";
import Products from "./pages/Products.jsx";
import Reports from "./pages/Reports.jsx";
import Categories from "./pages/Categories.jsx"; // Sincronizado con extensión .jsx por consistencia

// 📦 Módulos Operativos de Inventario y Movimientos
import StockIngress from "./pages/StockIngress.jsx";
import StockOutput from "./pages/StockOutput.jsx";

// 🔍 Auditoría e Historiales Dinámicos
import ResumenIngresos from "./pages/IngresosHistorial.jsx"; // Importación nativa mapeada
import SalidasHistorial from "./pages/SalidasHistorial.jsx";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  
  // --- 🔑 ESTADO DE SESIÓN ACTIVA ---
  const [sesionActiva, setSesionActiva] = useState(false);
  const [loading, setLoading] = useState(true);

  // Al encender la aplicación, verificamos si existe un token válido en el navegador
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token"); //
    if (token) { //
      setSesionActiva(true); //
    } else { //
      setSesionActiva(false); //
    } //
    setLoading(false); //
  }, [location.pathname]); //

  // Función para limpiar credenciales y expulsar al usuario (Logout)
  const handleLogout = () => {
    localStorage.removeItem("token"); //
    localStorage.removeItem("usuario_nombre"); //
    localStorage.removeItem("usuario_rol"); //
    sessionStorage.clear(); //
    setSesionActiva(false); //
    navigate("/login", { replace: true }); // Redirección inmediata a la pantalla de acceso
  };

  // Callback que llamará tu componente Login.jsx cuando la API devuelva un éxito
  const handleLoginSuccess = () => {
    setSesionActiva(true); //
    navigate("/", { replace: true }); //
  };

  if (loading) { //
    return ( //
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light"> //
        <div className="spinner-border text-dark" role="status"></div> //
        <span className="ms-2 text-muted fw-bold">Verificando credenciales...</span> //
      </div> //
    ); //
  }

  // Interceptor: Si no está logueado y trata de ver rutas privadas, lo mandamos al login
  const hideLayout = location.pathname === "/login"; //
  if (!sesionActiva && !hideLayout) { //
    return <Navigate to="/login" replace />; //
  }

  return (
    <div className="d-flex flex-column min-vh-100"> //
      {/* 🔑 PASAMOS LA FUNCIÓN DE LOGOUT AL HEADER */}
      {!hideLayout && <Header onLogout={handleLogout} />} 
      
      <div className="d-flex flex-grow-1"> //
        {!hideLayout && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />} 
        
        <main className="flex-grow-1 p-3" style={{ backgroundColor: "#f8f9fa" }}> //
          <Routes> //
            <Route path="/" element={<Dashboard />} /> //
            <Route path="/dashboard" element={<Dashboard />} /> //
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} /> //
            <Route path="/users" element={<Users />} /> //
            <Route path="/users/new" element={<FormularioUsuario />} /> //
            <Route path="/warehouses" element={<Warehouses />} /> //
            <Route path="/products" element={<Products />} /> //
            <Route path="/categorias" element={<Categories />} /> //
            <Route path="/products/new" element={<FormularioProducto />} /> //
            <Route path="/reports" element={<Reports />} /> //
            
            {/* 🛠️ MÓDULOS DE LOGÍSTICA OPERATIVA Y REGISTROS */}
            <Route path="/movimientos/entradas" element={<StockIngress />} /> //
            <Route path="/movements/outputs" element={<StockOutput />} /> //
            
            {/* 🔍 LIBROS HISTÓRICOS DE AUDITORÍA CENTRAL DE STOCK */}
            <Route path="/inventario/historial-ingresos" element={<ResumenIngresos />} /> //
            <Route path="/inventario/historial-salidas" element={<SalidasHistorial />} /> //
            
            {/* Redirección preventiva por URL rota */}
            <Route path="*" element={<Navigate to={sesionActiva ? "/" : "/login"} replace />} /> //
          </Routes> //
        </main> //
      </div> //
      
      {!hideLayout && <Footer />} 
    </div> //
  );
}

export default App; //