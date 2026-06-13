import React, { useState } from "react";
import { Card, Button, Form, Alert, ProgressBar } from "react-bootstrap";

function CargaMasiva() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: "danger", message: "Por favor, selecciona un archivo Excel." });
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      setLoading(true);
      setStatus({ type: "info", message: "Procesando archivo y generando códigos SKU..." });

      const response = await fetch("http://localhost:3000/api/productos/cargar-masivo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message: `¡Carga exitosa! Se procesaron e insertaron ${result.count} artículos con formato SKU uniformados.`,
        });
        setFile(null);
      } else {
        setStatus({ type: "danger", message: result.error || "Error al procesar el archivo." });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "danger", message: "Error de conexión con el servidor backend." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="pagetitle mb-4">
        <h1>Carga Masiva de Artículos</h1>
        <p className="text-muted">Sube un archivo Excel (.xlsx) para registrar inventario y generar códigos Code 128 estandarizados.</p>
      </div>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile" className="mb-4">
              <Form.Label className="fw-bold">Selecciona la plantilla de inventario (.xlsx)</Form.Label>
              <Form.Control 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange} 
                disabled={loading}
              />
              <Form.Text className="text-muted">
                El Excel debe contener las columnas: **nombre, descripcion, precio, categoria_cod, subcategoria_cod**.
              </Form.Text>
            </Form.Group>

            {status.message && (
              <Alert variant={status.type} className="mt-3">
                {status.message}
              </Alert>
            )}

            {loading && <ProgressBar animated now={100} className="mb-3" />}

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" disabled={loading || !file}>
                {loading ? "Procesando..." : "Iniciar Carga Masiva"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default CargaMasiva;