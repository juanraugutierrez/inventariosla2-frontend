import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaSignInAlt, FaBoxOpen } from 'react-icons/fa';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor, rellene todos los campos requeridos.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 🔑 DECLARACIÓN: Declaramos 'response' de forma correcta
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      // 🛠️ CORRECCIÓN DEL ERROR: Ahora 'response' está perfectamente definido
      if (!response.ok) {
        throw new Error(data.error || "Fallo al conectar con el servidor de autenticación.");
      }

      // Guardamos de forma persistente el Token JWT en el navegador
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario_nombre', data.user?.nombre || 'Usuario');
      localStorage.setItem('usuario_rol', data.user?.rol || 'Operario');

      // 🔑 LLAMADA AL APP.JSX: Notificamos al App.jsx para que monte el Layout completo
      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark text-white" style={{ background: 'linear-gradient(135deg, #212529 0%, #343a40 100%)', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div className="card border-0 shadow-lg p-4" style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
        <div className="card-body text-center">
          
          {/* Isotipo del Sistema */}
          <div className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-circle mb-3 shadow" style={{ width: '65px', height: '65px' }}>
            <FaBoxOpen size={32} />
          </div>
          
          <h3 className="fw-bold text-dark mb-1">Control de Inventario</h3>
          <p className="text-muted small mb-4">Ingresa tus credenciales corporativas</p>

          {error && (
            <div className="alert alert-danger py-2 px-3 text-start small border-0 shadow-sm" role="alert">
              <strong>⚠️ Acceso Denegado:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="text-start">
            
            {/* Input Correo */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">Correo Electrónico</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted small" /></span>
                <input 
                  type="email" 
                  className="form-control bg-light border-start-0 text-dark" 
                  placeholder="nombre@empresa.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required 
                />
              </div>
            </div>

            {/* Input Clave */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-secondary">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted small" /></span>
                <input 
                  type="password" 
                  className="form-control bg-light border-start-0 text-dark" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required 
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button 
              type="submit" 
              className="btn btn-dark w-100 fw-bold py-2.5 shadow d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Verificando...
                </>
              ) : (
                <>
                  <FaSignInAlt /> Iniciar Sesión
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}