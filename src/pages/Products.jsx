import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Row, Col, Alert, Spinner, Card, Badge, Pagination } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrashAlt, FaBarcode, FaBoxOpen, FaFileExcel, FaImage, FaSearch, FaTags, FaPrint } from "react-icons/fa";
import Barcode from "react-barcode";

export default function Products() {
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "https://api.sla-inventario.cl/api";

  // --- ESTADOS DE DATOS ---
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasTotales, setSubcategoriasTotales] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  const [unidadesParametricas, setUnidadesParametricas] = useState([]);

  // --- 🔍 ESTADOS PARA FILTROS DINÁMICOS ---
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtroSku, setFiltroSku] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // --- 📊 ESTADOS PARA PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  // --- ESTADOS DE INTERFAZ ---
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [file, setFile] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  // --- CONTROL DE MODALES ---
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [productoParaEtiqueta, setProductoParaEtiqueta] = useState(null);

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    codigo_sku: "",
    nombre: "",
    descripcion: "",
    url_foto: "", 
    precio_promedio: 0,
    categoria_id: "",
    subcategoria_id: "",
    unidad_medida_id: "1"
  });

  const notificar = (texto, tipo) => {
    setMensaje({ texto: "", tipo: "" });
    setTimeout(() => { setMensaje({ texto, tipo }); }, 50);
    setTimeout(() => {
      setMensaje((prev) => prev.texto === texto ? { texto: "", tipo: "" } : prev);
    }, 6000);
  };

  // --- 1. CARGA INICIAL DE CATÁLOGOS RELACIONALES ---
  useEffect(() => {
    async function cargarCatalogosGlobales() {
      try {
        setLoading(true);
        const [resProd, resCat, resSub, resUni] = await Promise.all([
          fetch(`${API_URL}/productos`),
          fetch(`${API_URL}/categorias`),
          fetch(`${API_URL}/subcategorias`),
          fetch(`${API_URL}/unidades-medida`)
        ]);

        if (!resProd.ok || !resCat.ok || !resSub.ok || !resUni.ok) {
          throw new Error("Uno o más recursos del servidor fallaron.");
        }

        setProductos(await resProd.json());
        setCategorias(await resCat.json());
        setSubcategoriasTotales(await resSub.json());
        setUnidadesParametricas(await resUni.json());
      } catch (err) {
        console.error(err);
        notificar("Error de sincronización con la API de inventario.", "danger");
      } finally {
        setLoading(false);
      }
    }
    cargarCatalogosGlobales();
  }, [API_URL]);

  // --- 2. FILTRADO DINÁMICO DE SUBCATEGORÍAS EN RAM ---
  useEffect(() => {
    if (formData.categoria_id) {
      const filtradas = subcategoriasTotales.filter(
        (sub) => sub.categoria_id === parseInt(formData.categoria_id)
      );
      setSubcategoriasFiltradas(filtradas);
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [formData.categoria_id, subcategoriasTotales]);

  // --- ⚡ AUTOMATIZACIÓN DE SKU EN TIEMPO REAL ---
  useEffect(() => {
    if (!isEdit && formData.categoria_id && formData.subcategoria_id) {
      const subSeleccionada = subcategoriasTotales.find(s => s.id === parseInt(formData.subcategoria_id));

      if (subSeleccionada) {
        const prefijoCat = String(formData.categoria_id).padStart(2, "0");
        const prefijoSub = String(subSeleccionada.codigo_subcategoria || "01").padStart(2, "0");
        const basePrefijo = `SLA${prefijoCat}${prefijoSub}`;

        const existentes = productos.filter(p => p.codigo_sku && p.codigo_sku.startsWith(basePrefijo));
        
        let proximaSecuencia = 1;
        if (existentes.length > 0) {
          const codigos = existentes.map(p => parseInt(p.codigo_sku.substring(7)) || 0);
          proximaSecuencia = Math.max(...codigos) + 1;
        }

        setFormData(prev => ({
          ...prev,
          codigo_sku: `${basePrefijo}${String(proximaSecuencia).padStart(4, "0")}`
        }));
      }
    }
  }, [formData.subcategoria_id, isEdit, categorias, subcategoriasTotales, productos]);

  // --- ⚡ MANEJADORES DE EVENTOS DEL FORMULARIO ---
  const handleCategoriaChange = (e) => {
    setFormData({
      ...formData,
      categoria_id: e.target.value,
      subcategoria_id: "",
      codigo_sku: "SLA" 
    });
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setCurrentId(null);
    setFormData({ codigo_sku: "SLA", nombre: "", descripcion: "", url_foto: "", precio_promedio: 0, category_id: "", subcategoria_id: "", unidad_medida_id: "1" });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setIsEdit(true);
    setCurrentId(prod.id);
    setFormData({
      codigo_sku: prod.codigo_sku,
      nombre: prod.nombre,
      descripcion: prod.descripcion || "",
      url_foto: prod.url_foto || "",
      precio_promedio: prod.precio_promedio,
      categoria_id: prod.categoria_id,
      subcategoria_id: prod.subcategoria_id,
      unidad_medida_id: String(prod.unidad_medida_id || 1)
    });
    setShowModal(true);
  };

  const handleOpenBarcode = (prod) => {
    setProductoParaEtiqueta(prod);
    setShowBarcodeModal(true);
  };

  const handlePrintBarcode = () => {
    window.print();
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Por favor, seleccione un archivo válido en formato .xlsx o .xls");
      return;
    }

    const fileFormData = new FormData();
    fileFormData.append("excelFile", file);

    try {
      setProcesando(true);
      const response = await fetch(`${API_URL}/productos/cargar-masivo`, {
        method: "POST",
        body: fileFormData
      });

      const resData = await response.json();

      if (response.ok) {
        notificar(`¡Proceso exitoso! Se insertaron ${resData.count} artículos.`, "success");
        setFile(null);
        const refetch = await fetch(`${API_URL}/productos`);
        if (refetch.ok) setProductos(await refetch.json());
      } else {
        notificar(resData.error || "Error en la carga masiva.", "danger");
      }
    } catch (err) {
      notificar("Fallo en la comunicación con el servidor.", "danger");
    } finally {
      setProcesando(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const endpoint = isEdit ? `${API_URL}/productos/${currentId}` : `${API_URL}/productos`;
    const method = isEdit ? "PUT" : "POST";

    try {
      setProcesando(true);
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_sku: formData.codigo_sku,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          url_foto: formData.url_foto,
          precio_promedio: parseFloat(formData.precio_promedio) || 0,
          subcategoria_id: parseInt(formData.subcategoria_id),
          unidad_medida_id: parseInt(formData.unidad_medida_id)
        })
      });

      const resData = await response.json();

      if (response.ok) {
        notificar(isEdit ? "Artículo modificado con éxito." : "Nuevo artículo catalogado correctamente.", "success");
        setShowModal(false);
        const refetch = await fetch(`${API_URL}/productos`);
        if (refetch.ok) setProductos(await refetch.json());
      } else {
        notificar(resData.error || "Ocurrió un inconveniente.", "danger");
      }
    } catch (err) {
      notificar("Error de red. No se pudo conectar con el servidor backend.", "danger");
    } finally {
      setProcesando(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Está completamente seguro de remover este producto del catálogo maestro?")) return;

    try {
      const response = await fetch(`${API_URL}/productos/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (response.ok) {
        notificar("El artículo fue removido de forma definitiva.", "success");
        setProductos(productos.filter((p) => p.id !== id));
      } else {
        notificar(data.error || "La base de datos denegó la eliminación.", "danger");
      }
    } catch (err) {
      notificar("Error crítico al procesar la baja del material.", "danger");
    }
  };

  // --- ⚡ LÓGICA DE FILTRADO INTERACTIVO SÍNCRONO ---
  const productosFiltrados = productos.filter((item) => {
    const cumpleNombre = item.nombre?.toLowerCase().includes(busquedaNombre.toLowerCase());
    const cumpleSku = filtroSku ? item.codigo_sku?.toLowerCase().includes(filtroSku.toLowerCase()) : true;
    const cumpleCategoria = filtroCategoria ? item.categoria_nombre === filtroCategoria : true;
    return cumpleNombre && cumpleSku && cumpleCategoria;
  });

  const listaCategoriasMadre = [...new Set(productos.map((p) => p.categoria_nombre).filter(Boolean))];
  const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
  
  // 🔑 REPARACIÓN DE MARCADOR VITE: Cambiado totalPages por totalPaginas para corregir la caída
  const paginaValida = paginaActual > totalPaginas ? 1 : paginaActual;
  const productosPaginados = productosFiltrados.slice((paginaValida - 1) * itemsPorPagina, paginaValida * itemsPorPagina);

  return (
    <div className="container-fluid px-4 py-2">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-barcode-area, #print-barcode-area * { visibility: visible; }
          #print-barcode-area { position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%) scale(1.3); text-align: center; }
          .modal-footer, .modal-header, .btn-close { display: none !important; }
          .modal-dialog { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-1">📋 Gestión de Catálogo Maestro e Inventario</h2>
          <p className="text-muted small mb-0">Estandarización de SKUs bajo norma de trazabilidad física y contable.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" className="fw-bold" onClick={() => window.location.href = "/warehouses/stock"}>📦 Almacenar / Retirar Producto</Button>
          <Button variant="primary" className="fw-bold d-flex align-items-center gap-2 px-3 shadow-sm" onClick={handleOpenCreate}><FaPlus /> Registrar Nuevo Artículo</Button>
        </div>
      </div>

      {mensaje.texto && <Alert variant={mensaje.tipo === "danger" ? "danger" : "success"} dismissible className="shadow-sm border-0 small fw-bold text-center mb-4">{mensaje.texto}</Alert>}

      {/* IMPORTACIÓN MASIVA */}
      <Card className="border-0 shadow-sm mb-4 bg-white">
        <Card.Body className="py-3">
          <Form onSubmit={handleExcelUpload} className="row align-items-center g-3">
            <Col md={4} className="d-flex align-items-center gap-2">
              <FaFileExcel size={24} className="text-success flex-shrink-0" />
              <div>
                <Form.Label className="fw-bold mb-0 small">Importación Masiva de Catálogo</Form.Label>
                <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Carga automática con secuenciador inteligente</span>
              </div>
            </Col>
            <Col md={5}><Form.Control type="file" size="sm" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} /></Col>
            <Col md={3}><Button type="submit" variant="success" size="sm" className="w-100 fw-bold" disabled={procesando}><FaFileExcel /> Procesar Planilla Excel</Button></Col>
          </Form>
        </Card.Body>
      </Card>

      {/* BARRA SUPERIOR DE FILTROS */}
      <Card className="border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
        <Row className="g-3 align-items-end small">
          <Col xs={12} md={5}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary mb-1">Buscador por Nombre:</Form.Label>
              <Form.Control type="text" size="sm" placeholder="Ej: Manguera, Esmeril..." value={busquedaNombre} onChange={(e) => { setBusquedaNombre(e.target.value); setPaginaActual(1); }} />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary mb-1">Filtrar por SKU:</Form.Label>
              <Form.Control type="text" size="sm" placeholder="Ej: SLA02" value={filtroSku} onChange={(e) => { setFiltroSku(e.target.value); setPaginaActual(1); }} />
            </Form.Group>
          </Col>
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary mb-1">Categoría Madre:</Form.Label>
              <Form.Select size="sm" value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaActual(1); }}>
                <option value="">-- Todas las Categorías --</option>
                {listaCategoriasMadre.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card>

      {/* TABLA PRINCIPAL */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-2" />
          <p className="text-muted small fw-bold">Sincronizando catálogo maestro...</p>
        </div>
      ) : (
        <>
          <Card className="border-0 shadow-sm bg-white rounded-3">
            <div className="table-responsive">
              <Table hover striped className="align-middle mb-0 small">
                <thead className="table-dark">
                  <tr>
                    <th className="ps-3" style={{ width: "135px" }}>SKU</th>
                    <th>Descripción / Detalle del Insumo</th>
                    <th>Categoría Madre</th>
                    <th>Subcategoría</th>
                    <th style={{ width: "110px" }}>U. Medida</th>
                    <th style={{ width: "120px" }}>Tipo Contable</th>
                    <th className="text-center" style={{ width: "95px" }}>Stock</th>
                    <th className="text-end pe-3" style={{ width: "140px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-5 fst-italic">No se encontraron artículos.</td>
                    </tr>
                  ) : (
                    productosPaginados.map((prod) => (
                      <tr key={prod.id}>
                        <td className="ps-3 font-monospace fw-bold text-secondary">{prod.codigo_sku}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {prod.url_foto ? <img src={prod.url_foto} alt={prod.nombre} className="rounded border object-fit-cover" style={{ width: "36px", height: "36px" }} /> : <div className="bg-light rounded border d-flex align-items-center justify-content-center text-muted" style={{ width: "36px", height: "36px" }}><FaBoxOpen size={16} /></div>}
                            <div><span className="fw-semibold text-dark d-block mb-0">{prod.nombre}</span>{prod.descripcion && <small className="text-muted d-block text-truncate" style={{ maxWidth: "250px" }}>{prod.descripcion}</small>}</div>
                          </div>
                        </td>
                        <td><span className="text-dark fw-semibold">{prod.categoria_nombre}</span></td>
                        <td><Badge bg="secondary" className="me-2 font-monospace">{prod.subcategoria_codigo}</Badge><span className="text-muted">{prod.subcategoria_nombre}</span></td>
                        <td><span className="fw-bold font-monospace text-dark text-uppercase" style={{ fontSize: '0.74rem' }}>{prod.unidad_medida_nombre}</span></td>
                        <td><Badge bg={prod.tipo_activo === "ACTIVO_FIJO" ? "primary" : "success"}>{prod.tipo_activo === "ACTIVO_FIJO" ? "🔧 Fijo" : "📦 Circulante"}</Badge></td>
                        <td className="text-center fw-bold fs-6"><span className={prod.stock > 0 ? "text-success" : "text-danger"}>{prod.stock ?? 0}</span></td>
                        <td className="text-end pe-3"><div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-primary" size="sm" className="py-1 px-2 border-0" onClick={() => handleOpenBarcode(prod)}><FaBarcode size={14} /></Button>
                            <Button variant="outline-secondary" size="sm" className="py-1 px-2 border-0" onClick={() => handleOpenEdit(prod)}><FaEdit size={14} /></Button>
                            <Button variant="outline-danger" size="sm" className="py-1 px-2 border-0" onClick={() => handleDeleteProduct(prod.id)}><FaTrashAlt size={14} /></Button>
                        </div></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>

          {totalPaginas > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination size="sm">
                <Pagination.First onClick={() => setPaginaActual(1)} disabled={paginaValida === 1} />
                <Pagination.Prev onClick={() => setPaginaActual(paginaValida - 1)} disabled={paginaValida === 1} />
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <Pagination.Item key={num} active={num === paginaValida} onClick={() => setPaginaActual(num)}>{num}</Pagination.Item>
                ))}
                <Pagination.Next onClick={() => setPaginaActual(paginaValida + 1)} disabled={paginaValida === totalPaginas} />
                <Pagination.Last onClick={() => setPaginaActual(totalPaginas)} disabled={paginaValida === totalPaginas} />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* MODAL FORMULARIO */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSaveProduct}>
          <Modal.Header closeButton className="bg-dark text-white py-3"><Modal.Title className="fw-bold fs-5">{isEdit ? "✏️ Ficha: Modificar Parámetros de Artículo" : "🆕 Catalogar Artículo en Maestro"}</Modal.Title></Modal.Header>
          <Modal.Body className="bg-light"><Row className="g-3">
              {isEdit && formData.codigo_sku && (
                <Col md={12} className="text-center mb-3"><div className="p-2 bg-white rounded border d-inline-block"><Barcode value={formData.codigo_sku} format="CODE128" width={1.5} height={40} fontSize={11} /></div></Col>
              )}
              {formData.url_foto && <Col md={12} className="text-center mb-2"><img src={formData.url_foto} alt="Preview" className="img-thumbnail" style={{ maxHeight: "140px" }} /></Col>}
              
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">Código SKU (Automático)</Form.Label><Form.Control type="text" className="font-monospace fw-bold text-primary bg-white" value={formData.codigo_sku} readOnly /></Form.Group></Col>
              <Col md={8}><Form.Group><Form.Label className="small fw-bold">Nombre del Artículo / Insumo Técnico *</Form.Label><Form.Control type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label className="small fw-bold text-primary">Categoría Raíz *</Form.Label><Form.Select required value={formData.categoria_id} onChange={handleCategoriaChange}><option value="">-- Seleccione Categoría --</option>{categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label className="small fw-bold text-primary">Subcategoría Específica *</Form.Label><Form.Select required value={formData.subcategoria_id} onChange={(e) => setFormData({ ...formData, subcategoria_id: e.target.value })} disabled={!formData.categoria_id}><option value="">-- Seleccione Subcategoría --</option>{subcategoriasFiltradas.map(sub => <option key={sub.id} value={sub.id}>[{sub.codigo_subcategoria || "00"}] {sub.nombre}</option>)}</Form.Select></Form.Group></Col>
              
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-danger">Unidad Paramétrica de Control *</Form.Label>
                  <Form.Select required value={formData.unidad_medida_id} onChange={(e) => setFormData({ ...formData, unidad_medida_id: e.target.value })} >
                    {unidadesParametricas.map((uni) => <option key={uni.id} value={uni.id}>{uni.nombre} ({uni.abreviacion})</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">Valor Base Inicial ($PPP)</Form.Label><Form.Control type="number" min="0" value={formData.precio_promedio} onChange={(e) => setFormData({ ...formData, precio_promedio: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">Fotografía del Activo</Form.Label><Button variant="outline-dark" className="w-100 btn-sm py-1.5" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setFormData({ ...formData, url_foto: reader.result }); }; reader.readAsDataURL(file); } }; input.click(); }}><FaImage /> Seleccionar archivo</Button></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label className="small fw-bold">Ficha Técnico / Notas Adicionales</Form.Label><Form.Control as="textarea" rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} /></Form.Group></Col>
            </Row></Modal.Body>
          <Modal.Header className="bg-white py-2 d-flex justify-content-end gap-2 border-top"><Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button><Button variant="dark" size="sm" type="submit" className="fw-bold px-4" disabled={procesando}>Guardar Cambios</Button></Modal.Header>
        </Form>
      </Modal>

      {/* MODAL IMPRESIÓN BARCODE */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} size="md" centered><Modal.Header closeButton className="bg-dark text-white py-2"><Modal.Title className="fw-bold fs-6"><FaBarcode /> Impresión de Etiqueta</Modal.Title></Modal.Header>
        <Modal.Body className="bg-white text-center py-4">{productoParaEtiqueta && (<div id="print-barcode-area" className="p-3 border rounded bg-white d-inline-block"><span className="fw-bold d-block text-dark text-uppercase" style={{ fontSize: "0.85rem" }}>{productoParaEtiqueta.nombre}</span><small className="text-muted d-block font-monospace mb-1">{productoParaEtiqueta.categoria_nombre}</small><div className="my-2 d-flex justify-content-center"><Barcode value={productoParaEtiqueta.codigo_sku} format="CODE128" width={1.6} height={55} fontSize={12} fontOptions="bold" /></div><div className="d-flex justify-content-between px-1 border-top pt-1 text-muted" style={{ fontSize: "0.65rem" }}><span>TIPO: {productoParaEtiqueta.tipo_activo === "ACTIVO_FIJO" ? "FIJO" : "CIRCULANTE"}</span><strong>SERVILIFT ERP</strong></div></div>)}</Modal.Body>
        <Modal.Footer className="bg-light py-2"><Button variant="outline-secondary" size="sm" onClick={() => setShowBarcodeModal(false)}>Cerrar</Button><Button variant="primary" size="sm" className="fw-bold" onClick={handlePrintBarcode}><FaPrint /> Mandar a Impresora</Button></Modal.Footer>
      </Modal>
    </div>
  );
}