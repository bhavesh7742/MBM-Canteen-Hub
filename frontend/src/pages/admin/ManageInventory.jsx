import { useState, useEffect } from 'react';
import API from '../../services/api';
const ManageInventory = () => {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchDishes();
    }, []);
    const fetchDishes = async () => {
        try {
            const { data } = await API.get('/menu');
            setDishes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const updateStock = async (id, quantity) => {
        try {
            await API.put(`/admin/inventory/${id}`, { inventoryQuantity: quantity });
            fetchDishes();
        } catch (err) {
            alert('Failed to update inventory');
        }
    };
    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    return (
        <div className="admin-page">
            <div className="page-header admin-page-header">
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Inventory Management</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage stock levels for all dishes</p>
            </div>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Dish</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Current Stock</th>
                            <th>Status</th>
                            <th>Update Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dishes.map((dish) => (
                            <tr key={dish._id}>
                                <td style={{ fontWeight: 600 }}>{dish.name}</td>
                                <td>{dish.category}</td>
                                <td>₹{dish.price}</td>
                                <td>
                                    <span style={{
                                        fontWeight: 700,
                                        color: dish.inventoryQuantity <= 5 ? 'var(--danger)' : dish.inventoryQuantity <= 15 ? 'var(--warning)' : 'var(--success)'
                                    }}>
                                        {dish.inventoryQuantity}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${dish.available ? 'ready' : 'pending'}`}>
                                        {dish.available ? 'Available' : 'Sold Out'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            defaultValue={dish.inventoryQuantity}
                                            className="form-input"
                                            style={{ width: '80px', padding: '6px 10px' }}
                                            id={`stock-${dish._id}`}
                                        />
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => {
                                                const val = document.getElementById(`stock-${dish._id}`).value;
                                                updateStock(dish._id, Number(val));
                                            }}
                                        >
                                            Update
                                        </button>
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => updateStock(dish._id, dish.inventoryQuantity + 50)}
                                            title="Add 50 units"
                                        >
                                            +50
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default ManageInventory;
