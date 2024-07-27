import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "~/styles/global.css";
import "~/styles/nprogress.css";

// Render the app
const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
