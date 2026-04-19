import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import "./styles/AdminGlobal.css";
import { ValidationProvider } from "./context/ValidationContext.jsx";
import { GlobalChatProvider } from "./context/GlobalChatContext.jsx";
import { Provider } from "react-redux";
import store from "./store";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

if (typeof window !== "undefined") {
  window.__APP_API_BASE_URL__ = API_BASE_URL;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <ValidationProvider>
        <GlobalChatProvider>
          <App />
        </GlobalChatProvider>
      </ValidationProvider>
    </BrowserRouter>
  </Provider>,
);
