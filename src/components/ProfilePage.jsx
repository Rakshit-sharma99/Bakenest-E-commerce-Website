import { useState, useEffect, useCallback } from 'react';
import profileBg from '../assets/images/profile-bg.png';
import { api } from '../services/api';
import './ProfilePage.css';

/* ── Icons ── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
);
const IconBox = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.7 21.5C12.29 21.71 11.72 21.71 11.3 21.5L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.3 2.5C11.71 2.29 12.28 2.29 12.7 2.5L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5ZM12 4.15L5.6 7.5L12 10.85L18.4 7.5L12 4.15ZM5 15.91L11 19.06V12.71L5 9.56V15.91ZM19 15.91V9.56L13 12.71V19.06L19 15.91Z"/></svg>
);
const IconAdmin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
);

const TABS = [
  { id: 'details', label: 'Personal Info', icon: <IconUser /> },
  { id: 'addresses', label: 'My Addresses', icon: <IconPin /> },
  { id: 'orders', label: 'Order History', icon: <IconBox /> },
];

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#10b981',
  rejected: '#ef4444',
};

const EMPTY_ADDRESS = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
};

export default function ProfilePage({ user, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState('details');

  /* ─── Personal Info ─── */
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  /* ─── Addresses ─── */
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrMsg, setAddrMsg] = useState('');

  /* ─── Orders ─── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  /* ─── Load Addresses ─── */
  const loadAddresses = useCallback(async () => {
    setAddrLoading(true);
    try {
      const data = await api.request('/users/profile/addresses');
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setAddrLoading(false);
    }
  }, []);

  /* ─── Load Orders ─── */
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await api.request('/orders/my');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'addresses') loadAddresses();
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  /* ─── Save Personal Info ─── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await api.request('/users/profile/me', {
        method: 'PUT',
        body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
      });
      setProfileMsg('✓ Profile updated successfully!');
    } catch (err) {
      setProfileMsg('✗ ' + (err.message || 'Failed to update profile'));
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(''), 3500);
    }
  };

  /* ─── Add Address ─── */
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddrSaving(true);
    setAddrMsg('');
    try {
      const result = await api.request('/users/profile/addresses', {
        method: 'POST',
        body: JSON.stringify(addrForm),
      });
      setAddresses(result.addresses || []);
      setAddrForm(EMPTY_ADDRESS);
      setShowAddrForm(false);
      setAddrMsg('✓ Address added!');
    } catch (err) {
      setAddrMsg('✗ ' + (err.message || 'Failed to add address'));
    } finally {
      setAddrSaving(false);
      setTimeout(() => setAddrMsg(''), 3500);
    }
  };

  /* ─── Delete Address ─── */
  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      const result = await api.request(`/users/profile/addresses/${addrId}`, { method: 'DELETE' });
      setAddresses(result.addresses || []);
    } catch (err) {
      alert(err.message || 'Failed to remove address');
    }
  };

  /* ─── Set Default Address ─── */
  const handleSetDefault = async (addrId) => {
    try {
      const result = await api.request(`/users/profile/addresses/${addrId}/default`, { method: 'PATCH' });
      setAddresses(result.addresses || []);
    } catch (err) {
      alert(err.message || 'Failed to set default');
    }
  };

  const displayName = profileForm.name || user?.name || 'Customer';
  const joinYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  return (
    <div className="profileContainer" style={{ backgroundImage: `url(${profileBg})` }}>
      <div className="profileOverlay" />
      <div className="profileWrapper">

        {/* ── Glass Sidebar ── */}
        <aside className="profileSidebarBox">
          <div className="profileSidebarInner">
            <div className="profileAvatarArea">
              <div className="avatarGlowWrap">
                <div className="avatarGlow" />
                <div className="avatarCircle">{displayName.charAt(0).toUpperCase()}</div>
              </div>
              <h2 className="profileName">{displayName}</h2>
              <p className="profileJoined">Member since {joinYear}</p>
              {profileForm.phone && <p className="profilePhone">📞 {profileForm.phone}</p>}
            </div>

            <nav className="profileNavList">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`profileNavItem ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="navIcon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}

              {user?.role === 'admin' && (
                <button
                  className="profileNavItem admin-link"
                  onClick={() => { window.location.href = '/admin'; }}
                >
                  <span className="navIcon"><IconAdmin /></span>
                  <span>Admin Dashboard</span>
                </button>
              )}

              <button className="profileNavItem logout-btn" onClick={onLogout}>
                <span className="navIcon"><IconLogout /></span>
                <span>Logout</span>
              </button>
            </nav>

            <button className="profileSideBack" onClick={onBack}>← Back to Shop</button>
          </div>
        </aside>

        {/* ── Main Glass Panel ── */}
        <main className="profileMainBox">
          <div className="profileMainInner">

            {/* Pill Nav */}
            <div className="profileTopPillNav">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ──────────────────── PERSONAL INFO TAB ──────────────────── */}
            {activeTab === 'details' && (
              <div className="profileContentFade">
                <h1 className="profileSecTitle">Personal Information</h1>
                <p className="profileSecDesc">Update your name and contact number. Email cannot be changed.</p>

                <form className="profileGlassForm" onSubmit={handleSaveProfile}>
                  <div className="glassInputWrap">
                    <label className="glassLabel">Full Name</label>
                    <input
                      type="text"
                      className="glassInput"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="glassInputWrap">
                    <label className="glassLabel">Email Address</label>
                    <input type="email" className="glassInput disabled-input" value={user?.email || ''} readOnly />
                    <span className="inputNote">Email cannot be changed</span>
                  </div>

                  <div className="glassInputWrap">
                    <label className="glassLabel">Phone Number</label>
                    <input
                      type="tel"
                      className="glassInput"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  {profileMsg && (
                    <div className={`profileFeedback ${profileMsg.startsWith('✓') ? 'success' : 'error'}`}>
                      {profileMsg}
                    </div>
                  )}

                  <button type="submit" className="glassSaveBtn" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ──────────────────── ADDRESSES TAB ──────────────────── */}
            {activeTab === 'addresses' && (
              <div className="profileContentFade">
                <div className="addrHeader">
                  <div>
                    <h1 className="profileSecTitle">My Addresses</h1>
                    <p className="profileSecDesc">Manage your saved delivery addresses.</p>
                  </div>
                  <button className="addAddrBtn" onClick={() => { setShowAddrForm((v) => !v); setAddrForm(EMPTY_ADDRESS); }}>
                    <IconPlus /> {showAddrForm ? 'Cancel' : 'Add New'}
                  </button>
                </div>

                {addrMsg && (
                  <div className={`profileFeedback ${addrMsg.startsWith('✓') ? 'success' : 'error'}`}>{addrMsg}</div>
                )}

                {/* Add Address Form */}
                {showAddrForm && (
                  <form className="addrFormCard" onSubmit={handleAddAddress}>
                    <h3 className="addrFormTitle">New Address</h3>
                    <div className="addrFormGrid">
                      <div className="addrFormField">
                        <label>Label</label>
                        <select value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}>
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="addrFormField">
                        <label>Full Name *</label>
                        <input required value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} placeholder="Recipient name" />
                      </div>
                      <div className="addrFormField">
                        <label>Phone *</label>
                        <input required value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div className="addrFormField full-width">
                        <label>Address Line 1 *</label>
                        <input required value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} placeholder="House / Flat / Block No." />
                      </div>
                      <div className="addrFormField full-width">
                        <label>Address Line 2</label>
                        <input value={addrForm.line2} onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })} placeholder="Street / Area / Landmark" />
                      </div>
                      <div className="addrFormField">
                        <label>City *</label>
                        <input required value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="City" />
                      </div>
                      <div className="addrFormField">
                        <label>State</label>
                        <input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} placeholder="State" />
                      </div>
                      <div className="addrFormField">
                        <label>Postal Code *</label>
                        <input required value={addrForm.postalCode} onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })} placeholder="PIN Code" />
                      </div>
                      <div className="addrFormField">
                        <label>Country *</label>
                        <input required value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} placeholder="Country" />
                      </div>
                      <div className="addrFormField full-width">
                        <label className="checkboxLabel">
                          <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                          Set as default address
                        </label>
                      </div>
                    </div>
                    <div className="addrFormActions">
                      <button type="submit" className="addrSaveBtn" disabled={addrSaving}>{addrSaving ? 'Saving...' : 'Save Address'}</button>
                      <button type="button" className="addrCancelBtn" onClick={() => setShowAddrForm(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Address Cards */}
                {addrLoading ? (
                  <div className="addrLoading">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="addrEmpty">
                    <div className="addrEmptyIcon">📍</div>
                    <p>No saved addresses yet.</p>
                    <button className="addAddrBtn" onClick={() => setShowAddrForm(true)}><IconPlus /> Add Your First Address</button>
                  </div>
                ) : (
                  <div className="addrCardGrid">
                    {addresses.map((addr) => (
                      <div key={addr._id} className={`addrCard ${addr.isDefault ? 'default-addr' : ''}`}>
                        <div className="addrCardTop">
                          <span className="addrLabel">{addr.label}</span>
                          {addr.isDefault && <span className="defaultBadge">Default</span>}
                        </div>
                        <div className="addrCardBody">
                          <strong>{addr.fullName}</strong>
                          <span>{addr.phone}</span>
                          <span>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</span>
                          <span>{addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.postalCode}</span>
                          <span>{addr.country}</span>
                        </div>
                        <div className="addrCardActions">
                          {!addr.isDefault && (
                            <button className="addrActionBtn" onClick={() => handleSetDefault(addr._id)}>Set Default</button>
                          )}
                          <button className="addrDeleteBtn" onClick={() => handleDeleteAddress(addr._id)}>
                            <IconTrash /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ──────────────────── ORDERS TAB ──────────────────── */}
            {activeTab === 'orders' && (
              <div className="profileContentFade">
                <h1 className="profileSecTitle">Order History</h1>
                <p className="profileSecDesc">All your past and current orders.</p>

                {ordersLoading ? (
                  <div className="addrLoading">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="addrEmpty">
                    <div className="addrEmptyIcon">📦</div>
                    <p>You haven't placed any orders yet.</p>
                    <button className="addAddrBtn" onClick={onBack}>Start Shopping →</button>
                  </div>
                ) : (
                  <div className="ordersList">
                    {orders.map((order) => (
                      <div key={order._id} className="orderCard">
                        <div
                          className="orderCardHeader"
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        >
                          <div className="orderIdBlock">
                            <span className="orderIdLabel">Order</span>
                            <span className="orderId">#{order._id.slice(-8).toUpperCase()}</span>
                          </div>
                          <div className="orderMeta">
                            <span className="orderDate">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="orderTotal">₹{Number(order.total).toLocaleString('en-IN')}</span>
                            <span
                              className="orderStatusBadge"
                              style={{ background: STATUS_COLORS[order.status] || '#888' }}
                            >
                              {order.status}
                            </span>
                            <span className="orderChevron">{expandedOrder === order._id ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {/* Expanded Order Details */}
                        {expandedOrder === order._id && (
                          <div className="orderCardBody">
                            {/* Items */}
                            <div className="orderItemsList">
                              <h4>Items Ordered</h4>
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="orderItem">
                                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="orderItemImg" />}
                                  <div className="orderItemInfo">
                                    <span className="orderItemName">{item.name}</span>
                                    <span className="orderItemQty">Qty: {item.quantity}</span>
                                  </div>
                                  <span className="orderItemPrice">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>

                            {/* Summary */}
                            <div className="orderSummaryBlock">
                              <div className="orderSummaryRow">
                                <span>Subtotal</span>
                                <span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="orderSummaryRow discount">
                                  <span>Discount</span>
                                  <span>- ₹{Number(order.discount).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {order.shippingFee > 0 && (
                                <div className="orderSummaryRow">
                                  <span>Shipping</span>
                                  <span>₹{Number(order.shippingFee).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div className="orderSummaryRow total">
                                <span>Total</span>
                                <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shippingAddress && (
                              <div className="orderAddressBlock">
                                <h4>Delivered To</h4>
                                <address>
                                  <strong>{order.shippingAddress.fullName}</strong><br />
                                  {order.shippingAddress.phone}<br />
                                  {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                                  {order.shippingAddress.country}
                                </address>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
