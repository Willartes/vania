/**
 * controllers/usuariosController.js
 * CRUD de Usuários (Admin)
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('../database');

const UsuariosController = {

  /** GET /api/usuarios — admin: lista todos clientes */
  listar(req, res) {
    try {
      const db = getDb();
      const { tipo, ativo } = req.query;
      let query = 'SELECT id, nome, email, telefone, tipo, ativo, criado_em FROM usuarios WHERE 1=1';
      const params = [];

      if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
      if (ativo !== undefined) { query += ' AND ativo = ?'; params.push(ativo === 'true' ? 1 : 0); }
      query += ' ORDER BY nome';

      const usuarios = db.prepare(query).all(...params);
      return res.json({ sucesso: true, dados: usuarios });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/usuarios/:id */
  buscarPorId(req, res) {
    try {
      const db = getDb();
      const usuario = db.prepare('SELECT id, nome, email, telefone, tipo, ativo, criado_em FROM usuarios WHERE id = ?').get(req.params.id);
      if (!usuario) return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
      return res.json({ sucesso: true, dados: usuario });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** PUT /api/usuarios/:id */
  atualizar(req, res) {
    try {
      const db = getDb();
      const existe = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
      if (!existe) return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });

      const { nome, telefone, senha, ativo } = req.body;
      const senhaHash = senha ? bcrypt.hashSync(senha, 10) : null;

      db.prepare(`
        UPDATE usuarios SET
          nome = COALESCE(?, nome),
          telefone = COALESCE(?, telefone),
          senha = COALESCE(?, senha),
          ativo = COALESCE(?, ativo),
          atualizado_em = datetime('now','localtime')
        WHERE id = ?
      `).run(nome || null, telefone || null, senhaHash, ativo !== undefined ? (ativo ? 1 : 0) : null, req.params.id);

      return res.json({ sucesso: true, mensagem: 'Usuário atualizado.' });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** DELETE /api/usuarios/:id — soft delete */
  remover(req, res) {
    try {
      const db = getDb();
      db.prepare(`UPDATE usuarios SET ativo = 0 WHERE id = ?`).run(req.params.id);
      return res.json({ sucesso: true, mensagem: 'Usuário desativado.' });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  }
};

module.exports = UsuariosController;
