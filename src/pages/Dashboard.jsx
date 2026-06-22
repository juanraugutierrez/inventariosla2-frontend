import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { FaBoxes, FaCalendarAlt, FaLayerGroup, FaSyncAlt } from "react-icons/fa";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [fechaConsulta, setFechaConsulta] = useState("");
  const [kpis, setKpis] = useState({
    stockMonetizado: 0,
    activoFisico: 0,
    activoCirculante: 0,
    consumoProyectos: 0,
    emergenciasRepuestos: 0,
    mantenimientoCorrectivo: 0,
    herramientasEnTerreno: 0,
    totalSkus: 0 
  });
  
  const [stockByCategory, setStockByCategory] = useState([]);
  const [unitsByCategory, setUnitsByCategory] = useState([]);
  const [gastosTerreno, setGastosTerreno] = useState([]);
  const [distribucionSkuPorCategoria, setDistribucionSkuPorCategoria] = useState([]); 

  // 🛡️ ENRUTADOR DE ENTORNOS SEGURO: Evita Contenido Mixto en nube y errores de OpenSSL en Local
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";     // ☁️ Servidor de Producción (HTTPS Seguro)
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // 🔄 FUNCIÓN MAESTRA DE CARGA ADAPTADA A FORMATOS DE RED
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Extraer el token de autorización de la sesión para poblar las métricas reales
      const sesionGuardada = localStorage.getItem('usuario_sesion');
      let token = "";
      if (sesionGuardada) {
        try {
          const datosParseados = JSON.parse(sesionGuardada);
          token = datosParseados.token || datosParseados.usuario?.token || "";
        } catch (e) {
          console.error("Error al desempaquetar token de sesión:", e);
        }
      }

      const response = await fetch(`${API_URL}/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) throw new Error("Error al obtener las métricas del servidor.");
      
      const resRaw = await response.json();
      
      // Desempaquetador por si la API viene envuelta en .data por proxies inversos
      const data = resRaw.data ? resRaw.data : resRaw;
      
      console.log("📊 [DEBUG] Datos procesados en el Dashboard:", data);

      // Asignación estricta de variables numéricas desde el JSON
      if (data && data.kpis) {
        setKpis({
          stockMonetizado: Number(data.kpis.stockMonetizado || 0),
          activoFisico: Number(data.kpis.activoFisico || 0),
          activoCirculante: Number(data.kpis.activoCirculante || 0),
          consumoProyectos: Number(data.kpis.consumoProyectos || 0),
          emergenciasRepuestos: Number(data.kpis.emergenciasRepuestos || 0),
          mantenimientoCorrectivo: Number(data.kpis.mantenimientoCorrectivo || 0),
          herramientasEnTerreno: Number(data.kpis.herramientasEnTerreno || 0),
          totalSkus: Number(data.kpis.totalSkus || 0)
        });
      }

      // Inyección segura de arreglos para evitar fallos de renderizado en Recharts
      setStockByCategory(Array.isArray(data.stockMonetizadoPorCategoria) ? data.stockMonetizadoPorCategoria : []);
      setUnitsByCategory(Array.isArray(data.unidadesPorCategoria) ? data.unidadesPorCategoria : []);
      setGastosTerreno(Array.isArray(data.kpisGastosTerreno) ? data.kpisGastosTerreno : []);
      setDistribucionSkuPorCategoria(Array.isArray(data.distribucionSkuPorCategoria) ? data.distribucionSkuPorCategoria : []);

      const ahora = new Date();
      setFechaConsulta(ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
      
      setLoading(false);
    } catch (error) {
      console.error("❌ Error mapeando el JSON del dashboard:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border text-dark mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
        <h6 className="text-secondary fw-semibold">Sincronizando paneles operacionales con el servidor...</h6>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3 bg-light" style={{ minHeight: "100vh" }}>
      
      {/* ENCABEZADO MAESTRO */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold text-dark m-0">📊 Panel de Control Logístico</h4>
          <small className="text-muted">Indicadores Operacionales y Financieros globales</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 border shadow-sm bg-white font-sans fw-bold" onClick={fetchDashboardData}>
            <FaSyncAlt /> Sincronizar Ahora
          </button>
          <div className="badge bg-white text-dark shadow-sm px-3 py-2 border rounded-3 d-flex align-items-center gap-2 font-monospace" style={{ fontSize: "0.85rem" }}>
            <FaCalendarAlt className="text-secondary" /> {fechaConsulta} hrs
          </div>
        </div>
      </div>

      {/* BLOQUE 1: TARJETAS DE INDICADORES CLAVE (KPIs) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #0088FE" }}>
            <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Capital Inmovilizado</span>
            <h3 className="fw-bold text-dark my-1 fs-4">{formatCurrency(kpis.stockMonetizado)}</h3>
            <small className="text-muted fs-7">Valorización de existencias totales</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #00C49F" }}>
            <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Activo Circulante</span>
            <h3 className="fw-bold text-success my-1 fs-4">{formatCurrency(kpis.activoCirculante)}</h3>
            <small className="text-muted fs-7">Insumos destinados para operaciones</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #FFBB28" }}>
            <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Activo Fijo</span>
            <h3 className="fw-bold text-primary my-1 fs-4">{formatCurrency(kpis.activoFisico)}</h3>
            <small className="text-muted fs-7">Herramientas y maquinarias de uso interno</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #212529" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Modelos Catalogados</span>
                <h3 className="fw-bold text-dark my-1 fs-4">{kpis.totalSkus} SKUs</h3>
                <small className="text-muted fs-7">Códigos únicos Code 128 activos</small>
              </div>
              <div className="bg-light p-2 rounded-circle text-dark d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                <FaBoxes size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: KPIs AUXILIARES DE GASTOS Y FLUJO EN TERRENO */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-dark text-white rounded-3 h-100">
            <span className="text-light opacity-75 fw-bold text-uppercase font-monospace" style={{ fontSize: "0.65rem" }}>Inversión en Proyectos</span>
            <h4 className="fw-bold my-1 fs-5">{formatCurrency(kpis.consumoProyectos)}</h4>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-dark text-white rounded-3 h-100">
            <span className="text-light opacity-75 fw-bold text-uppercase font-monospace" style={{ fontSize: "0.65rem" }}>Mantenimiento Correctivo</span>
            <h4 className="fw-bold my-1 fs-5">{formatCurrency(kpis.mantenimientoCorrectivo)}</h4>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-dark text-white rounded-3 h-100">
            <span className="text-light opacity-75 fw-bold text-uppercase font-monospace" style={{ fontSize: "0.65rem" }}>Emergencias / Repuestos</span>
            <h4 className="fw-bold my-1 fs-5">{formatCurrency(kpis.emergenciasRepuestos)}</h4>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-dark text-white rounded-3 h-100">
            <span className="text-light opacity-75 fw-bold text-uppercase font-monospace" style={{ fontSize: "0.65rem" }}>Herramientas Desplegadas</span>
            <h4 className="fw-bold my-1 fs-5">{kpis.herramientasEnTerreno} u.</h4>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: GRÁFICOS ANALÍTICOS DE VALORIZACIONES Y COSTOS */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100">
            <h6 className="fw-bold text-dark mb-3">Valorización Financiera de Existencias por Categoría</h6>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="valor" name="Capital Inmovilizado" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100">
            <h6 className="fw-bold text-dark mb-3">Costo Consolidado de Salidas de Materiales</h6>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosTerreno} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(val) => `$${(val / 100000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="monto" name="Costo Total Salidas" fill="#FF8042" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 4: SECCIÓN DE VOLUMEN FÍSICO Y TABLA DE SKU */}
      <div className="row g-4">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100">
            <h6 className="fw-bold text-dark mb-2">Distribución Porcentual de Volumen Físico</h6>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="unidades"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    style={{ fontSize: "10px", fontWeight: "bold" }}
                  >
                    {unitsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} unidades`, "Cantidad"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-7">
          <div className="card shadow-sm border-0 bg-white rounded-3 h-100">
            <div className="card-header bg-white py-3 border-0 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaLayerGroup className="text-secondary" />
                <h6 className="mb-0 fw-bold text-dark">Densidad y Variedad de SKU por Categoría</h6>
              </div>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table align-middle m-0" style={{ fontSize: "0.9rem" }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-3 border-0 text-secondary font-monospace fw-bold" style={{ fontSize: "0.75rem" }}>Categoría Logística</th>
                    <th className="text-center border-0 text-secondary font-monospace fw-bold" style={{ fontSize: "0.75rem", width: "130px" }}>Modelos SKU</th>
                    <th className="pe-3 border-0 text-secondary font-monospace fw-bold" style={{ fontSize: "0.75rem", width: "180px" }}>Proporción Catálogo</th>
                  </tr>
                </thead>
                <tbody>
                  {distribucionSkuPorCategoria.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted fst-italic">
                        No hay artículos ni SKUs vinculados actualmente en el catálogo.
                      </td>
                    </tr>
                  ) : (
                    distribucionSkuPorCategoria.map((item, index) => {
                      const porcentaje = kpis.totalSkus > 0 
                        ? ((item.cantidad / kpis.totalSkus) * 100).toFixed(1) 
                        : 0;
                      return (
                        <tr key={index}>
                          <td className="ps-3 fw-semibold text-dark">{item.categoria}</td>
                          <td className="text-center fw-bold font-monospace text-secondary">{item.cantidad} u.</td>
                          <td className="pe-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress w-100 bg-light" style={{ height: "6px", borderRadius: "3px" }}>
                                <div className="progress-bar bg-dark" style={{ width: `${porcentaje}%`, borderRadius: "3px" }}></div>
                              </div>
                              <span className="small fw-bold text-muted font-monospace" style={{ minWidth: "40px", textAlign: "right" }}>{porcentaje}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;