import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Table, Alert } from "react-bootstrap";

export default function TraspasosInventario() {
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api" : "https://api.sla-inventario.cl/api";

  const [bodegas, setBodegas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [filas, setFilas] = useState([{ articulo_id: "", cantidad: 1 }]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function cargarCatalogos() {
      const [resB, resP] = await Promise.all([fetch(`${API_URL}/bodegas`), fetch(`${API_URL}/productos`)]);
      if (resB.ok) setBodegas(await resB.json());
      if (resP.ok) setProductos(await resP.json());
    }
    cargarCatalogos();
  }, []);

  const handleFilaChange = (index, campo, value) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index][campo] = value;
    setFilas(nuevasFilas);
  };

  const agregarFila = () => setFilas([...filas, { articulo_id: "", cantidad: 1 }]);
  const removerFila = (index) => setFilas(filas.filter((_, i) => i !== index));

  const ejecutarTraspaso = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    const payload = {
      bodega_origen_id: origen,
      bodega_destino_id: destino,
      usuario_id: 1, // Simulado o extraído de tu localStorage
      articulos: filas.filter(f => f.articulo_id && f.cantidad > 0)
    };

    try {
      const res = await fetch(`${API_URL}/traspasos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("¡Traspaso masivo procesado y asentado en la base de datos!");
        setFilas([{ articulo_id: "", cantidad: 1 }]);
        setOrigen(""); setDestino("");
      } else {
        setErrorMsg(data.error || "Fallo al procesar el traspaso.");
      }
    } catch (err) {
      setErrorMsg("Error de comunicación de red con el servidor.");
    }
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold text-dark mb-1">📦 Transferencia de Stock Inter-Bodegas</h3>
      <p className="text-muted small mb-4">Movimiento interno de mercancías resguardado por transacciones atómicas.</p>

      {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>{errorMsg}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg("")}>{successMsg}</Alert>}

      <Form onSubmit={ejecutarTraspaso}>
        <Card className="border-0 shadow-sm p-4 mb-4 bg-white">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-secondary">Bodega Origen (Despacha)</Form.Label>
                <Form.Select required value={origen} onChange={(e) => setOrigen(e.target.value)}>
                  <option value="">-- Seleccionar Origen --</option>
                  {bodegas.map(b => <option key={b.id} value={b.id}>{b.name || b.nombre}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-secondary">Bodega Destino (Recibe)</Form.Label>
                <Form.Select required value={destino} onChange={(e) => setDestino(e.target.value)}>
                  <option value="">-- Seleccionar Destino --</option>
                  {bodegas.map(b => <option key={b.id} value={b.id}>{b.name || b.nombre}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card>

        <Card className="border-0 shadow-sm p-0 bg-white">
          <Table responsive hover className="mb-0 align-middle small">
            <thead className="table-dark">
              <tr>
                <th className="ps-3">Selección de Artículo o Componente</th>
                <th style={{ width: "150px" }}>Cantidad</th>
                <th className="text-center" style={{ width: "100px" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, index) => (
                <tr key={index}>
                  <td className="ps-3">
                    <Form.Select required value={fila.articulo_id} onChange={(e) => handleFilaChange(index, "articulo_id", e.target.value)}>
                      <option value="">-- Selecciona el Insumo --</option>
                      {productos.map(p => <option key={p.id} value={p.id}>[{p.codigo_sku}] {p.nombre}</option>)}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control type="number" min="1" required value={fila.cantidad} onChange={(e) => handleFilaChange(index, "cantidad", e.target.value)} />
                  </td>
                  <td className="text-center">
                    <Button variant="outline-danger" size="sm" onClick={() => removerFila(index)} disabled={filas.length === 1}>Quitar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Card.Footer className="bg-white d-flex justify-content-between p-3 border-top">
            <Button variant="outline-dark" size="sm" onClick={agregarFila}>+ Añadir Fila</Button>
            <Button type="submit" variant="success" size="sm" className="fw-bold px-4">Procesar Transferencia ⚡</Button>
          </Card.Footer>
        </Card>
      </Form>
    </div>
  );
}