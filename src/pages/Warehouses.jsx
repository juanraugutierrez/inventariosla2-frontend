import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Card, Alert, Spinner } from "react-bootstrap";

/**
 * Componente de Gestión de Bodegas (Centrales y Vehículos Móviles)
 * Sistema ERP - Servilift
 */
export default function Warehouses() {
  // 🛡️ ENRUTADOR DE ENTORNOS SEGURO: Configuración dinámica de la URL de la API
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "https://api.sla-inventario.cl/api";

  // --- 📊 ESTADOS DEL COMPONENTE ---
  const [bodegas, setBodegas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // --- 📑 ESTADOS DE CONTROL DE MODALES ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado inicial estricto adaptado al esquema de Prisma
  const initialState = { id: null, nombre: '', direccion: '', es_central: true, responsable_id: '' };
  const [currentBodega, setCurrentBodega] = useState(initialState);

  // --- 🔄 EFECTOS DE INICIALIZACIÓN ---
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Carga masiva paralela desde la API para optimizar el rendimiento
   */
  const cargarDatos = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [resBodegas, resUsuarios] = await Promise.all([
        fetch(`${API_URL}/bodegas`),
        fetch(`${API_URL}/users`) // Sincronizado con el endpoint maestro de trabajadores
      ]);

      if (!resBodegas.ok || !resUsuarios.ok) {
        throw new Error("No se pudo obtener la información desde los servicios.");
      }

      const dataBodegas = await resBodegas.json();
      const dataUsuarios = await resUsuarios.json();

      setBodegas(dataBodegas);
      setUsuarios(dataUsuarios);
    } catch (error) {
      console.error("❌ Error al inicializar catálogos:", error);
      setErrorMsg("Ocurrió un error al intentar comunicar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // --- ⚙️ MANEJADORES DE ACCIÓN ---

  const handleShowCreate = () => {
    setIsEditing(false);
    setCurrentBodega(initialState);
    setShowModal(true);
  };

  const handleShowEdit = (bodega) => {
    setIsEditing(true);
    setCurrentBodega({
      id: bodega.id,
      nombre: bodega.nombre,
      direccion: bodega.direccion || '',
      es_central: bodega.es_central,
      responsable_id: bodega.responsable_id || ''
    });
    setShowModal(true);
  };

  /**
   * Procesa la inserción o actualización de la bodega ante la API
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const url = isEditing ? `${API_URL}/bodegas/${currentBodega.id}` : `${API_URL}/bodegas`;
    const method = isEditing ? "PUT" : "POST";

    // Formateo estricto de tipos antes del envío (Express espera JSON estructurado)
    const payload = {
      nombre: currentBodega.nombre.trim(),
      direccion: currentBodega.direccion.trim() || null,
      es_central: String(currentBodega.es_central) === "true",
      responsable_id: currentBodega.responsable_id ? parseInt(currentBodega.responsable_id) : null
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Fallo en la operación interna de base de datos.");
      }

      setShowModal(false);
      cargarDatos(); // Refrescar grilla
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  /**
   * Elimina de forma lógica o física una instalación física
   */
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está completamente seguro de dar de baja esta bodega móvil/central?")) return;
    setErrorMsg("");
    try {
      const response = await fetch(`${API_URL}/bodegas/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "La bodega contiene stock activo y no puede eliminarse.");
      }
      cargarDatos();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="container py-4">
      {/* Encabezado Principal */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">🏢 Control de Bodegas e Instalaciones</h3>
          <p className="text-muted small mb-0">Gestión física de centros de distribución maestros y pañoles móviles de Servilift.</p>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-dark" 
            className="fw-bold" 
            onClick={() => window.location.href = "/warehouses/stock"}
          >
            📊 Ver Stock General
          </Button>
          <Button variant="dark" className="fw-bold shadow-xs" onClick={handleShowCreate}>
            + Dar de Alta Bodega
          </Button>
        </div>
      </div>

      {/* Alertas Globales de Error */}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="fw-semibold small">
          🚨 {errorMsg}
        </Alert>
      )}

      {/* Contenedor Principal de Datos */}
      <Card className="border-0 shadow-sm rounded-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="dark" className="mb-2" />
            <p className="text-muted small mb-0">Consultando registros en MySQL...</p>
          </div>
        ) : (
          <Table responsive hover className="mb-0 align-middle small">
            <thead className="table-dark">
              <tr>
                <th className="ps-3" style={{ width: "80px" }}>ID</th>
                <th>Nombre de Instalación</th>
                <th>Dirección / Patente</th>
                <th className="text-center">Tipo</th>
                {/* 🔑 CORRECCIÓN 1: Se incrementa el ancho de la columna a 400px para albergar los 4 botones holgadamente */}
                <th className="text-center" style={{ width: "400px" }}>Acciones de Control</th>
              </tr>
            </thead>
            <tbody>
              {bodegas.map((bodega) => {
                const responsable = usuarios.find(u => u.id === bodega.responsable_id);
                return (
                  <tr key={bodega.id}>
                    <td className="ps-3 text-muted font-monospace">#{bodega.id}</td>
                    <td>
                      <div className="fw-bold text-dark">{bodega.nombre}</div>
                      <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>
                        👤 Resp: {responsable ? responsable.nombre_completo : "No Asignado"}
                      </small>
                    </td>
                    <td>{bodega.direccion || <span className="text-muted fst-italic">Sin dirección</span>}</td>
                    <td className="text-center">
                      <span className={`badge ${bodega.es_central ? "bg-dark" : "bg-secondary"} px-2.5 py-1.5`}>
                        {bodega.es_central ? "CENTRAL" : "MÓVIL (Vehículo)"}
                      </span>
                    </td>
                    <td className="text-center">
                      {/* 🔑 CORRECCIÓN 2: Flexbox matricial nativo con gap controlado y deshabilitación de saltos de línea (text-nowrap) */}
                      <div className="d-flex justify-content-center align-items-center gap-1 text-nowrap">
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="fw-semibold py-1 px-2"
                          onClick={() => window.location.href = `/warehouses/stock?bodegaId=${bodega.id}`}
                        >
                          📦 Stock
                        </Button>
                        
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="fw-semibold py-1 px-2"
                          onClick={() => window.location.href = `/warehouses/ubicaciones?bodegaId=${bodega.id}&nombre=${encodeURIComponent(bodega.nombre)}`}
                        >
                          📍 Ubicaciones
                        </Button>
                        
                        <Button 
                          variant="outline-dark" 
                          size="sm" 
                          className="fw-semibold py-1 px-2" 
                          onClick={() => handleShowEdit(bodega)}
                        >
                          Editar
                        </Button>
                        
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="fw-semibold py-1 px-2" 
                          onClick={() => handleDelete(bodega.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bodegas.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted fst-italic">
                    No se han encontrado bodegas parametrizadas en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* 📋 MODAL DE FORMULARIO MAESTRO */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-dark">
            {isEditing ? "Modificar Configuración de Bodega" : "Registrar Nueva Bodega"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="py-3">
            <div className="row g-3">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">Nombre de la Bodega *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Ej: Bodega Central Quilicura o Furgón Fiorino AB-CD-12"
                    value={currentBodega.nombre}
                    onChange={(e) => setCurrentBodega({ ...currentBodega, nombre: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>

              <div className="col-md-12">
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">Dirección / Datos de Referencia</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Ubicación física o identificador logístico"
                    value={currentBodega.direccion}
                    onChange={(e) => setCurrentBodega({ ...currentBodega, direccion: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">Clasificación Operativa</Form.Label>
                  <Form.Select 
                    value={String(currentBodega.es_central)}
                    onChange={(e) => setCurrentBodega({ ...currentBodega, es_central: e.target.value })}
                  >
                    <option value="true">CENTRAL (Edificio)</option>
                    <option value="false">MÓVIL (Vehículo)</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold text-secondary small">Usuario Responsable Asignado</Form.Label>
                  <Form.Select 
                    value={currentBodega.responsable_id} 
                    onChange={(e) => setCurrentBodega({ ...currentBodega, responsable_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Trabajador --</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-light border-top-0 py-2">
            <Button variant="secondary" size="sm" className="fw-semibold" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="dark" size="sm" type="submit" className="fw-bold px-4">
              {isEditing ? 'Actualizar Bodega' : 'Dar de Alta'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}