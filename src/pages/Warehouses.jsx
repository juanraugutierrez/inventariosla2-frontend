import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Card, Alert } from "react-bootstrap";

function Warehouses() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const [bodegas, setBodegas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Sincronizado con tu endpoint real de /users
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado inicial adaptado a tu esquema estricto de Prisma
  const initialState = { id: null, nombre: '', direccion: '', es_central: true, responsable_id: '' };
  const [currentBodega, setCurrentBodega] = useState(initialState);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Obtener las bodegas registradas
      const resBodegas = await fetch(`${API_URL}/bodegas`);
      if (resBodegas.ok) {
        const dataBodegas = await resBodegas.json();
        setBodegas(dataBodegas);
      }

      // 2. 🔑 CORRECCIÓN CRÍTICA: Consumimos exactamente /users como en Users.jsx
      const resUsuarios = await fetch(`${API_URL}/users`);
      if (resUsuarios.ok) {
        const dataUsuarios = await resUsuarios.json();
        setUsuarios(dataUsuarios);
      }
    } catch (error) {
      setErrorMsg("Error de red. No se pudo establecer comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowNew = () => {
    setCurrentBodega(initialState);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleShowEdit = (bodega) => {
    setCurrentBodega({
      ...bodega,
      // Convertimos a string para que el componente <select> de Bootstrap lo preseleccione correctamente
      responsable_id: bodega.responsable_id ? String(bodega.responsable_id) : ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const url = isEditing ? `${API_URL}/bodegas/${currentBodega.id}` : `${API_URL}/bodegas`;
    const method = isEditing ? 'PUT' : 'POST';

    // Formateamos los datos asegurando los tipos primitivos correctos para MySQL/Prisma
    const payload = {
      nombre: currentBodega.nombre.trim(),
      direccion: currentBodega.direccion ? currentBodega.direccion.trim() : null,
      es_central: Boolean(currentBodega.es_central),
      responsable_id: currentBodega.responsable_id ? parseInt(currentBodega.responsable_id) : null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok) {
        cargarDatos();
        setShowModal(false);
      } else {
        setErrorMsg(data.error || "Error interno al procesar los datos de la bodega.");
      }
    } catch (error) {
      setErrorMsg("Error de comunicación con el backend al guardar.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar permanentemente esta bodega del sistema?")) return;
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/bodegas/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        cargarDatos();
      } else {
        setErrorMsg(data.error || "La base de datos rechazó la eliminación de la bodega.");
      }
    } catch (error) {
      setErrorMsg("Error de comunicación con el backend al eliminar.");
    }
  };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted">Sincronizando registros de bodegas corporativas...</p></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="pagetitle">
          <h2 className="mb-0 text-dark fw-bold">🏢 Control y Gestión de Bodegas</h2>
          <p className="text-muted mb-0">Administración general de complejos centrales y unidades móviles de reparto.</p>
        </div>
        <Button variant="dark" onClick={handleShowNew} className="fw-bold px-4 shadow-sm">
          + Nueva Bodega
        </Button>
      </div>

      {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg("")} dismissible>{errorMsg}</Alert>}

      <div className="table-responsive shadow-sm rounded">
        <Table striped hover className="mb-0 align-middle">
          <thead>
            <tr className="table-dark">
              <th className="px-4" style={{ width: '80px' }}>ID</th>
              <th>Nombre de Infraestructura</th>
              <th>Dirección Física / Cobertura</th>
              <th>Tipo</th>
              <th>Responsable Asignado</th>
              <th className="text-center" style={{ width: '180px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bodegas.map((bodega) => {
              // Mapeo dinámico para pintar el nombre real del usuario responsable en la tabla
              const userResponsable = usuarios.find(u => u.id === bodega.responsable_id);

              return (
                <tr key={bodega.id}>
                  <td className="px-4 fw-bold text-secondary">{bodega.id}</td>
                  <td className="fw-bold text-dark">{bodega.nombre}</td>
                  <td>{bodega.direccion || <span className="text-muted fst-italic">No registrada</span>}</td>
                  <td>
                    <span className={`badge px-2 py-1.5 ${bodega.es_central ? 'bg-primary' : 'bg-success'}`} style={{ fontSize: '0.75rem' }}>
                      {bodega.es_central ? 'CENTRAL' : 'MÓVIL'}
                    </span>
                  </td>
                  <td>
                    {userResponsable ? (
                      <span className="fw-semibold text-dark">{userResponsable.nombre_completo}</span>
                    ) : (
                      <span className="text-muted fst-italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="text-center">
                    <Button variant="outline-dark" size="sm" className="me-2 fw-semibold" onClick={() => handleShowEdit(bodega)}>
                      Editar
                    </Button>
                    <Button variant="outline-danger" size="sm" className="fw-semibold" onClick={() => handleDelete(bodega.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              );
            })}
            {bodegas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted bg-white">
                  No existen bodegas configuradas en el sistema de inventarios.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* MODAL: FORMULARIO MAESTRO DE BODEGAS */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold text-dark">{isEditing ? '📝 Modificar Parámetros de Bodega' : '🏢 Configurar Nueva Bodega'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary">Nombre Identificador</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ej: Centro de Distribución Santiago / Furgón Peugeot" 
                value={currentBodega.nombre}
                onChange={(e) => setCurrentBodega({ ...currentBodega, nombre: e.target.value })}
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary">Dirección o Destinación Terrestre (Opcional)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ej: Av. Central #4560, Parque Industrial" 
                value={currentBodega.direccion}
                onChange={(e) => setCurrentBodega({ ...currentBodega, direccion: e.target.value })}
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Clasificación Operativa</Form.Label>
                  <Form.Select 
                    value={currentBodega.es_central ? 'true' : 'false'} 
                    onChange={(e) => setCurrentBodega({ ...currentBodega, es_central: e.target.value === 'true' })}
                  >
                    <option value="true">CENTRAL (Fija)</option>
                    <option value="false">MÓVIL (Vehículo)</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-secondary">Usuario Responsable Asignado</Form.Label>
                  <Form.Select 
                    value={currentBodega.responsable_id} 
                    onChange={(e) => setCurrentBodega({ ...currentBodega, responsable_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Trabajador --</option>
                    {usuarios.map(u => (
                      // Usamos 'nombre_completo' mapeado de tu base de datos real
                      <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" className="fw-semibold" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="dark" type="submit" className="fw-bold px-4">
              {isEditing ? 'Actualizar Bodega' : 'Dar de Alta'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Warehouses;