import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrashAlt, FaSave, FaTimesCircle } from 'react-icons/fa';

export default function Users() {
  // --- ESTADOS DE DATOS DESDE MYSQL ---
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS DE EDICIÓN EN LÍNEA ---
  const [idFilaEditando, setIdFilaEditando] = useState(null);
  const [datosFilaEditando, setDatosFilaEditando] = useState({
    nombre_completo: '',
    email: '',
    perfil_id: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // --- 1. CARGA DE USUARIOS Y ROLES DISPONIBLES ---
  const cargarUsuariosYPerfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Traer usuarios activos con sus IDs de relación unificados
      const resUsers = await fetch(`${API_URL}/users`);
      if (!resUsers.ok) throw new Error("Error consultando la lista de usuarios");
      const dataUsers = await resUsers.json();
      setUsuarios(dataUsers);

      // Traer catálogo de perfiles/roles para los menús desplegables
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
  }, [API_URL]);

  // --- 2. ACTIVAR MODO DE EDICIÓN EN LÍNEA ---
  const habilitarEdicionFila = (user) => {
    setIdFilaEditando(user.id);
    setDatosFilaEditando({
      nombre_completo: user.nombre_completo,
      email: user.email,
      // Almacenamos el ID numérico estricto del perfil para el select
      perfil_id: user.perfil_id ? String(user.perfil_id) : '' 
    });
  };

  const cancelarEdicionFila = () => {
    setIdFilaEditando(null);
    setDatosFilaEditando({ nombre_completo: '', email: '', perfil_id: '' });
  };

  // --- 3. PERSISTIR ACTUALIZACIÓN EN MYSQL (PUT) 🔑 ---
  const handleGuardarCambios = async (id) => {
    if (!datosFilaEditando.nombre_completo.trim() || !datosFilaEditando.email.trim()) {
      alert("El nombre completo y el correo electrónico no pueden quedar vacíos.");
      return;
    }

    if (!datosFilaEditando.perfil_id) {
      alert("Debe asignar un perfil válido al usuario.");
      return;
    }

    // Payload limpio con tipos primitivos unificados para Prisma
    const payload = {
      nombre_completo: datosFilaEditando.nombre_completo.trim(),
      email: datosFilaEditando.email.trim(),
      perfil_id: parseInt(datosFilaEditando.perfil_id) // 👈 Forzamos entero para la FK de MySQL
    };

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Usuario actualizado con éxito en la base de datos.");
        setIdFilaEditando(null); // Desactivar modo edición
        cargarUsuariosYPerfiles(); // Recargar grilla con datos reales
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.error || 'No se pudieron guardar los cambios.'}`);
      }
    } catch (err) {
      alert("Error de red. No se pudo establecer comunicación con el backend.");
    }
  };

  // --- 4. DAR DE BAJA / ELIMINACIÓN LÓGICA (DELETE) ---
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0 text-dark fw-bold">👥 Control de Accesos y Usuarios</h2>
        <span className="badge bg-dark p-2 fs-6">Activos: {usuarios.length}</span>
      </div>

      <div className="table-responsive shadow-sm rounded">
        <table className="table m-0 align-middle">
          <thead>
            {/* Cabecera oscura consistente con tu catálogo */}
            <tr className="table-dark">
              <th>RUT / Documento</th>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Perfil / Rol Asignado</th>
              <th className="text-center" style={{ width: '130px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted" style={{ backgroundColor: '#ffffff' }}>
                  No existen usuarios registrados o activos en el sistema.
                </td>
              </tr>
            ) : (
              usuarios.map((user) => {
                const estaEditandoEsteUser = idFilaEditando === user.id;

                return (
                  <tr key={user.id}>
                    {/* El RUT nunca cambia (Fondo blanco estricto por requerimiento anterior) */}
                    <td style={{ backgroundColor: '#ffffff', color: '#6c757d' }} className="fw-semibold">
                      {user.rut_o_documento}
                    </td>

                    {/* NOMBRE COMPLETÓ */}
                    <td style={{ backgroundColor: '#ffffff' }}>
                      {estaEditandoEsteUser ? (
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          value={datosFilaEditando.nombre_completo}
                          onChange={(e) => setDatosFilaEditando({ ...datosFilaEditando, nombre_completo: e.target.value })}
                        />
                      ) : (
                        <span className="text-dark fw-bold">{user.nombre_completo}</span>
                      )}
                    </td>

                    {/* CORREO ELECTRÓNICO */}
                    <td style={{ backgroundColor: '#ffffff', color: '#212529' }}>
                      {estaEditandoEsteUser ? (
                        <input 
                          type="email" 
                          className="form-control form-control-sm"
                          value={datosFilaEditando.email}
                          onChange={(e) => setDatosFilaEditando({ ...datosFilaEditando, email: e.target.value })}
                        />
                      ) : (
                        user.email
                      )}
                    </td>

                    {/* SELECTOR ASIGNADO / ASIGNABLE DE PERFIL 🌟 */}
                    <td style={{ backgroundColor: '#ffffff' }}>
                      {estaEditandoEsteUser ? (
                        <select 
                          className="form-select form-select-sm"
                          value={datosFilaEditando.perfil_id}
                          onChange={(e) => setDatosFilaEditando({ ...datosFilaEditando, perfil_id: e.target.value })}
                        >
                          <option value="">-- Cambiar Rol --</option>
                          {perfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge bg-light text-dark border shadow-sm px-2 py-1.5" style={{ fontSize: '0.85rem' }}>
                          {user.perfil}
                        </span>
                      )}
                    </td>

                    {/* BOTONERA DINÁMICA DE ACCIONES */}
                    <td style={{ backgroundColor: '#ffffff' }} className="text-center">
                      {estaEditandoEsteUser ? (
                        <div className="d-flex justify-content-center gap-2">
                          {/* Botón Guardar (Disquete Verde) */}
                          <button 
                            type="button" 
                            className="btn btn-sm btn-success p-1.5 d-flex align-items-center justify-content-center shadow-sm"
                            onClick={() => handleGuardarCambios(user.id)}
                            title="Confirmar cambios y guardar en MySQL"
                          >
                            <FaSave size={14} />
                          </button>
                          {/* Botón Cancelar (Círculo Rojo) */}
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger p-1.5 d-flex align-items-center justify-content-center shadow-sm"
                            onClick={cancelarEdicionFila}
                            title="Descartar"
                          >
                            <FaTimesCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-center gap-2">
                          {/* Botón Editar */}
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-dark p-1.5 d-flex align-items-center justify-content-center"
                            onClick={() => habilitarEdicionFila(user)}
                            title="Editar en línea"
                          >
                            <FaEdit size={13} />
                          </button>
                          {/* Botón Eliminar */}
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-danger p-1.5 d-flex align-items-center justify-content-center"
                            onClick={() => handleEliminarUsuario(user.id)}
                            title="Dar de baja usuario"
                          >
                            <FaTrashAlt size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}