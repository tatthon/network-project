import React from "react";
import ReactDOM from "react-dom/client";
import App from "./page"; // ✅ ใช้ default import ไม่ต้องมี {}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);