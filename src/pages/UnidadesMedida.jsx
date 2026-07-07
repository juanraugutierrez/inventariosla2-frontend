import React, { useState, useEffect } from "react";
import { Table, Button, Form, Card, Alert, Row, Col, Pagination } from "react-bootstrap";
import { FaEdit, FaTrash, FaBalanceScale } from "react-icons/fa";

export default function UnidadesMedida() {
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api" : "https://api.sla-inventario.cl/api";

  const [unidades, setUnidades] = useState([]);
  const [nombre, setNombre] = useState("");
  const [abreviacion, setAbreviacion] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      const res = await fetch(`${API_URL}/unidades-medida`);
      if (res.ok) setUnidades(await res.json());
    } catch (err) {
      setErrorMsg("Error al comunicar con la base de datos.");
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    const url = isEditing ? `${API_URL}/unidades-medida/${editId}` : `${API_URL}/unidades-medida`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, abreviacion })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(isEditing ? "Unidad modificada correctamente." : "Nueva unidad registrada con éxito.");
        setNombre(""); setAbreviacion(""); setIsEditing(false); setEditId(null);
        fetchUnidades();
      } else {
        setErrorMsg(data.error || "Ocurrió un error.");
      }
    } catch (err) {
      setErrorMsg("Error de comunicación de red.");
    }
  };

  const handleOpenEdit = (uni) => {
    setIsEditing(true);
    setEditId(uni.id);
    setNombre(uni.nombre);
    setAbreviacion(uni.abreviacion || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false); setEditId(null); setNombre(""); setAbreviacion("");
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Dar de baja esta unidad paramétrica de embalaje?")) return;
    setErrorMsg(""); setSuccessMsg("");

    try {
      const res = await fetch(`${API_URL}/unidades-medida/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Registro removido con éxito.");
        fetchUnidades();
      } else {
        setErrorMsg(data.error || "No se puede eliminar.");
      }
    } catch (err) {
      setErrorMsg("Error de red.");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = unidades.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(unidades.length / itemsPerPage);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">⚖️ Parámetros: Unidades de Almacenamiento</h3>
        <p className="text-muted small">Configuración global de empaques, cubicajes y magnitudes de fraccionamiento contable.</p>
      </div>

      {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>{errorMsg}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg("")}>{successMsg}</Alert>}

      <Row className="g-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm p-3 rounded-3 bg-white">
            <h6 className="fw-bold text-secondary mb-3">{isEditing ? "✏️ Editar Parámetro" : "➕ Nueva Magnitud"}</h6>
            <Form onSubmit={handleGuardar}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">Descripción Textual *</Form.Label>
                <Form.Control type="text" placeholder="Ej: BIDÓN 5 LITROS, METROS" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Abreviación Comercial</Form.Label>
                <Form.Control type="text" placeholder="Ej: bd5L, m." value={abreviacion} onChange={(e) => setAbreviacion(e.target.value)} />
              </Form.Group>
              <div className="d-flex gap-2">
                {isEditing && <Button variant="outline-secondary" size="sm" className="w-50 fw-bold" onClick={handleCancelEdit}>Cancelar</Button>}
                <Button type="submit" variant="dark" size="sm" className={isEditing ? "w-50 fw-bold" : "w-100 fw-bold"}>{isEditing ? "Actualizar" : "Registrar Unidad"}</Button>
              </div>
            </Form>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
            <Table striped hover className="mb-0 align-middle small">
              <thead className="table-dark">
                <tr>
                  <th className="ps-3" style={{ width: "80px" }}>ID</th>
                  <th>Unidad Registrada</th>
                  <th>Abreviación</th>
                  <th className="text-center" style={{ width: "130px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((uni) => (
                  <tr key={uni.id}>
                    <td className="ps-3 text-muted font-monospace">#{uni.id}</td>
                    <td className="fw-bold text-dark text-uppercase">{uni.nombre}</td>
                    <td className="font-monospace text-secondary">{uni.abreviacion || "-"}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <Button variant="outline-dark" size="sm" className="py-0 px-2 border-0" onClick={() => handleOpenEdit(uni)}><FaEdit size={12} /></Button>
                        <Button variant="outline-danger" size="sm" className="py-0 px-2 border-0" onClick={() => handleEliminar(uni.id)} disabled={uni.id === 1}><FaTrash size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {totalPages > 1 && (
              <Card.Footer className="bg-white border-top-0 d-flex justify-content-between align-items-center py-2 px-3">
                <span className="text-muted small">Total: <b>{unidades.length}</b> magnitudes parametrizadas.</span>
                <Pagination size="sm" className="mb-0">
                  {[...Array(totalPages).keys()].map(p => (
                    <Pagination.Item key={p+1} active={p+1 === currentPage} onClick={() => setCurrentPage(p+1)}>{p+1}</Pagination.Item>
                  ))}
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}