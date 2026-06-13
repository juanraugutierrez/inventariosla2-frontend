import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { FaBoxes, FaChartPie, FaCalendarAlt, FaLayerGroup, FaSyncAlt } from "react-icons/fa";

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
    totalSkus: 0 // 🔑 Nueva métrica inicializada
  });
  
  const [stockByCategory, setStockByCategory] = useState([]);
  const [unitsByCategory, setUnitsByCategory] = useState([]);
  const [gastosTerreno, setGastosTerreno] = useState([]);
  const [distribucionSkuPorCategoria, setDistribucionSkuPorCategoria] = useState([]); // 🔑 Nuevo estado para la distribución de SKUs

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // 🔄 FUNCIÓN MAESTRA DE CARGA REUTILIZABLE PARA EL BOTÓN DE ACTUALIZACIÓN
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard`);
      if (!response.ok) throw new Error("Error al obtener las métricas del servidor.");
      
      const data = await response.json();

      // Mapear los KPIs existentes y la nueva métrica totalSkus
      setKpis({
        stockMonetizado: data.kpis?.stockMonetizado || 0,
        activoFisico: data.kpis?.activoFisico || 0,
        activoCirculante: data.kpis?.activoCirculante || 0,
        consumoProyectos: data.kpis?.consumoProyectos || 0,
        emergenciasRepuestos: data.kpis?.emergenciasRepuestos || 0,
        mantenimientoCorrectivo: data.kpis?.mantenimientoCorrectivo || 0,
        herramientasEnTerreno: data.kpis?.herramientasEnTerreno || 0,
        totalSkus: data.kpis?.totalSkus || 0 // 🔑 Consumo del nuevo KPI numérico
      });

      setStockByCategory(data.stockMonetizadoPorCategoria || []);
      setUnitsByCategory(data.unidadesPorCategoria || []);
      setGastosTerreno(data.kpisGastosTerreno || []);
      setDistribucionSkuPorCategoria(data.distribucionSkuPorCategoria || []); // 🔑 Consumo del nuevo arreglo mapeado

      // Capturar fecha y hora de la sincronización
      const ahora = new Date();
      setFechaConsulta(ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
      
      setLoading(false);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [API_URL]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border text-dark mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
        <h6 className="text-secondary fw-semibold">Sincronizando paneles con MySQL de Servilift...</h6>
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
          {/* 🔑 BOTÓN DE ACTUALIZACIÓN REINCORPORADO PERFECTAMENTE */}
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 border shadow-sm bg-white" onClick={fetchDashboardData}>
            <FaSyncAlt /> Sincronizar Ahora
          </button>
          <div className="badge bg-white text-dark shadow-sm px-3 py-2 border rounded-3 d-flex align-items-center gap-2 font-monospace" style={{ fontSize: "0.85rem" }}>
            <FaCalendarAlt className="text-secondary" /> {fechaConsulta} hrs
          </div>
        </div>
      </div>

      {/* BLOQUE 1: TARJETAS DE INDICADORES CLAVE (KPIs) */}
      <div className="row g-3 mb-4">
        {/* KPI 1: Capital Inmovilizado en Bodega */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #0088FE" }}>
            <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Capital Inmovilizado</span>
            <h3 className="fw-bold text-dark my-1 fs-4">{formatCurrency(kpis.stockMonetizado)}</h3>
            <small className="text-muted fs-7">Valorización de existencias totales</small>
          </div>
        </div>

        {/* KPI 2: Activos Circulantes */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #00C49F" }}>
            <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Activo Circulante</span>
            <h3 className="fw-bold text-success my-1 fs-4">{formatCurrency(kpis.activoCirculante)}</h3>
            <small className="text-muted fs-7">Insumos destinados para operaciones</small>
          </div>
        </div>

        {/* KPI 3: Activos Fijos */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card p-3 shadow-sm border-0 bg-white rounded-3 h-100" style={{ borderLeft: "4px solid #FFBB28" }}>
            <span className="text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>Activo Fijo</span>
            <h3 className="fw-bold text-primary my-1 fs-4">{formatCurrency(kpis.activoFisico)}</h3>
            <small className="text-muted fs-7">Herramientas y maquinarias de uso interno</small>
          </div>
        </div>

        {/* 🔑 TARJETA KPI 4 ACTUALIZADA: TOTAL DE SKUs REALES DESDE EL BACKEND */}
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

      {/* BLOQUE 4: SECCIÓN DE VOLUMEN FÍSICO Y GRÁFICO/TABLA DE SKU */}
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

        {/* 🔑 GRÁFICO Y TABLA DE SKU POR CATEGORÍA INTEGRADO TOTALMENTE */}
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