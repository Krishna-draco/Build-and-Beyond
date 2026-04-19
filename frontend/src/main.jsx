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
