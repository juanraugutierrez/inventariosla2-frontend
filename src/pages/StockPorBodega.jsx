import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Table, Button, Form, Card, Alert, Row, Col, Spinner, Badge, Pagination } from "react-bootstrap";
import { FaWarehouse, FaBoxes, FaDollarSign, FaArrowRight, FaPlus, FaMinus } from "react-icons/fa";

export default function StockPorBodega() {
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api" : "https://api.sla-inventario.cl/api";

  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  
  const initialBodegaId = query.get("bodegaId") || "";

  // --- 📊 ESTADOS DE CONTROL ---
  const [bodegas, setBodegas] = useState([]);
  const [selectedBodega, setSelectedBodega] = useState(initialBodegaId);
  const [itemsStock, setItemsStock] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- 📊 ESTADOS PARA LA PAGINACIÓN DINÁMICA ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetch(`${API_URL}/bodegas`)
      .then(res => res.json())
      .then(data => setBodegas(data))
      .catch(() => setErrorMsg("Error al obtener el catálogo de bodegas."));
  }, []);

  useEffect(() => {
    if (selectedBodega) {
      fetchStockInventario(selectedBodega);
    } else {
      setItemsStock([]);
    }
  }, [selectedBodega]);

  const fetchStockInventario = async (id) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/bodegas/${id}/stock`);
      if (res.ok) {
        setItemsStock(await res.json());
        setCurrentPage(1);
      } else {
        setErrorMsg("No se pudo procesar el inventario de la instalación.");
      }
    } catch (err) {
      setErrorMsg("Error de conexión de red.");
    } Platform: {
      setLoading(false);
    }
  };

  // --- ⚙️ LÓGICA DE FILTRADO EN TIEMPO REAL ---
  const stockFiltrado = itemsStock.filter(item => 
    item.nombre_articulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.codigo_sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- ⚙️ CÁLCULO DE SEGMENTACIÓN POR PÁGINA ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = stockFiltrado.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stockFiltrado.length / itemsPerPage);

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const totalUnidadesFisicas = itemsStock.reduce((acc, curr) => acc + curr.stock, 0);
  const valorizacionTotalBodega = itemsStock.reduce((acc, curr) => acc + parseFloat(curr.valor_total_item || 0), 0);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">📋 Inventario y Existencias por Bodega</h3>
          <p className="text-muted small mb-0">Auditoría contable de materiales en stock y valorización bajo costo PPP.</p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate("/warehouses")}>
          ← Volver a Instalaciones
        </Button>
      </div>

      {errorMsg && <Alert variant="danger">⚠️ {errorMsg}</Alert>}

      <Card className="border-0 shadow-sm p-3 mb-4 bg-white rounded-3">
        <Row className="align-items-center">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary small mb-1">🏢 Seleccionar Centro de Distribución o Vehículo:</Form.Label>
              <Form.Select 
                value={selectedBodega} 
                onChange={(e) => {
                  setSelectedBodega(e.target.value);
                  navigate(`/warehouses/stock?bodegaId=${e.target.value}`, { replace: true });
                }}
                className="fw-semibold text-dark border-primary"
              >
                <option value="">-- Seleccione una Bodega para Auditar --</option>
                {bodegas.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre} {b.es_central ? " (Central)" : " (Móvil)"}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <div className="d-flex gap-2 justify-content-md-end">
              <Button variant="success" size="sm" className="fw-bold" onClick={() => navigate("/movimientos/entradas")} disabled={!selectedBodega}>
                <FaPlus className="me-1" /> Cargar Stock
              </Button>
              <Button variant="danger" size="sm" className="fw-bold" onClick={() => navigate("/movements/outputs")} disabled={!selectedBodega}>
                <FaMinus className="me-1" /> Rebajar Stock
              </Button>
              <Button variant="dark" size="sm" className="fw-bold" onClick={() => navigate("/movimientos/traspasos")} disabled={!selectedBodega}>
                <FaArrowRight className="me-1" /> Mover a otra Bodega
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {selectedBodega ? (
        loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="dark" />
            <p className="text-muted small mt-2">Calculando inventario y matrices de valor...</p>
          </div>
        ) : (
          <>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Card className="border-0 shadow-sm p-3 bg-dark text-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <span className="small fw-semibold text-muted d-block uppercase">Unidades Totales en Custodia</span>
                      <h2 className="fw-bold m-0 mt-1">{totalUnidadesFisicas.toLocaleString("es-CL")} ítems</h2>
                    </div>
                    <FaBoxes size={36} className="text-muted opacity-50" />
                  </div>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-0 shadow-sm p-3 bg-primary text-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <span className="small fw-semibold text-white-50 d-block uppercase">Valorización Líquida de Inventario</span>
                      <h2 className="fw-bold m-0 mt-1">${Math.round(valorizacionTotalBodega).toLocaleString("es-CL")} CLP</h2>
                    </div>
                    <FaDollarSign size={36} className="text-white-50 opacity-50" />
                  </div>
                </Card>
              </Col>
            </Row>

            <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
              <Card.Header className="bg-light py-2 px-3 border-bottom-0">
                <Row className="g-2 align-items-center">
                  <Col>
                    <Form.Control 
                      type="text" 
                      size="sm" 
                      placeholder="🔎 Filtrar material por SKU o coincidencia de nombre..." 
                      value={busqueda}
                      onChange={handleBusquedaChange}
                      className="bg-white"
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-center gap-2">
                    <Form.Label className="small mb-0 text-muted text-nowrap">Mostrar:</Form.Label>
                    <Form.Select 
                      size="sm" 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      style={{ width: "80px" }}
                      className="fw-semibold text-dark"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Form.Select>
                    <span className="small text-muted mb-0">líneas</span>
                  </Col>
                </Row>
              </Card.Header>
              
              <Table striped hover responsive className="mb-0 align-middle small">
                <thead className="table-secondary">
                  <tr>
                    <th className="ps-3" style={{ width: "130px" }}>SKU</th>
                    <th>Descripción del Insumo / Componente</th>
                    <th>Tipo Contable</th>
                    <th className="text-center" style={{ width: "150px" }}>Cant. Disponible</th>
                    <th className="text-end" style={{ width: "130px" }}>Costo PPP</th>
                    <th className="text-end pe-3" style={{ width: "140px" }}>Total Valorizado</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 🔑 AQUÍ SE CORRIGE EL ERROR: Se reincorpora de forma estricta el mapeo iterativo */}
                  {currentItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ps-3 font-monospace fw-bold text-secondary">{item.codigo_sku}</td>
                      <td className="fw-semibold text-dark">{item.nombre_articulo}</td>
                      <td>
                        <Badge bg={item.tipo_activo === "ACTIVO_FIJO" ? "dark" : "success"}>
                          {item.tipo_activo === "ACTIVO_FIJO" ? "🔧 Fijo" : "📦 Circulante"}
                        </Badge>
                      </td>
                      <td className="text-center fw-bold text-primary text-lowercase">
                        {item.stock} {item.unidad_medida || 'unidades'}
                      </td>
                      <td className="text-end font-monospace">${Math.round(item.ppp).toLocaleString("es-CL")}</td>
                      <td className="text-end pe-3 font-monospace fw-bold text-dark">
                        ${Math.round(item.valor_total_item).toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted fst-italic">
                        No se registran existencias que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <Card.Footer className="bg-white border-top d-flex flex-wrap justify-content-between align-items-center py-2 px-3">
                  <span className="text-muted small">
                    Mostrando del <b>{indexOfFirstItem + 1}</b> al <b>{Math.min(indexOfLastItem, stockFiltrado.length)}</b> de <b>{stockFiltrado.length}</b> registros encontrados.
                  </span>
                  <Pagination size="sm" className="mb-0 my-1">
                    <Pagination.Prev 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1} 
                    />
                    {[...Array(totalPages).keys()].map(page => (
                      <Pagination.Item 
                        key={page + 1} 
                        active={page + 1 === currentPage} 
                        onClick={() => setCurrentPage(page + 1)}
                      >
                        {page + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      disabled={currentPage === totalPages} 
                    />
                  </Pagination>
                </Card.Footer>
              )}
            </Card>
          </>
        )
      ) : (
        <Alert variant="info" className="text-center py-4">
          <FaWarehouse size={28} className="d-block mx-auto mb-2 text-secondary" />
          Por favor, seleccione una instalación o furgón móvil en el menú superior para desplegar las existencias de inventario.
        </Alert>
      )}
    </div>
  );
}