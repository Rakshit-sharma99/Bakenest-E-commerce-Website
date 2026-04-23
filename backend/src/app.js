// Import the Express framework for building the web application
import express from 'express';
// Import the Path module for handling and transforming file paths
import path from 'path';
// Import fileURLToPath to convert file URLs to file system paths (ESM compatibility)
import { fileURLToPath } from 'url';
// Import CORS middleware to enable Cross-Origin Resource Sharing
import cors from 'cors';
// Import Helmet middleware for securing the app by setting various HTTP headers
import helmet from 'helmet';
// Import Morgan middleware for logging HTTP requests
import morgan from 'morgan';
// Import express-rate-limit to prevent brute-force and DoS attacks
import rateLimit from 'express-rate-limit';
// Import Compression middleware to reduce the size of the response body
import compression from 'compression';

// Import authentication-related routes
import authRoutes from './routes/authRoutes.js';
// Import product-related routes
import productRoutes from './routes/productRoutes.js';
// Import order-related routes
import orderRoutes from './routes/orderRoutes.js';
// Import user-related routes
import userRoutes from './routes/userRoutes.js';
// Import coupon-related routes
import couponRoutes from './routes/couponRoutes.js';
// Import file upload-related routes
import uploadRoutes from './routes/uploadRoutes.js';
// Import review-related routes
import reviewRoutes from './routes/reviewRoutes.js';
// Import invoice-related routes
import invoiceRoutes from './routes/invoiceRoutes.js';
// Import custom error handling middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Determine the current file path (ESM specific)
const __filename = fileURLToPath(import.meta.url);
// Determine the current directory name (ESM specific)
const __dirname = path.dirname(__filename);

// Initialize the Express application instance
const app = express();

// Set up the allowed origins for CORS, defaulting to localhost:5173 if not specified
const corsOrigin = process.env.CLIENT_URL?.split(',').map((u) => u.trim()) || ['http://localhost:5173'];

// Use Helmet to enhance application security with various HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http://localhost:5001", "https:"],
    },
  },
}));
// Apply Gzip compression to reduce payload sizes for responses larger than 1KB
app.use(compression({ threshold: 1024 }));
// Enable CORS with the specified origins and support for credentials (cookies/tokens)
app.use(cors({ origin: corsOrigin, credentials: true }));
// Parse incoming requests with JSON payloads, limiting the size to 2MB
app.use(express.json({ limit: '2mb' }));
// Parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true }));
// Use Morgan in 'dev' mode for detailed request logging in the console
app.use(morgan('dev'));

// Apply rate limiting to all routes under /api to prevent abuse
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 1200, // Limit each IP to 1200 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })
);

// Define a simple health check route to verify the API's status
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'bakenest-api' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Mount the authentication routes on the /api/auth path
app.use('/api/auth', authRoutes);
// Mount the product routes on the /api/products path
app.use('/api/products', productRoutes);
// Mount the order routes on the /api/orders path
app.use('/api/orders', orderRoutes);
// Mount the user routes on the /api/users path
app.use('/api/users', userRoutes);
// Mount the coupon routes on the /api/coupons path
app.use('/api/coupons', couponRoutes);
// Mount the upload routes on the /api/uploads path
app.use('/api/uploads', uploadRoutes);
// Mount the review routes on the /api/reviews path
app.use('/api/reviews', reviewRoutes);
// Mount the invoice routes on the /api/invoice path
app.use('/api/invoice', invoiceRoutes);

// Register middleware to handle 404 Not Found errors
app.use(notFound);
// Register the global error handling middleware
app.use(errorHandler);

// Export the configured application instance for use in server.js
export default app;

