import React from "react";
import ReactDOM from "react-dom/client";
import "./fonts.css";
import "@fontsource-variable/inter";
import App from "./App";
import { SettingsProvider } from "./SettingsContext";
import "./styles.css";
import "./form-template.css";
import "./documents.css";
import "./theme.css";
import "./readability.css";
import "./language-controls.css";
import "./simple-design.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>,
);
