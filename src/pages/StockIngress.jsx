import React, { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Row, Col, Table, Spinner } from "react-bootstrap";
import { FaPlusCircle, FaWarehouse, FaBarcode, FaTrash, FaFileInvoiceDollar, FaTools } from "react-icons/fa";

export default function StockIngress() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const [bodegas, setBodegas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [docCabecera, setDocCabecera] = useState({
    tipo_documento: "FACTURA",
    numero_documento: "",
    fecha_emision: new Date().toISOString().split("T")[0],
    proveedor_o_emisor: "",
    monto_neto: "0",
    monto_total: "0",
    bodega_id: "",
    observaciones: ""
  });

  const [skuBusqueda, setSkuBusqueda] = useState("");
  const [articulosLote, setArticulosLote] = useState([]);

  useEffect(() => {
    async function inicializarFormulario() {
      try {
        setLoading(true);
        const [resBodegas, resProd, resSub] = await Promise.all([
          fetch(`${API_URL}/bodegas`),
          fetch(`${API_URL}/productos`),
          fetch(`${API_URL}/subcategorias`)
        ]);

        if (resBodegas.ok && resProd.ok && resSub.ok) {
          setBodegas(await resBodegas.json());
          setProductos(await resProd.json());
          setSubcategorias(await resSub.json());
        } else {
          setErrorMsg("Error al sincronizar catálogos maestros desde MySQL.");
        }
      } catch (err) {
        setErrorMsg("Error de red al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    inicializarFormulario();
  }, [API_URL]);

  useEffect(() => {
    const netoCalculado = articulosLote.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
    setDocCabecera(prev => ({
      ...prev,
      monto_neto: String(netoCalculado),
      monto_total: String(Math.round(netoCalculado * 1.19))
    }));
  }, [articulosLote]);

  const procesarAgregarSku = (skuTexto) => {
    const skuLimpiado = skuTexto.trim().toUpperCase();
    if (!skuLimpiado) return;

    const productoEncontrado = productos.find(p => p.codigo_sku.toUpperCase() === skuLimpiado);
    const yaEnGrilla = articulosLote.find(item => item.codigo_sku.toUpperCase() === skuLimpiado);

    if (productoEncontrado) {
      if (yaEnGrilla) {
        setArticulosLote(articulosLote.map(item => 
          item.codigo_sku.toUpperCase() === skuLimpiado ? { ...item, cantidad: item.cantidad + 1 } : item
        ));
      } else {
        setArticulosLote([...articulosLote, {
          articulo_id: productoEncontrado.id,
          codigo_sku: productoEncontrado.codigo_sku,
          nombre: productoEncontrado.nombre,
          tipo_activo: productoEncontrado.tipo_activo || "ACTIVO_FIJO",
          categoria_nombre: productoEncontrado.categoria_nombre || "Sistemas Hidráulicos", // 🔑 Propiedad integrada
          subcategoria_id: productoEncontrado.subcategoria_id,
          cantidad: 1,
          precio_unitario: Math.round(productoEncontrado.precio_promedio || 0),
          es_nuevo: false
        }]);
      }
    } else {
      if (yaEnGrilla) {
        setArticulosLote(articulosLote.map(item => 
          item.codigo_sku.toUpperCase() === skuLimpiado ? { ...item, cantidad: item.cantidad + 1 } : item
        ));
      } else {
        setArticulosLote([...articulosLote, {
          articulo_id: `NUEVO_${Date.now()}`,
          codigo_sku: skuLimpiado,
          nombre: "",
          tipo_activo: "ACTIVO_FIJO",
          categoria_nombre: "Nuevo Artículo",
          subcategoria_id: subcategorias[0]?.id || "",
          cantidad: 1,
          precio_unitario: 0,
          es_nuevo: true
        }]);
      }
    }
    setSkuBusqueda("");
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      procesarAgregarSku(skuBusqueda);
    }
  };

  const handleAgregarProductoManual = () => {
    const skuManual = prompt("Por favor, digite el código SKU para el artículo nuevo de Servilift:");
    if (skuManual) procesarAgregarSku(skuManual);
  };

  const handleCambiarCantidad = (id, valor) => {
    setArticulosLote(articulosLote.map(item => item.articulo_id === id ? { ...item, cantidad: parseInt(valor) || 1 } : item));
  };

  const handleCambiarPrecio = (id, valor) => {
    setArticulosLote(articulosLote.map(item => item.articulo_id === id ? { ...item, precio_unitario: Math.round(parseFloat(valor)) || 0 } : item));
  };

  const handleCambiarNombreNuevo = (id, valor) => {
    setArticulosLote(articulosLote.map(item => item.articulo_id === id ? { ...item, nombre: valor } : item));
  };

  const handleCambiarTipoNuevo = (id, valor) => {
    setArticulosLote(articulosLote.map(item => item.articulo_id === id ? { ...item, tipo_activo: valor } : item));
  };

  const handleCambiarSubcategoriaNuevo = (id, valor) => {
    setArticulosLote(articulosLote.map(item => item.articulo_id === id ? { ...item, subcategoria_id: valor } : item));
  };

  const handleRemoverItem = (id) => {
    setArticulosLote(articulosLote.filter(item => item.articulo_id !== id));
  };

  const handleGuardarIngresoMasivo = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!docCabecera.bodega_id) {
      setErrorMsg("Debe seleccionar una bodega de destino física.");
      return;
    }
    if (articulosLote.length === 0) {
      setErrorMsg("El lote de artículos está vacío. Escanee un SKU o agregue uno manual.");
      return;
    }

    const incompletos = articulosLote.some(item => item.es_nuevo && (!item.nombre.trim() || !item.subcategoria_id));
    if (incompletos) {
      setErrorMsg("Todos los productos creados en caliente deben poseer un Nombre y Subcategoría asignada.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/inventario/ingreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...docCabecera, articulos_movimiento: articulosLote })
      });

      if (res.ok) {
        setSuccessMsg("¡Éxito! Movimiento masivo asentado y Precios Medios Ponderados (PPP) recalculados.");
        setArticulosLote([]);
        setDocCabecera({
          tipo_documento: "FACTURA", numero_documento: "", fecha_emision: new Date().toISOString().split("T")[0],
          proveedor_o_emisor: "", monto_neto: "0", monto_total: "0", bodega_id: docCabecera.bodega_id, observaciones: ""
        });
        const resProd = await fetch(`${API_URL}/productos`);
        if (resProd.ok) setProductos(await resProd.json());
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Fallo interno al registrar la operation.");
      }
    } catch (err) {
      setErrorMsg("Error crítico de comunicación con el servidor.");
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="dark" /><p>Cargando subsistema Servilift...</p></div>;

  return (
    <div className="container-fluid mt-2 px-4">
      <div className="pagetitle mb-4">
        <h2 className="text-dark fw-bold">📥 Centro de Recepción e Ingreso Documentado</h2>
        <p className="text-muted small">Carga masiva de insumos con cálculo inmediato del Precio Medio Ponderado (PPP).</p>
      </div>

      {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg("")} dismissible>{errorMsg}</Alert>}
      {successMsg && <Alert variant="success" onClose={() => setSuccessMsg("")} dismissible>{successMsg}</Alert>}

      <Form onSubmit={handleGuardarIngresoMasivo}>
        <Row className="g-3">
          <div className="col-lg-4">
            <Card className="shadow-sm border-0 bg-white">
              <Card.Header className="bg-dark text-white fw-bold d-flex align-items-center gap-2 py-3">
                <FaFileInvoiceDollar /> 1. Datos del Documento
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  <Col md={12} className="mb-2">
                    <Form.Label className="small fw-bold">Tipo Documento</Form.Label>
                    <Form.Select value={docCabecera.tipo_documento} onChange={(e) => setDocCabecera({ ...docCabecera, tipo_documento: e.target.value })}>
                      <option value="FACTURA">📄 Factura Comercial</option>
                      <option value="BOLETA">🎫 Boleta de Venta</option>
                      <option value="GUIA_DESPACHO">🚚 Guía de Despacho</option>
                      <option value="VALE_DEVOLUCION">🔧 Vale Devolución Técnico</option>
                    </Form.Select>
                  </Col>
                  <Col md={12} className="mb-2">
                    <Form.Label className="small fw-bold">N° de Documento</Form.Label>
                    <Form.Control type="text" required placeholder="Ej: 8847" value={docCabecera.numero_documento} onChange={(e) => setDocCabecera({ ...docCabecera, numero_documento: e.target.value })} />
                  </Col>
                  <Col md={12} className="mb-2">
                    <Form.Label className="small fw-bold">Fecha de Emisión</Form.Label>
                    <Form.Control type="date" required value={docCabecera.fecha_emision} onChange={(e) => setDocCabecera({ ...docCabecera, fecha_emision: e.target.value })} />
                  </Col>
                  <Col md={12} className="mb-2">
                    <Form.Label className="small fw-bold">Proveedor / Emisor</Form.Label>
                    <Form.Control type="text" placeholder="Ej: Importadora Logística" value={docCabecera.proveedor_o_emisor} onChange={(e) => setDocCabecera({ ...docCabecera, proveedor_o_emisor: e.target.value })} />
                  </Col>

                  {docCabecera.tipo_documento !== "VALE_DEVOLUCION" && (
                    <>
                      <Col md={12} className="mb-2">
                        <Form.Label className="small fw-bold">Monto Neto Calculado (CLP)</Form.Label>
                        <Form.Control type="number" readOnly className="bg-light" value={docCabecera.monto_neto} />
                      </Col>
                      <Col md={12} className="mb-2">
                        <Form.Label className="small fw-bold">Monto Total Bruto (Con IVA)</Form.Label>
                        <Form.Control type="number" readOnly className="bg-light fw-bold text-dark" value={docCabecera.monto_total} />
                      </Col>
                    </>
                  )}

                  <Col md={12} className="mb-2">
                    <Form.Label className="small fw-bold text-primary">Bodega de Almacenamiento *</Form.Label>
                    <Form.Select required value={docCabecera.bodega_id} onChange={(e) => setDocCabecera({ ...docCabecera, bodega_id: e.target.value })}>
                      <option value="">-- Seleccionar Almacén Destino --</option>
                      {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </Form.Select>
                  </Col>
                  <Col md={12}>
                    <Form.Label className="small fw-bold">Notas</Form.Label>
                    <Form.Control type="text" placeholder="Detalles..." value={docCabecera.observaciones} onChange={(e) => setDocCabecera({ ...docCabecera, observaciones: e.target.value })} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>

          <div className="col-lg-8">
            <Card className="shadow-sm border-0 bg-white h-100">
              <Card.Header className="bg-primary text-white fw-bold d-flex align-items-center gap-2 py-2">
                <div className="d-flex align-items-center gap-2"><FaTools /> 2. Artículos del Lote</div>
                <Button variant="light" size="sm" className="text-primary fw-bold ms-auto" onClick={handleAgregarProductoManual}>
                  + Registrar Producto Manual
                </Button>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                
                <div className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-2"><FaBarcode /> Escáner de Barra:</Form.Label>
                    <Form.Control type="text" placeholder="Escanear SKU y presiona ENTER" value={skuBusqueda} onChange={(e) => setSkuBusqueda(e.target.value)} onKeyDown={handleBarcodeKeyDown} className="border-primary bg-light font-monospace fw-bold text-primary" />
                  </Form.Group>
                </div>

                <div className="table-responsive flex-grow-1 border rounded" style={{ minHeight: "350px" }}>
                  <Table hover striped className="m-0 align-middle small" style={{ fontSize: "0.82rem" }}>
                    <thead className="table-secondary">
                      <tr>
                        <th>SKU</th>
                        <th>Descripción Artículo</th>
                        <th style={{ width: "150px" }}>Categoría Logística</th>
                        <th style={{ width: "135px" }}>Subcategoría</th>
                        <th style={{ width: "75px" }}>Cant.</th>
                        <th style={{ width: "115px" }}>Precio Unit ($)</th>
                        <th className="text-center" style={{ width: "35px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {articulosLote.map((item) => (
                        <tr key={item.articulo_id} className={item.es_nuevo ? "table-warning" : ""}>
                          <td className="font-monospace fw-bold text-secondary">{item.codigo_sku}</td>
                          <td>
                            {item.es_nuevo ? (
                              <Form.Control type="text" size="sm" required placeholder="Nombre del artículo..." value={item.nombre} className="border-warning bg-white fw-semibold" onChange={(e) => handleCambiarNombreNuevo(item.articulo_id, e.target.value)} />
                            ) : (
                              <span className="fw-semibold text-dark">{item.nombre}</span>
                            )}
                          </td>
                          <td>
                            {/* 🔑 CORRECCIÓN EXPLICITA: Muestra de forma dinámica la Categoría y hereda el color del Catálogo Maestro */}
                            {item.es_nuevo ? (
                              <Form.Select size="sm" className="border-warning text-dark fw-bold" value={item.tipo_activo} onChange={(e) => handleCambiarTipoNuevo(item.articulo_id, e.target.value)}>
                                <option value="ACTIVO_CIRCULANTE">📦 Activo Circulante</option>
                                <option value="ACTIVO_FIJO">🔧 Activo Fijo</option>
                              </Form.Select>
                            ) : (
                              <span className={`badge ${item.tipo_activo === 'ACTIVO_FIJO' ? 'bg-primary' : 'bg-success'} fw-bold px-2 py-1`}>
                                {item.categoria_nombre}
                              </span>
                            )}
                          </td>
                          <td>
                            {item.es_nuevo ? (
                              <Form.Select size="sm" className="border-warning text-dark" value={item.subcategoria_id} onChange={(e) => handleCambiarSubcategoriaNuevo(item.articulo_id, e.target.value)} required>
                                <option value="">-- Seleccionar * --</option>
                                {subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                              </Form.Select>
                            ) : (
                              <span className="text-muted fw-semibold">{subcategorias.find(s => s.id === item.subcategoria_id)?.nombre || "Mantenimiento"}</span>
                            )}
                          </td>
                          <td>
                            <Form.Control type="number" min="1" size="sm" className="fw-bold text-center border-dark px-1" value={item.cantidad} onChange={(e) => handleCambiarCantidad(item.articulo_id, e.target.value)} />
                          </td>
                          <td>
                            <Form.Control type="number" min="0" size="sm" className="fw-bold text-end border-primary" placeholder="Valor $" value={item.precio_unitario} onChange={(e) => handleCambiarPrecio(item.articulo_id, e.target.value)} />
                          </td>
                          <td className="text-center">
                            <Button variant="link" className="text-danger p-0" onClick={() => handleRemoverItem(item.articulo_id)}><FaTrash size={13} /></Button>
                          </td>
                        </tr>
                      ))}
                      {articulosLote.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted fst-italic">Ningún material cargado en el lote de Servilift.</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <Button type="submit" variant="dark" className="w-100 fw-bold py-2 mt-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                  <FaPlusCircle /> Registrar Movimiento Masivo e Incrementar Stock
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Row>
      </Form>
    </div>
  );
}