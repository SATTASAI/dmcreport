import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./TransferApp.jsx";
import "./transfer.css";
import "./registry-pages.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
