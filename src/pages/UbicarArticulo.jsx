import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";

export default function UbicarArticulo() {
  // Configuración dinámica de la URL de la API según el entorno
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api" : "https://api.sla-inventario.cl/api";

  const navigate = useNavigate();

  // --- 📊 ESTADOS DE CATÁLOGOS ---
  const [bodegas, setBodegas] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  // --- 📑 ESTADOS DEL FORMULARIO ---
  const [bodegaId, setBodegaId] = useState("");
  const [articuloId, setArticuloId] = useState("");
  const [ubicacionId, setUbicacionId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [tipoOperacion, setTipoOperacion] = useState("INGRESO"); // INGRESO o RETIRO

  // --- ⚙️ ESTADOS DE CONTROL ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Cargar Bodegas y Artículos al iniciar el componente
  useEffect(() => {
    cargarCatalogosIniciales();
  }, []);

  // Escuchar el cambio de Bodega para cargar sus ubicaciones específicas
  useEffect(() => {
    if (bodegaId) {
      cargarUbicacionesPorBodega(bodegaId);
    } else {
      setUbicaciones([]);
      setUbicacionId("");
    }
  }, [bodegaId]);

  const cargarCatalogosIniciales = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [resBodegas, resArticulos] = await Promise.all([
        fetch(`${API_URL}/bodegas`),
        fetch(`${API_URL}/productos`)
      ]);

      if (!resBodegas.ok || !resArticulos.ok) throw new Error("Error al obtener los catálogos.");

      setBodegas(await resBodegas.json());
      setArticulos(await resArticulos.json());
    } catch (err) {
      setErrorMsg("No se pudieron cargar las listas de bodegas o productos.");
    } finally {
      setLoading(false);
    }
  };

  const cargarUbicacionesPorBodega = async (id) => {
    try {
      const res = await fetch(`${API_URL}/bodegas/${id}/ubicaciones`);
      if (res.ok) {
        setUbicaciones(await res.json());
      } else {
        setUbicaciones([]);
      }
    } catch (err) {
      console.error("Error cargando ubicaciones:", err);
    }
  };

  const handleProcessAsignacion = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    setSubmitting(true);

    // Regla de negocio del Backend: Si es retiro, convertimos la cantidad a valor negativo
    const valorCantidad = parseInt(cantidad);
    const cantidadFinal = tipoOperacion === "RETIRO" ? valorCantidad * -1 : valorCantidad;

    const payload = {
      articulo_id: parseInt(articuloId),
      ubicacion_id: parseInt(ubicacionId),
      cantidad: cantidadFinal
    };

    try {
      const res = await fetch(`${API_URL}/inventario/ubicar-articulo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Movimiento posicional registrado correctamente.");
        // Limpiar solo campos variables
        setCantidad("");
      } else {
        setErrorMsg(data.error || "Ocurrió un inconveniente al ubicar el producto.");
      }
    } catch (err) {
      setErrorMsg("Fallo crítico de red o comunicación con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="dark" />
        <p className="text-muted small mt-2">Sincronizando posiciones operativas...</p>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidh: "800px" }}>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">📦 Control de Almacenamiento Posicional</h3>
        <p className="text-muted small mb-0">Vincular repuestos y herramientas directamente a sus celdas físicas, racks o estantes.</p>
      </div>

      {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>🚨 {errorMsg}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg("")}>✅ {successMsg}</Alert>}

      <Card className="border-0 shadow-sm p-4 rounded-3">
        <Form onSubmit={handleProcessAsignacion}>
          <Row className="g-3">
            
            {/* 1. SELECCIÓN DE BODEGA */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">1. Seleccionar Bodega / Instalación *</Form.Label>
                <Form.Select value={bodegaId} onChange={(e) => setBodegaId(e.target.value)} required>
                  <option value="">-- Seleccione Bodega --</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre} {b.es_central ? '(Central)' : '(Móvil)'}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* 2. SELECCIÓN DE UBICACIÓN (RACK/CASILLERO) */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">2. Posición Física (Código Automatizado) *</Form.Label>
                <Form.Select 
                  value={ubicacionId} 
                  onChange={(e) => setUbicacionId(e.target.value)} 
                  disabled={!bodegaId || ubicaciones.length === 0}
                  required
                >
                  <option value="">{bodegaId ? "-- Seleccione Posición --" : "<- Seleccione primero una bodega"}</option>
                  {ubicaciones.map(u => (
                    <option key={u.id} value={u.id}>{u.codigo} ({u.descripcion || 'Sin Notas'})</option>
                  ))}
                </Form.Select>
                {bodegaId && ubicaciones.length === 0 && (
                  <Form.Text className="text-danger small d-block mt-1">⚠️ Esta bodega no posee racks configurados aún.</Form.Text>
                )}
              </Form.Group>
            </Col>

            {/* 3. SELECCIÓN DE ARTÍCULO */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">3. Artículo o Componente Maestro *</Form.Label>
                <Form.Select value={articuloId} onChange={(e) => setArticuloId(e.target.value)} required>
                  <option value="">-- Seleccione el Artículo a Mover --</option>
                  {articulos.map(art => (
                    <option key={art.id} value={art.id}>[{art.codigo_sku}] - {art.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* 4. FLUJO OPERATIVO */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">4. Tipo de Acción Física</Form.Label>
                <div className="d-flex gap-3 mt-1">
                  <Form.Check 
                    type="radio" 
                    label="📥 Almacenar / Ingresar Stock" 
                    name="tipoOperacion" 
                    checked={tipoOperacion === "INGRESO"}
                    onChange={() => setTipoOperacion("INGRESO")}
                  />
                  <Form.Check 
                    type="radio" 
                    label="📤 Extraer / Picking" 
                    name="tipoOperacion" 
                    checked={tipoOperacion === "RETIRO"}
                    onChange={() => setTipoOperacion("RETIRO")}
                  />
                </div>
              </Form.Group>
            </Col>

            {/* 5. CANTIDAD */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">5. Cantidad de Unidades *</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1" 
                  placeholder="Ej: 10" 
                  value={cantidad} 
                  onChange={(e) => setCantidad(e.target.value)} 
                  required 
                />
              </Form.Group>
            </Col>

            {/* ACCIONES DEL FORMULARIO */}
            <Col md={12} className="text-end mt-4">
              <Button 
                variant="secondary" 
                size="sm" 
                className="me-2 fw-semibold" 
                onClick={() => navigate("/warehouses")} 
                disabled={submitting}
              >
                Volver
              </Button>
              <Button 
                type="submit" 
                variant={tipoOperacion === "INGRESO" ? "dark" : "danger"} 
                size="sm" 
                className="fw-bold px-4 shadow-xs" 
                disabled={submitting}
              >
                {submitting ? "Sincronizando..." : "Confirmar Movimiento Posicional"}
              </Button>
            </Col>

          </Row>
        </Form>
      </Card>
    </div>
  );
}