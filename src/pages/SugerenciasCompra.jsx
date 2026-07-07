import React, { useState } from "react";
import { Card, Button, Alert, Spinner } from "react-bootstrap";

export default function SugerenciasCompra() {
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api" : "https://api.sla-inventario.cl/api";

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const dispararAnalisis = async () => {
    setLoading(true); setErrorMsg(""); setResultado(null);
    try {
      const res = await fetch(`${API_URL}/ordenes-compra/generar-automatica`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResultado(data);
      } else {
        setErrorMsg(data.error || "Ocurrió un error al procesar el stock mínimo.");
      }
    } catch (err) {
      setErrorMsg("Fallo en la comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold text-dark mb-1">🤖 Generador de Órdenes de Compra Automáticas</h3>
      <p className="text-muted small mb-4">Motor inteligente de abastecimiento basado en umbrales de stock mínimo de seguridad.</p>

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      <Card className="border-0 shadow-sm p-4 text-center mb-4 bg-white rounded-3">
        <h5>Asistente de Abastecimiento Servilift</h5>
        <p className="text-muted small max-w-xl mx-auto">El sistema escaneará el catálogo completo cruzando las unidades físicas de todas las bodegas móviles y centrales contra sus mínimos definidos.</p>
        <div className="mt-2">
          <Button variant="dark" className="fw-bold px-4" onClick={dispararAnalisis} disabled={loading}>
            {loading ? <><Spinner animation="border" size="sm" className="me-2"/>Analizando Almacenes...</> : "Escanear Inventario y Generar OC"}
          </Button>
        </div>
      </Card>

      {resultado && (
        <Card className="border-0 shadow-sm p-4 bg-white animate__animated animate__fadeIn">
          {resultado.orden ? (
            <div>
              <Alert variant="success" className="fw-bold">🎯 {resultado.message}</Alert>
              <h6 className="fw-bold text-dark font-monospace">Código de Orden: {resultado.orden.numero_orden}</h6>
              <p className="small text-muted">Estado actual del documento: <span className="badge bg-warning text-dark">{resultado.orden.estado}</span></p>
              <div className="border rounded p-3 bg-light font-monospace small">
                <strong>Detalles del Reabastecimiento Sugerido:</strong>
                <ul className="mt-2 mb-0">
                  {resultado.orden.ordenes_compra_detalle?.map((det, idx) => (
                    <li key={idx}>ID Artículo: {det.articulo_id} — Cantidad propuesta a comprar: <strong className="text-success">{det.cantidad_sugerida} u.</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Alert variant="info" className="text-center fw-bold mb-0">✨ {resultado.message}</Alert>
          )}
        </Card>
      )}
    </div>
  );
}