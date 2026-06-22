import React, { useState, useEffect } from "react";
import { Table, Card, Button, Modal, Spinner, Alert, Pagination, Row, Col, Badge, Form } from "react-bootstrap";
import { FaBoxes, FaEye, FaFileInvoice, FaCalendarAlt, FaIdCard, FaBarcode, FaListOl } from "react-icons/fa";

export default function IngresosHistorial() {
 const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";

  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔍 NUEVOS CONTROLES: Filtros de Fecha Replicados
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // 📊 NUEVOS CONTROLES: Paginación Dinámica Replicada (5, 10, 50, 100 líneas)
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // Estados del Modal de Detalle
  const [showModal, setShowModal] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [detalleItems, setDetalleItems] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    async function obtenerHistorial() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/inventario/movimientos?tipo=ENTRADA`);
        if (res.ok) {
          const data = await res.json();
          // Orden cronológico descendente (de la más nueva a la más antigua)
          const ordenadas = Array.isArray(data)
            ? data.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro))
            : [];
          setMovimientos(ordenadas);
        } else {
          setErrorMsg("No se pudo recuperar el historial de ingresos desde el servidor.");
        }
      } catch (err) {
        setErrorMsg("Error de red al intentar conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    obtenerHistorial();
  }, [API_URL]);

  const handleVerDetalle = async (movimiento) => {
    if (!movimiento || !movimiento.id) return;

    setMovimientoSeleccionado(movimiento);
    setDetalleItems([]);
    setShowModal(true);

    try {
      setLoadingDetalle(true);
      // Conexión corregida al endpoint singular del backend Express
      const res = await fetch(`${API_URL}/inventario/movimiento/${movimiento.id}`);
      
      if (res.ok) {
        const data = await res.json();
        
        // Fusionamos las propiedades y priorizamos el campo real de la Base de Datos
        setMovimientoSeleccionado({
          ...movimiento,
          ...data,
          folio_documento_salida: data.folio_documento_salida || movimiento.folio_documento_salida || data.folio_interno || movimiento.numero_documento || `IN-${movimiento.id}`
        });

        const articulosRaw = data.detalle_movimientos || [];
        
        const articulosFormateados = articulosRaw.map((art) => ({
          id: art.id,
          sku: art.codigo_sku || art.articulos?.codigo_sku || "N/A",
          descripcion: art.nombre_articulo || art.articulos?.nombre || "Componente sin nombre",
          cantidad: parseInt(art.cantidad || 0),
          valor_ppp: parseFloat(art.precio_unitario_operacion || 0),
          total: parseInt(art.cantidad || 0) * parseFloat(art.precio_unitario_operacion || 0)
        }));

        setDetalleItems(articulosFormateados);
      } else {
        console.error("El backend retornó un código de error en la ruta de ingresos.");
      }
    } catch (err) {
      console.error("Error al cargar detalles de la entrada:", err);
      setDetalleItems([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatearFechaEstricta = (stringFecha) => {
    if (!stringFecha) return "Sin fecha";
    try {
      const d = new Date(stringFecha);
      if (isNaN(d.getTime())) return "Sin fecha";
      
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      
      return `${dia}-${mes}-${anio}, ${hora}:${mins}`;
    } catch (e) {
      return "Sin fecha";
    }
  };

  // 🔍 REPLICACIÓN DE FILTRADO EN TIEMPO REAL POR RANGO DE FECHAS
  const movimientosFiltrados = movimientos.filter((item) => {
    if (!item.fecha_registro) return true;
    const fechaItem = new Date(item.fecha_registro);
    
    if (fechaDesde) {
      const desde = new Date(fechaDesde + "T00:00:00");
      if (fechaItem < desde) return false;
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta + "T23:59:59");
      if (fechaItem > hasta) return false;
    }
    return true;
  });

  // 📊 REPLICACIÓN DE CÓMPUTO DE PAGINACIÓN DINÁMICA
  const totalItemsFiltrados = movimientosFiltrados.length;
  const totalPaginas = Math.ceil(totalItemsFiltrados / itemsPorPagina);
  const paginaValida = paginaActual > totalPaginas ? 1 : paginaActual;

  const indiceUltimoItem = paginaValida * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const movimientosPaginados = movimientosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  return (
    <div className="container-fluid px-4 py-2">
      
      {/* SECCIÓN INTERFAZ WEB PRINCIPAL */}
      <div className="no-print">
        <div className="pagetitle mb-4">
          <h2 className="text-dark fw-bold mb-1">📋 Historial de Recepción e Ingresos</h2>
          <p className="text-muted small mb-0">Registro maestro de entradas al inventario, documentos de soporte y vales técnicos de Servilift.</p>
        </div>

        {/* 📊 BARRA DE FILTROS REPLICADA EXACTAMENTE DESDE SALIDAS */}
        <Card className="border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
          <Row className="g-3 align-items-end small">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-1 mb-1">
                  <FaCalendarAlt /> Rango Desde:
                </Form.Label>
                <Form.Control 
                  type="date" 
                  size="sm" 
                  value={fechaDesde} 
                  onChange={(e) => { setFechaDesde(e.target.value); setPaginaActual(1); }} 
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-1 mb-1">
                  <FaCalendarAlt /> Rango Hasta:
                </Form.Label>
                <Form.Control 
                  type="date" 
                  size="sm" 
                  value={fechaHasta} 
                  onChange={(e) => { setFechaHasta(e.target.value); setPaginaActual(1); }} 
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-1 mb-1">
                  <FaListOl /> Líneas por página:
                </Form.Label>
                <Form.Select 
                  size="sm" 
                  value={itemsPorPagina} 
                  onChange={(e) => { setItemsPorPagina(parseInt(e.target.value)); setPaginaActual(1); }}
                >
                  <option value={5}>5 líneas</option>
                  <option value={10}>10 líneas</option>
                  <option value={50}>50 líneas</option>
                  <option value={100}>100 líneas</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" className="mb-2" />
            <p className="text-muted small fw-bold">Sincronizando registros con la API...</p>
          </div>
        ) : errorMsg ? (
          <Alert variant="danger" className="small">{errorMsg}</Alert>
        ) : (
          <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
            <div className="table-responsive">
              <Table hover striped className="align-middle mb-0 small">
                <thead className="table-dark">
                  <tr>
                    <th className="ps-3" style={{ width: "95px" }}><FaIdCard className="me-1" /> ID Reg</th>
                    <th style={{ width: "120px" }}>Operación</th>
                    <th>Motivo / Destino</th>
                    <th><FaCalendarAlt className="me-1" /> Fecha de Recepción</th>
                    <th><FaFileInvoice className="me-1" /> N° Docto Soporte (Folio)</th>
                    <th className="text-end pe-3" style={{ width: "120px" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-5 fst-italic">
                        No se registran movimientos de entrada que coincidan con los criterios.
                      </td>
                    </tr>
                  ) : (
                    movimientosPaginados.map((mov) => (
                      <tr key={mov.id}>
                        <td className="ps-3 fw-bold text-secondary">{mov.id}</td>
                        <td>
                          <Badge bg="success" className="px-2 py-1 text-uppercase" style={{ fontSize: "0.7rem" }}>
                            <FaBoxes className="me-1" /> Entrada
                          </Badge>
                        </td>
                        <td className="text-uppercase fw-semibold" style={{ fontSize: "0.8rem" }}>
                          {mov.motivo_operacion ? mov.motivo_operacion.replace(/_/g, " ") : "INGRESO PROVEEDOR"}
                        </td>
                        <td className="text-secondary fw-medium">
                          {formatearFechaEstricta(mov.fecha_registro)}
                        </td>
                        <td className="font-monospace text-dark fw-bold">
                          {mov.numero_documento || "N/A"}
                        </td>
                        <td className="text-end pe-3">
                          <Button variant="outline-dark" size="sm" className="py-1 px-2 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }} onClick={() => handleVerDetalle(mov)}>
                            <FaEye size={12} /> Ver Ficha
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        )}

        {/* PAGINACIÓN COMPACTA DINÁMICA */}
        {!loading && totalPaginas > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination size="sm">
              <Pagination.First onClick={() => setPaginaActual(1)} disabled={paginaValida === 1} />
              <Pagination.Prev onClick={() => setPaginaActual(paginaValida - 1)} disabled={paginaValida === 1} />
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <Pagination.Item key={num} active={num === paginaValida} onClick={() => setPaginaActual(num)}>
                  {num}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setPaginaActual(paginaValida + 1)} disabled={paginaValida === totalPaginas} />
              <Pagination.Last onClick={() => setPaginaActual(totalPaginas)} disabled={paginaValida === totalPaginas} />
            </Pagination>
          </div>
        )}
      </div>

      {/* MODAL AUDITORÍA INTERFAZ WEB */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static" className="no-print">
        <Modal.Header closeButton className="bg-light py-2">
          <Modal.Title className="fs-6 fw-bold text-dark">Ficha de Recepción Técnica de Materiales</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <div>
                <h4 className="fw-bold mb-0 text-success">SERVILIFT S.A.</h4>
                <small className="text-muted small text-uppercase font-monospace" style={{ fontSize: "0.65rem" }}>Control de Stock e Inventarios</small>
              </div>
              <div className="text-end">
                <h5 className="fw-bold mb-0 text-success font-monospace">
                  {movimientoSeleccionado?.folio_documento_salida || `IN-${movimientoSeleccionado?.id}`}
                </h5>
                <Badge bg="success" className="text-uppercase px-2 py-0 font-monospace" style={{ fontSize: "0.6rem" }}>Vale de Entrada</Badge>
              </div>
            </div>

            <Row className="mb-3 small">
              <Col xs={6} className="mb-2">
                <span className="d-block text-muted small fw-semibold">Tipo de Movimiento:</span>
                <span className="fw-bold text-success">🟢 ENTRADA / INGRESO DE STOCK</span>
              </Col>
              <Col xs={6} className="mb-2">
                <span className="d-block text-muted small fw-semibold">Fecha de Recepción:</span>
                <span className="fw-bold text-dark">
                  {formatearFechaEstricta(movimientoSeleccionado?.fecha_registro)}
                </span>
              </Col>
              <Col xs={6} className="mb-2">
                <span className="d-block text-muted small fw-semibold">Motivo Operacional:</span>
                <span className="fw-bold text-uppercase">{movimientoSeleccionado?.motivo_operacion?.replace(/_/g, " ") || "INGRESO PROVEEDOR"}</span>
              </Col>
              <Col xs={6} className="mb-2">
                <span className="d-block text-muted small fw-semibold">Bodega Destino:</span>
                <span className="fw-bold text-primary">{movimientoSeleccionado?.nombre_bodega_destino || "Bodega Central"}</span>
              </Col>
            </Row>

            <div className="bg-light p-2 rounded border mb-3 small">
              <h6 className="fw-bold text-secondary text-uppercase mb-2 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <FaFileInvoice size={12} /> Documento de Soporte Inicial (Origen)
              </h6>
              <Row>
                <Col xs={4}>
                  <span className="text-muted d-block small">Tipo Documento:</span>
                  <span className="fw-bold text-dark text-uppercase">{movimientoSeleccionado?.tipo_documento || "Factura / Guía"}</span>
                </Col>
                <Col xs={4}>
                  <span className="text-muted d-block small">Número Documento (Folio):</span>
                  <span className="fw-bold text-danger font-monospace">{movimientoSeleccionado?.numero_documento || "N/A"}</span>
                </Col>
                <Col xs={4}>
                  <span className="text-muted d-block small">Proveedor / Emisor:</span>
                  <span className="fw-bold text-dark text-truncate d-block">{movimientoSeleccionado?.proveedor_o_emisor || "No Registrado"}</span>
                </Col>
              </Row>
            </div>

            <h6 className="fw-bold text-dark text-uppercase pb-1 border-bottom small mb-2" style={{ fontSize: "0.75rem" }}>Desglose de Ítems e Insumos Ingresados</h6>

            {loadingDetalle ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" variant="success" className="me-2" />
                <span className="text-muted small">Cargando desglose de repuestos...</span>
              </div>
            ) : (
              <Table size="sm" bordered className="align-middle mt-2 small" style={{ fontSize: "0.8rem" }}>
                <thead className="table-secondary text-dark">
                  <tr>
                    <th>SKU</th>
                    <th>Descripción del Componente</th>
                    <th className="text-center" style={{ width: "90px" }}>Cantidad</th>
                    <th className="text-end" style={{ width: "120px" }}>Costo Unitario</th>
                    <th className="text-end" style={{ width: "130px" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleItems.map((item) => (
                    <tr key={item.id}>
                      <td className="font-monospace text-secondary fw-bold">{item.sku}</td>
                      <td className="fw-medium">{item.descripcion}</td>
                      <td className="text-center fw-bold text-success">+{item.cantidad}</td>
                      <td className="text-end font-monospace">${item.valor_ppp?.toLocaleString("es-CL")}</td>
                      <td className="text-end font-monospace fw-bold">${item.total?.toLocaleString("es-CL")}</td>
                    </tr>
                  ))}
                  <tr className="table-light fw-bold">
                    <td colSpan="4" className="text-end text-uppercase">Total Neto Ponderado Cargado:</td>
                    <td className="text-end font-monospace text-success fs-6">
                      ${detalleItems.reduce((sum, item) => sum + item.total, 0).toLocaleString("es-CL")}
                    </td>
                  </tr>
                </tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light py-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>Cerrar Ficha</Button>
          <Button variant="success" size="sm" className="fw-bold" onClick={handlePrint}>🖨️ Imprimir Acta</Button>
        </Modal.Footer>
      </Modal>

      {/* 🖨 ... SECCIÓN ÁREA DE IMPRESIÓN ESPEJO EXCLUSIVA Y ESTILOS CSS REPLICADOS ... */}
      <div className="print-only-vale-view">
        <div id="comprobante-ingreso-servilift">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: "12px" }}>
            <div style={{ width: "60%" }}>
              <h1 style={{ fontWeight: "bold", margin: "0", fontSize: "21px", color: "#000", fontFamily: "sans-serif" }}>SERVILIFT S.A.</h1>
              <span style={{ fontSize: "10px", color: "#333", fontFamily: "sans-serif", display: "block" }}>Mantenimiento y Montaje de Elevadores</span>
              <span style={{ fontSize: "9px", color: "#555", fontFamily: "sans-serif" }}>Sistema Integral de Control de Inventario</span>
            </div>
            <div style={{ width: "40%", textAlign: "right" }}>
              <h2 style={{ fontWeight: "bold", margin: "0 0 2px 0", fontSize: "15px", color: "#198754", textTransform: "uppercase", fontFamily: "sans-serif" }}>
                Vale de Recepción Bodega
              </h2>
              <div style={{ backgroundColor: "#198754", color: "#fff", padding: "4px 10px", fontWeight: "bold", fontFamily: "monospace", display: "inline-block", borderRadius: "2px", fontSize: "12px" }}>
                {movimientoSeleccionado?.folio_documento_salida || `IN-${movimientoSeleccionado?.id}`}
              </div>
            </div>
          </div>

          <hr style={{ borderTop: "2px solid #000", margin: "5px 0 12px 0" }} />

          <table style={{ width: "100%", marginBottom: "15px", fontSize: "11px", fontFamily: "sans-serif", border: "none" }} className="meta-print-table">
            <tbody>
              <tr>
                <td style={{ padding: "3px 0", fontWeight: "bold", width: "50%", color: "#000" }}>
                  Bodega Destino: <span style={{ fontWeight: "normal" }}>{movimientoSeleccionado?.nombre_bodega_destino || "Bodega Central"}</span>
                </td>
                <td style={{ padding: "3px 0", fontWeight: "bold", width: "50%", color: "#000" }}>
                  Documento Origen: <span style={{ fontWeight: "normal", fontFamily: "monospace" }}>{movimientoSeleccionado?.tipo_documento || "N/A"} — {movimientoSeleccionado?.numero_documento || "N/A"}</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", fontWeight: "bold", color: "#000" }}>
                  Fecha Recepción: <span style={{ fontWeight: "normal" }}>{formatearFechaEstricta(movimientoSeleccionado?.fecha_registro)}</span>
                </td>
                <td style={{ padding: "3px 0", fontWeight: "bold", color: "#000" }}>
                  Proveedor / Emisor: <span style={{ fontWeight: "normal", textTransform: "uppercase" }}>{movimientoSeleccionado?.proveedor_o_emisor || "No Registrado"}</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2" style={{ padding: "3px 0", fontWeight: "bold", color: "#000" }}>
                  Observaciones: <span style={{ fontWeight: "normal", fontStyle: "italic" }}>{movimientoSeleccionado?.observaciones || "Sin observaciones registradas."}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", fontSize: "11px", fontFamily: "sans-serif" }}>
            <thead>
              <tr style={{ backgroundColor: "#198754", color: "#fff" }}>
                <th style={{ textAlign: "left", fontWeight: "bold", padding: "6px", border: "1px solid #000" }}><FaBarcode size={10} className="me-1" /> SKU</th>
                <th style={{ textAlign: "left", fontWeight: "bold", padding: "6px", border: "1px solid #000" }}>Descripción del Componente / Repuesto</th>
                <th style={{ width: "65px", textAlign: "center", fontWeight: "bold", padding: "6px", border: "1px solid #000" }}>Cant.</th>
                <th style={{ width: "95px", textAlign: "right", fontWeight: "bold", padding: "6px", border: "1px solid #000" }}>P. Unitario</th>
                <th style={{ width: "110px", textAlign: "right", fontWeight: "bold", padding: "6px", border: "1px solid #000" }}>Total Tramo</th>
              </tr>
            </thead>
            <tbody>
              {detalleItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontFamily: "monospace", padding: "5px", border: "1px solid #000", color: "#000" }}>{item.sku}</td>
                  <td style={{ padding: "5px", border: "1px solid #000", color: "#000" }}>{item.descripcion}</td>
                  <td style={{ textAlign: "center", fontWeight: "bold", padding: "5px", border: "1px solid #000", color: "#000" }}>+{item.cantidad}</td>
                  <td style={{ textAlign: "right", padding: "5px", border: "1px solid #000", color: "#000" }}>${item.valor_ppp?.toLocaleString("es-CL")}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold", padding: "5px", border: "1px solid #000", color: "#000" }}>${item.total?.toLocaleString("es-CL")}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold", backgroundColor: "#fff" }}>
                <td colSpan="4" style={{ textAlign: "right", padding: "6px", border: "none" }}>
                  Monto Total Neto Integrado:
                </td>
                <td style={{ textAlign: "right", color: "#198754", fontSize: "12px", padding: "6px", border: "2px solid #000" }}>
                  ${detalleItems.reduce((sum, item) => sum + item.total, 0).toLocaleString("es-CL")}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ border: "1px solid #000", backgroundColor: "#fff", padding: "10px", fontSize: "10px", lineHeight: "1.3", color: "#000", textAlign: "justify", marginBottom: "40px", fontFamily: "sans-serif" }}>
            <strong>COMPROBANTE DE VERIFICACIÓN FÍSICA:</strong> La firma de este documento certifica que los insumos y repuestos listados en la parte superior han sido contados, inspeccionados visualmente y validados en cuanto a especificaciones técnicas y SKU correspondientes. Se autoriza formalmente el ingreso contable del lote en los registros de inventario activo y actualización del Precio Promedio Ponderado (PPP) de Servilift S.A.
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "45px" }} className="firmas-container-ingreso">
            <div style={{ textAlign: "center", width: "42%" }}>
              <div style={{ borderTop: "1px solid #000", width: "100%", marginBottom: "4px" }}></div>
              <span style={{ fontSize: "10px", color: "#000", fontFamily: "sans-serif", display: "block", fontWeight: "bold" }}>Encargado de Abastecimiento</span>
              <span style={{ fontSize: "8.5px", color: "#444" }}>Entrega Conforme</span>
            </div>
            <div style={{ width: "16%" }}></div>
            <div style={{ textAlign: "center", width: "42%" }}>
              <div style={{ borderTop: "1px solid #000", width: "100%", marginBottom: "4px" }}></div>
              <span style={{ fontSize: "10px", color: "#000", fontFamily: "sans-serif", display: "block", fontWeight: "bold" }}>Pañolero / Responsable Bodega</span>
              <span style={{ fontSize: "8.5px", color: "#444" }}>Recepción Conformidad</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .print-only-vale-view {
          display: none !important;
        }

        @media print {
          .no-print,
          .modal-header,
          .modal-footer,
          nav,
          header,
          .navbar,
          .sidebar,
          .pagetitle,
          form,
          button,
          .btn {
            display: none !important;
          }

          @page {
            size: letter;
            margin: 0mm !important;
          }

          .modal-open, body {
            overflow: visible !important;
            background-color: #fff !important;
            color: #000 !important;
          }
          
          .modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            background: none !important;
            box-shadow: none !important;
          }

          .modal-dialog {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .modal-content {
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          .print-only-vale-view {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            padding: 20mm 20mm 20mm 20mm !important;
            box-sizing: border-box !important;
            background-color: #fff !important;
          }

          #comprobante-ingreso-servilift {
            display: block !important;
            border: 2px solid #000 !important;
            padding: 20px !important;
            background-color: #fff !important;
            page-break-inside: avoid !important;
          }

          .print-only-vale-view table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .print-only-vale-view th {
            background-color: #198754 !important;
            color: #fff !important;
            border: 1px solid #000 !important;
            padding: 5px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-only-vale-view td {
            border: 1px solid #000 !important;
            padding: 5px !important;
            color: #000 !important;
          }

          .meta-print-table td {
            border: none !important;
            padding: 3px 0 !important;
          }

          .firmas-container-ingreso {
            display: flex !important;
            justify-content: space-between !important;
          }
        }
      `}</style>
    </div>
  );
}