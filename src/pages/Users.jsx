import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaUserPlus } from 'react-icons/fa';

export default function Users() {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    rut_o_documento: '',
    nombre_completo: '',
    email: '',
    perfil_id: ''
  });

  // 🔑 ENDPOINT CORPORATIVO DE PRODUCCIÓN ASIGNADO
  const API_URL = "https://api.sla-inventario.cl/api";

  const cargarUsuariosYPerfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const resUsers = await fetch(`${API_URL}/users`);
      if (!resUsers.ok) throw new Error("Error consultando la lista de usuarios");
      const dataUsers = await resUsers.json();
      setUsuarios(dataUsers);

      const resPerfiles = await fetch(`${API_URL}/perfiles`);
      if (resPerfiles.ok) {
        const dataPerfiles = await resPerfiles.json();
        setPerfiles(dataPerfiles);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuariosYPerfiles();
  }, []);

  const abrirModalEdicion = (user) => {
    setUsuarioSeleccionado(user);
    setFormData({
      id: user.id,
      rut_o_documento: user.rut_o_documento,
      nombre_completo: user.nombre_completo,
      email: user.email,
      perfil_id: user.perfil_id ? String(user.perfil_id) : ''
    });
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();

    if (!formData.nombre_completo.trim() || !formData.email.trim() || !formData.rut_o_documento.trim()) {
      alert("Todos los campos obligatorios deben estar completos.");
      return;
    }

    if (!formData.perfil_id) {
      alert("Debe asignar un perfil/rol válido.");
      return;
    }

    const payload = {
      rut_o_documento: formData.rut_o_documento.trim(),
      nombre_completo: formData.nombre_completo.trim(),
      email: formData.email.trim(),
      perfil_id: parseInt(formData.perfil_id) 
    };

    try {
      const response = await fetch(`${API_URL}/users/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Usuario actualizado con éxito.");
        setUsuarioSeleccionado(null);
        cargarUsuariosYPerfiles();
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.error || 'No se pudieron guardar los cambios.'}`);
      }
    } catch (err) {
      alert("Error de red. No se pudo establecer comunicación con el backend.");
    }
  };

  const handleEliminarUsuario = async (id) => {
    if (!window.confirm("¿Está seguro de que desea dar de baja a este usuario del sistema?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert("Usuario dado de baja correctamente.");
        cargarUsuariosYPerfiles();
      } else {
        alert("No se pudo procesar la baja del usuario.");
      }
    } catch (err) {
      alert("Error de red intentando eliminar.");
    }
  };

  if (loading) return <div className="text-center my-5"><div className="spinner-border text-dark"></div><p className="mt-2 text-muted">Sincronizando tabla de usuarios...</p></div>;
  if (error) return <div className="alert alert-danger m-3"><strong>⚠️ Error de datos:</strong> {error}</div>;

  return (
    <div className="container mt-4">
      
      {/* ENCABEZADO OPTIMIZADO CON ACCESO DIRECTO RUTA /USERS/NEW */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="mb-0 text-dark fw-bold">👥 Control de Accesos y Usuarios</h2>
          <p className="text-muted small m-0">Gestión integrada de operadores y asignación de roles en tiempo real</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* 🚀 BOTÓN NUEVO: Enrutamiento directo al formulario de creación */}
          <Link to="/users/new" className="btn btn-sm btn-dark d-flex align-items-center gap-2 px-3 py-2 shadow-sm fw-bold">
            <FaUserPlus size={14} /> Crear Usuario Nuevo
          </Link>
          <span className="badge bg-secondary p-2.5 fs-7 border rounded-3 text-white shadow-xs font-monospace">Activos: {usuarios.length}</span>
        </div>
      </div>

      {/* --- TABLA DE USUARIOS --- */}
      <div className="table-responsive shadow-sm rounded border bg-white">
        <table className="table m-0 align-middle text-center">
          <thead>
            <tr className="table-dark text-uppercase font-monospace" style={{ fontSize: '0.78rem' }}>
              <th className="text-start ps-3">RUT / Documento</th>
              <th className="text-start">Nombre Completo</th>
              <th className="text-start">Correo Electrónico</th>
              <th>Perfil / Rol Asignado</th>
              <th style={{ width: '130px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted fst-italic">
                  No existen usuarios registrados o activos en el sistema.
                </td>
              </tr>
            ) : (
              usuarios.map((user) => (
                <tr key={user.id}>
                  <td className="text-start ps-3 font-monospace text-muted fw-bold">
                    {user.rut_o_documento}
                  </td>
                  <td className="text-start">
                    <span className="text-dark fw-bold">{user.nombre_completo}</span>
                  </td>
                  <td className="text-start text-secondary fw-semibold">
                    {user.email}
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border shadow-sm px-2 py-1.5 text-uppercase font-monospace" style={{ fontSize: '0.75rem' }}>
                      {user.perfil || 'Sin cargo'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-dark py-1 px-2.5 d-flex align-items-center gap-1"
                        onClick={() => abrirModalEdicion(user)}
                        title="Modificar usuario en modal"
                      >
                        <FaEdit size={12} /> <small className="fw-bold">Editar</small>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger py-1 px-2"
                        onClick={() => handleEliminarUsuario(user.id)}
                        title="Dar de baja usuario"
                      >
                        <FaTrashAlt size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- FORMULARIO MODAL CONTROLADO --- */}
      {usuarioSeleccionado && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">✏️ Modificar Datos del Usuario</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setUsuarioSeleccionado(null)}></button>
              </div>
              <form onSubmit={handleGuardarCambios}>
                <div className="modal-body bg-light">
                  
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold">RUT / Documento:</label>
                    <input 
                      type="text" 
                      className="form-control shadow-sm"
                      value={formData.rut_o_documento}
                      onChange={(e) => setFormData({ ...formData, rut_o_documento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold">Nombre Completo:</label>
                    <input 
                      type="text" 
                      className="form-control shadow-sm"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold">Correo Electrónico:</label>
                    <input 
                      type="email" 
                      className="form-control shadow-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary fw-semibold">Cargo / Rol Asignado:</label>
                    <select 
                      className="form-select shadow-sm"
                      value={formData.perfil_id}
                      onChange={(e) => setFormData({ ...formData, perfil_id: e.target.value })}
                      required
                    >
                      <option value="">-- Seleccionar nuevo cargo --</option>
                      {perfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                </div>
                <div className="modal-footer bg-white border-top">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setUsuarioSeleccionado(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-dark fw-semibold shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}