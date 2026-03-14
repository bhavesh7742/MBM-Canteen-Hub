import { useState, useEffect } from 'react';
import API from '../../services/api';
const ManageMenu = () => {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editDish, setEditDish] = useState(null);
    const [form, setForm] = useState({
        name: '', category: 'Snacks', price: '', description: '', imageURL: '', inventoryQuantity: 50, available: true
    });
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
    const openAdd = () => {
        setEditDish(null);
        setForm({ name: '', category: 'Snacks', price: '', description: '', imageURL: '', inventoryQuantity: 50, available: true });
        setShowModal(true);
    };
    const openEdit = (dish) => {
        setEditDish(dish);
        setForm({
            name: dish.name,
            category: dish.category,
            price: dish.price,
            description: dish.description,
            imageURL: dish.imageURL,
            inventoryQuantity: dish.inventoryQuantity,
            available: dish.available
        });
        setShowModal(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, price: Number(form.price), inventoryQuantity: Number(form.inventoryQuantity) };
            if (editDish) {
                await API.put(`/admin/dishes/${editDish._id}`, payload);
            } else {
                await API.post('/admin/dishes', payload);
            }
            setShowModal(false);
            fetchDishes();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this dish?')) return;
        try {
            await API.delete(`/admin/dishes/${id}`);
            fetchDishes();
        } catch (err) {
            alert('Delete failed');
        }
    };
    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    return (
        <div className="admin-page">
            <div className="admin-toolbar">
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Manage Menu</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{dishes.length} dishes</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>+ Add Dish</button>
            </div>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dishes.map((dish) => (
                            <tr key={dish._id}>
                                <td style={{ fontWeight: 600 }}>{dish.name}</td>
                                <td>{dish.category}</td>
                                <td>₹{dish.price}</td>
                                <td>{dish.inventoryQuantity}</td>
                                <td>
                                    <span className={`status-badge ${dish.available ? 'ready' : 'pending'}`}>
                                        {dish.available ? 'Available' : 'Sold Out'}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(dish)}>Edit</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(dish._id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editDish ? 'Edit Dish' : 'Add New Dish'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option>Drinks</option>
                                    <option>Snacks</option>
                                    <option>Fast Food</option>
                                    <option>Meals</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input className="form-input" value={form.imageURL} onChange={(e) => setForm({ ...form, imageURL: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Stock Quantity</label>
                                <input className="form-input" type="number" min="0" value={form.inventoryQuantity} onChange={(e) => setForm({ ...form, inventoryQuantity: e.target.value })} required />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Setting stock to 0 will mark dish as sold out.</p>
                            </div>
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
                                <input 
                                    type="checkbox" 
                                    id="available"
                                    checked={form.available} 
                                    onChange={(e) => setForm({ ...form, available: e.target.checked })} 
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <label htmlFor="available" style={{ marginBottom: 0 }}>Force Available (Override Stock)</label>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">{editDish ? 'Update Dish' : 'Add Dish'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ManageMenu;
