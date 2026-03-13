import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

/* Components */
import Navbar from "./components/Navbar";
import FloatingCart from "./components/FloatingCart";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";

/* User Pages */
import Menu from "./pages/Menu";
import DishDetails from "./pages/DishDetails";
import Cart from "./pages/Cart";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderHistory from "./pages/OrderHistory";
import Login from "./pages/Login";
import Register from "./pages/Register";

/* Admin Pages */
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageMenu from "./pages/admin/ManageMenu";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageInventory from "./pages/admin/ManageInventory";

function App() {
  return (
    <Router>
      <div className="app-shell">
        {/* Navbar appears on all pages */}
        <Navbar />
        <FloatingCart />

        <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Menu />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/dish/:id" element={<DishDetails />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected User Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-confirmation"
          element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="menu" element={<ManageMenu />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="inventory" element={<ManageInventory />} />
        </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
