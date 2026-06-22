import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔑 URL DE PRODUCCIÓN ACTUALIZADA CORPORATIVA
  const API_URL = "https://api.sla-inventario.cl/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al intentar iniciar sesión.');
      }

      const usuarioCompleto = data.usuario ? { ...data.usuario, permisos: data.permisos || data.usuario.permisos || [] } : data;

      if (usuarioCompleto) {
        // 🔒 ADICIÓN MAESTRA DE SEGURIDAD: Seteamos los datos de usuario y estampamos el timestamp inicial
        localStorage.setItem('usuario_sesion', JSON.stringify(usuarioCompleto));
        localStorage.setItem('ultima_actividad_erp', Date.now().toString());
        
        const perfilNormalizado = String(usuarioCompleto.perfil_nombre || usuarioCompleto.perfil || usuarioCompleto.cargo || '').toUpperCase().trim();
        const listaPermisos = usuarioCompleto.permisos || [];

        if (perfilNormalizado === 'ADMINISTRADOR' || listaPermisos.includes('Visualizar Dashboard')) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/products';
        }
      } else {
        throw new Error('Estructura de sesión inválida devuelta por el servidor.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center bg-dark" style={{ minHeight: '100vh', width: '100vw' }}>
      <div className="card shadow-lg border-0 p-4 rounded-3 bg-white" style={{ width: '400px' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark mb-1">📦 Sistema ERP</h2>
          <p className="text-muted small">Gestión de Inventario y Accesos Central</p>
        </div>

        {error && (
          <div className="alert alert-danger p-2 small text-center fw-semibold animate__animated animate__fadeIn">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-bold">Correo Electrónico:</label>
            <input
              type="email"
              className="form-control form-control-md"
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary small fw-bold">Contraseña del Sistema:</label>
            <input
              type="password"
              className="form-control form-control-md"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-dark btn-md w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Autenticando...
              </>
            ) : (
              'Ingresar al Panel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}