# 🍔 MBM Canteen Hub

A modern full-stack MERN application built to digitize and simplify the campus canteen experience at MBM University.

MBM Canteen Hub offers a fast Swiggy-style ordering system with OTP authentication, live order tracking, smart inventory management, and a real-time admin dashboard.

---

# 🚀 Features

## 👨‍🎓 Student Side

* OTP-based phone authentication
* Auto registration for new users
* Permanent pickup code for every student
* Browse categorized menu items
* Real-time stock availability
* Cart and seamless checkout flow
* Live order status tracking
* Fully responsive mobile-first UI

## 🛠️ Admin Side

* Secure admin authentication
* Role-based access control (RBAC)
* Real-time order dashboard using Socket.io
* Instant order alerts
* Inventory & stock management
* Automatic “Sold Out” handling
* Twilio SMS notifications for new orders

---

# 🏗️ Tech Stack

## Frontend

* React 19
* Vite 7
* React Router DOM
* Context API
* Custom CSS Design System

## Backend

* Node.js
* Express.js
* Socket.io
* JWT Authentication
* Bcrypt.js
* Twilio SDK

## Database

* MongoDB Atlas
* Mongoose ODM

---

# 🎨 UI Highlights

* Modern dark theme
* Glassmorphism design
* Neon-inspired accents
* Mobile-first responsive layout
* Smooth and optimized user experience

---

# 📂 Project Structure

```bash
MBM-Canteen-Hub/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── routes/
│
└── README.md
```

---

# ⚡ Real-Time Features

* Live admin dashboard updates
* Instant order notifications
* Real-time order status synchronization

Powered by Socket.io.

---

# 📱 SMS Notification System

Integrated with Twilio to send instant SMS alerts for every new order placed.

---

# 🧠 Performance & Reliability

* Fast development with Vite HMR
* Optimized production build
* Inventory validation before orders
* OTP expiry handling
* Robust error management

---

# 🛠️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone <your-repository-url>
cd MBM-Canteen-Hub
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

Run backend server:

```bash
npm run dev
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# 🌐 Deployment

## Frontend

* Vercel

## Backend

* Render

## Database

* MongoDB Atlas

---

# 🔮 Future Improvements

* Razorpay / Stripe integration
* QR-based pickup system
* Push notifications
* Coupon system
* PWA support
* Analytics dashboard
* AI-based demand prediction

---

# 👨‍💻 Author

**Bhavesh**
BE Information Technology
MBM University

---
