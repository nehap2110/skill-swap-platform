// src/app.js
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/apiResponse');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes   = require('./routes/auth.routes');
const userRoutes   = require('./routes/user.routes');
const swapRoutes   = require('./routes/swap.routes');
const reviewRoutes = require('./routes/review.routes');
const skillRoutes  = require('./routes/skill.routes');
const chatRoutes = require('./routes/chat.routes');
const contactRoutes = require('./routes/contact.routes');

// ─── App init ─────────────────────────────────────────────────────────────────
const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [env.CLIENT_URL];
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // Reject oversized payloads
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.isDev) app.use(morgan('dev'));
if (env.isProd) app.use(morgan('combined'));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running 🚀' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/swaps',   swapRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/skills',  skillRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/contact', contactRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
// app.all('*', (req, res) => {
//   sendError(res, {
//     statusCode: 404,
//     message: `Route ${req.method} ${req.originalUrl} not found.`,
//   });
// });

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;