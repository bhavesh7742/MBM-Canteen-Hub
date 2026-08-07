import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

import { AuthProvider } from "./context/AuthProvider";
import { CartProvider } from "./context/CartProvider";
import { FavoritesProvider } from "./context/FavoritesProvider";
import { FeedbackProvider } from "./context/FeedbackProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FeedbackProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </FeedbackProvider>
  </React.StrictMode>
);