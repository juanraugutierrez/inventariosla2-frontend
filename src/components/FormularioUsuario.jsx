import React, { useState, useEffect } from 'react';

export default function FormularioUsuario() {
  const [rutODocumento, setRutODocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfilId, setPerfilId] = useState('');

  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState({ tipo: '', texto: '' });

 const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"              // 💻 Servidor Local (HTTP plano sin SSL)
    : "https://api.sla-inventario.cl/api";

  // Cargar perfiles para el selector relacional
  useEffect(() => {
    fetch(`${API_URL}/perfiles`)
      .then((res) => res.json())
      .then((data) => setPerfiles(data))
      .catch((err) => console.error("Error cargando perfiles:", err));
  }, [API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotificacion({ tipo: '', texto: '' });

    const nuevoUsuario = {
      rut_o_documento: rutODocumento.trim(),
      nombre_completo: nombreCompleto.trim(),
      email: email.trim(),
      password,
      perfil_id: parseInt(perfilId)
    };

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      const data = await response.json();

      if (response.ok) {
        setNotificacion({ tipo: 'success', texto: '¡Usuario registrado exitosamente!' });
        setRutODocumento('');
        setNombreCompleto('');
        setEmail('');
        setPassword('');
        setPerfilId('');
      } else {
        setNotificacion({ tipo: 'danger', texto: data.error || 'Error al guardar el usuario.' });
      }
    } catch (error) {
      setNotificacion({ tipo: 'danger', texto: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '600px' }}>
      <div className="card shadow" style={{ backgroundColor: '#ffffff', color: '#212529' }}>
        <div className="card-header bg-dark text-white p-3">
          <h4 className="mb-0 fs-5 fw-bold">👤 Registro de Nuevo Usuario</h4>
        </div>
        <div className="card-body p-4">
          {notificacion.texto && (
            <div className={`alert alert-${notificacion.tipo}`} role="alert">{notificacion.texto}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">RUT / Documento de Identidad *</label>
              <input type="text" className="form-control" value={rutODocumento} onChange={(e) => setRutODocumento(e.target.value)} placeholder="Ej: 12.345.678-9" required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nombre Completo *</label>
              <input type="text" className="form-control" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} placeholder="Ej: Juan Carlos Pérez" required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Correo Electrónico *</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@empresa.com" required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Contraseña de Acceso *</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Perfil de Acceso / Rol *</label>
              <select className="form-select" value={perfilId} onChange={(e) => setPerfilId(e.target.value)} required>
                <option value="">-- Selecciona un Rol --</option>
                {perfiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-dark w-100 fw-bold" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar e Integrar Usuario'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}