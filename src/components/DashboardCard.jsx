import React from "react";

function DashboardCard({ title, value, icon }) {
  return (
    <div className="card dashboard info-card">
      <div className="card-body d-flex align-items-center">
        <div className="card-icon">{icon}</div>
        <div className="ps-3">
          <h6>{value}</h6>
          <span className="text-muted small">{title}</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;
