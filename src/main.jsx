// ✅ src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ❌ Hech qanday BrowserRouter kerak emas bu joyda!
// ❌ Faqat <App /> ni chiqaramiz.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
