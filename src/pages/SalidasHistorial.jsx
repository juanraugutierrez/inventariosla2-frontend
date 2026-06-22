import React, { useState, useEffect } from "react";
import { Table, Card, Button, Modal, Spinner, Alert, Pagination, Row, Col, Badge, Form } from "react-bootstrap";
import { FaEye, FaIdCard, FaBarcode, FaPrint, FaCalendarAlt, FaListOl } from "react-icons/fa";

export default function SalidasHistorial() {
 const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";

  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Controles de Rango de Fechas
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Controles de Paginación Dinámica
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // Estados del Modal de Detalle
  const [showModal, setShowModal] = useState(false);
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null);
  const [detalleItems, setDetalleItems] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    async function obtenerHistorial() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/inventario/salidas-historial`);
        if (res.ok) {
          const data = await res.json();
          // Asegurar orden cronológico descendente (De la más nueva a la más antigua)
          const ordenadas = Array.isArray(data)
            ? data.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro))
            : [];
          setSalidas(ordenadas);
        } else {
          setErrorMsg("No se pudo recuperar el historial de despachos.");
        }
      } catch (err) {
        setErrorMsg("Error de comunicación con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    obtenerHistorial();
  }, [API_URL]);

  const handleVerDetalle = async (item) => {
    if (!item || !item.id) return;
    
    // Almacenamos inmediatamente los metadatos planos que ya residen en la fila
    setSalidaSeleccionada({
      id: item.id,
      folio: item.folio_documento_salida || `OUT-CONF-${item.id}`,
      fecha: item.fecha_registro || new Date(),
      tecnico: String(item.quien_retira || "No especificado").replace(/[()]/g, "").trim(),
      destino: item.identificador_destino_externo || "General",
      motivo: String(item.motivo_operacion || "PROYECTO").replace(/_/g, " "),
      bodega_origen: item.bodega_origen || "Bodega Central",
      observaciones: item.observaciones || "Sin notas adicionales"
    });
    
    setDetalleItems([]);
    setShowModal(true);
    
    try {
      setLoadingDetalle(true);
      // 🔑 COINCIDENCIA DE RUTA: Apunta exactamente a /salida-detalle/ tal como dicta tu Express Router
      const res = await fetch(`${API_URL}/inventario/salida-detalle/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetalleItems(Array.isArray(data.detalle) ? data.detalle : []);
      } else {
        console.error("El backend rechazó la solicitud del desglose de salida.");
      }
    } catch (err) {
      console.error("Error al obtener detalle de salida:", err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatearFechaGrilla = (stringFecha) => {
    if (!stringFecha) return "Sin fecha";
    try {
      const d = new Date(stringFecha);
      if (isNaN(d.getTime())) return "Sin fecha";
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      const hora = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const segs = String(d.getSeconds()).padStart(2, '0');
      return `${dia}/${mes}/${anio}, ${hora}:${mins}:${segs}`;
    } catch (e) {
      return "Sin fecha";
    }
  };

  // 🔍 FILTRADO EN TIEMPO REAL POR FECHAS
  const salidasFiltradas = salidas.filter((item) => {
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

  // 📊 CÓMPUTO DE PAGINACIÓN DINÁMICA
  const totalItemsFiltrados = salidasFiltradas.length;
  const totalPaginas = Math.ceil(totalItemsFiltrados / itemsPorPagina);
  const paginaValida = paginaActual > totalPaginas ? 1 : paginaActual;
  
  const indiceUltimoItem = paginaValida * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const salidasPaginadas = salidasFiltradas.slice(indicePrimerItem, indiceUltimoItem);

  return (
    <div className="container-fluid px-4 py-2">
      
      {/* SECCIÓN INTERFAZ WEB GRILLA HISTORIAL (Se oculta al imprimir) */}
      <div className="no-print">
        <div className="pagetitle mb-4">
          <h2 className="text-dark fw-bold mb-1">📋 Historial de Despachos y Salidas</h2>
          <p className="text-muted small mb-0">Auditoría completa de salidas de stock, actas de responsabilidad y cargos asignados de Servilift.</p>
        </div>

        {/* CONTROLES: FILTROS DE FECHA Y SELECTOR DE LÍNEAS */}
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
            <Spinner animation="border" variant="danger" className="mb-2" />
            <p className="text-muted small fw-bold">Consolidando historial de egresos...</p>
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
                    <th>Folio Interno</th>
                    <th>Destino / Operación</th>
                    <th>Fecha Despacho</th>
                    <th>Técnico / Destinatario</th>
                    <th className="text-end pe-3" style={{ width: "110px" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {salidasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-5 fst-italic">
                        No se registran egresos de stock que coincidan con los criterios.
                      </td>
                    </tr>
                  ) : (
                    salidasPaginadas.map((item) => {
                      const tecnicoLimpio = item.quien_retira ? String(item.quien_retira).replace(/[()]/g, "").trim() : "No especificado";
                      const motivoBase = item.motivo_operacion ? item.motivo_operacion.replace(/_/g, " ") : "";
                      const destinoExterno = item.identificador_destino_externo && item.identificador_destino_externo !== "General"
                        ? ` - ${item.identificador_destino_externo}`
                        : "";

                      return (
                        <tr key={item.id}>
                          <td className="ps-3 fw-bold text-secondary">{item.id}</td>
                          <td className="text-nowrap font-monospace fw-bold text-danger">
                            {item.folio_documento_salida || `OUT-CONF-${item.id}`}
                          </td>
                          <td className="text-uppercase fw-semibold">{`${motivoBase}${destinoExterno}`}</td>
                          <td className="text-secondary fw-medium">{formatearFechaGrilla(item.fecha_registro)}</td>
                          <td className="fw-medium text-dark">{tecnicoLimpio}</td>
                          <td className="text-end pe-3">
                            <Button variant="outline-danger" size="sm" className="py-1 px-2 fw-bold text-uppercase" style={{ fontSize: "0.7rem" }} onClick={() => handleVerDetalle(item)}>
                              <FaEye size={12} /> Auditoría
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        )}

        {/* PAGINACIÓN DINÁMICA */}
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

      {/* MODAL INTERFAZ INTERNA WEB (Se oculta al mandar a imprimir) */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static" className="no-print">
        <Modal.Header closeButton className="bg-light py-2">
          <Modal.Title className="fs-6 fw-bold text-dark">Ficha de Control y Auditoría de Salida</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetalle ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
              <span className="text-muted small">Cargando desglose de materiales...</span>
            </div>
          ) : (
            <div className="p-2">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <div>
                  <h4 className="fw-bold mb-0 text-danger">SERVILIFT S.A.</h4>
                  <small className="text-muted small text-uppercase font-monospace" style={{ fontSize: "0.65rem" }}>Acta de Cargo e Integridad de Materiales en Terreno</small>
                </div>
                <div className="text-end">
                  <h5 className="fw-bold mb-0 text-danger font-monospace">{salidaSeleccionada?.folio}</h5>
                  <Badge bg="danger" className="text-uppercase px-2 py-0 font-monospace" style={{ fontSize: "0.6rem" }}>Vale Operacional</Badge>
                </div>
              </div>

              <Row className="mb-3 small">
                <Col xs={6} className="mb-2">
                  <span className="d-block text-muted small fw-semibold">Tipo de Movimiento:</span>
                  <span className="fw-bold text-danger">🔴 SALIDA / EGRESO DE MATERIALES</span>
                </Col>
                <Col xs={6} className="mb-2">
                  <span className="d-block text-muted small fw-semibold">Fecha Despacho:</span>
                  <span className="fw-bold text-dark">{formatearFechaGrilla(salidaSeleccionada?.fecha)}</span>
                </Col>
                <Col xs={6} className="mb-2">
                  <span className="d-block text-muted small fw-semibold">Destino Operacional / Faena:</span>
                  <span className="fw-bold text-uppercase text-dark">
                    {salidaSeleccionada?.motivo} - {salidaSeleccionada?.destino}
                  </span>
                </Col>
                <Col xs={6} className="mb-2">
                  <span className="d-block text-muted small fw-semibold">Bodega Origen:</span>
                  <span className="fw-bold text-primary">{salidaSeleccionada?.bodega_origen}</span>
                </Col>
              </Row>

              <div className="bg-light p-2 rounded border mb-3 small">
                <h6 className="fw-bold text-secondary text-uppercase mb-1" style={{ fontSize: "0.75rem" }}>Datos Básicos del Receptor</h6>
                <span className="text-muted small">Técnico a Cargo de Responsabilidad Física: </span>
                <span className="fw-bold text-dark text-uppercase">{salidaSeleccionada?.tecnico}</span>
              </div>

              <h6 className="fw-bold text-dark text-uppercase pb-1 border-bottom small mb-2" style={{ fontSize: "0.75rem" }}>Desglose de Ítems Retirados de Stock</h6>

              <Table size="sm" bordered className="align-middle mt-2 small" style={{ fontSize: "0.8rem" }}>
                <thead className="table-secondary text-dark">
                  <tr>
                    <th>SKU</th>
                    <th>Componente / Repuesto Técnico</th>
                    <th className="text-center" style={{ width: "90px" }}>Cantidad</th>
                    <th className="text-end" style={{ width: "120px" }}>Costo Base PPP</th>
                    <th className="text-end" style={{ width: "130px" }}>Subtotal Cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleItems.map((item, idx) => (
                    <tr key={item?.id || idx}>
                      <td className="font-monospace text-secondary fw-bold">{item?.sku}</td>
                      <td className="fw-medium">{item?.descripcion}</td>
                      <td className="text-center fw-bold text-danger">-{item?.cantidad}</td>
                      <td className="text-end font-monospace">${item?.valor_ppp?.toLocaleString("es-CL")}</td>
                      <td className="text-end font-monospace fw-bold">${item?.total?.toLocaleString("es-CL")}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold table-danger text-dark">
                    <td colSpan="4" className="text-end text-uppercase">Total Responsabilidad en Terreno:</td>
                    <td className="text-end font-monospace text-danger fs-6">
                      ${detalleItems.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString("es-CL")}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light py-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>Cerrar</Button>
          <Button variant="danger" size="sm" className="fw-bold d-inline-flex align-items-center gap-1" onClick={handlePrint}>
            <FaPrint size={12} /> Imprimir Acta Cargo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🖨️ ÁREA DE IMPRESIÓN EXCLUSIVA (Formato Puro Blanco y Negro - 1 Hoja Carta) */}
      <div className="print-area">
        <div id="comprobante-servilift">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: "12px" }}>
            <div style={{ width: "60%" }}>
              <h1 style={{ fontWeight: "bold", margin: "0 0 1px 0", fontSize: "20px", color: "#000", fontFamily: "sans-serif" }}>SERVILIFT S.A.</h1>
              <span style={{ fontSize: "10px", color: "#444", fontFamily: "sans-serif" }}>Mantenimiento y Montaje de Elevadores</span>
            </div>
            <div style={{ width: "40%", textAlign: "right" }}>
              <h2 style={{ fontWeight: "bold", margin: "0 0 2px 0", fontSize: "15px", color: "#dc3545", textTransform: "uppercase", fontFamily: "sans-serif" }}>
                Vale de Cargo Técnico
              </h2>
              <div style={{ backgroundColor: "#ffc107", color: "#000", padding: "3px 8px", fontWeight: "bold", fontFamily: "monospace", display: "inline-block", borderRadius: "2px", fontSize: "11px" }}>
                {salidaSeleccionada?.folio}
              </div>
            </div>
          </div>

          <hr style={{ borderTop: "1px solid #999", margin: "5px 0 12px 0" }} />

          <table style={{ width: "100%", border: "none", marginBottom: "12px", fontSize: "11px" }} className="meta-table-print">
            <tbody>
              <tr>
                <td style={{ border: "none", padding: "2px 0", fontWeight: "bold", width: "50%", color: "#000" }}>
                  Bodega Origen: <span style={{ fontWeight: "normal" }}>{salidaSeleccionada?.bodega_origen}</span>
                </td>
                <td style={{ border: "none", padding: "2px 0", fontWeight: "bold", width: "50%", color: "#000" }}>
                  Técnico Receptor:
                </td>
              </tr>
              <tr>
                <td style={{ border: "none", padding: "2px 0", fontWeight: "bold", color: "#000" }}>
                  Fecha Operación: <span style={{ fontWeight: "normal" }}>{formatearFechaGrilla(salidaSeleccionada?.fecha)}</span>
                </td>
                <td style={{ border: "none", padding: "0 0 2px 0", color: "#000", fontWeight: "normal" }}>
                  {salidaSeleccionada?.tecnico}
                </td>
              </tr>
              <tr>
                <td style={{ border: "none", padding: "2px 0" }}></td>
                <td style={{ border: "none", padding: "2px 0", fontWeight: "bold", color: "#000" }}>
                  Destino/Proyecto: <span style={{ fontWeight: "normal" }}>{salidaSeleccionada?.destino}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px", fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#212529", color: "#fff" }}>
                <th style={{ textAlign: "left", fontWeight: "bold", padding: "5px" }}>SKU</th>
                <th style={{ textAlign: "left", fontWeight: "bold", padding: "5px" }}>Descripción</th>
                <th style={{ width: "60px", textAlign: "center", fontWeight: "bold", padding: "5px" }}>Cant.</th>
                <th style={{ width: "90px", textAlign: "right", fontWeight: "bold", padding: "5px" }}>Valor PPP</th>
                <th style={{ width: "90px", textAlign: "right", fontWeight: "bold", padding: "5px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {detalleItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ fontFamily: "monospace", padding: "5px", color: "#000" }}>{item.sku}</td>
                  <td style={{ padding: "5px", color: "#000" }}>{item.descripcion}</td>
                  <td style={{ textAlign: "center", fontWeight: "bold", padding: "5px", color: "#000" }}>{item.cantidad}</td>
                  <td style={{ textAlign: "right", padding: "5px", color: "#000" }}>${item.valor_ppp?.toLocaleString("es-CL")}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold", padding: "5px", color: "#000" }}>${item.total?.toLocaleString("es-CL")}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold", backgroundColor: "#fff" }}>
                <td colSpan="4" style={{ textAlign: "right", padding: "6px 5px", textTransform: "uppercase", fontSize: "10px", border: "none" }}>
                  Monto Total de Responsabilidad:
                </td>
                <td style={{ textAlign: "right", color: "#0d6efd", fontSize: "12px", padding: "6px 5px", border: "1px solid #000" }}>
                  ${detalleItems.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString("es-CL")}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ border: "1px solid #000", backgroundColor: "#fff", padding: "10px", fontSize: "9.5px", lineHeight: "1.3", color: "#000", textAlign: "justify", marginBottom: "35px" }} className="style-justificacion">
            <strong>CLÁUSULA DE RESPONSABILIDAD MATERIAL:</strong> El firmante declara recibir a conformidad las herramientas e insumos descritos en este documento para el uso exclusivo en las operaciones de Servilift. Se deja constancia que la pérdida, extravío o deterioro por negligencia de los activos de clasificación fija faculta a la administración para remitir este folio a fin de gestionar los descuentos correspondientes en su próxima liquidación de remuneraciones.
          </div>

          <div className="text-firmas" style={{ display: "flex", justifyContent: "space-around", marginTop: "40px" }}>
            <div style={{ textAlign: "center", width: "42%" }}>
              <div style={{ borderTop: "1px solid #000", width: "100%", marginBottom: "4px" }}></div>
              <span style={{ fontSize: "10px", color: "#000", fontFamily: "sans-serif" }}>Firma Despachador Bodega</span>
            </div>
            <div style={{ width: "16%" }}></div>
            <div style={{ textAlign: "center", width: "42%" }}>
              <div style={{ borderTop: "1px solid #000", width: "100%", marginBottom: "4px" }}></div>
              <span style={{ fontSize: "10px", color: "#000", fontFamily: "sans-serif" }}>Firma Técnico Conforme</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🖨️ CONTROL ESTRICTO DE ESTILOS CSS DE IMPRESIÓN */}
      <style>{`
        .print-area {
          display: none;
        }

        @media print {
          .no-print, 
          nav, 
          aside, 
          header, 
          .navbar, 
          .sidebar,
          .pagetitle,
          form,
          button,
          .btn,
          .modal-header,
          .modal-footer,
          .modal,
          footer,
          [className*="footer"],
          [id*="footer"],
          #comprobante-servilift + div {
            display: none !important;
          }

          @page {
            size: letter;
            margin: 0mm !important;
          }

          html, body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #root, main, .container-fluid {
            background: #fff !important;
            color: #000 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 25px 30px !important;
            box-sizing: border-box !important;
          }

          #comprobante-servilift {
            display: block !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            padding: 15px !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            background-color: #fff !important;
            page-break-inside: avoid !important;
          }

          .print-area table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            color: #000 !important;
          }
          
          .print-area th {
            background-color: #212529 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 5px !important;
            border: 1px solid #000 !important;
          }

          .print-area td {
            padding: 5px !important;
            border: 1px solid #000 !important;
            color: #000 !important;
          }

          .meta-table-print td {
            border: none !important;
            padding: 2px 0 !important;
          }

          .style-justificacion {
            background-color: #fff !important;
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .text-firmas {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 50px !important;
          }
        }
      `}</style>
    </div>
  );
}