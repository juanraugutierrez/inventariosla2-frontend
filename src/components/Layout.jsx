import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <main id="main" className="flex-grow-1 p-3">
          <Outlet /> {/* Aquí se renderizan las páginas */}
        </main>
        <Footer />
      </div>
    </div>
    
  );
}

export default Layout;
