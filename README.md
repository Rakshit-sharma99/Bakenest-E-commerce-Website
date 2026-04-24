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

## Deployment

### Backend (Render)
1. Set Environment Variables: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
2. Build Command: `cd backend && npm install`
3. Start Command: `cd backend && npm start`

### Frontend (Vercel)
1. Set Environment Variable: `VITE_API_URL` (point to your Render backend URL).
2. Framework Preset: Vite.
3. Root Directory: `.` (Project Root).

---

## Production readiness notes

- Replace default admin credentials and JWT secret
- Set strict CORS `CLIENT_URL` values
- Use a managed MongoDB cluster and secure networking
- **Important**: This project uses local storage for images (`backend/uploads`). For production on platforms like Render/Heroku, you should configure a persistent disk or migrate to Cloudinary/AWS S3 to prevent data loss on redeploys.
- Add CI with lint/build/test checks before deployment
