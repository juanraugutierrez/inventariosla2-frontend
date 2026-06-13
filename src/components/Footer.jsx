import React from "react";
import { FaXTwitter, FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa6";

function Footer() {
  return (
    <footer className="bg-dark text-light py-4 text-xxs fst-italic">
      <div className="container">
        {/* Row superior: links legales y redes sociales */}
        <div className="row align-items-center mb-3">
          <div className="col-md-6 d-flex justify-content-start gap-3">
            <a href="/imprint" className="text-decoration-none text-muted small">Imprint</a>
            <a href="/terms" className="text-decoration-none text-muted small">Terms & Conditions</a>
            <a href="/privacy" className="text-decoration-none text-muted small">Privacy Notice</a>
            <a href="/data-preferences" className="text-decoration-none text-muted small">Data preferences</a>
          </div>

          <div className="col-md-6 d-flex justify-content-end gap-2">
            <span className="text-muted small">You can also find us on:</span>
            <a
              href="https://twitter.com/servilift"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
              aria-label="Twitter"
            >
              <FaXTwitter className="fs-5 text-light" />
            </a>
            <a
              href="https://facebook.com/servilift"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
              aria-label="Facebook"
            >
              <FaFacebookF className="fs-5 text-light" />
            </a>
            <a
              href="https://instagram.com/servilift"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
              aria-label="Instagram"
            >
              <FaInstagram className="fs-5 text-light" />
            </a>
            <a
              href="https://linkedin.com/company/servilift"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn className="fs-5 text-light" />
            </a>
          </div>
        </div>

        {/* Línea divisoria */}
        <hr className="border-light my-3" />

        {/* Información de contacto */}
        <div className="row text-center text-md-start">
          <div className="col-md-4 mb-3">
            <h6 className="fw-bold">Servilift</h6>
            <p className="small text-muted">
              Servicios de elevadores y mantenimiento especializado.
            </p>
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-bold">Contáctanos</h6>
            <p className="small text-muted">
              <strong>Teléfono:</strong> +569 83185305<br />
              <strong>Email:</strong> contacto@servilift.cl
            </p>
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-bold">Nuestros Servicios</h6>
            <ul className="list-unstyled small">
              <li>Mantenimiento preventivo</li>
              <li>Instalación de ascensores</li>
              <li>Reparaciones urgentes</li>
              <li>Modernización de equipos</li>
            </ul>
          </div>
        </div>

        {/* Pie de página legal */}
        <div className="row mt-4">
          <div className="col text-center small text-muted">
            © 2025 <strong>Adegest Spa</strong>. Todos los derechos reservados.  
            <br />
            All prices include VAT. The crossed out price indicates the manufacturer's recommended retail price.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;