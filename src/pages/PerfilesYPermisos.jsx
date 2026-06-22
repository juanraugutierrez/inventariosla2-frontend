import React, { useState, useEffect } from 'react';
import { FaSave, FaFolderPlus, FaShieldAlt, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle, FaListUl } from 'react-icons/fa';

export default function PerfilesYPermisos() {
  const [perfiles, setPerfiles] = useState([]);
  const [permisosMaestros, setPermisosMaestros] = useState([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [permisosAsignados, setPermisosAsignados] = useState([]);
  
  // Gestión de pestañas independientes (Mantenimiento vs Asignación)
  const [tabActiva, setTabActiva] = useState('crud');

  // Estados de carga e interacción operativa
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Campos exclusivos para el formulario CRUD de Perfiles
  const [idEdicion, setIdEdicion] = useState(null); 
  const [nombrePerfil, setNombrePerfil] = useState('');
  const [descripcionPerfil, setDescripcionPerfil] = useState('');

 const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // CARGA REAL DESDE LA BASE DE DATOS (LECTURA DIRECTA DE PRISMA / MYSQL)
  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      setMensaje({ texto: '', tipo: '' });
      
      const resPerfiles = await fetch(`${API_URL}/perfiles`);
      if (!resPerfiles.ok) throw new Error("Fallo al conectar con el servidor para leer los perfiles.");
      const dataPerfiles = await resPerfiles.json();
      
      // Asignación estricta de los datos reales de la base de datos
      setPerfiles(Array.isArray(dataPerfiles) ? dataPerfiles : []);

      // Escaneo de rutas para el catálogo maestro de permisos
      let dataPermisos = null;
      const rutasAChequear = [`${API_URL}/permisos`, `${API_URL}/perfiles/permisos`, `${API_URL}/perfiles/permisos-maestros`];

      for (const url of rutasAChequear) {
        try {
          const res = await fetch(url);
          if (res.ok) { 
            dataPermisos = await res.json(); 
            break; 
          }
        } catch (e) {}
      }

      if (!dataPermisos) throw new Error("No se pudo obtener el listado maestro de permisos desde el backend.");
      setPermisosMaestros(Array.isArray(dataPermisos) ? dataPermisos : []);

      // Sincronización del perfil activo para el Paso 2
      if (Array.isArray(dataPerfiles) && dataPerfiles.length > 0) {
        if (!perfilSeleccionado) {
          setPerfilSeleccionado(dataPerfiles[0]);
          await cargarPermisosDePerfil(dataPerfiles[0].id);
        }
      } else {
        setPerfilSeleccionado(null);
        setPermisosAsignados([]);
      }
    } catch (error) {
      notificar(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisosDePerfil = async (perfilId) => {
    try {
      const response = await fetch(`${API_URL}/perfiles/${perfilId}/permisos`);
      if (response.ok) {
        const ids = await response.json();
        setPermisosAsignados(Array.isArray(ids) ? ids : []);
      }
    } catch (error) {
      console.error("Error al mapear la tabla intermedia:", error);
    }
  };

  const handleCambioPerfil = async (e) => {
    const id = parseInt(e.target.value);
    const perfil = perfiles.find(p => p.id === id);
    setPerfilSeleccionado(perfil);
    if (perfil) await cargarPermisosDePerfil(perfil.id);
  };

  const handleCheckboxChange = (permisoId) => {
    if (permisosAsignados.includes(permisoId)) {
      setPermisosAsignados(permisosAsignados.filter(id => id !== permisoId));
    } else {
      setPermisosAsignados([...permisosAsignados, permisoId]);
    }
  };

  // CRUD: Guardar (Crear o Modificar Perfil en base de datos)
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!nombrePerfil.trim()) return notificar('El nombre del perfil es obligatorio.', 'warning');

    try {
      setProcesando(true);
      const url = idEdicion ? `${API_URL}/perfiles/${idEdicion}` : `${API_URL}/perfiles`;
      const metodo = idEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nombrePerfil.trim().toUpperCase(), 
          descripcion: descripcionPerfil.trim() 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fallo operativo en la base de datos MySQL.');

      notificar(idEdicion ? 'Perfil actualizado con éxito.' : `Perfil "${data.nombre}" creado exitosamente.`, 'success');
      cancelarEdicion();
      await cargarDatosIniciales();
    } catch (error) {
      notificar(error.message, 'danger');
    } finally {
      setProcesando(false);
    }
  };

  const iniciarEdicion = (perfil) => {
    setIdEdicion(perfil.id);
    setNombrePerfil(perfil.nombre);
    setDescripcionPerfil(perfil.descripcion || '');
  };

  const cancelarEdicion = () => {
    setIdEdicion(null);
    setNombrePerfil('');
    setDescripcionPerfil('');
  };

  // 🔒 CRUD: ELIMINAR CORREGIDO CON CAPTURA ESTRICTA DE EXCEPCIONES 400 (FOREIGN KEYS)
  const handleEliminarPerfil = async (id, nombre) => {
    if (!confirm(`¿Está seguro de eliminar de forma permanente el perfil "${nombre}"?`)) return;

    try {
      setProcesando(true);
      setMensaje({ texto: '', tipo: '' });

      const response = await fetch(`${API_URL}/perfiles/${id}`, { method: 'DELETE' });
      
      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
      }

      if (!response.ok) {
        // Al capturar el error 400 de restricción de integridad de MySQL, inyectamos el aviso adecuado para la UI
        throw new Error(data.error || `Acción denegada. Existen usuarios o dependencias activas asociadas a este perfil.`);
      }

      notificar('Registro removido de la base de datos de manera limpia.', 'success');
      if (perfilSeleccionado?.id === id) setPerfilSeleccionado(null);
      await cargarDatosIniciales();
    } catch (error) {
      // Pasamos el mensaje del error directamente a la barra temporal de 5 segundos
      notificar(error.message, 'danger');
    } finally {
      setProcesando(false);
    }
  };

  // MATRIZ: Guardar y sincronizar permisos por lotes en la tabla puente
  const handleGuardarMatrizPermisos = async (e) => {
    e.preventDefault();
    if (!perfilSeleccionado) return notificar('Por favor, elija un perfil de destino.', 'warning');

    try {
      setProcesando(true);
      setMensaje({ texto: '', tipo: '' });
      const urlDestino = `${API_URL}/perfiles/${perfilSeleccionado.id}/permisos`;

      let response = await fetch(urlDestino, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permisosIds: permisosAsignados })
      });

      if (response.status === 404) {
        response = await fetch(urlDestino, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permisosIds: permisosAsignados })
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo procesar la sincronización en el backend.');
      }

      notificar(`¡Matriz de permisos guardada y sincronizada para ${perfilSeleccionado.nombre}!`, 'success');
    } catch (error) {
      notificar(error.message, 'danger');
    } finally {
      setProcesando(false);
    }
  };

  // TEMPORIZADOR DE ALERTAS (5 SEGUNDOS EXACTOS + LIMPIEZA AUTOMÁTICA POR SUPERPOSICIÓN)
  const notificar = (texto, tipo) => {
    setMensaje({ texto: '', tipo: '' }); // Limpieza inmediata flash
    setTimeout(() => {
      setMensaje({ texto, tipo });
    }, 30);

    setTimeout(() => {
      setMensaje((prev) => {
        if (prev.texto === texto) return { texto: '', tipo: '' };
        return prev;
      });
    }, 5000);
  };

  if (loading) {
    return (
      <div className="container p-5 text-center">
        <div className="spinner-border text-dark mb-2" role="status"></div>
        <p className="text-muted small fw-semibold">Sincronizando estructuras con la base de datos de perfiles...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 animate__animated animate__fadeIn">
      
      {/* Barra de Alertas Temporalizada */}
      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo === 'danger' ? 'danger' : 'success'} shadow-sm border-0 small fw-bold text-center mb-4 rounded-3 p-3 animate__animated animate__fadeInDown`}>
          {mensaje.tipo === 'danger' ? <FaExclamationTriangle className="me-2" /> : <FaCheckCircle className="me-2" />}
          {mensaje.texto}
        </div>
      )}

      {/* Control Navigation Header */}
      <div className="card shadow-sm border rounded-3 bg-white mb-4 overflow-hidden">
        <div className="d-flex text-center bg-light border-bottom">
          <button 
            type="button"
            className={`flex-fill py-3 border-0 fw-bold small transition-all ${tabActiva === 'crud' ? 'bg-white text-dark border-bottom border-dark' : 'text-secondary opacity-75'}`}
            style={{ fontSize: '0.88rem', borderBottom: tabActiva === 'crud' ? '3px solid #212529' : 'none' }}
            onClick={() => setTabActiva('crud')}
          >
            <span className="badge bg-dark text-white rounded-circle me-2">1</span>
            Mantenimiento de Perfiles (CRUD)
          </button>
          
          <button 
            type="button"
            className={`flex-fill py-3 border-0 fw-bold small transition-all ${tabActiva === 'permisos' ? 'bg-white text-dark border-bottom border-dark' : 'text-secondary opacity-75'}`}
            style={{ fontSize: '0.88rem', borderBottom: tabActiva === 'permisos' ? '3px solid #212529' : 'none' }}
            onClick={() => setTabActiva('permisos')}
          >
            <span className="badge bg-secondary text-white rounded-circle me-2">2</span>
            Asignación de Permisos Disponibles
          </button>
        </div>

        <div className="card-body p-4">
          
          {/* SECCIÓN 1: CRUD COMPLETO */}
          {tabActiva === 'crud' && (
            <div className="animate__animated animate__fadeIn">
              <div className="row g-4 mb-5">
                <div className="col-xl-5 col-lg-6 mx-auto">
                  <div className="border rounded-3 p-4 bg-light shadow-xs">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <FaFolderPlus className="text-primary" />
                      {idEdicion ? 'Modificar Parámetros de Perfil' : 'Dar de Alta Nuevo Perfil'}
                    </h6>
                    
                    <form onSubmit={handleGuardarPerfil}>
                      <div className="mb-3">
                        <label className="form-label fw-bold text-secondary small mb-1">Nombre del Perfil (*)</label>
                        <input 
                          type="text" 
                          className="form-control fw-bold text-uppercase border-secondary border-opacity-50 shadow-sm"
                          placeholder="Ej: OPERADOR_BODEGA"
                          value={nombrePerfil}
                          onChange={(e) => setNombrePerfil(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold text-secondary small mb-1">Descripción / Roles</label>
                        <textarea 
                          className="form-control border-secondary border-opacity-50 shadow-sm"
                          rows="2"
                          placeholder="Alcance de sus operaciones y privilegios..."
                          value={descripcionPerfil}
                          onChange={(e) => setDescripcionPerfil(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-dark flex-grow-1 fw-bold btn-sm py-2 shadow-sm" disabled={procesando}>
                          {idEdicion ? 'Actualizar Registro' : 'Inyectar a MySQL'}
                        </button>
                        {idEdicion && (
                          <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={cancelarEdicion}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* TABLA DE VISUALIZACIÓN MAESTRA EN TIEMPO REAL */}
              <div className="border rounded-3 overflow-hidden bg-white shadow-sm">
                <div className="bg-dark text-white p-3 d-flex align-items-center justify-content-between">
                  <h6 className="m-0 fw-bold text-uppercase tracking-wider small d-flex align-items-center gap-2">
                    <FaListUl /> Perfiles del Sistema en Tiempo Real
                  </h6>
                  <span className="badge bg-secondary px-2.5 py-1.5 small">{perfiles.length} Registros</span>
                </div>
                
                <div className="table-responsive" style={{ maxHeight: '45vh' }}>
                  <table className="table table-hover align-middle m-0 table-sm text-center">
                    <thead className="table-light border-bottom">
                      <tr>
                        <th className="py-2" style={{ width: '80px' }}>ID</th>
                        <th className="text-start">Nombre del Perfil</th>
                        <th className="text-start">Descripción Técnica</th>
                        <th style={{ width: '220px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfiles.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-4 text-muted small fw-semibold fst-italic">No se encontraron perfiles en la base de datos.</td>
                        </tr>
                      ) : (
                        perfiles.map(p => (
                          <tr key={p.id} className={idEdicion === p.id ? 'table-warning' : ''}>
                            <td className="font-monospace text-muted fw-bold">#{p.id}</td>
                            <td className="text-start fw-bold text-dark"><span className="badge bg-light text-dark border px-2 py-1 text-uppercase">{p.nombre}</span></td>
                            <td className="text-start small text-secondary fw-semibold">{p.descripcion || <em className="opacity-50">Sin descripción asignada.</em>}</td>
                            <td>
                              <div className="d-flex justify-content-center gap-1">
                                <button type="button" className="btn btn-sm btn-outline-dark py-1 px-2.5" onClick={() => { setTabActiva('permisos'); setPerfilSeleccionado(p); cargarPermisosDePerfil(p.id); }}>
                                  <FaShieldAlt size={11} /> <small className="fw-bold">Permisos</small>
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-dark py-1 px-2.5" onClick={() => iniciarEdicion(p)}>
                                  <FaEdit size={11} /> <small className="fw-bold">Editar</small>
                                </button>
                                {/* 🛠️ SE PERFECCIONÓ LA EXTRACCIÓN UNITARIA DE CADA ID DE MANERA AISLADA */}
                                <button type="button" className="btn btn-sm btn-outline-danger py-1 px-2.5" onClick={() => handleEliminarPerfil(p.id, p.nombre)} disabled={procesando}>
                                  <FaTrash size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: GRID DE ASIGNACIÓN */}
          {tabActiva === 'permisos' && (
            <form onSubmit={handleGuardarMatrizPermisos} className="animate__animated animate__fadeIn">
              <div className="row g-4">
                <div className="col-xl-4 col-lg-5">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="d-flex align-items-center gap-2 mb-3 text-dark border-bottom pb-2">
                      <FaShieldAlt className="text-secondary" />
                      <h6 className="m-0 fw-bold">1. Selección de Perfil</h6>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-select-label fw-bold text-secondary small mb-1">Perfil a configurar:</label>
                      <select 
                        className="form-select fw-bold text-dark border-secondary border-opacity-50 shadow-sm"
                        value={perfilSeleccionado?.id || ''} 
                        onChange={handleCambioPerfil}
                        required
                      >
                        <option value="" disabled>-- Elige un Perfil --</option>
                        {perfiles.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {perfilSeleccionado && (
                      <div className="bg-white p-3 rounded-2 border small text-muted">
                        <strong className="text-secondary d-block mb-1 text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Ficha técnica:</strong>
                        <span className="fw-medium text-dark">{perfilSeleccionado.descripcion || 'Sin descripción técnica registrada.'}</span>
                      </div>
                    )}

                    <button type="submit" className="btn btn-success w-100 fw-bold mt-4 py-2.5 shadow-sm border-0" disabled={procesando || !perfilSeleccionado}>
                      <FaSave className="me-1" /> {procesando ? 'Guardando...' : 'Sincronizar Permisos'}
                    </button>
                  </div>
                </div>

                <div className="col-xl-8 col-lg-7">
                  <div className="border rounded-3 overflow-hidden bg-white shadow-sm">
                    <div className="bg-dark text-white p-3 d-flex align-items-center gap-2">
                      <FaShieldAlt className="text-success" />
                      <h6 className="m-0 fw-bold text-uppercase tracking-wider small">2. Opciones de Permisos Disponibles</h6>
                    </div>

                    <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle table-sm border-0 m-0 text-center">
                          <thead className="table-light border-bottom" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                            <tr>
                              <th style={{ width: '65px' }} className="py-2">Estado</th>
                              <th>Módulo ERP</th>
                              <th className="text-start">Código Técnico</th>
                              <th className="text-start">Descripción del Privilegio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permisosMaestros.map(permiso => {
                              const checkeado = permisosAsignados.includes(permiso.id);
                              return (
                                <tr key={permiso.id} className={checkeado ? 'table-active' : ''}>
                                  <td className="py-2">
                                    <input 
                                      type="checkbox"
                                      className="form-check-input cursor-pointer"
                                      style={{ width: '16px', height: '16px' }}
                                      checked={checkeado}
                                      onChange={() => handleCheckboxChange(permiso.id)}
                                    />
                                  </td>
                                  <td>
                                    <span className="badge bg-dark px-2 py-1 text-uppercase" style={{ fontSize: '0.65rem' }}>
                                      {permiso.modulo || 'GENERAL'}
                                    </span>
                                  </td>
                                  <td className="text-start"><code className="text-danger small fw-bold">{permiso.nombre}</code></td>
                                  <td className="text-start small text-secondary fw-semibold">{permiso.descripcion}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}