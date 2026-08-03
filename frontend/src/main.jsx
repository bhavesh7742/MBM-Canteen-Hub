import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { FeedbackProvider } from "./context/FeedbackContext";

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