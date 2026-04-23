import { useEffect, useMemo, useState } from 'react';
import { api, authStore } from '../../services/api';
import { getSocket } from '../../services/socket';
import InvoicePage from '../InvoicePage';
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
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);

  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [productForm, setProductForm] = useState(defaultProduct);
  const [editingProductId, setEditingProductId] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState('');

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
    const [productData, orderData, userData, couponData] = await Promise.all([
      api.request(`/products?limit=100&search=${encodeURIComponent(productSearch)}`),
      api.request(`/orders?status=${orderStatusFilter}&search=${encodeURIComponent(orderSearch)}`),
      api.request('/users'),
      api.request('/coupons'),
    ]);

    setProducts(productData.items || []);
    // orderController now returns { orders, total } — extract the array
    setOrders(Array.isArray(orderData) ? orderData : (orderData?.orders || []));
    setUsers(userData || []);
    setCoupons(couponData || []);
  };

  useEffect(() => {
    loadAll().catch((err) => showToast(err.message, true));
  }, [productSearch, orderSearch, orderStatusFilter]);

  useEffect(() => {
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
  }, [productSearch, orderSearch, orderStatusFilter]);

  const resetProductForm = () => {
    setProductForm(defaultProduct);
    setEditingProductId('');
    setRelatedSearch('');
  };

  const submitProduct = async (event) => {
    event.preventDefault();
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

  const archiveProduct = async (id) => {
    if (!window.confirm('Archive this product? It will be hidden from the storefront.')) return;

    try {
      await api.request(`/products/${id}`, { method: 'DELETE' });
      showToast('Product archived successfully');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const restoreProduct = async (id) => {
    try {
      await api.request(`/products/restore/${id}`, { method: 'PATCH' });
      showToast('Product restored successfully');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const duplicateProduct = async (product) => {
    try {
      const payload = {
        ...product,
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`,
        isActive: true
      };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;
      
      // Ensure images is correctly formatted if it's currently a join string in form state
      // But here product comes from the list, so it's already an array.
      
      await api.request('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Product duplicated successfully');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const uploadProductImage = async (file) => {
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
    try {
      await api.request(`/coupons/${id}/toggle`, { method: 'PATCH' });
      showToast('Coupon status updated');
      await loadAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const updateOrderStatus = async (id, status) => {
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
    lowStock: products.filter((p) => p.stock < 5).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    revenue: orders
      .filter((o) => o.status !== 'rejected')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    users: users.length,
  };

  return (
    <div className="adminShell">
      {/* Admin invoice viewer overlay */}
      {invoiceOrderId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto' }}>
          <InvoicePage
            orderId={invoiceOrderId}
            isAdmin={true}
            onBack={() => setInvoiceOrderId(null)}
          />
        </div>
      )}
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
        {(message || error) && (
          <div className={`adminToast ${error ? 'error' : ''}`}>{error || message}</div>
        )}

        {activeTab === 'overview' && (
          <section className="adminCardsGrid">
            <article><h4>Total Products</h4><p>{stats.products}</p></article>
            <article className={stats.lowStock > 0 ? 'dangerCard' : ''}><h4>Low Stock (≤5)</h4><p>{stats.lowStock}</p>{stats.outOfStock > 0 && <span className="outOfStockBadge">{stats.outOfStock} out of stock</span>}</article>
            <article className={stats.pendingOrders > 0 ? 'alertCard' : ''}><h4>Pending Orders</h4><p>{stats.pendingOrders}</p></article>
            <article><h4>Registered Users</h4><p>{stats.users}</p></article>
            <article className="revenueCard"><h4>Total Revenue</h4><p>₹{stats.revenue.toLocaleString('en-IN')}</p></article>
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
                   <input 
                     type="text" 
                     placeholder="Filter related models..." 
                     className="relatedSearch"
                     value={relatedSearch}
                     onChange={(e) => setRelatedSearch(e.target.value)}
                     style={{ marginBottom: '5px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                   />
                   <select 
                     multiple 
                     size="4" 
                     value={productForm.relatedProducts} 
                     onChange={(e) => {
                       const selected = Array.from(e.target.selectedOptions, option => option.value);
                       setProductForm({ ...productForm, relatedProducts: selected });
                     }}
                   >
                     {products
                       .filter(p => p._id !== editingProductId)
                       .filter(p => !relatedSearch || p.name.toLowerCase().includes(relatedSearch.toLowerCase()))
                       .map(p => (
                         <option key={p._id} value={p._id}>{p.name}</option>
                       ))}
                   </select>
                   <p className="fieldNote">Hold Ctrl/Cmd to select multiple</p>
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
                      <th>Status</th>
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
                        <td>
                          <span className={`statusBadge ${product.isActive ? 'delivered' : 'rejected'}`}>
                            {product.isActive ? 'Active' : 'Archived'}
                          </span>
                        </td>
                        <td className="actionsCell">
                        <button onClick={() => editProduct(product)}>Edit</button>
                        <button className="ghostBtn" onClick={() => duplicateProduct(product)}>Copy</button>
                        {product.isActive ? (
                          <button className="dangerBtn" onClick={() => archiveProduct(product._id)}>Archive</button>
                        ) : (
                          <button style={{ background: '#5C9E6E' }} onClick={() => restoreProduct(product._id)}>Restore</button>
                        )}
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
                        <button
                          style={{ background: 'linear-gradient(135deg,#302b63,#24243e)', color: '#fff', border: 'none' }}
                          onClick={() => setInvoiceOrderId(order._id)}
                        >
                          🧾 Invoice
                        </button>
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
                <input placeholder="Code (e.g. SAVE20)" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required />
                <button type="button" className="generateBtn" onClick={() => setCouponForm({...couponForm, code: Math.random().toString(36).substr(2, 8).toUpperCase()})}>Auto-Gen</button>
              </div>
              <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
              <input type="number" min="0" placeholder={couponForm.discountType === 'percentage' ? 'Discount % (e.g. 15)' : 'Flat amount ₹'} value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} required />
              <input type="number" min="0" placeholder="Min order amount ₹ (0 = no minimum)" value={couponForm.minOrderAmount || 0} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })} />
              <select value={couponForm.appliesTo} onChange={(e) => setCouponForm({ ...couponForm, appliesTo: e.target.value })}>
                <option value="all">Applies to All Products</option>
                <option value="category">Specific Category</option>
              </select>
              {couponForm.appliesTo === 'category' && (
                <select value={couponForm.targetCategory} onChange={(e) => setCouponForm({ ...couponForm, targetCategory: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              )}
              <input placeholder="Description (shown to users)" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
              <button type="submit">Create Coupon</button>
            </form>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min Order</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td><strong>{coupon.code}</strong></td>
                      <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                      <td>{coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}</td>
                      <td>{coupon.appliesTo}{coupon.targetCategory ? ` (${coupon.targetCategory})` : ''}</td>
                      <td><span className={`statusBadge ${coupon.active ? 'delivered' : 'rejected'}`}>{coupon.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="actionsCell">
                        <button onClick={() => toggleCoupon(coupon._id)}>{coupon.active ? 'Disable' : 'Enable'}</button>
                        <button className="dangerBtn" onClick={async () => { if (window.confirm('Delete this coupon?')) { try { await api.request(`/coupons/${coupon._id}`, { method: 'DELETE' }); showToast('Coupon deleted'); await loadAll(); } catch(e) { showToast(e.message, true); } } }}>Delete</button>
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
                    <th>Role</th>
                    <th>Saved Addresses</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td><span className={`statusBadge ${user.role === 'admin' ? 'processing' : 'delivered'}`}>{user.role}</span></td>
                      <td>
                        {user.addresses && user.addresses.length > 0
                          ? user.addresses.map((addr, i) => (
                              <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                <strong>{addr.label}:</strong> {addr.line1}, {addr.city} - {addr.postalCode}
                              </div>
                            ))
                          : '-'}
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
