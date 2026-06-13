import React, { useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import JsBarcode from "jsbarcode";

function BarcodeModal({ show, onHide, articulo }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    // Si el modal está visible y hay un artículo con código válido, generamos el código de barras
    if (show && articulo && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, String(articulo.codigo_barras || articulo.sku || articulo.id), {
          format: "CODE128",     // Formato estándar universal para inventarios
          lineColor: "#000000",  // Color de las barras
          width: 2,              // Ancho de cada barra
          height: 80,            // Altura del código
          displayValue: true,    // Muestra el texto/número abajo de las barras
          fontSize: 16,
          font: "monospace"
        });
      } catch (error) {
        console.error("Error generando el código de barras:", error);
      }
    }
  }, [show, articulo]);

  // Función nativa para mandar a imprimir solo el recuadro del código de barras
  const handleImprimir = () => {
    const ventimp = window.open(" ", "_blank");
    ventimp.document.write(`
      <html>
        <head>
          <title>Imprimir Etiqueta - ${articulo?.nombre}</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin: 40px; }
            .etiqueta { border: 1px dashed #ccc; padding: 20px; display: inline-block; }
            h3 { margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <h3>${articulo?.nombre}</h3>
            ${barcodeRef.current.outerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    ventimp.document.close();
  };

  if (!articulo) return null;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold text-dark">🏷️ Etiqueta de Código de Barras</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-5">
        <h4 className="fw-bold mb-1 text-dark">{articulo.nombre}</h4>
        <p className="text-muted small mb-4">SKU / Identificador único del sistema</p>
        
        {/* Aquí es donde JsBarcode inyectará el diseño de barras */}
        <div className="p-3 border rounded bg-white shadow-sm d-inline-block">
          <svg ref={barcodeRef}></svg>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button variant="dark" className="fw-bold px-4" onClick={handleImprimir}>
          🖨️ Imprimir Etiqueta
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BarcodeModal;