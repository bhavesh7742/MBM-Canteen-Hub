import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
const DishDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    fetchDish();
    setQuantity(1);
  }, [id]);
  const fetchDish = async () => {
    try {
      const { data } = await API.get(`/menu/${id}`);
      setDish(data);
    } catch (err) {
      console.error("Fetch dish error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleAddToCart = async () => {
    if (!isAuthenticated) return navigate("/login");
    try {
      setAdding(true);
      await addToCart(dish._id, quantity);
      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };
  if (loading) {
    return (
      <div className="page-container loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }
  if (!dish) {
    return (
      <div className="page-container empty-state">
        <div className="emoji">😕</div>
        <h2>Dish not found</h2>
        <button className="btn btn-primary" onClick={() => navigate("/menu")}>
          Back to Menu
        </button>
      </div>
    );
  }
  return (
    <div className="page-container">
      <button
        onClick={() => navigate("/menu")}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: "var(--space-lg)" }}
      >
        ← Back to Menu
      </button>
      <div className="dish-detail">
        <img
          src={dish.imageURL}
          alt={dish.name}
          className="dish-detail-image"
        />
        <div className="dish-detail-info">
          <h1>{dish.name}</h1>
          <span className="category-tag">{dish.category}</span>
          <div className="price">{dish.price}</div>
          <p className="description">{dish.description}</p>
          <div className="availability">
            <span
              className={`dot ${dish.available ? "available" : "unavailable"}`}
            ></span>
            <span>
              {dish.available
                ? `In Stock (${dish.inventoryQuantity} left)`
                : "Currently Unavailable"}
            </span>
          </div>
          {dish.available && (
            <div className="dish-detail-actions">
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(dish.inventoryQuantity, quantity + 1))}>+</button>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={adding || quantity > dish.inventoryQuantity}
              >
                {adding
                  ? "Adding..."
                  : `Add to Cart — ₹${(dish.price * quantity).toFixed(2)}`}
              </button>
            </div>
          )}
          <div
            style={{
              marginTop: "var(--space-lg)",
              color: "var(--text-muted)",
              fontSize: "var(--font-sm)",
            }}
          >
            ❤️ {dish.likes || 0}{" "}
            {dish.likes === 1 ? "person likes" : "people like"} this dish
          </div>
        </div>
      </div>
    </div>
  );
};
export default DishDetails;
