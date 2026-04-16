import { useState } from 'react';
import { api } from '../services/api';
import './CartOverlay.css';

export default function CartOverlay({ cart, onClose, onRemoveItem, onUpdateQuantity, user, onAuthRequest }) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [complete, setComplete] = useState(false);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Simplified, assuming no shipping or extra discount applied to cart yet

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      onAuthRequest();
      return;
    }

    setCheckingOut(true);
    try {
      const payload = {
        items: cart.map(c => ({
          product: c._id || c.id,
          name: c.name,
          imageUrl: c.imageUrl,
          quantity: c.quantity,
          unitPrice: c.price
        })),
        subtotal,
        total,
        shippingAddress: address
      };

      await api.request('/orders', { method: 'POST', body: JSON.stringify(payload) });
      setComplete(true);
      setTimeout(() => {
        onClose(true); // Signal success
      }, 2000);
    } catch (err) {
      alert(err.message || 'Checkout failed');
      setCheckingOut(false);
    }
  };

  return (
    <div className="cartOverlayBg">
      <div className="cartOverlayBox">
        <div className="cartHeader">
          <h2>Your Cart</h2>
          <button onClick={() => onClose(false)} className="closeCartBtn">✕</button>
        </div>

        {complete ? (
          <div className="cartComplete">
            <h3>Order Placed!</h3>
            <p>Thank you for your order.</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="cartEmpty">Your cart is empty.</div>
        ) : (
          <div className="cartContent">
            <div className="cartItems">
              {cart.map((item) => (
                <div key={item._id || item.id} className="cartItem">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
                  <div className="cartItemInfo">
                    <h4>{item.name}</h4>
                    <p>₹{Number(item.price).toFixed(2)}</p>
                    <div className="cartItemActions">
                      <button onClick={() => onUpdateQuantity(item, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item, 1)}>+</button>
                      <button className="removeBtn" onClick={() => onRemoveItem(item)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cartSummary">
              <div className="subtotalRow">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <form className="checkoutForm" onSubmit={handleCheckout}>
              <h3>Shipping Details</h3>
              <input placeholder="Full Name" required value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} />
              <input placeholder="Phone" required value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} />
              <input placeholder="Address Line 1" required value={address.line1} onChange={e => setAddress({...address, line1: e.target.value})} />
              <div className="formRow">
                <input placeholder="City" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                <input placeholder="Zip Code" required value={address.postalCode} onChange={e => setAddress({...address, postalCode: e.target.value})} />
              </div>
              <input placeholder="Country" required value={address.country} onChange={e => setAddress({...address, country: e.target.value})} />
              
              <button type="submit" disabled={checkingOut} className="checkoutBtn">
                {checkingOut ? 'Processing...' : `Checkout - ₹${total.toFixed(2)}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
