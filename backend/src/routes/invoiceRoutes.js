import express from 'express';
import { getInvoice, getInvoiceAdmin } from '../controllers/invoiceController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

// ── User: view their own order invoice ──────────────────────────────────────
router.get('/:orderId', protect, getInvoice);

// ── Admin: view any order invoice ───────────────────────────────────────────
router.get('/admin/:orderId', protect, adminOnly, getInvoiceAdmin);

export default router;
