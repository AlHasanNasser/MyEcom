import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: null,
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' });

  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    console.log("AdminDashboard: User object changed:", user);
    if (user && user.profile) {
      console.log("AdminDashboard: User Role:", user.profile.role);
      console.log("AdminDashboard: User is_approved:", user.profile.is_approved);

      if (user.profile.role === 'Admin') {
        setLoading(true);
        setLoadingOrders(true);
        setLoadingUsers(true);
        fetchProducts();
        fetchCategories();
        fetchOrders();
        fetchUsers();
      } else if (user.profile.role === 'Supplier' && user.profile.is_approved) {
        setLoading(true);
        setLoadingOrders(true);
        fetchProducts();
        fetchCategories();
        fetchOrders(); // Suppliers can only manage orders
      } else {
        // User is not admin or approved supplier, ensure all loading states are false
        setLoading(false);
        setLoadingOrders(false);
        setLoadingUsers(false);
      }
    } else {
      // No user or profile, ensure all loading states are false
      setLoading(false);
      setLoadingOrders(false);
      setLoadingUsers(false);
    }
  }, [user]);

  const fetchProducts = () => {
    api
      .get("products/")
      .then((res) => {
        if (user && user.profile && user.profile.role === 'Supplier') {
          setProducts(res.data.filter(p => p.supplier && p.supplier.id === user.id));
        } else {
          setProducts(res.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    api
      .get("categories/")
      .then((res) => setCategories(res.data))
      .catch((e) => console.error(e));
  };

  const fetchOrders = () => {
    let url = "orders/";
    api.get(url)
        .then(res => setOrders(res.data))
        .catch(e => console.error("Error fetching orders", e))
        .finally(() => setLoadingOrders(false));
  };

  const handleStatusChange = (orderId, newStatus) => {
    api.post(`orders/${orderId}/update_status/`, { status: newStatus })
        .then(() => {
            fetchOrders(); // Refresh orders
        })
        .catch(e => {
            console.error("Error updating order status", e);
            alert("Failed to update order status.");
        });
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setNewProduct({ ...newProduct, [name]: files[0] });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.category) {
      alert("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("description", newProduct.description);
    formData.append("price", newProduct.price);
    formData.append("stock", newProduct.stock);
    formData.append("category_id", newProduct.category);

    if (newProduct.image) {
      formData.append('image', newProduct.image);
    }

    api
      .post("products/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        setNewProduct({ name: "", description: "", price: "", stock: "", category: "", image: null });
        fetchProducts();
      })
      .catch((e) => {
        console.error(e);
        if (e.response && e.response.data && e.response.data.slug) {
          alert(`Failed to create product: ${e.response.data.slug[0]}. Please try a different product name.`);
        } else {
          alert("Failed to create product. Check console for details.");
        }
      });
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      api
        .delete(`products/${productId}/`)
        .then(() => {
          fetchProducts(); // Refresh product list
        })
        .catch((e) => {
          console.error(e);
          alert("Failed to delete product. Check console for details.");
        });
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({ ...product, category: product.category.id });
    setShowImageInput(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setEditingProduct({ ...editingProduct, [name]: files[0] });
    } else {
      setEditingProduct({ ...editingProduct, [name]: value });
    }
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price || !editingProduct.stock || !editingProduct.category) {
      alert("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("description", editingProduct.description);
    formData.append("price", editingProduct.price);
    formData.append("stock", editingProduct.stock);
    if (typeof editingProduct.category === 'object' && editingProduct.category !== null) {
      formData.append("category_id", editingProduct.category.id);
    } else {
      formData.append("category_id", editingProduct.category);
    }

    if (editingProduct.image instanceof File) {
      formData.append('image', editingProduct.image);
    }

    api
      .patch(`products/${editingProduct.id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        setEditingProduct(null);
        fetchProducts();
      })
      .catch((e) => {
        console.error(e);
        if (e.response && e.response.data && e.response.data.slug) {
          alert(`Failed to update product: ${e.response.data.slug[0]}. Please try a different product name.`);
        } else {
          alert("Failed to update product. Check console for details.");
        }
      });
  };

  const fetchUsers = () => {
    api.get("users/")
        .then(res => setUsers(res.data))
        .catch(e => console.error("Error fetching users", e))
        .finally(() => setLoadingUsers(false));
  };

  const handleNewSupplierInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier({ ...newSupplier, [name]: value });
  };

  const handleCreateSupplier = (e) => {
    e.preventDefault();
    if (!newSupplier.username || !newSupplier.password || !newSupplier.email) {
      alert("Username, email, and password are required for a new supplier.");
      return;
    }
    api.post("users/workers/register/", newSupplier)
      .then(() => {
        alert("Supplier account requested. Awaiting admin approval.");
        setNewSupplier({ username: '', email: '', password: '', first_name: '', last_name: '' });
        fetchUsers();
      })
      .catch(e => {
        console.error("Error creating supplier", e);
        alert(`Failed to create supplier: ${e.response?.data?.error || 'Unknown error'}`);
      });
  };

  const handleSupplierApproval = (userId, action) => { // action can be 'approve' or 'reject'
    api.post(`users/workers/${userId}/approve/`, { action })
      .then(() => {
        alert(`Supplier ${action}d successfully.`);
        fetchUsers();
      })
      .catch(e => {
        console.error(`Error ${action}ing supplier`, e);
        alert(`Failed to ${action} supplier: ${e.response?.data?.error || 'Unknown error'}`);
      });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
        api.delete(`users/${userId}/delete/`)
            .then(() => {
                alert("User deleted successfully.");
                fetchUsers();
            })
            .catch(e => {
                console.error("Error deleting user", e);
                alert(`Failed to delete user: ${e.response?.data?.error || 'Unknown error'}`);
            });
    }
};

  if (loading || loadingOrders || loadingUsers) return <div className="container">Loading...</div>;

  return (
    <div className="container admin-dashboard">
      <h2>Admin Dashboard</h2>
      <p>
        Note: Only staff users should access this in production — backend enforces permissions.
      </p>

      <div className="admin-actions">
        {user && user.profile && user.profile.role === 'Admin' && (
          <a className="btn-secondary" href="/admin/">
            Open Django Admin
          </a>
        )}
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      {user && user.profile && (user.profile.role === 'Admin' || (user.profile.role === 'Supplier' && user.profile.is_approved)) && (
        <div className="product-management">
          <h3>Manage Products</h3>
          {editingProduct ? (
            <div className="edit-product-form">
              <h3>Edit Product</h3>
              <form onSubmit={handleUpdateProduct}>
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={editingProduct.name}
                    onChange={handleEditInputChange}
                    placeholder="Product Name"
                    required
                  />
                  <select
                    name="category"
                    value={editingProduct.category}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    name="price"
                    value={editingProduct.price}
                    onChange={handleEditInputChange}
                    placeholder="Price"
                    required
                  />
                  <input
                    type="number"
                    name="stock"
                    value={editingProduct.stock}
                    onChange={handleEditInputChange}
                    placeholder="Stock"
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="description"
                    value={editingProduct.description}
                    onChange={handleEditInputChange}
                    placeholder="Product Description"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Product Image:</label>
                  {editingProduct.image && !showImageInput ? (
                    <div>
                      <img src={editingProduct.image} alt="Current Product" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                      <button type="button" className="btn-sm btn-secondary" onClick={() => setShowImageInput(true)}>
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      name="image"
                      id="editImage"
                      onChange={handleEditInputChange}
                      accept="image/*"
                    />
                  )}
                </div>
                <button type="submit" className="btn-primary">
                  Update Product
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
              </form>
            </div>
          ) : (
            <div className="create-product-form">
              <h3>Create New Product</h3>
              <form onSubmit={handleCreateProduct}>
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    placeholder="Product Name"
                    required
                  />
                  <select
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder="Price"
                    required
                  />
                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleInputChange}
                    placeholder="Stock"
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    placeholder="Product Description"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="image">Product Image:</label>
                  <input
                    type="file"
                    name="image"
                    id="image"
                    onChange={handleInputChange}
                    accept="image/*"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Create Product
                </button>
              </form>
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>${p.price}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => handleEditClick(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(user && user.profile && (user.profile.role === 'Admin' || (user.profile.role === 'Supplier' && user.profile.is_approved))) && (
        <div className="orders-management">
          <h3>Manage Orders</h3>
          {loadingOrders ? (
              <p>Loading orders...</p>
          ) : (
              <table className="admin-table">
                  <thead>
                      <tr>
                          <th>Order ID</th>
                          <th>User</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {orders.map(order => (
                          <tr key={order.id}>
                              <td>{order.id}</td>
                              <td>{order.user ? order.user.email : 'N/A'}</td>
                              <td>{new Date(order.created_at).toLocaleDateString()}</td>
                              <td>${order.total}</td>
                              <td>
                                  <select
                                      value={order.status}
                                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  >
                                      <option value="Pending">Pending</option>
                                      <option value="Shipped">Shipped</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Cancelled">Cancelled</option>
                                  </select>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
        </div>
      )}

      {user && user.profile && user.profile.role === 'Admin' && (
        <div className="worker-management">
          <h3>Manage Suppliers & Users</h3>
          <div className="create-worker-form">
            <h4>Create New Supplier Account</h4>
            <form onSubmit={handleCreateSupplier}>
              <div className="form-group">
                <input type="text" name="username" value={newSupplier.username} onChange={handleNewSupplierInputChange} placeholder="Username" required />
                <input type="email" name="email" value={newSupplier.email} onChange={handleNewSupplierInputChange} placeholder="Email" required />
              </div>
              <div className="form-group">
                <input type="password" name="password" value={newSupplier.password} onChange={handleNewSupplierInputChange} placeholder="Password" required />
                <input type="text" name="first_name" value={newSupplier.first_name} onChange={handleNewSupplierInputChange} placeholder="First Name" />
                <input type="text" name="last_name" value={newSupplier.last_name} onChange={handleNewSupplierInputChange} placeholder="Last Name" />
              </div>
              <button type="submit" className="btn-primary">Create Supplier</button>
            </form>
          </div>

          <h4>All Users</h4>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.profile ? user.profile.role : 'N/A'}</td>
                  <td>{user.profile?.is_approved ? 'Yes' : 'No'}</td>
                  <td>
                    {user.profile?.role === 'Supplier' && !user.profile?.is_approved && (
                      <button className="btn-sm btn-primary" onClick={() => handleSupplierApproval(user.id, 'approve')}>Approve</button>
                    )}
                    {user.profile?.role === 'Supplier' && user.profile?.is_approved && (
                      <button className="btn-sm btn-secondary" onClick={() => handleSupplierApproval(user.id, 'reject')}>Reject</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
