const menuConfig = {
  GERENTE: [
    { path: "/", label: "Dashboard" },
    { path: "/users", label: "Usuarios" },
    { path: "/warehouses", label: "Bodegas" },
    { path: "/products", label: "Productos" },
    { path: "/reports", label: "Reportes" },
  ],
  ADMINISTRADOR: [
    { path: "/", label: "Dashboard" },
    { path: "/users", label: "Usuarios" },
    { path: "/warehouses", label: "Bodegas" },
    { path: "/products", label: "Productos" },
  ],
  BODEGUERO: [
    { path: "/", label: "Dashboard" },
    { path: "/products", label: "Productos" },
    { path: "/warehouses", label: "Bodegas" },
  ],
  TECNICO: [
    { path: "/", label: "Dashboard" },
    { path: "/products", label: "Productos" },
  ],
  PROVEEDOR: [
    { path: "/", label: "Dashboard" },
    { path: "/products", label: "Productos" },
  ],
};

export default menuConfig;
