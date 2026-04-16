import { useEffect, useMemo, useState } from 'react';
import { api, authStore } from '../../services/api';
import { getSocket } from '../../services/socket';
import './AdminDashboard.css';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'coupons', label: 'Discounts' },
  { id: 'users', label: 'Users' },
];

const defaultProduct = {
  name: '',
  slug: '',
  description: '',
  category: '',
  price: 0,
  comparePrice: 0,
  stock: 0,
  imageUrl: '',
  images: '',
  warranty: '',
  returnsAllowed: true,
  relatedProducts: [],
};

export default function AdminDashboard({ adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [productForm, setProductForm] = useState(defaultProduct);
  const [editingProductId, setEditingProductId] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    appliesTo: 'all',
    targetCategory: '',
    active: true,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isPreviewMode = localStorage.getItem('bakenest_preview_mode') === 'true';

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
    [products]
  );

  const showToast = (text, isError = false) => {
    if (isError) {
      setError(text);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadAll = async () => {
    if (isPreviewMode) {
      const productData = await api.request(`/products?limit=100&search=${encodeURIComponent(productSearch)}`);
      setProducts(productData.items || []);
      setOrders([]);
      setUsers([]);
      setCoupons([]);
      return;
    }

    const [productData, orderData, userData, couponData] = await Promise.all([
      api.request(`/products?limit=100&search=${encodeURIComponent(productSearch)}`),
      api.request(`/orders?status=${orderStatusFilter}&search=${encodeURIComponent(orderSearch)}`),
      api.request('/users'),
      api.request('/coupons'),
    ]);

    setProducts(productData.items || []);
    setOrders(orderData || []);
    setUsers(userData || []);
    setCoupons(couponData || []);
  };

  useEffect(() => {
    loadAll().catch((err) => showToast(err.message, true));
  }, [productSearch, orderSearch, orderStatusFilter]);

  useEffect(() => {
    if (isPreviewMode) return undefined;

    const socket = getSocket();

    const handleRealtime = () => {
      loadAll().catch((err) => showToast(err.message, true));
    };

    socket.on('products:changed', handleRealtime);
    socket.on('orders:changed', handleRealtime);
    socket.on('coupons:changed', handleRealtime);

    return () => {
      socket.off('products:changed', handleRealtime);
      socket.off('orders:changed', handleRealtime);
      socket.off('coupons:changed', handleRealtime);
    };
  }, [productSearch, orderSearch, orderStatusFilter, isPreviewMode]);

  const resetProductForm = () => {
    setProductForm(defaultProduct);
    setEditingProductId('');
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    if (isPreviewMode) {
      showToast('Preview mode: editing is disabled. Login to enable changes.', true);
      return;
    }

    setSavingProduct(true);
    try {
      // Pre-process images back into an array before sending
      const payload = {
        ...productForm,
        images: typeof productForm.images === 'string' 
          ? productForm.images.split(',').map(url => url.trim()).filter(Boolean) 
          : productForm.images
      };

      if (editingProductId) {
        await api.request(`/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Product updated successfully');
      } else {
        await api.request('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Product created successfully');
      }

      resetProductForm();
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSavingProduct(false);
    }
  };

  const editProduct = (product) => {
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      price: product.price,
      comparePrice: product.comparePrice || 0,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
      images: Array.isArray(product.images) ? product.images.join(', ') : (product.images || ''),
      warranty: product.warranty || '',
      returnsAllowed: product.returnsAllowed !== undefined ? product.returnsAllowed : true,
      relatedProducts: product.relatedProducts || [],
    });
    setEditingProductId(product._id);
    setActiveTab('products');
  };

  const removeProduct = async (id) => {
    if (isPreviewMode) {
      showToast('Preview mode: deleting is disabled. Login to enable changes.', true);
      return;
    }

    if (!window.confirm('Delete this product?')) return;

    try {
      await api.request(`/products/${id}`, { method: 'DELETE' });
      showToast('Product deleted');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const uploadProductImage = async (file) => {
    if (isPreviewMode) {
      showToast('Preview mode: image upload is disabled. Login to enable changes.', true);
      return;
    }

    try {
      const payload = await api.uploadImage(file);
      setProductForm((prev) => ({ ...prev, imageUrl: payload.imageUrl }));
      showToast('Image uploaded');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const createCoupon = async (event) => {
    event.preventDefault();
    if (isPreviewMode) {
      showToast('Preview mode: coupon creation is disabled. Login to enable changes.', true);
      return;
    }

    try {
      await api.request('/coupons', {
        method: 'POST',
        body: JSON.stringify(couponForm),
      });
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'all',
        targetCategory: '',
        active: true,
      });
      showToast('Coupon created');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const toggleCoupon = async (id) => {
    if (isPreviewMode) {
      showToast('Preview mode: coupon updates are disabled. Login to enable changes.', true);
      return;
    }

    try {
      await api.request(`/coupons/${id}/toggle`, { method: 'PATCH' });
      showToast('Coupon status updated');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const updateOrderStatus = async (id, status) => {
    if (isPreviewMode) {
      showToast('Preview mode: order updates are disabled. Login to enable changes.', true);
      return;
    }

    try {
      await api.request(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Order marked as ${status}`);
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const stats = {
    products: products.length,
    lowStock: products.filter((p) => p.stock < 10).length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    users: users.length,
  };

  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <h2>BakeNest Admin</h2>
        <p>Welcome, {adminUser.name}</p>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="logoutBtn" onClick={() => { authStore.clearSession(); onLogout(); }}>
          Logout
        </button>
      </aside>

      <main className="adminContent">
        {isPreviewMode && (
          <div className="adminPreviewBanner">
            Preview mode is active. You can browse the dashboard UI now. Login later to manage products, orders, users, and discounts.
          </div>
        )}

        {(message || error) && (
          <div className={`adminToast ${error ? 'error' : ''}`}>{error || message}</div>
        )}

        {activeTab === 'overview' && (
          <section className="adminCardsGrid">
            <article><h4>Total Products</h4><p>{stats.products}</p></article>
            <article><h4>Low Stock Alerts</h4><p>{stats.lowStock}</p></article>
            <article><h4>Pending Orders</h4><p>{stats.pendingOrders}</p></article>
            <article><h4>Registered Users</h4><p>{stats.users}</p></article>
          </section>
        )}

        {activeTab === 'products' && (
          <section>
            <div className="adminSectionHeader">
              <h3>Product Management</h3>
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products"
              />
            </div>

            <form className="adminForm premiumForm" onSubmit={submitProduct}>
              <div className="formGrid2">
                <input placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                <input placeholder="Slug" value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })} required />
                <input placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required />
                <input type="number" min="0" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} required />
                <div className="priceInputGroup">
                  <span className="priceLabel">Listed Price (₹):</span>
                  <input type="number" min="0" placeholder="Listed Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} required />
                </div>
                <div className="priceInputGroup">
                  <span className="priceLabel">Original/OG Price (₹):</span>
                  <input type="number" min="0" placeholder="Original Price" value={productForm.comparePrice} onChange={(e) => setProductForm({ ...productForm, comparePrice: Number(e.target.value) })} />
                </div>
              </div>
              <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />

              <div className="formGrid2" style={{ marginTop: '10px' }}>
                <input placeholder="Gallery Image URLs (comma separated)" value={productForm.images} onChange={(e) => setProductForm({ ...productForm, images: e.target.value })} />
                <input placeholder="Warranty (e.g. 1 Year Warranty)" value={productForm.warranty} onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })} />
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={productForm.returnsAllowed} onChange={(e) => setProductForm({ ...productForm, returnsAllowed: e.target.checked })} />
                  Allow Returns (e.g. 30 Day Returns)
                </label>

                <div className="priceInputGroup">
                   <span className="priceLabel">Related Products:</span>
                   <select 
                     multiple 
                     size="3" 
                     value={productForm.relatedProducts} 
                     onChange={(e) => {
                       const selected = Array.from(e.target.selectedOptions, option => option.value);
                       setProductForm({ ...productForm, relatedProducts: selected });
                     }}
                   >
                     {products.filter(p => p._id !== editingProductId).map(p => (
                       <option key={p._id} value={p._id}>{p.name}</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="imageUploadRow">
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadProductImage(e.target.files[0])} />
                {productForm.imageUrl && <img src={productForm.imageUrl} alt="preview" className="imagePreview" />}
              </div>

              <div className="formActions">
                <button type="submit" disabled={savingProduct}>
                  {savingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
                </button>
                {editingProductId && (
                  <button type="button" className="ghostBtn" onClick={resetProductForm}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <div className="tableWrap">
              <table>
                <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Prices</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="tableThumb" /> : '-'}</td>
                        <td className="boldCell">{product.name}</td>
                        <td>{product.category}</td>
                        <td className="priceCell">
                          ₹{product.price?.toFixed(2)}{' '}
                          {product.comparePrice > product.price && <span className="adminOldPrice">₹{product.comparePrice.toFixed(2)}</span>}
                        </td>
                        <td className={product.stock < 10 ? 'dangerText' : ''}>{product.stock}</td>
                        <td className="actionsCell">
                        <button onClick={() => editProduct(product)}>Edit</button>
                        <button className="dangerBtn" onClick={() => removeProduct(product._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section>
            <div className="adminSectionHeader">
              <h3>Order Management</h3>
              <div className="inlineFilters">
                <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search orders" />
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="boldCell">#{order._id.slice(-6)}</td>
                      <td className="addressCell">
                        <strong>{order.shippingAddress?.fullName}</strong> ({order.user?.email})<br />
                        📞 {order.shippingAddress?.phone || 'N/A'}<br />
                        🏠 {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
                      </td>
                      <td className="priceCell">₹{order.total?.toFixed(2)}</td>
                      <td><span className={`statusBadge ${order.status}`}>{order.status}</span></td>
                      <td className="actionsCell">
                        <button onClick={() => updateOrderStatus(order._id, 'accepted')}>Accept</button>
                        <button onClick={() => updateOrderStatus(order._id, 'rejected')}>Reject</button>
                        <button onClick={() => updateOrderStatus(order._id, 'processing')}>Processing</button>
                        <button onClick={() => updateOrderStatus(order._id, 'shipped')}>Shipped</button>
                        <button onClick={() => updateOrderStatus(order._id, 'delivered')}>Delivered</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'coupons' && (
          <section>
            <div className="adminSectionHeader">
              <h3>Discount & Offers</h3>
            </div>
            <form className="adminForm inline premiumForm" onSubmit={createCoupon}>
              <div className="codeGenGroup">
                <input placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required />
                <button type="button" className="generateBtn" onClick={() => setCouponForm({...couponForm, code: Math.random().toString(36).substr(2, 8).toUpperCase()})}>Auto-Gen</button>
              </div>
              <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
              <input type="number" min="0" placeholder="Value" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} required />
              <select value={couponForm.appliesTo} onChange={(e) => setCouponForm({ ...couponForm, appliesTo: e.target.value })}>
                <option value="all">All</option>
                <option value="category">Category</option>
              </select>
              {couponForm.appliesTo === 'category' && (
                <select value={couponForm.targetCategory} onChange={(e) => setCouponForm({ ...couponForm, targetCategory: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              )}
              <input placeholder="Description" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
              <button type="submit">Create Coupon</button>
            </form>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td>{coupon.code}</td>
                      <td>{coupon.discountType}</td>
                      <td>{coupon.discountValue}</td>
                      <td>{coupon.appliesTo}{coupon.targetCategory ? ` (${coupon.targetCategory})` : ''}</td>
                      <td>{coupon.active ? 'Enabled' : 'Disabled'}</td>
                      <td className="actionsCell">
                        <button onClick={() => toggleCoupon(coupon._id)}>{coupon.active ? 'Disable' : 'Enable'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section>
            <h3>Registered Users</h3>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Delivery Address</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        {[user.address?.line1, user.address?.city, user.address?.postalCode, user.address?.country]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
