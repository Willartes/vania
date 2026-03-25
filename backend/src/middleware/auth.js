/**
 * middleware/auth.js
 * Middleware de autenticação JWT
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const jwt = require('jsonwebtoken');

/**
 * Verifica se o token JWT é válido
 */
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ sucesso: false, mensagem: 'Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
  }
}

/**
 * Verifica se o usuário autenticado é admin
 */
function apenasAdmin(req, res, next) {
  if (!req.usuario || req.usuario.tipo !== 'admin') {
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado. Apenas administradores.' });
  }
  next();
}

/**
 * Verifica se é o próprio usuário ou admin
 */
function proprietarioOuAdmin(req, res, next) {
  const idParam = parseInt(req.params.id);
  if (req.usuario.tipo === 'admin' || req.usuario.id === idParam) {
    return next();
  }
  return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
}

module.exports = { autenticar, apenasAdmin, proprietarioOuAdmin };
