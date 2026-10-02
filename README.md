# LifeLink – Location-Based Blood Donor & Blood Request Management Portal

**LifeLink** is a standalone, modern, responsive full-stack web application designed to connect people who need blood with eligible blood donors based on blood group compatibility, accurate geographical location (Haversine formula), and donor availability.

The portal is developed independently and features an architectural integration interface for future connection to the **Hospital Geofence Attendance System** through the Doctor Dashboard.

---

## 🩸 Core Highlights

- **Single User Account Model**: Registered users can act seamlessly as both a Blood Donor and a Blood Requester without separate accounts.
- **Strict 18+ Age Validation**: Calculates exact age using complete date of birth (day, month, year) on both frontend and backend.
- **Email OTP Verification**: Secure, time-limited, rate-limited OTP verification for registration and password resets with bcrypt hashing.
- **GPS Location Detection & Manual Entry**: Geolocation API with reverse geocoding (OpenStreetMap) and manual coordinate fallback.
- **Accurate Haversine Distance Engine**: Computes true great-circle distance in kilometres with customizable search radii (5 km to 100+ km).
- **Clinical Red-Blood-Cell (RBC) Compatibility Matrix**: Strictly filters compatible donor blood types according to transfusion medicine rules.
- **Multi-Donor Invitations**: Requesters can send individual invitation notifications to multiple eligible donors in one action.
- **Atomic Single-Donor Acceptance**: When one donor accepts, the request is matched atomically, other invitations are closed, and donor contact information is safely revealed to the requester.
- **Automated 6-Month Donation Cooldown**: Acceptance automatically starts a configurable 6-month waiting period and locks donor availability to protect health.
- **Mistaken Acceptance & Cancellation Workflow**: Donors can report accidental acceptances; requesters can review, approve, reverse donation records, and restore donor eligibility.
- **Dual Notification System**: Responsive branded HTML emails + real-time in-app notification center.
- **Complete Auditing**: Tracks all acceptance, cancellation, and cooldown state changes.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router v7 |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Express Rate Limit |
| **Database** | MongoDB & Mongoose (with 2dsphere indexes and geospatial schemas) |
| **Email Service** | Nodemailer (supports SMTP / Ethereal / In-Memory audit log) |
| **Location & Maps** | Browser Geolocation API, OpenStreetMap Reverse Geocoding |
| **Testing** | Jest, Supertest (13 automated unit & integration tests) |

---

## 📁 Repository Structure

```
lifelink/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection & index sync
│   │   ├── controllers/     # Auth, Donor, Request, Invitation, Notification, Donation
│   │   ├── middleware/      # JWT protection, Express rate limiting
│   │   ├── models/          # User, BloodRequest, Invitation, DonationHistory, Notification, OTPRecord, AuditLog
│   │   ├── routes/          # Express REST API routes
│   │   ├── utils/           # Haversine distance, RBC compatibility, age calc, cooldown, email service
│   │   ├── app.js           # Express application setup & middleware
│   │   └── server.js        # Server listener
│   ├── tests/
│   │   └── lifelink.test.js # Jest integration test suite (13 tests)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client with token interceptor
│   │   ├── components/      # Navbar, Sidebar, Layout, LocationPicker, StatusBadge, CompatibilityChartModal
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── pages/           # Landing, Login, Register, OTPVerify, ForgotPassword, Dashboard, RequestBlood, FindDonors, MyRequests, Invitations, DonationHistory, RequestHistory, DonorAvailability, Profile, Notifications, IntegrationGuide
│   │   ├── App.jsx          # Protected route router
│   │   ├── main.jsx
│   │   └── index.css        # Tailwind v4 configuration
│   ├── vite.config.js
│   └── package.json
├── INTEGRATION.md           # Doctor Dashboard integration specification
├── package.json             # Root unified runner scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally or a MongoDB Atlas connection string

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables (or use default development settings)
cp .env.example .env

# Seed the database with demo users (Suriya, Ranjith, etc.)
npm run seed

# Run the backend test suite
npm test

# Start the backend development server
npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Start the Vite development server
npm run dev
# Portal accessible on http://localhost:5173
```

---

## 🧪 Pre-Seeded Demo Scenario (Section 9 & Section 25)

The database seed command (`npm run seed` in `backend`) provisions the exact test scenario outlined in the requirements:

