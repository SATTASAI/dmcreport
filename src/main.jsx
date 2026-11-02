import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./TransferApp.jsx";
import "./transfer.css";
import "./registry-pages.css";

if (
  new URLSearchParams(window.location.search).get("view") === "students-frame"
) {
  document.body.classList.add("student-directory-page");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
