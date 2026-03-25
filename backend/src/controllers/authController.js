/**
 * controllers/authController.js
 * Controle de autenticação
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const AuthController = {

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: 'Email e senha são obrigatórios.' });
      }

      const db = getDb();
      const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1').get(email.toLowerCase().trim());

      if (!usuario) {
        return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
      }

      const senhaValida = bcrypt.compareSync(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
      }

      const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

      return res.json({
        sucesso: true,
        token,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, telefone: usuario.telefone, tipo: usuario.tipo }
      });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /**
   * POST /api/auth/registrar
   */
  async registrar(req, res) {
    try {
      const { nome, email, senha, telefone } = req.body;
      if (!nome || !email || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: 'Nome, email e senha são obrigatórios.' });
      }
      if (senha.length < 6) {
        return res.status(400).json({ sucesso: false, mensagem: 'Senha deve ter ao menos 6 caracteres.' });
      }

      const db = getDb();
      const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
      if (existe) {
        return res.status(409).json({ sucesso: false, mensagem: 'E-mail já cadastrado.' });
      }

      const senhaHash = bcrypt.hashSync(senha, 10);
      const result = db.prepare(`
        INSERT INTO usuarios (nome, email, senha, telefone, tipo) VALUES (?, ?, ?, ?, 'cliente')
      `).run(nome.trim(), email.toLowerCase().trim(), senhaHash, telefone || null);

      const novoUsuario = db.prepare('SELECT id, nome, email, telefone, tipo FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
      const payload = { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, tipo: novoUsuario.tipo };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

      return res.status(201).json({ sucesso: true, token, usuario: novoUsuario });
    } catch (err) {
      console.error('[Auth] Registrar error:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /**
   * GET /api/auth/perfil
   */
  async perfil(req, res) {
    try {
      const db = getDb();
      const usuario = db.prepare('SELECT id, nome, email, telefone, tipo, criado_em FROM usuarios WHERE id = ?').get(req.usuario.id);
      if (!usuario) return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
      return res.json({ sucesso: true, usuario });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  }
};

module.exports = AuthController;