| User | Email | Password | Role & Blood Group | Location | Test Purpose |
|---|---|---|---|---|---|
| **Suriya** | `suriya@example.com` | `Password@123` | Requester &bull; O+ | Ramapuram, Chennai | Initiates O+ blood requests |
| **Ranjith** | `ranjith@example.com` | `Password@123` | Donor &bull; O+ | Tambaram, Chennai (~14.5 km) | Matches request; accepts invitation; starts cooldown |
| **Vignesh** | `vignesh@example.com` | `Password@123` | Donor &bull; O- | Guindy, Chennai (~7 km) | Tests Universal RBC Donor compatibility |
| **Priya** | `priya@example.com` | `Password@123` | Donor &bull; A+ | Chennai Central (~13 km) | Excluded (Incompatible with O+ request) |
| **Divya** | `divya@example.com` | `Password@123` | Donor &bull; O+ | Kanchipuram (~62 km) | Excluded when searching within 50 km radius |
| **Arun** | `arun@example.com` | `Password@123` | Donor &bull; O+ | Porur, Chennai | Excluded (In 6-month donation cooldown) |

---

## 🧪 Running Automated Tests

Run the comprehensive test suite verifying blood compatibility, distance calculations, age boundary checks, OTP flow, atomic single-donor acceptance, cooldown locks, and mistaken cancellation workflows:

```bash
cd backend
npm test
```

All 13 integration tests run in band and verify full end-to-end functionality.

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/send-otp` – Validates details, checks 18+ age, sends email OTP
- `POST /api/auth/verify-otp` – Verifies OTP and activates account
- `POST /api/auth/login` – Logs in user with email & password, returns JWT
- `POST /api/auth/forgot-password` – Sends password reset OTP
- `POST /api/auth/reset-password` – Validates OTP and updates password
- `GET /api/auth/me` – Returns authenticated user session & unread counts

### Donor Management
- `GET /api/donors/profile` – Retrieves profile details & donation stats
- `PUT /api/donors/profile` – Updates user profile and base coordinates
- `GET /api/donors/availability` – Returns Active/Inactive and cooldown state
- `PUT /api/donors/availability` – Toggles status (prevents activation if in cooldown)
- `GET /api/donors/eligibility` – Detailed breakdown of donation eligibility

### Blood Requests & Matching
- `POST /api/requests/search-donors` – Searches compatible donors within custom radius (km)
- `POST /api/requests` – Creates new blood request
- `GET /api/requests/my` – Retrieves all requests created by user
- `GET /api/requests/:id` – Retrieves request, invitations list, and accepted donor contact
- `POST /api/requests/:id/invitations` – Sends invitations to multiple selected donors
- `POST /api/requests/:id/cancel` – Cancels blood request and closes pending invitations
- `GET /api/requests/history` – Complete request archive

### Invitations & Acceptance Workflow
- `GET /api/invitations/my` – Retrieves incoming requests for donor
- `POST /api/invitations/:id/accept` – Atomically accepts request, starts 6-month cooldown, reveals contact to requester
- `POST /api/invitations/:id/decline` – Declines invitation
- `POST /api/invitations/:id/request-cancellation` – Reports accidental acceptance with reason
- `POST /api/invitations/:id/approve-cancellation` – Requester approves mistaken acceptance cancellation, restores donor cooldown
- `POST /api/invitations/:id/reject-cancellation` – Requester rejects cancellation

### Notifications & Donation History
- `GET /api/notifications` – Returns in-app alerts and unread count
- `PATCH /api/notifications/:id/read` – Marks notification as read
- `PATCH /api/notifications/read-all` – Marks all notifications as read
- `GET /api/donations/history` – Returns donation history records

---

## 🌐 Deployment Instructions

### Production Environment Variables (`.env`)
```ini
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lifelink?retryWrites=true&w=majority
JWT_SECRET=super_strong_production_secret_key_random_string
JWT_EXPIRES_IN=7d
COOLDOWN_MONTHS=6
APP_URL=https://lifelink.yourdomain.com
CORS_ORIGIN=https://lifelink.yourdomain.com

# SMTP Credentials
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM="LifeLink Blood Portal" <notifications@lifelink.yourdomain.com>
```

### Backend Deployment (Render / Railway / Docker)
1. Deploy `backend/` directory as a Node.js web service.
2. Set build command: `npm install`.
3. Set start command: `npm start`.
4. Configure environment variables in the host dashboard.

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Deploy `frontend/` directory.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Set `VITE_API_URL` environment variable pointing to the deployed backend URL.

---

## 📄 License
LifeLink is licensed under the ISC License.
