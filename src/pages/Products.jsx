import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Row, Col, Alert, Spinner, Card, Badge, Pagination } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrashAlt, FaBarcode, FaBoxOpen, FaFileExcel, FaImage, FaSearch, FaTags } from "react-icons/fa";

export default function Products() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // --- ESTADOS DE DATOS ---
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasTotales, setSubcategoriasTotales] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // --- 🔍 ESTADOS PARA FILTROS DINÁMICOS EN TIEMPO REAL ---
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtroSku, setFiltroSku] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // --- 📊 ESTADOS PARA PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  // --- ESTADOS DE INTERFAZ ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);

  // --- CONTROL DE MODALES ---
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    codigo_sku: "",
    nombre: "",
    descripcion: "",
    url_foto: "", // Guardará el string serializado en Base64
    precio_promedio: 0,
    categoria_id: "",
    subcategoria_id: ""
  });

  // --- 1. CARGA INICIAL DE CATÁLOGOS RELACIONALES ---
  useEffect(() => {
    async function cargarCatalogosGlobales() {
      try {
        setLoading(true);
        
        const [resProd, resCat, resSub] = await Promise.all([
          fetch(`${API_URL}/productos`),
          fetch(`${API_URL}/categorias`),
          fetch(`${API_URL}/subcategorias`)
        ]);

        if (!resProd.ok || !resCat.ok || !resSub.ok) {
          throw new Error("Uno o más recursos del servidor fallaron al responder.");
        }

        const dataProd = await resProd.json();
        const dataCat = await resCat.json();
        const dataSub = await resSub.json();

        setProductos(dataProd);
        setCategorias(dataCat);
        setSubcategoriasTotales(dataSub);

        setError(null);
      } catch (err) {
        console.error("Fallo crítico en la carga relacional:", err);
        setError("Error de sincronización con la API de inventario de Servilift.");
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

        const secuenciaStr = String(proximaSecuencia).padStart(4, "0");
        
        setFormData(prev => ({
          ...prev,
          codigo_sku: `${basePrefijo}${secuenciaStr}`
        }));
      }
    }
  }, [formData.subcategoria_id, isEdit, categorias, subcategoriasTotales, productos]);

  // --- ⚡ LÓGICA DE FILTRADO INTERACTIVO SÍNCRONO ---
  const productosFiltrados = productos.filter((item) => {
    const cumpleNombre = item.nombre
      ?.toLowerCase()
      .includes(busquedaNombre.toLowerCase());

    const cumpleSku = filtroSku
      ? item.codigo_sku?.toLowerCase().includes(filtroSku.toLowerCase())
      : true;

    const cumpleCategoria = filtroCategoria
      ? item.categoria_nombre === filtroCategoria
      : true;

    return cumpleNombre && cumpleSku && cumpleCategoria;
  });

  // Extraer las categorías de forma dinámica basadas en los nombres presentes en el arreglo
  const listaCategoriasMadre = [
    ...new Set(productos.map((p) => p.categoria_nombre).filter(Boolean)),
  ];

  // --- 📊 CÓMPUTO SECUENCIAL DE LA PAGINACIÓN ---
  const totalItemsFiltrados = productosFiltrados.length;
  const totalPaginas = Math.ceil(totalItemsFiltrados / itemsPorPagina);
  // Validamos que si el filtro reduce los datos, la página actual no quede desbordada
  const paginaValida = paginaActual > totalPaginas ? 1 : paginaActual;

  const indiceUltimoItem = paginaValida * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  // Este es el arreglo segmentado definitivo que se renderiza en las filas <tr> de la tabla
  const productosPaginados = productosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  // --- 3. MANEJADORES DE EVENTOS ---
  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setFormData({
      ...formData,
      categoria_id: catId,
      subcategoria_id: "",
      codigo_sku: "SLA" 
    });
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setCurrentId(null);
    setFormData({
      codigo_sku: "SLA",
      nombre: "",
      descripcion: "",
      url_foto: "",
      precio_promedio: 0,
      categoria_id: "",
      subcategoria_id: ""
    });
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
      subcategoria_id: prod.subcategoria_id
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const endpoint = isEdit ? `${API_URL}/productos/${currentId}` : `${API_URL}/productos`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_sku: formData.codigo_sku,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          url_foto: formData.url_foto,
          precio_promedio: parseFloat(formData.precio_promedio) || 0,
          subcategoria_id: parseInt(formData.subcategoria_id)
        })
      });

      const resData = await response.json();

      if (response.ok) {
        setSuccess(isEdit ? "Artículo modificado con éxito." : "Nuevo artículo catalogado correctamente.");
        setShowModal(false);
        
        const refetch = await fetch(`${API_URL}/productos`);
        if (refetch.ok) setProductos(await refetch.json());
      } else {
        setError(resData.error || "Ocurrió un inconveniente al procesar la operación.");
      }
    } catch (err) {
      setError("Error de red. No se pudo conectar con el servidor backend.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Está completamente seguro de remover este producto del catálogo maestro? Esta acción es irreversible.")) return;

    try {
      const response = await fetch(`${API_URL}/productos/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (response.ok) {
        setSuccess("El artículo fue removido de forma definitiva.");
        setProductos(productos.filter((p) => p.id !== id));
      } else {
        setError(data.error || "La base de datos denegó la eliminación.");
      }
    } catch (err) {
      setError("Error crítico al procesar la baja del material.");
    }
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
      setLoading(true);
      const response = await fetch(`${API_URL}/productos/cargar-masivo`, {
        method: "POST",
        body: fileFormData
      });

      const resData = await response.json();

      if (response.ok) {
        setSuccess(`¡Proceso exitoso! Se insertaron ${resData.count} artículos indexados bajo la norma.`);
        setFile(null);
        const refetch = await fetch(`${API_URL}/productos`);
        if (refetch.ok) setProductos(await refetch.json());
      } else {
        setError(resData.error || "Error en el parsing de la planilla.");
      }
    } catch (err) {
      setError("Fallo en la comunicación multipart con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-1">📋 Gestión de Catálogo Maestro e Inventario</h2>
          <p className="text-muted small mb-0">Estandarización de SKUs bajo norma de trazabilidad física y contable.</p>
        </div>
        <Button variant="primary" className="fw-bold d-flex align-items-center gap-2 px-3 shadow-sm" onClick={handleOpenCreate}>
          <FaPlus /> Registrar Nuevo Artículo
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

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
            <Col md={5}>
              <Form.Control type="file" size="sm" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} className="border-success" />
            </Col>
            <Col md={3}>
              <Button type="submit" variant="success" size="sm" className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                <FaFileExcel /> Procesar Planilla Excel
              </Button>
            </Col>
          </Form>
        </Card.Body>
      </Card>

      {/* 🔍 BARRA SUPERIOR DE FILTROS EN TIEMPO REAL */}
      <Card className="border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
        <Row className="g-3 align-items-end small">
          <Col xs={12} md={5}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-1 mb-1">
                <FaSearch size={11} /> Buscador por Nombre (Mientras ingresa):
              </Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Ej: Manguera, Esmeril, Cerrojo..."
                className="bg-light"
                value={busquedaNombre}
                onChange={(e) => { setBusquedaNombre(e.target.value); setPaginaActual(1); }}
              />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-1 mb-1">
                <FaBarcode size={11} /> Filtrar por SKU:
              </Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Ej: SLA02"
                className="bg-light font-monospace fw-semibold"
                value={filtroSku}
                onChange={(e) => { setFiltroSku(e.target.value); setPaginaActual(1); }}
              />
            </Form.Group>
          </Col>
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary d-flex align-items-center gap-1 mb-1">
                <FaTags size={11} /> Categoría Madre:
              </Form.Label>
              <Form.Select
                size="sm"
                className="bg-light fw-medium"
                value={filtroCategoria}
                onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaActual(1); }}
              >
                <option value="">-- Todas las Categorías --</option>
                {listaCategoriasMadre.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
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
                    <th className="ps-3" style={{ width: "135px" }}><FaBarcode className="me-2" />SKU</th>
                    <th>Descripción / Detalle del Insumo</th>
                    <th>Categoría Madre</th>
                    <th>Subcategoría</th>
                    <th style={{ width: "120px" }}>Tipo Contable</th>
                    <th className="text-center" style={{ width: "95px" }}>Stock</th>
                    <th className="text-end pe-3" style={{ width: "100px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-5 fst-italic">
                        No se encontraron artículos que coincidan con los criterios de búsqueda seleccionados.
                      </td>
                    </tr>
                  ) : (
                    productosPaginados.map((prod) => (
                      <tr key={prod.id}>
                        <td className="ps-3 font-monospace fw-bold text-secondary">{prod.codigo_sku}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {prod.url_foto ? (
                              <img src={prod.url_foto} alt={prod.nombre} className="rounded border object-fit-cover" style={{ width: "36px", height: "36px" }} />
                            ) : (
                              <div className="bg-light rounded border d-flex align-items-center justify-content-center text-muted" style={{ width: "36px", height: "36px" }}><FaBoxOpen size={16} /></div>
                            )}
                            <div>
                              <span className="fw-semibold text-dark d-block mb-0">{prod.nombre}</span>
                              {prod.descripcion && <small className="text-muted d-block text-truncate" style={{ maxWidth: "250px" }}>{prod.descripcion}</small>}
                            </div>
                          </div>
                        </td>
                        <td><span className="text-dark fw-semibold">{prod.categoria_nombre}</span></td>
                        <td>
                          <Badge bg="secondary" className="me-2 font-monospace">{prod.subcategoria_codigo}</Badge>
                          <span className="text-muted">{prod.subcategoria_nombre}</span>
                        </td>
                        <td>
                          <Badge bg={prod.tipo_activo === "ACTIVO_FIJO" ? "primary" : "success"} className="px-2 py-1">
                            {prod.tipo_activo === "ACTIVO_FIJO" ? "🔧 Fijo" : "📦 Circulante"}
                          </Badge>
                        </td>
                        <td className="text-center fw-bold fs-6">
                          <span className={prod.stock > 0 ? "text-success" : "text-danger"}>{prod.stock ?? 0}</span>
                        </td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-secondary" size="sm" className="py-1 px-2 border-0" onClick={() => handleOpenEdit(prod)}><FaEdit size={14} /></Button>
                            <Button variant="outline-danger" size="sm" className="py-1 px-2 border-0" onClick={() => handleDeleteProduct(prod.id)}><FaTrashAlt size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>

          {/* ================================================================ */}
          {/* 📊 NUEVO CONTROL DE PAGINACIÓN COMPACTA EN LA PARTE INFERIOR     */}
          {/* ================================================================ */}
          {totalPaginas > 1 && (
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
        </>
      )}

      {/* MODAL DE APERTURA */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSaveProduct}>
          <Modal.Header closeButton className="bg-dark text-white py-3">
            <Modal.Title className="fw-bold fs-5">{isEdit ? "✏️ Modificar Parámetros de Artículo" : "🆕 Catalogar Artículo en Maestro"}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-light">
            <Row className="g-3">
              {formData.url_foto && (
                <Col md={12} className="text-center mb-2">
                  <img src={formData.url_foto} alt="Preview" className="img-thumbnail shadow-sm object-fit-contain" style={{ maxHeight: "160px" }} />
                </Col>
              )}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Código SKU (Automático)</Form.Label>
                  <Form.Control type="text" className="font-monospace fw-bold border-primary bg-white text-primary" value={formData.codigo_sku} readOnly />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Nombre del Artículo / Insumo Técnico *</Form.Label>
                  <Form.Control type="text" required placeholder="Ej: Manguera Hidráulica 3/4 R2T" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-primary">Categoría Raíz *</Form.Label>
                  <Form.Select required value={formData.categoria_id} onChange={handleCategoriaChange}>
                    <option value="">-- Seleccione Categoría --</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-primary">Subcategoría Específica *</Form.Label>
                  <Form.Select required value={formData.subcategoria_id} onChange={(e) => setFormData({ ...formData, subcategoria_id: e.target.value })} disabled={!formData.categoria_id}>
                    <option value="">-- Seleccione Subcategoría --</option>
                    {subcategoriasFiltradas.map((sub) => (
                      <option key={sub.id} value={sub.id}>[{sub.codigo_subcategoria || "00"}] {sub.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Valor Base Inicial ($PPP)</Form.Label>
                  <Form.Control type="number" min="0" placeholder="0" value={formData.precio_promedio} onChange={(e) => setFormData({ ...formData, precio_promedio: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Fotografía del Activo (Compresión Base64)</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control type="text" placeholder="Código Base64 de la imagen cargada..." value={formData.url_foto ? `${formData.url_foto.substring(0, 40)}... (Serializado)` : ""} readOnly className="bg-white text-muted small" />
                    <Button variant="outline-dark" className="d-flex align-items-center gap-1 flex-shrink-0" onClick={() => {
                      const inputElement = document.createElement("input");
                      inputElement.type = "file";
                      inputElement.accept = "image/*";
                      inputElement.onchange = (event) => {
                        const selectedFile = event.target.files[0];
                        if (selectedFile) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, url_foto: reader.result });
                          };
                          reader.readAsDataURL(selectedFile);
                        }
                      };
                      inputElement.click();
                    }}>
                      <FaImage /> Seleccionar archivo
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Ficha Técnico / Notas Adicionales</Form.Label>
                  <Form.Control as="textarea" rows={3} placeholder="Detalles de hilos, presiones máximas o especificaciones mecánicas del componente..." value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Header className="bg-white py-2 d-flex justify-content-end gap-2 border-top">
            <Button variant="outline-secondary" size="sm" className="fw-bold" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="dark" size="sm" type="submit" className="fw-bold px-4">⚡ Guardar Cambios en Maestro</Button>
          </Modal.Header>
        </Form>
      </Modal>
    </div>
  );
}