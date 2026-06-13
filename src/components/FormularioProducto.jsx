import React, { useState, useEffect } from 'react';

export default function FormularioProducto({ productoEditar, onAccionTerminada }) {
  const [codigoSku, setCodigoSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenBase64, setImagenBase64] = useState(''); // Estado para la imagen serializada
  const [tipoActivo, setTipoActivo] = useState('ACTIVO_CIRCULANTE');
  const [precioPromedio, setPrecioPromedio] = useState('');
  
  // Estados de categorización en cascada
  const [categoriaId, setCategoriaId] = useState('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasTotales, setSubcategoriasTotales] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState({ tipo: '', texto: '' });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Cargar Categorías y Subcategorías al montar el componente
  useEffect(() => {
    fetch(`${API_URL}/categorias`).then(res => res.json()).then(data => setCategorias(data));
    fetch(`${API_URL}/subcategorias`).then(res => res.json()).then(data => setSubcategoriasTotales(data));
  }, [API_URL]);

  // Modo Edición: Cargar datos si se le pasa un producto existente
  useEffect(() => {
    if (productoEditar) {
      setCodigoSku(productoEditar.codigo_sku);
      setNombre(productoEditar.nombre);
      setDescripcion(productoEditar.descripcion || '');
      setImagenBase64(productoEditar.url_foto || '');
      setTipoActivo(productoEditar.tipo_activo);
      setPrecioPromedio(productoEditar.precio_promedio);
      setCategoriaId(productoEditar.categoria_id);
      setSubcategoriaId(productoEditar.subcategoria_id);
    }
  }, [productoEditar]);

  // Filtrar subcategorías dinámicamente cuando cambie la categoría seleccionada
  useEffect(() => {
    if (categoriaId) {
      const filtradas = subcategoriasTotales.filter(sub => sub.categoria_id === parseInt(categoriaId));
      setSubcategoriasFiltradas(filtradas);
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [categoriaId, subcategoriasTotales]);

  // 📷 🗜️ REDIMENSIONAR Y COMPRIMIR IMAGEN EN EL ORIGEN (MÁX 800x600 - JPEG 75%)
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 📐 Configuración estándar de resolución para la app
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        // Mantener la relación de aspecto original de la fotografía
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // 🎨 Renderizar en un Canvas oculto de procesamiento
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG moderado reduciendo drásticamente el peso del Base64 largo
        const dataUrlOptimized = canvas.toDataURL("image/jpeg", 0.75);
        setImagenBase64(dataUrlOptimized);
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotificacion({ tipo: '', texto: '' });

    const payload = {
      codigo_sku: codigoSku,
      nombre: nombre,
      descripcion: descripcion,
      url_foto: imagenBase64, // Enviamos el Base64 optimizado y ultra liviano
      tipo_activo: tipoActivo,
      precio_promedio: parseFloat(precioPromedio) || 0,
      subcategoria_id: parseInt(subcategoriaId)
    };

    const urlEndpoint = productoEditar ? `${API_URL}/productos/${productoEditar.id}` : `${API_URL}/productos`;
    const metodoHttp = productoEditar ? 'PUT' : 'POST';

    try {
      const response = await fetch(urlEndpoint, {
        method: metodoHttp,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setNotificacion({ tipo: 'success', texto: productoEditar ? '¡Artículo modificado correctamente!' : '¡Artículo creado!' });
        if (!productoEditar) {
          setCodigoSku(''); setNombre(''); setDescripcion(''); setImagenBase64(''); setPrecioPromedio(''); setCategoriaId(''); setSubcategoriaId('');
        }
        if (onAccionTerminada) onAccionTerminada();
      } else {
        const errData = await response.json();
        setNotificacion({ tipo: 'danger', texto: errData.error || 'Error en la operación.' });
      }
    } catch (err) {
      setNotificacion({ tipo: 'danger', texto: 'Error de red.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow border-0" style={{ backgroundColor: '#ffffff', color: '#212529' }}>
      <div className="card-header bg-dark text-white p-3">
        <h5 className="mb-0 fw-bold">{productoEditar ? '📝 Modificar Artículo' : '📦 Catalogar Nuevo Artículo'}</h5>
      </div>
      <div className="card-body p-4">
        {notificacion.texto && <div className={`alert alert-${notificacion.tipo}`}>{notificacion.texto}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Previsualización de la imagen serializada */}
          {imagenBase64 && (
            <div className="text-center mb-3">
              <img src={imagenBase64} alt="Previsualización" className="img-thumbnail" style={{ maxHeight: '140px' }} />
              <button type="button" className="btn btn-sm btn-danger d-block mx-auto mt-1" onClick={() => setImagenBase64('')}>Quitar Imagen</button>
            </div>
          )}

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Código SKU</label>
              <input type="text" className="form-control" value={codigoSku} onChange={(e) => setCodigoSku(e.target.value)} disabled={!!productoEditar} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Nombre Artículo</label>
              <input type="text" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
          </div>

          {/* Subir archivo de Imagen */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Fotografía del Artículo (Compresión Automática)</label>
            <input type="file" className="form-control" accept="image/*" onChange={handleImagenChange} />
          </div>

          <div className="row">
            {/* Categoría Selector */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Categoría *</label>
              <select className="form-select" value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setSubcategoriaId(''); }} required>
                <option value="">Seleccione Categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {/* Subcategoría Selector */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Subcategoría *</label>
              <select className="form-select" value={subcategoriaId} onChange={(e) => setSubcategoriaId(e.target.value)} disabled={!categoriaId} required>
                <option value="">Seleccione Subcategoría</option>
                {/* 🔑 CORREGIDO: Cambiado de subcategoriesFiltradas a subcategoriasFiltradas para coincidir con tu useState */}
                {subcategoriasFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="row">
            {/* Clasificación Contable */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Clasificación Contable</label>
              <select className="form-select" value={tipoActivo} onChange={(e) => setTipoActivo(e.target.value)}>
                <option value="ACTIVO_CIRCULANTE">Activo Circulante (Inventariable)</option>
                <option value="ACTIVO_FIJO">Activo Fijo (Uso Interno)</option>
              </select>
            </div>
            {/* Precio */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Precio Promedio ($)</label>
              <input type="number" className="form-control" value={precioPromedio} onChange={(e) => setPrecioPromedio(e.target.value)} disabled={!!productoEditar} />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Descripción / Especificaciones</label>
            <textarea className="form-control" rows="2" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></textarea>
          </div>

          <button type="submit" className="btn btn-dark w-100 fw-bold" disabled={loading}>
            {loading ? 'Procesando...' : productoEditar ? 'Guardar Cambios del Artículo' : 'Catalogar e Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}