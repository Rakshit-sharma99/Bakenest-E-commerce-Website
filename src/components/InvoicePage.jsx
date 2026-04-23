import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './InvoicePage.css';

/* ── SVG Icons ───────────────────────────────────────────────────── */
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

const STATUS_BADGE = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  accepted:   { bg: '#dbeafe', color: '#1e40af' },
  processing: { bg: '#ede9fe', color: '#5b21b6' },
  shipped:    { bg: '#cffafe', color: '#155e75' },
  delivered:  { bg: '#d1fae5', color: '#065f46' },
  rejected:   { bg: '#fee2e2', color: '#991b1b' },
};

/* ══════════════════════════════════════════════════════════════════
   InvoicePage
   Props:
     orderId  — MongoDB order _id string
     onBack   — callback to go back
     isAdmin  — optional: uses admin endpoint
════════════════════════════════════════════════════════════════════ */
export default function InvoicePage({ orderId, onBack, isAdmin = false }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const printRef            = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    const endpoint = isAdmin
      ? `/invoice/admin/${orderId}`
      : `/invoice/${orderId}`;

    api.request(endpoint)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load invoice.'))
      .finally(() => setLoading(false));
  }, [orderId, isAdmin]);

  const handlePrint = () => window.print();

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="inv-shell">
        <div className="inv-loader">
          <div className="inv-spinner" />
          <p>Generating invoice…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="inv-shell">
        <div className="inv-error-box">
          <span className="inv-error-icon">⚠️</span>
          <h2>Could not load invoice</h2>
          <p>{error}</p>
          <button className="inv-back-btn" onClick={onBack}>
            <IconArrowLeft /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { invoice, order, user, company } = data;
  const statusStyle = STATUS_BADGE[order.status] || { bg: '#f3f4f6', color: '#374151' };

  /* ── Address formatter ── */
  const addr = order.shippingAddress;
  const addrLines = [
    addr.fullName,
    addr.phone,
    addr.line1 + (addr.line2 ? `, ${addr.line2}` : ''),
    `${addr.city}${addr.state ? `, ${addr.state}` : ''} – ${addr.postalCode}`,
    addr.country,
  ].filter(Boolean);

  const lineSubtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <div className="inv-shell">
      {/* ── Screen-only toolbar ── */}
      <div className="inv-toolbar no-print">
        <button className="inv-back-btn" onClick={onBack}>
          <IconArrowLeft /> Back to Orders
        </button>
        <button className="inv-download-btn" onClick={handlePrint}>
          <IconDownload /> Download PDF
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          INVOICE DOCUMENT — this section is what gets printed
      ══════════════════════════════════════════════════════════════ */}
      <div className="inv-document" ref={printRef}>

        {/* ── HEADER ── */}
        <header className="inv-header">
          <div className="inv-company-block">
            {/* Logo mark */}
            <div className="inv-logo-mark">
              <span className="inv-logo-icon">🧁</span>
              <div className="inv-logo-text">
                <span className="inv-logo-name">BakeNest</span>
                <span className="inv-logo-tagline">{company.tagline}</span>
              </div>
            </div>
            <div className="inv-company-details">
              <p>{company.address}</p>
              <p>📞 {company.phone} &nbsp;|&nbsp; ✉️ {company.email}</p>
              <p>{company.gstin} &nbsp;|&nbsp; 🌐 {company.website}</p>
            </div>
          </div>

          <div className="inv-title-block">
            <h1 className="inv-title">TAX INVOICE</h1>
            <table className="inv-meta-table">
              <tbody>
                <tr>
                  <th>Invoice No.</th>
                  <td>{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <th>Invoice Date</th>
                  <td>{fmtDate(invoice.createdAt)}</td>
                </tr>
                <tr>
                  <th>Order ID</th>
                  <td>#{String(order._id).slice(-10).toUpperCase()}</td>
                </tr>
                <tr>
                  <th>Order Date</th>
                  <td>{fmtDate(order.createdAt)}</td>
                </tr>
                <tr>
                  <th>Payment</th>
                  <td>{order.paymentMethod || 'COD'}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    <span
                      className="inv-status-badge"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        <div className="inv-divider" />

        {/* ── BILL TO / SHIP TO ── */}
        <section className="inv-parties">
          <div className="inv-party-block">
            <h3 className="inv-party-label">Bill To</h3>
            <p className="inv-party-name">{user.name || addr.fullName}</p>
            {user.email && <p>{user.email}</p>}
            {user.phone && <p>{user.phone}</p>}
          </div>
          <div className="inv-party-block">
            <h3 className="inv-party-label">Ship To</h3>
            {addrLines.map((line, i) => (
              <p key={i} className={i === 0 ? 'inv-party-name' : ''}>{line}</p>
            ))}
          </div>
        </section>

        <div className="inv-divider" />

        {/* ── PRODUCT TABLE ── */}
        <section className="inv-items-section">
          <table className="inv-items-table">
            <thead>
              <tr>
                <th className="inv-col-sno">#</th>
                <th className="inv-col-product">Product</th>
                <th className="inv-col-qty">Qty</th>
                <th className="inv-col-price">Unit Price</th>
                <th className="inv-col-total">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'inv-row-even' : ''}>
                  <td className="inv-col-sno">{idx + 1}</td>
                  <td className="inv-col-product">
                    <div className="inv-product-cell">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="inv-item-img" />
                      )}
                      <span className="inv-item-name">{item.name}</span>
                    </div>
                  </td>
                  <td className="inv-col-qty">{item.quantity}</td>
                  <td className="inv-col-price">{fmt(item.unitPrice)}</td>
                  <td className="inv-col-total">{fmt(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── PRICING SUMMARY ── */}
        <section className="inv-summary-section">
          <div className="inv-summary-spacer" />
          <div className="inv-summary-box">
            <div className="inv-summary-row">
              <span>Subtotal</span>
              <span>{fmt(lineSubtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="inv-summary-row inv-discount">
                <span>
                  Discount
                  {order.couponCode && (
                    <span className="inv-coupon-tag"> ({order.couponCode})</span>
                  )}
                </span>
                <span>- {fmt(order.discount)}</span>
              </div>
            )}
            <div className="inv-summary-row">
              <span>Delivery Charges</span>
              <span>{order.shippingFee > 0 ? fmt(order.shippingFee) : 'FREE'}</span>
            </div>
            <div className="inv-divider inv-summary-divider" />
            <div className="inv-summary-row inv-total-row">
              <span>Grand Total</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>
        </section>

        <div className="inv-divider inv-section-gap" />

        {/* ── FOOTER ── */}
        <footer className="inv-footer">
          <div className="inv-footer-thank">
            <div className="inv-footer-icon">🎉</div>
            <div>
              <h3>Thank you for shopping with BakeNest!</h3>
              <p>We hope your baking journey is filled with joy, creativity, and delicious results.</p>
            </div>
          </div>

          <div className="inv-footer-terms">
            <h4>Terms & Conditions</h4>
            <ol>
              <li>All items are subject to availability. Prices inclusive of applicable taxes where stated.</li>
              <li>Returns & exchanges accepted within 7 days of delivery for unused and sealed products.</li>
              <li>This is a computer-generated invoice and does not require a physical signature.</li>
              <li>For support, reach us at {company.email} or call {company.phone}.</li>
            </ol>
          </div>

          <div className="inv-footer-brand">
            <span className="inv-footer-logo">BakeNest</span>
            <span>{company.website}</span>
          </div>
        </footer>

      </div>
      {/* end .inv-document */}
    </div>
  );
}
