import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Card, Alert, Pagination } from "react-bootstrap";
import { FaFolderPlus, FaEdit, FaTrash, FaEye, FaFolderOpen, FaPlusCircle } from "react-icons/fa";

function Categories() {
  // const API_URL = "http://localhost:3000/api";
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";

  // Estados Principales
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [subcategorias, setSubcategorias] = useState([]); 
  const [errorMsg, setErrorMsg] = useState("");

  // Estados de Paginación (5 registros por página)
  const [currentPageCat, setCurrentPageCat] = useState(1);
  const [currentPageSub, setCurrentPageSub] = useState(1);
  const itemsPerPage = 5;

  // Estados de Modales para Categorías
  const [showModalCat, setShowModalCat] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [currentCat, setCurrentCat] = useState({ id: null, nombre: "" });

  // Estado del Modal de Subcategorías
  const [showSubManagerModal, setShowSubManagerModal] = useState(false);

  // Estados de Modales para Subcategorías
  const [showModalSub, setShowModalSub] = useState(false);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [currentSub, setCurrentSub] = useState({ id: null, nombre: "" });

  // 1. CARGAR CATEGORÍAS Y SUBCATEGORÍAS AL INICIAR
  useEffect(() => {
    fetchCategorias();
    fetchSubcategorias(); 
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/categorias`);
      const data = await res.json();
      if (res.ok) setCategorias(data);
    } catch (err) {
      setErrorMsg("Error al conectar con el servidor.");
    }
  };

  const fetchSubcategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/subcategorias`); 
      const data = await res.json();
      if (res.ok) setSubcategorias(data);
    } catch (err) {
      console.error("Error al cargar subcategorías:", err);
    }
  };

  // Al seleccionar una categoría, se reinicia la paginación interna del modal a la página 1
  const handleSelectCategoria = (cat) => {
    setSelectedCategoria(cat);
    setCurrentPageSub(1);
    setShowSubManagerModal(true);
  };

  // ==========================================
  // LÓGICA DE CATEGORÍAS (CRUD)
  // ==========================================
  const handleOpenCreateCat = () => {
    setIsEditingCat(false);
    setCurrentCat({ id: null, nombre: "" });
    setShowModalCat(true);
  };

  const handleOpenEditCat = (cat, e) => {
    e.stopPropagation(); 
    setIsEditingCat(true);
    setCurrentCat({ id: cat.id, nombre: cat.nombre });
    setShowModalCat(true);
  };

  const handleSaveCategoria = async (e) => {
    e.preventDefault();
    const method = isEditingCat ? "PUT" : "POST";
    const url = isEditingCat ? `${API_URL}/categorias/${currentCat.id}` : `${API_URL}/categorias`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: currentCat.nombre }),
      });
      if (res.ok) {
        setShowModalCat(false);
        fetchCategorias();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Error al procesar la categoría.");
      }
    } catch (err) {
      setErrorMsg("Error de red.");
    }
  };

  const handleDeleteCategoria = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    try {
      const res = await fetch(`${API_URL}/categorias/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCategorias();
        fetchSubcategorias(); 
        if (selectedCategoria?.id === id) {
          setShowSubManagerModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // LÓGICA DE SUBCATEGORÍAS
  // ==========================================
  const handleOpenCreateSub = () => {
    setIsEditingSub(false);
    setCurrentSub({ id: null, nombre: "" });
    setShowModalSub(true);
  };

  const handleOpenEditSub = (sub) => {
    setIsEditingSub(true);
    setCurrentSub({ id: sub.id, nombre: sub.nombre });
    setShowModalSub(true);
  };

  const handleSaveSubcategoria = async (e) => {
    e.preventDefault();
    const method = isEditingSub ? "PUT" : "POST";
    const url = isEditingSub ? `${API_URL}/subcategorias/${currentSub.id}` : `${API_URL}/subcategorias`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: currentSub.nombre,
          categoria_id: selectedCategoria.id, 
        }),
      });
      if (res.ok) {
        setShowModalSub(false);
        fetchSubcategorias(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubcategoria = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta subcategoría?")) return;
    try {
      const res = await fetch(`${API_URL}/subcategorias/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubcategorias();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // CÁLCULOS DE FILTRADO Y PAGINACIÓN
  // ==========================================
  
  // Filtrado estricto por tipo numérico
  const subcategoriasFiltradas = selectedCategoria
    ? subcategorias.filter((sub) => Number(sub.categoria_id) === Number(selectedCategoria.id)) 
    : [];

  // Paginación de Categorías
  const indexOfLastCat = currentPageCat * itemsPerPage;
  const indexOfFirstCat = indexOfLastCat - itemsPerPage;
  const currentCategorias = categorias.slice(indexOfFirstCat, indexOfLastCat);
  const totalPagesCat = Math.ceil(categorias.length / itemsPerPage);

  // Paginación de Subcategorías
  const indexOfLastSub = currentPageSub * itemsPerPage;
  const indexOfFirstSub = indexOfLastSub - itemsPerPage;
  const currentSubcategorias = subcategoriasFiltradas.slice(indexOfFirstSub, indexOfLastSub);
  const totalPagesSub = Math.ceil(subcategoriasFiltradas.length / itemsPerPage);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-dark fw-bold m-0">Categorías y Subcategorías</h2>
        <Button variant="primary" onClick={handleOpenCreateCat} className="fw-bold d-flex align-items-center gap-2">
          <FaFolderPlus /> Nueva Categoría
        </Button>
      </div>

      {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg("")} dismissible>{errorMsg}</Alert>}

      {/* TARJETA DE CATEGORÍAS PRINCIPALES */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-dark text-white fw-bold py-3">
          Categorías Principales
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover striped className="align-middle mb-0 text-dark">
              <thead className="table-secondary">
                <tr>
                  <th style={{ width: "80px" }} className="text-center">ID</th>
                  <th>Nombre</th>
                  <th className="text-end px-4" style={{ width: "300px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentCategorias.map((cat) => (
                  <tr 
                    key={cat.id} 
                    style={{ cursor: "pointer" }} 
                    onClick={() => handleSelectCategoria(cat)}
                    className={selectedCategoria?.id === cat.id && showSubManagerModal ? "table-primary" : ""}
                  >
                    <td className="text-center font-monospace fw-bold text-secondary">#{cat.id}</td>
                    <td className="fw-bold">{cat.nombre}</td>
                    <td className="text-end px-4" onClick={(e) => e.stopPropagation()}>
                      {/* Contenedor Flex alineado a la derecha en una sola fila */}
                      <div className="d-flex gap-1 justify-content-end">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="fw-bold py-1 px-2 d-flex align-items-center gap-1"
                          onClick={() => handleSelectCategoria(cat)}
                        >
                          <FaEye size={12} /> <span className="d-none d-md-inline">Ver Subs</span>
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm" 
                          className="py-1 px-2 d-flex align-items-center"
                          onClick={(e) => handleOpenEditCat(cat, e)}
                        >
                          <FaEdit size={12} />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="py-1 px-2 d-flex align-items-center"
                          onClick={(e) => handleDeleteCategoria(cat.id, e)}
                        >
                          <FaTrash size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categorias.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-5 text-muted fst-italic">No hay categorías maestras registradas.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        
        {/* Renderizado Condicional de la Paginación de Categorías */}
        {totalPagesCat > 1 && (
          <Card.Footer className="bg-white d-flex justify-content-center py-2 border-top">
            <Pagination className="mb-0 dynamic-pagination">
              <Pagination.First onClick={() => setCurrentPageCat(1)} disabled={currentPageCat === 1} />
              <Pagination.Prev onClick={() => setCurrentPageCat(prev => Math.max(prev - 1, 1))} disabled={currentPageCat === 1} />
              {[...Array(totalPagesCat)].map((_, idx) => (
                <Pagination.Item 
                  key={idx + 1} 
                  active={idx + 1 === currentPageCat} 
                  onClick={() => setCurrentPageCat(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setCurrentPageCat(prev => Math.max(prev + 1, totalPagesCat))} disabled={currentPageCat === totalPagesCat} />
              <Pagination.Last onClick={() => setCurrentPageCat(totalPagesCat)} disabled={currentPageCat === totalPagesCat} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* ==========================================
          🔑 MODAL CENTRALIZADO: ADM. DE SUBCATEGORÍAS 
         ========================================== */}
      <Modal show={showSubManagerModal} onHide={() => setShowSubManagerModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white py-3">
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <FaFolderOpen /> Subcategorías de: <span className="text-warning">{selectedCategoria?.nombre}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
            <span className="text-muted small fw-bold">Manejo interno de clasificaciones.</span>
            <Button variant="success" size="sm" onClick={handleOpenCreateSub} className="fw-bold shadow-sm d-flex align-items-center gap-1">
              <FaPlusCircle /> Añadir Subcategoría
            </Button>
          </div>

          <div className="table-responsive">
            <Table striped hover className="align-middle mb-0 text-dark">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "120px" }} className="ps-4">ID Sub</th>
                  <th>Nombre Subcategoría</th>
                  <th className="text-center" style={{ width: "180px" }}>Operaciones</th>
                </tr>
              </thead>
              <tbody>
                {currentSubcategorias.map((sub) => (
                  <tr key={sub.id}>
                    <td className="ps-4 font-monospace text-muted">#{sub.id}</td>
                    <td className="fw-bold text-secondary">{sub.nombre}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <Button 
                          variant="outline-warning" 
                          size="sm" 
                          className="py-1 px-2 small"
                          onClick={() => handleOpenEditSub(sub)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="py-1 px-2 small"
                          onClick={() => handleDeleteSubcategoria(sub.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {subcategoriasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-muted fst-italic">
                      Esta categoría no cuenta con subcategorías asignadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>

        {/* Renderizado de la Paginación de Subcategorías dentro del Footer del Modal */}
        {totalPagesSub > 1 && (
          <Modal.Footer className="bg-light d-flex justify-content-center py-2 border-top">
            <Pagination className="mb-0 dynamic-pagination pagination-sm">
              <Pagination.First onClick={() => setCurrentPageSub(1)} disabled={currentPageSub === 1} />
              <Pagination.Prev onClick={() => setCurrentPageSub(prev => Math.max(prev - 1, 1))} disabled={currentPageSub === 1} />
              {[...Array(totalPagesSub)].map((_, idx) => (
                <Pagination.Item 
                  key={idx + 1} 
                  active={idx + 1 === currentPageSub} 
                  onClick={() => setCurrentPageSub(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setCurrentPageSub(prev => Math.max(prev + 1, totalPagesSub))} disabled={currentPageSub === totalPagesSub} />
              <Pagination.Last onClick={() => setCurrentPageSub(totalPagesSub)} disabled={currentPageSub === totalPagesSub} />
            </Pagination>
          </Modal.Footer>
        )}
      </Modal>

      {/* MODAL FORMULARIO: DETALLE CATEGORÍA */}
      <Modal show={showModalCat} onHide={() => setShowModalCat(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">{isEditingCat ? "Modificar Categoría" : "Nueva Categoría"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCategoria}>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary">Nombre de Categoría</Form.Label>
              <Form.Control 
                type="text" 
                value={currentCat.nombre} 
                onChange={(e) => setCurrentCat({ ...currentCat, nombre: e.target.value })} 
                required 
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModalCat(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" className="fw-bold">Guardar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL FORMULARIO: DETALLE SUBCATEGORÍA */}
      <Modal show={showModalSub} onHide={() => setShowModalSub(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">{isEditingSub ? "Modificar Subcategoría" : "Nueva Subcategoría"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSubcategoria}>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-bold text-secondary">Nombre</Form.Label>
              <Form.Control 
                type="text" 
                value={currentSub.nombre} 
                onChange={(e) => setCurrentSub({ ...currentSub, nombre: e.target.value })} 
                required 
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModalSub(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" className="fw-bold">Guardar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Categories;