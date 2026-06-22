import React, { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Row, Col, Table, Spinner } from "react-bootstrap";
import { FaMinusCircle, FaWarehouse, FaBarcode, FaTrash, FaUserCheck, FaPrint } from "react-icons/fa";

export default function StockOutput() {
 const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";

  const [bodegas, setBodegas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [valeImpresion, setValeImpresion] = useState(null);

  const [formCabecera, setFormCabecera] = useState({
    bodega_id: "",
    quien_retira: "",
    motivo_operacion: "PROYECTO",
    identificador_destino_externo: "",
    observaciones: ""
  });

  const [skuBusqueda, setSkuBusqueda] = useState("");
  const [articulosLote, setArticulosLote] = useState([]);

  useEffect(() => {
    async function inicializarSalidas() {
      try {
        setLoading(true);
        const [resB, resP, resU] = await Promise.all([
          fetch(`${API_URL}/bodegas`),
          fetch(`${API_URL}/productos`),
          fetch(`${API_URL}/users`)
        ]);

        if (resB.ok && resP.ok && resU.ok) {
          setBodegas(await resB.json());
          setProductos(await resP.json());
          setUsuarios(await resU.json());
        } else {
          setErrorMsg("Error al obtener los catálogos maestros o el personal registrado.");
        }
      } catch (err) {
        setErrorMsg("Error de red al intentar conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    inicializarSalidas();
  }, [API_URL]);

  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const skuLimpiado = skuBusqueda.trim().toUpperCase();
      const prod = productos.find(p => p.codigo_sku.toUpperCase() === skuLimpiado);

      if (!prod) {
        alert("El SKU escaneado no existe.");
        setSkuBusqueda("");
        return;
      }

      const existe = articulosLote.find(item => item.articulo_id === prod.id);
      if (existe) {
        setArticulosLote(articulosLote.map(item => item.articulo_id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      } else {
        setArticulosLote([...articulosLote, {
          articulo_id: prod.id,
          codigo_sku: prod.codigo_sku,
          nombre: prod.nombre,
          precio_promedio: Math.round(prod.precio_promedio),
          cantidad: 1
        }]);
      }
      setSkuBusqueda("");
    }
  };

  const handleCambiarCantidad = (id, valor) => {
    setArticulosLote(articulosLote.map(item => item.articulo_id === id ? { ...item, cantidad: parseInt(valor) || 1 } : item));
  };

  const handleRemoverItem = (id) => {
    setArticulosLote(articulosLote.filter(item => item.articulo_id !== id));
  };

  const handleProcesarDespacho = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formCabecera.bodega_id) {
      setErrorMsg("Debe seleccionar una bodega de origen.");
      return;
    }
    if (!formCabecera.quien_retira) {
      setErrorMsg("Debe seleccionar obligatoriamente a un técnico registrado.");
      return;
    }
    if (articulosLote.length === 0) {
      setErrorMsg("Debe escanear al menos un producto para despachar.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/inventario/salida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formCabecera,
          articulos_movimiento: articulosLote
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Salida autorizada de forma conforme.");
        setValeImpresion({
          folio: data.folio,
          cabecera: formCabecera,
          articulos: articulosLote,
          fecha: new Date().toLocaleString(),
          total: articulosLote.reduce((acc, i) => acc + (i.cantidad * i.precio_promedio), 0)
        });
      } else {
        setErrorMsg(data.error || "La base de datos rechazó el egreso.");
      }
    } catch (err) {
      setErrorMsg("Fallo crítico de comunicación.");
    }
  };

  // ⚡ 3. NUEVA FUNCIÓN: IMPRIMIR TICKET, LIMPIAR FORMULARIO Y CONTROLAR EL SIDEBAR NATIVO
  const handleImprimirYLimpiarFormulario = () => {
    // A. Disparar el flujo de impresión nativo del navegador
    window.print();

    // B. Resetear por completo la cabecera y el listado del lote para otra operación
    setArticulosLote([]);
    setFormCabecera({
      bodega_id: "",
      quien_retira: "",
      motivo_operacion: "PROYECTO",
      identificador_destino_externo: "",
      observaciones: ""
    });
    setSkuBusqueda("");
    setValeImpresion(null); // Ocultar el panel del vale impreso

    // C. Controlar el colapso del sidebar mediante manipulación defensiva del DOM
    const submenusAbiertos = document.querySelectorAll('.sidebar .collapse.show, .sidebar .show');
    submenusAbiertos.forEach(menu => {
      // Contraer todas las secciones excepto el dropdown específico de movimientos
      if (!menu.id.toLowerCase().includes('movimientos') && !menu.className.toLowerCase().includes('movimientos')) {
        menu.classList.remove('show');
      }
    });

    const botonesActivos = document.querySelectorAll('.sidebar .nav-link[aria-expanded="true"]');
    botonesActivos.forEach(boton => {
      if (!boton.innerText.toLowerCase().includes('movimientos')) {
        boton.setAttribute('aria-expanded', 'false');
        boton.classList.add('collapsed');
      }
    });
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="dark" /><p className="mt-2 text-muted fw-bold">Sincronizando nómina de personal autorizado de Servilift...</p></div>;

  return (
    <div className="container-fluid px-4 py-2">
      
      {/* CONTENEDOR NO-IMPRIMIBLE EN INTERFAZ GENERAL */}
      <div className="no-print">
        <div className="pagetitle mb-4">
          <h2 className="text-dark fw-bold">📤 Egreso y Despacho de Material Técnico</h2>
          <p className="text-muted small">Control de responsabilidad material para proyectos, mantenimientos correctivos y atención de emergencias.</p>
        </div>

        {errorMsg && <Alert variant="danger" dismissible>{errorMsg}</Alert>}
        {successMsg && <Alert variant="success" dismissible>{successMsg}</Alert>}
      </div>

      {/* 🧾 COMPROBANTE DE IMPRESIÓN (AISLADO MEDIANTE CSS) */}
      {valeImpresion && (
        <div className="print-area">
          <Card className="border border-dark shadow-sm bg-white mb-4 p-4 font-monospace rounded-3 mx-auto" style={{ maxWidth: "800px" }} id="comprobante-servilift">
            <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
              <div>
                <h4 className="fw-bold mb-0 text-dark">SERVILIFT S.A.</h4>
                <small className="text-secondary">Mantenimiento y Montaje de Elevadores</small>
              </div>
              <div className="text-end">
                <h5 className="text-danger fw-bold mb-0">VALE DE CARGO TÉCNICO</h5>
                <mark className="fw-bold bg-warning text-dark px-2">{valeImpresion.folio}</mark>
              </div>
            </div>
            <Row className="small mb-3 text-dark">
              <Col xs={6} className="mb-1"><strong>Bodega Origen:</strong> {bodegas.find(b => b.id === parseInt(valeImpresion.cabecera.bodega_id))?.nombre}</Col>
              <Col xs={6} className="mb-1"><strong>Técnico Receptor:</strong> {valeImpresion.cabecera.quien_retira}</Col>
              <Col xs={6} className="mb-1"><strong>Fecha Operación:</strong> {valeImpresion.fecha}</Col>
              <Col xs={6} className="mb-1"><strong>Destino/Proyecto:</strong> {valeImpresion.cabecera.identificador_destino_externo}</Col>
            </Row>
            <Table size="sm" bordered className="small mb-3 align-middle text-dark">
              <thead>
                <tr className="table-dark">
                  <th>SKU</th>
                  <th>Descripción</th>
                  <th className="text-center" style={{ width: "60px" }}>Cant.</th>
                  <th className="text-end" style={{ width: "110px" }}>Valor PPP</th>
                  <th className="text-end" style={{ width: "110px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {valeImpresion.articulos.map(item => (
                  <tr key={item.articulo_id}>
                    <td className="font-monospace">{item.codigo_sku}</td>
                    <td>{item.nombre}</td>
                    <td className="text-center fw-bold">{item.cantidad}</td>
                    <td className="text-end">${item.precio_promedio.toLocaleString('es-CL')}</td>
                    <td className="text-end fw-bold">${(item.cantidad * item.precio_promedio).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
                <tr className="fw-bold table-light">
                  <td colSpan="4" className="text-end text-dark">MONTO TOTAL DE RESPONSABILIDAD:</td>
                  <td className="text-end text-primary">${valeImpresion.total.toLocaleString('es-CL')}</td>
                </tr>
              </tbody>
            </Table>
            <div className="border p-2 bg-light text-muted mb-4 style-justificacion" style={{ fontSize: "0.75rem", lineHeight: "1.3" }}>
              <strong>CLÁUSULA DE RESPONSABILIDAD MATERIAL:</strong> El firmante declara recibir a conformidad las herramientas e insumos descritos en este documento para el uso exclusivo en las operaciones de Servilift. Se deja constancia que la pérdida, extravío o deterioro por negligencia de los activos de clasificación fija faculta a la administración para remitir este folio a fin de gestionar los descuentos correspondientes en su próxima liquidación de remuneraciones.
            </div>
            <div className="d-flex justify-content-around text-center pt-5 mt-4 text-dark mb-2 text-firmas">
              <div style={{ width: "230px", borderTop: "1px solid #000" }} className="pt-1"><small>Firma Despachador Bodega</small></div>
              <div style={{ width: "230px", borderTop: "1px solid #000" }} className="pt-1"><small>Firma Técnico Conforme</small></div>
            </div>
          </Card>
          
          <div className="no-print mx-auto mb-4" style={{ maxWidth: "800px" }}>
            {/* 🔑 CAMBIO: Ahora llama a la nueva función controlada para imprimir, resetear y colapsar */}
            <Button variant="outline-dark" className="w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2" onClick={handleImprimirYLimpiarFormulario}>
              <FaPrint /> Imprimir Documento de Respaldo Técnico (Generar PDF)
            </Button>
          </div>
        </div>
      )}

      {/* FORMULARIO DE DESPACHO INTERFAZ GENERAL */}
      <div className="no-print">
        <Form onSubmit={handleProcesarDespacho}>
          <Row className="g-3">
            <div className="col-lg-4">
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-dark text-white fw-bold py-3"><FaUserCheck /> 1. Autorización de Entrega</Card.Header>
                <Card.Body>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">Bodega de Origen *</Form.Label>
                    <Form.Select required value={formCabecera.bodega_id} onChange={(e) => setFormCabecera({ ...formCabecera, bodega_id: e.target.value })}>
                      <option value="">-- Seleccionar Bodega --</option>
                      {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold text-danger">Técnico que Retira (Nómina Servilift) *</Form.Label>
                    <Form.Select required value={formCabecera.quien_retira} onChange={(e) => setFormCabecera({ ...formCabecera, quien_retira: e.target.value })}>
                      <option value="">-- Seleccionar Técnico Autorizado --</option>
                      {usuarios.map(u => <option key={u.id} value={u.nombre}>{u.nombre} ({u.email})</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">Motivo Logístico</Form.Label>
                    <Form.Select value={formCabecera.motivo_operacion} onChange={(e) => setFormCabecera({ ...formCabecera, motivo_operacion: e.target.value })}>
                      <option value="PROYECTO">🚀 Instalación / Proyecto</option>
                      <option value="MANTENIMIENTO_CORRECTIVO">🔧 Mantenimiento Contrato</option>
                      <option value="EMERGENCIA">🚨 Emergencia Falla Crítica</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">Identificador Destino (Nombre Proyecto/OT)</Form.Label>
                    <Form.Control type="text" placeholder="Ej: Edificio Mirador Piso 12" value={formCabecera.identificador_destino_externo} onChange={(e) => setFormCabecera({ ...formCabecera, identificador_destino_externo: e.target.value })} />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Notas de Despacho</Form.Label>
                    <Form.Control type="text" placeholder="Detalles de entrega..." value={formCabecera.observaciones} onChange={(e) => setFormCabecera({ ...formCabecera, observaciones: e.target.value })} />
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>

            <div className="col-lg-8">
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white fw-bold py-3"><FaBarcode /> 2. Escaneo de Material Solicitado</Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Control type="text" placeholder="Escanear SKU de herramientas o insumos y presiona ENTER" value={skuBusqueda} onChange={(e) => setSkuBusqueda(e.target.value)} onKeyDown={handleBarcodeKeyDown} className="border-primary bg-light font-monospace fw-bold text-primary" />
                  </Form.Group>

                  <div className="table-responsive border rounded" style={{ minHeight: "260px" }}>
                    <Table hover striped className="m-0 align-middle small">
                      <thead className="table-secondary">
                        <tr>
                          <th>SKU</th>
                          <th>Descripción</th>
                          <th style={{ width: "90px" }}>Cant.</th>
                          <th className="text-end" style={{ width: "110px" }}>Costo PPP</th>
                          <th className="text-center" style={{ width: "40px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {articulosLote.map(item => (
                          <tr key={item.articulo_id}>
                            <td className="font-monospace fw-bold">{item.codigo_sku}</td>
                            <td>{item.nombre}</td>
                            <td><Form.Control type="number" min="1" size="sm" className="fw-bold text-center" value={item.cantidad} onChange={(e) => handleCambiarCantidad(item.articulo_id, e.target.value)} /></td>
                            <td className="text-end">${item.precio_promedio.toLocaleString('es-CL')}</td>
                            <td className="text-center"><Button variant="link" className="text-danger p-0" onClick={() => handleRemoverItem(item.articulo_id)}><FaTrash size={13} /></Button></td>
                          </tr>
                        ))}
                        {articulosLote.length === 0 && (
                          <tr><td colSpan="5" className="text-center py-5 text-muted fst-italic">Grilla vacía. Escanee los códigos de barra para armar el pedido del técnico.</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                  <Button type="submit" variant="dark" className="w-100 fw-bold py-2 mt-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                    <FaMinusCircle /> Confirmar Salida y Generar Acta de Responsabilidad
                  </Button>
                </Card.Body>
              </Card>
            </div>
          </Row>
        </Form>
      </div>

      {/* 🖨️ CONTROL ESTRICTO DE ESTILOS CSS DE IMPRESIÓN */}
      <style>{`
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
          .btn {
            display: none !important;
          }

          html, body, #root, main, .container-fluid {
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
            position: static !important;
            overflow: visible !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
          }

          #comprobante-servilift {
            display: block !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          .print-area table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            color: #000 !important;
            border-color: #000 !important;
          }
          
          .print-area th {
            background-color: #333 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-area td, .print-area th {
            padding: 6px !important;
            border: 1px solid #000 !important;
            color: #000 !important;
          }

          .style-justificacion {
            background-color: #f8f9fa !important;
            border: 1px solid #ccc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .text-firmas {
            display: flex !important;
            justify-content: space-around !important;
            margin-top: 60px !important;
          }
        }
      `}</style>

    </div>
  );
}