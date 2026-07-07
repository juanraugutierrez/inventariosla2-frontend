import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Table, Button, Form, Card, Alert, Row, Col, Pagination } from "react-bootstrap";

export default function UbicacionesBodega() {
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api" : "https://api.sla-inventario.cl/api";

  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const bodegaId = query.get("bodegaId");
  const bodegaNombre = query.get("nombre") || "Bodega";

  // --- 📊 ESTADOS BASE ---
  const [ubicaciones, setUbicaciones] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // --- 📑 NUEVOS ESTADOS COMPATIBLES CON EL GENERADOR AUTOMÁTICO DE RACKS ---
  const [rack, setRack] = useState("");
  const [letras, setLetras] = useState("");
  const [cantidadEspacios, setCantidadEspacios] = useState("1");
  const [descripcion, setDescripcion] = useState("");

  // --- 🔍 ESTADOS DE FILTRO Y PAGINACIÓN ---
  const [filterCodigo, setFilterCodigo] = useState("");
  const [filterDescripcion, setFilterDescripcion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!bodegaId) navigate("/warehouses");
    fetchUbicaciones();
  }, [bodegaId]);

  const fetchUbicaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/bodegas/${bodegaId}/ubicaciones`);
      if (res.ok) setUbicaciones(await res.json());
    } catch (err) {
      setErrorMsg("Error al conectar con el servidor.");
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    // Procesar la entrada de letras para convertirla en un arreglo limpio (Ej: "a, b" -> ["A", "B"])
    const listaLetras = letras
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    if (listaLetras.length === 0) {
      setErrorMsg("Debe ingresar al menos una letra o sección válida.");
      return;
    }

    // Estructuración exacta del JSON Payload requerido por el Motor Operativo de la API
    const payload = {
      bodega_id: parseInt(bodegaId),
      rack: parseInt(rack),
      letras: listaLetras,
      cantidad_espacios: parseInt(cantidadEspacios),
      descripcion: descripcion.trim() || null
    };

    try {
      const res = await fetch(`${API_URL}/ubicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Lote de ubicaciones físicas asignado con éxito.");
        // Limpieza de campos del formulario
        setRack("");
        setLetras("");
        setCantidadEspacios("1");
        setDescripcion("");
        // Refrescar tabla de datos
        fetchUbicaciones();
      } else {
        setErrorMsg(data.error || "Ocurrió un error.");
      }
    } catch (err) {
      setErrorMsg("Error de red al intentar comunicar el lote con MySQL.");
    }
  };

  // --- ⚙️ LÓGICA DE FILTRADO EN TIEMPO REAL ---
  const filteredUbicaciones = ubicaciones.filter((ub) => {
    const cumpleCodigo = ub.codigo.toLowerCase().includes(filterCodigo.toLowerCase());
    const cumpleDesc = (ub.descripcion || "").toLowerCase().includes(filterDescripcion.toLowerCase());
    return cumpleCodigo && cumpleDesc;
  });

  // --- ⚙️ CÁLCULO DE PAGINACIÓN ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUbicaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUbicaciones.length / itemsPerPage);

  const handleFilterCodigoChange = (e) => {
    setFilterCodigo(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterDescripcionChange = (e) => {
    setFilterDescripcion(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="container py-4">
      <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate("/warehouses")}>← Volver a Bodegas</Button>
      <h3 className="fw-bold text-dark mb-1">📍 Distribución Física: {bodegaNombre}</h3>
      <p className="text-muted small mb-4">Configuración de pasillos, estantes o casilleros para el ordenamiento interno.</p>

      {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>{errorMsg}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg("")}>{successMsg}</Alert>}

      <Row className="g-4">
        {/* Panel Izquierdo: Formulario Avanzado de Racks */}
        <Col md={4}>
          <Card className="border-0 shadow-sm p-3 rounded-3">
            <h6 className="fw-bold text-secondary mb-3">Generador Masivo de Racks</h6>
            <Form onSubmit={handleGuardar}>
              
              {/* INPUT: NÚMERO DE RACK */}
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Número identificador de Rack / Estante *</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  placeholder="Ej: 4 (Se formateará a 0004)" 
                  value={rack} 
                  onChange={(e) => setRack(e.target.value)} 
                  required 
                />
              </Form.Group>

              {/* INPUT: SECCIONES / LETRAS */}
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Secciones / Niveles (Letras) *</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ej: a, b (Separadas por coma)" 
                  value={letras} 
                  onChange={(e) => setLetras(e.target.value)} 
                  required 
                />
                <Form.Text className="text-muted d-block mt-0.5" style={{ fontSize: "0.7rem", lineHeight: "1.1" }}>
                  Fuerza mayúsculas automáticamente. Puedes colocar una sola o varias.
                </Form.Text>
              </Form.Group>

              {/* INPUT: CANTIDAD DE ESPACIOS */}
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold mb-1">Cantidad de casilleros por nivel *</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  placeholder="Ej: 3 (Creará del 001 al 003)" 
                  value={cantidadEspacios} 
                  onChange={(e) => setCantidadEspacios(e.target.value)} 
                  required 
                />
              </Form.Group>

              {/* INPUT: DESCRIPCIÓN */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold mb-1">Descripción Base de la Estructura</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Ej: Estante de repuestos críticos..." 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                />
              </Form.Group>

              <Button type="submit" variant="dark" size="sm" className="w-100 fw-bold shadow-xs py-2">
                ⚡ Desagregar y Registrar Lote
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Panel Derecho: Tabla con Filtros y Paginación */}
        <Col md={8}>
          <Card className="border-0 shadow-sm p-3 mb-3 rounded-3 bg-white">
            <Row className="g-2 align-items-center">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted mb-1">Buscar por Código Calculado</Form.Label>
                  <Form.Control 
                    size="sm" 
                    type="text" 
                    placeholder="🔎 Ej: 0004-A..." 
                    value={filterCodigo} 
                    onChange={handleFilterCodigoChange} 
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted mb-1">Buscar por Descripción</Form.Label>
                  <Form.Control 
                    size="sm" 
                    type="text" 
                    placeholder="🔎 Palabras clave..." 
                    value={filterDescripcion} 
                    onChange={handleFilterDescripcionChange} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card>

          <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
            <Table striped hover className="mb-0 align-middle small">
              <thead className="table-dark">
                <tr>
                  <th className="ps-3" style={{ width: "80px" }}>ID</th>
                  <th>Código de Ubicación</th>
                  <th>Descripción Asignada</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((ub) => (
                  <tr key={ub.id}>
                    <td className="ps-3 text-muted font-monospace">#{ub.id}</td>
                    <td className="fw-bold text-primary font-monospace">{ub.codigo}</td>
                    <td>{ub.descripcion || <span className="text-muted fst-italic">Sin notas</span>}</td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-muted fst-italic">
                      No se encontraron ubicaciones físicas con los criterios ingresados.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Card.Footer className="bg-white border-top-0 d-flex flex-wrap justify-content-between align-items-center py-2 px-3">
                <span className="text-muted small">
                  Mostrando del <b>{indexOfFirstItem + 1}</b> al <b>{Math.min(indexOfLastItem, filteredUbicaciones.length)}</b> de <b>{filteredUbicaciones.length}</b> registros encontrados.
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
        </Col>
      </Row>
    </div>
  );
}