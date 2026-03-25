/**
 * server.js — Vania Herculano Biomedicina Estética — API
 * © 2025 William Rodrigues da Silva
 */
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const routes  = require('./routes');
const { getDb } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Inicializa banco ──────────────────────────────────────────
getDb();
console.log('✅ Banco SQLite inicializado');

// ── CORS — aceita localhost e Vercel ─────────────────────────
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://127.0.0.1:4200',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (Postman, curl, mobile)
    if (!origin) return callback(null, true);
    // Permite qualquer origem em desenvolvimento
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // Em produção, verifica whitelist ou domínio Vercel
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }
    callback(new Error('Bloqueado pelo CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── Middlewares ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Log em desenvolvimento ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Rotas ─────────────────────────────────────────────────────
app.use('/api', routes);

// ── Rota raiz ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    app: 'Vania Herculano API',
    version: '1.0.0',
    status: 'running',
    health: '/api/health'
  });
});

// ── Erro global ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    sucesso: false,
    mensagem: err.message || 'Erro interno do servidor.'
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌸 Vania Herculano API → http://localhost:${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
