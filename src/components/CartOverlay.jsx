import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import './CartOverlay.css';

// Debounce helper — avoids spamming the server as user types coupon code
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SHIPPING_THRESHOLD = 999; // Free shipping above ₹999
const SHIPPING_FEE = 49;

export default function CartOverlay({
  cart,
  onClose,
  onRemoveItem,
  onUpdateQuantity,
  user,
  onAuthRequest,
}) {
  /* ─── View state: 'cart' | 'checkout' | 'complete' ─── */
  const [view, setView] = useState('cart');

  /* ─── Coupon ─── */
  const [couponCode, setCouponCode] = useState('');
  const [couponState, setCouponState] = useState(null); // { code, discountAmount, description, discountType, discountValue }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const debouncedCoupon = useDebounce(couponCode, 600);

  /* ─── Address form ─── */
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddr, setSelectedSavedAddr] = useState('');

  /* ─── Checkout state ─── */
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  /* ───────────────────── Derived Calculations ───────────────────────────── */
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCategories = [...new Set(cart.map((i) => i.category).filter(Boolean))];
  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discountAmount = couponState?.discountAmount || 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  /* ─── Load saved addresses if user is logged in ─── */
  useEffect(() => {
    if (user) {
      api.request('/users/profile/addresses')
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSavedAddresses(data);
            // Pre-fill with default address
            const def = data.find((a) => a.isDefault) || data[0];
            if (def) {
              setAddress({
                fullName: def.fullName,
                phone: def.phone,
                line1: def.line1,
                line2: def.line2 || '',
                city: def.city,
                state: def.state || '',
                postalCode: def.postalCode,
                country: def.country,
              });
              setSelectedSavedAddr(def._id);
            }
          }
        })
        .catch(() => {}); // Silently fail — user can still fill manually
    }
  }, [user]);

  /* ─── Auto-validate coupon when debounced code changes ─── */
  useEffect(() => {
    if (!debouncedCoupon || debouncedCoupon.length < 3) {
      setCouponState(null);
      setCouponError('');
      return;
    }
    handleValidateCoupon(debouncedCoupon);
  }, [debouncedCoupon, subtotal]);

  const handleValidateCoupon = async (code) => {
    if (!code || subtotal <= 0) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponState(null);
    try {
      const result = await api.request('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal, cartCategories }),
      });
      if (result.valid) {
        setCouponState({
          code: result.coupon.code,
          discountAmount: result.discountAmount,
          description: result.coupon.description,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
        });
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon');
      setCouponState(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponState(null);
    setCouponError('');
  };

  /* ─── Select saved address ─── */
  const handleSelectSavedAddress = (addrId) => {
    setSelectedSavedAddr(addrId);
    const addr = savedAddresses.find((a) => a._id === addrId);
    if (addr) {
      setAddress({
        fullName: addr.fullName,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2 || '',
        city: addr.city,
        state: addr.state || '',
        postalCode: addr.postalCode,
        country: addr.country,
      });
    }
  };

  /* ─── Submit Order ─── */
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequest(); return; }
    setSubmitting(true);
    setCheckoutError('');
    try {
      await api.request('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((c) => ({
            product: c._id || c.id,
            name: c.name,
            imageUrl: c.imageUrl || '',
            quantity: c.quantity,
            unitPrice: c.price,
          })),
          subtotal,
          discount: discountAmount,
          shippingFee,
          total,
          couponCode: couponState?.code || '',
          paymentMethod: 'COD',
          shippingAddress: address,
        }),
      });
      setView('complete');
      setTimeout(() => onClose(true), 3000);
    } catch (err) {
      setCheckoutError(err.message || 'Order placement failed. Please try again.');
      setSubmitting(false);
    }
  };

  /* ─── field helper ─── */
  const setField = (key, value) => setAddress((prev) => ({ ...prev, [key]: value }));

  /* ════════════════════════════════════════════════════════════════════════
                            RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="cartOverlayBg" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="cartOverlayBox">

        {/* ── Header ── */}
        <div className="cartHeader">
          <div className="cartHeaderLeft">
            {view === 'checkout' && (
              <button className="cartBackBtn" onClick={() => setView('cart')}>← Cart</button>
            )}
            <h2>{view === 'complete' ? '🎉 Order Placed!' : view === 'checkout' ? 'Checkout' : `Your Cart (${cart.length})`}</h2>
          </div>
          <button onClick={() => onClose(false)} className="closeCartBtn">✕</button>
        </div>

        {/* ── Order Complete ── */}
        {view === 'complete' && (
          <div className="cartComplete">
            <div className="cartCompleteIcon">✅</div>
            <h3>Thank you for your order!</h3>
            <p>Your order has been placed and is being processed.</p>
            <p className="cartCompleteNote">You'll receive a confirmation shortly.</p>
          </div>
        )}

        {/* ── Cart View ── */}
        {view === 'cart' && (
          <>
            {cart.length === 0 ? (
              <div className="cartEmpty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <p>Your cart is empty.</p>
                <button className="startShoppingBtn" onClick={() => onClose(false)}>Continue Shopping</button>
              </div>
            ) : (
              <div className="cartContent">
                {/* Items */}
                <div className="cartItems">
                  {cart.map((item) => (
                    <div key={item._id || item.id} className="cartItem">
                      <div className="cartItemImg">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} />
                          : <div className="cartItemImgPlaceholder">🛒</div>
                        }
                      </div>
                      <div className="cartItemInfo">
                        <h4>{item.name}</h4>
                        <p className="cartItemPrice">₹{Number(item.price).toLocaleString('en-IN')}</p>
                        <div className="cartItemActions">
                          <button className="qtyBtn" onClick={() => onUpdateQuantity(item, -1)}>−</button>
                          <span className="qtyDisplay">{item.quantity}</span>
                          <button className="qtyBtn" onClick={() => onUpdateQuantity(item, 1)}>+</button>
                          <button className="removeBtn" onClick={() => onRemoveItem(item)}>Remove</button>
                        </div>
                      </div>
                      <div className="cartItemTotal">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ─── Coupon Input ─── */}
                <div className="couponSection">
                  <label className="couponLabel">Have a coupon?</label>
                  {couponState ? (
                    <div className="couponApplied">
                      <div className="couponAppliedInfo">
                        <span className="couponTag">🏷 {couponState.code}</span>
                        <span className="couponSaving">
                          You save ₹{discountAmount.toLocaleString('en-IN')}
                          {couponState.description && ` — ${couponState.description}`}
                        </span>
                      </div>
                      <button className="removeCouponBtn" onClick={removeCoupon}>✕ Remove</button>
                    </div>
                  ) : (
                    <div className="couponInputRow">
                      <input
                        className="couponInput"
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        maxLength={20}
                      />
                      <button
                        className="couponApplyBtn"
                        onClick={() => handleValidateCoupon(couponCode)}
                        disabled={couponLoading || couponCode.length < 3}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && <div className="couponError">⚠ {couponError}</div>}
                </div>

                {/* ─── Order Summary ─── */}
                <div className="cartSummary">
                  <div className="summaryRow">
                    <span>Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="summaryRow discount">
                      <span>Coupon Discount ({couponState?.code})</span>
                      <span>− ₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="summaryRow">
                    <span>Delivery</span>
                    <span className={shippingFee === 0 ? 'freeShipping' : ''}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="freeShippingHint">
                      Add ₹{(SHIPPING_THRESHOLD - subtotal).toLocaleString('en-IN')} more for free delivery
                    </div>
                  )}
                  <div className="summaryRow total">
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="savingsHighlight">
                      🎉 You're saving ₹{discountAmount.toLocaleString('en-IN')} on this order!
                    </div>
                  )}
                </div>

                {/* ─── Proceed Button ─── */}
                <button
                  className="checkoutBtn"
                  onClick={() => {
                    if (!user) { onAuthRequest(); return; }
                    setView('checkout');
                  }}
                >
                  Proceed to Checkout — ₹{total.toLocaleString('en-IN')}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Checkout View ── */}
        {view === 'checkout' && (
          <div className="checkoutContent">
            <form className="checkoutForm" onSubmit={handleCheckout}>

              {/* Saved Address Selector */}
              {savedAddresses.length > 0 && (
                <div className="savedAddrSection">
                  <label className="checkoutLabel">Use a saved address</label>
                  <div className="savedAddrList">
                    {savedAddresses.map((addr) => (
                      <label key={addr._id} className={`savedAddrOption ${selectedSavedAddr === addr._id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="savedAddr"
                          value={addr._id}
                          checked={selectedSavedAddr === addr._id}
                          onChange={() => handleSelectSavedAddress(addr._id)}
                        />
                        <div className="savedAddrOptionContent">
                          <strong>{addr.label} — {addr.fullName}</strong>
                          <span>{addr.line1}, {addr.city} - {addr.postalCode}</span>
                        </div>
                      </label>
                    ))}
                    <label className={`savedAddrOption ${selectedSavedAddr === 'new' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="savedAddr"
                        value="new"
                        checked={selectedSavedAddr === 'new'}
                        onChange={() => { setSelectedSavedAddr('new'); setAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' }); }}
                      />
                      <div className="savedAddrOptionContent">
                        <strong>+ Use a different address</strong>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Shipping Details Form */}
              <div className="checkoutSection">
                <h3 className="checkoutSectionTitle">📍 Delivery Details</h3>
                <div className="checkoutGrid">
                  <div className="checkoutField">
                    <label className="checkoutLabel">Full Name *</label>
                    <input
                      required
                      placeholder="Recipient full name"
                      value={address.fullName}
                      onChange={(e) => setField('fullName', e.target.value)}
                    />
                  </div>
                  <div className="checkoutField">
                    <label className="checkoutLabel">Phone *</label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={address.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                    />
                  </div>
                  <div className="checkoutField full-width">
                    <label className="checkoutLabel">Address Line 1 *</label>
                    <input
                      required
                      placeholder="House / Flat / Building No."
                      value={address.line1}
                      onChange={(e) => setField('line1', e.target.value)}
                    />
                  </div>
                  <div className="checkoutField full-width">
                    <label className="checkoutLabel">Address Line 2</label>
                    <input
                      placeholder="Street / Area / Landmark (optional)"
                      value={address.line2}
                      onChange={(e) => setField('line2', e.target.value)}
                    />
                  </div>
                  <div className="checkoutField">
                    <label className="checkoutLabel">City *</label>
                    <input required placeholder="City" value={address.city} onChange={(e) => setField('city', e.target.value)} />
                  </div>
                  <div className="checkoutField">
                    <label className="checkoutLabel">State</label>
                    <input placeholder="State" value={address.state} onChange={(e) => setField('state', e.target.value)} />
                  </div>
                  <div className="checkoutField">
                    <label className="checkoutLabel">PIN Code *</label>
                    <input required placeholder="6-digit PIN" value={address.postalCode} onChange={(e) => setField('postalCode', e.target.value)} />
                  </div>
                  <div className="checkoutField">
                    <label className="checkoutLabel">Country *</label>
                    <input required placeholder="Country" value={address.country} onChange={(e) => setField('country', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="checkoutSection">
                <h3 className="checkoutSectionTitle">💳 Payment Method</h3>
                <div className="paymentOption selected">
                  <span className="paymentIcon">💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <span>Pay when your order arrives</span>
                  </div>
                  <span className="paymentCheck">✓</span>
                </div>
              </div>

              {/* Final Order Summary */}
              <div className="checkoutSection">
                <h3 className="checkoutSectionTitle">📋 Order Summary</h3>
                <div className="checkoutSummaryCompact">
                  {cart.map((item) => (
                    <div key={item._id || item.id} className="checkoutItemRow">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="checkoutDivider" />
                  <div className="checkoutItemRow">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="checkoutItemRow discount">
                      <span>Coupon ({couponState?.code})</span>
                      <span>− ₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="checkoutItemRow">
                    <span>Delivery</span>
                    <span className={shippingFee === 0 ? 'freeShipping' : ''}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>
                  <div className="checkoutDivider" />
                  <div className="checkoutItemRow totalRow">
                    <span>Grand Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {checkoutError && <div className="checkoutError">⚠ {checkoutError}</div>}

              <button type="submit" className="placeOrderBtn" disabled={submitting}>
                {submitting ? 'Placing Order...' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
