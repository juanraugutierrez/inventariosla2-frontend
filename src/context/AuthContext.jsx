import React, { createContext, useContext, useState } from "react";

// Crear contexto
const AuthContext = createContext();

// Hook para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  // Simulación de login -> más adelante se conectará con backend
  const [user, setUser] = useState({
    name: "Juan Pérez",
    role: "GERENTE", // 👈 Cambia esto para probar
  });

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
