# BakeNest E-commerce (Storefront + Secure Admin Dashboard)

This project now includes a complete full-stack admin management system for a bakery e-commerce website:

- React storefront and admin UI
- Node.js + Express API
- MongoDB models for users, products, orders, coupons
- Admin-only protected routes with JWT + role-based access control
- Image upload support for product media
- Real-time dashboard/storefront refresh using Socket.IO

## Key Features

### Admin capabilities

- Product management: add, edit, delete, image upload, stock, and pricing
- Discount/offer management: create coupons, enable/disable dynamically
- Order management: view all orders, accept/reject, status transitions
- User management: list users and delivery/contact details
- Search/filter support for products and orders

### Security

- JWT authentication
- Admin-only access middleware for sensitive APIs
- Rate limiting and `helmet` hardening

### Real-time updates

- Product/order/coupon updates emit Socket.IO events
- Storefront and dashboard auto-refresh on relevant events

## Project Structure

- `src/` → React frontend + admin dashboard components
- `backend/` → Express API, Mongo models/controllers/routes/middleware

## Environment setup

### Frontend (`.env`)

Create `.env` in project root from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bakenest
JWT_SECRET=replace-with-strong-random-secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@bakenest.com
ADMIN_PASSWORD=StrongAdmin@123
```

## Install dependencies

From project root:

```bash
npm install
```

From backend folder:

```bash
cd backend
npm install
```

## Run locally

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
npm run dev
```

## Seed admin user

After backend env is configured:

```bash
cd backend
npm run seed:admin
```

## Access URLs

- Storefront: `http://localhost:5173`
- Admin login: `http://localhost:5173/admin`
- API health: `http://localhost:5000/api/health`

## Production readiness notes

- Replace default admin credentials and JWT secret
- Set strict CORS `CLIENT_URL` values
- Use a managed MongoDB cluster and secure networking
- Prefer cloud object storage (S3/Cloudinary) over local file uploads for scale
- Add CI with lint/build/test checks before deployment
