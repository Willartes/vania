/**
 * controllers/servicosController.js
 * CRUD de Serviços
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const { getDb } = require('../database');

const ServicosController = {

  /** GET /api/servicos — lista todos (público) */
  listar(req, res) {
    try {
      const db = getDb();
      const { ativo, categoria } = req.query;
      let query = 'SELECT * FROM servicos WHERE 1=1';
      const params = [];

      if (ativo !== undefined) { query += ' AND ativo = ?'; params.push(ativo === 'true' ? 1 : 0); }
      if (categoria) { query += ' AND categoria = ?'; params.push(categoria); }

      query += ' ORDER BY categoria, nome';
      const servicos = db.prepare(query).all(...params);
      return res.json({ sucesso: true, dados: servicos });
    } catch (err) {
      console.error('[Servicos] Listar:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/servicos/:id */
  buscarPorId(req, res) {
    try {
      const db = getDb();
      const servico = db.prepare('SELECT * FROM servicos WHERE id = ?').get(req.params.id);
      if (!servico) return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });
      return res.json({ sucesso: true, dados: servico });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** POST /api/servicos — admin only */
  criar(req, res) {
    try {
      const { nome, descricao, valor, duracao_min, categoria, imagem_url } = req.body;
      if (!nome || valor === undefined) {
        return res.status(400).json({ sucesso: false, mensagem: 'Nome e valor são obrigatórios.' });
      }
      const db = getDb();
      const result = db.prepare(`
        INSERT INTO servicos (nome, descricao, valor, duracao_min, categoria, imagem_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(nome.trim(), descricao || null, parseFloat(valor), duracao_min || 60, categoria || null, imagem_url || null);

      const novo = db.prepare('SELECT * FROM servicos WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({ sucesso: true, dados: novo });
    } catch (err) {
      console.error('[Servicos] Criar:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** PUT /api/servicos/:id — admin only */
  atualizar(req, res) {
    try {
      const db = getDb();
      const existe = db.prepare('SELECT id FROM servicos WHERE id = ?').get(req.params.id);
      if (!existe) return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });

      const { nome, descricao, valor, duracao_min, categoria, imagem_url, ativo } = req.body;
      db.prepare(`
        UPDATE servicos SET
          nome = COALESCE(?, nome),
          descricao = COALESCE(?, descricao),
          valor = COALESCE(?, valor),
          duracao_min = COALESCE(?, duracao_min),
          categoria = COALESCE(?, categoria),
          imagem_url = COALESCE(?, imagem_url),
          ativo = COALESCE(?, ativo),
          atualizado_em = datetime('now','localtime')
        WHERE id = ?
      `).run(nome || null, descricao || null, valor ? parseFloat(valor) : null,
             duracao_min || null, categoria || null, imagem_url || null,
             ativo !== undefined ? (ativo ? 1 : 0) : null, req.params.id);

      const atualizado = db.prepare('SELECT * FROM servicos WHERE id = ?').get(req.params.id);
      return res.json({ sucesso: true, dados: atualizado });
    } catch (err) {
      console.error('[Servicos] Atualizar:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** DELETE /api/servicos/:id — admin only (soft delete) */
  remover(req, res) {
    try {
      const db = getDb();
      const existe = db.prepare('SELECT id FROM servicos WHERE id = ?').get(req.params.id);
      if (!existe) return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });

      db.prepare(`UPDATE servicos SET ativo = 0, atualizado_em = datetime('now','localtime') WHERE id = ?`).run(req.params.id);
      return res.json({ sucesso: true, mensagem: 'Serviço desativado com sucesso.' });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/servicos/categorias */
  categorias(req, res) {
    try {
      const db = getDb();
      const cats = db.prepare('SELECT DISTINCT categoria FROM servicos WHERE ativo = 1 AND categoria IS NOT NULL ORDER BY categoria').all();
      return res.json({ sucesso: true, dados: cats.map(c => c.categoria) });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  }
};

module.exports = ServicosController;
