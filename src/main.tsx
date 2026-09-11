import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/400-italic.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@xyflow/react/dist/style.css";
import "./index.css";
import App from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Fant ikke #root i index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
