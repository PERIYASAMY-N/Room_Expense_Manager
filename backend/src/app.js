const express = require('express');
const cors = require('cors');

const app = express();

// CORS — allow FRONTEND_URL in production (comma-separated list supported)
// In local dev, allow all common Vite ports (5173–5175) and 3000
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000'
      ];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Render health checks, mobile apps)
        if (!origin) return callback(null, true);
        // Allow any vercel.app subdomain (covers preview deployments)
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: false // App uses Bearer tokens, not cookies
}));

app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const personalRoutes = require('./routes/personalRoutes');
const roomRoutes = require('./routes/roomRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

// API Mounts
app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms/:roomId/expenses', expenseRoutes);
app.use('/api/rooms/:roomId', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Room Expense Manager API is running' });
});

const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

module.exports = app;
