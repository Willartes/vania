/**
 * controllers/agendamentosController.js
 * Gestão de Agendamentos
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const { getDb } = require('../database');

const AgendamentosController = {

  /** GET /api/agendamentos — admin: todos; cliente: os seus */
  listar(req, res) {
    try {
      const db = getDb();
      const { status, data_inicio, data_fim, usuario_id } = req.query;
      const isAdmin = req.usuario.tipo === 'admin';

      let query = `
        SELECT 
          a.*,
          u.nome AS usuario_nome, u.email AS usuario_email, u.telefone AS usuario_telefone,
          s.nome AS servico_nome, s.valor AS servico_valor, s.duracao_min AS servico_duracao, s.categoria AS servico_categoria
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.usuario_id
        JOIN servicos s ON s.id = a.servico_id
        WHERE 1=1
      `;
      const params = [];

      if (!isAdmin) { query += ' AND a.usuario_id = ?'; params.push(req.usuario.id); }
      else if (usuario_id) { query += ' AND a.usuario_id = ?'; params.push(usuario_id); }

      if (status) { query += ' AND a.status = ?'; params.push(status); }
      if (data_inicio) { query += ' AND a.data >= ?'; params.push(data_inicio); }
      if (data_fim) { query += ' AND a.data <= ?'; params.push(data_fim); }

      query += ' ORDER BY a.data DESC, a.horario ASC';
      const agendamentos = db.prepare(query).all(...params);
      return res.json({ sucesso: true, dados: agendamentos });
    } catch (err) {
      console.error('[Agendamentos] Listar:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/agendamentos/:id */
  buscarPorId(req, res) {
    try {
      const db = getDb();
      const agendamento = db.prepare(`
        SELECT a.*, u.nome AS usuario_nome, u.email AS usuario_email, u.telefone AS usuario_telefone,
               s.nome AS servico_nome, s.valor AS servico_valor, s.duracao_min AS servico_duracao
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.usuario_id
        JOIN servicos s ON s.id = a.servico_id
        WHERE a.id = ?
      `).get(req.params.id);

      if (!agendamento) return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado.' });

      // Garante que cliente só veja o próprio
      if (req.usuario.tipo !== 'admin' && agendamento.usuario_id !== req.usuario.id) {
        return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
      }

      return res.json({ sucesso: true, dados: agendamento });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** POST /api/agendamentos */
  criar(req, res) {
    try {
      const { servico_id, data, horario, observacoes } = req.body;
      if (!servico_id || !data || !horario) {
        return res.status(400).json({ sucesso: false, mensagem: 'Serviço, data e horário são obrigatórios.' });
      }

      const db = getDb();

      // Verifica se serviço existe e está ativo
      const servico = db.prepare('SELECT * FROM servicos WHERE id = ? AND ativo = 1').get(servico_id);
      if (!servico) return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado ou inativo.' });

      // Verifica conflito de horário
      const conflito = db.prepare(`
        SELECT id FROM agendamentos
        WHERE data = ? AND horario = ? AND status NOT IN ('cancelado')
      `).get(data, horario);

      if (conflito) {
        return res.status(409).json({ sucesso: false, mensagem: 'Horário já reservado. Escolha outro horário.' });
      }

      const usuarioId = req.usuario.tipo === 'admin' && req.body.usuario_id
        ? req.body.usuario_id
        : req.usuario.id;

      const result = db.prepare(`
        INSERT INTO agendamentos (usuario_id, servico_id, data, horario, observacoes)
        VALUES (?, ?, ?, ?, ?)
      `).run(usuarioId, servico_id, data, horario, observacoes || null);

      const novo = db.prepare(`
        SELECT a.*, u.nome AS usuario_nome, s.nome AS servico_nome, s.valor AS servico_valor
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.usuario_id
        JOIN servicos s ON s.id = a.servico_id
        WHERE a.id = ?
      `).get(result.lastInsertRowid);

      return res.status(201).json({ sucesso: true, dados: novo });
    } catch (err) {
      console.error('[Agendamentos] Criar:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** PATCH /api/agendamentos/:id/status — admin only */
  atualizarStatus(req, res) {
    try {
      const { status } = req.body;
      const statusValidos = ['pendente', 'confirmado', 'realizado', 'cancelado'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ sucesso: false, mensagem: 'Status inválido.' });
      }

      const db = getDb();
      const agendamento = db.prepare(`
        SELECT a.*, s.valor FROM agendamentos a JOIN servicos s ON s.id = a.servico_id WHERE a.id = ?
      `).get(req.params.id);

      if (!agendamento) return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado.' });

      // Atualiza status
      db.prepare(`
        UPDATE agendamentos SET status = ?, atualizado_em = datetime('now','localtime') WHERE id = ?
      `).run(status, req.params.id);

      // Se marcado como REALIZADO → registra no financeiro
      if (status === 'realizado' && agendamento.status !== 'realizado') {
        const jaExiste = db.prepare('SELECT id FROM financeiro WHERE agendamento_id = ?').get(agendamento.id);
        if (!jaExiste) {
          db.prepare(`
            INSERT INTO financeiro (agendamento_id, servico_id, usuario_id, valor, data_realizacao)
            VALUES (?, ?, ?, ?, ?)
          `).run(agendamento.id, agendamento.servico_id, agendamento.usuario_id, agendamento.valor, agendamento.data);
        }
      }

      return res.json({ sucesso: true, mensagem: `Status atualizado para "${status}".` });
    } catch (err) {
      console.error('[Agendamentos] Status:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** DELETE /api/agendamentos/:id — cancela */
  cancelar(req, res) {
    try {
      const db = getDb();
      const agendamento = db.prepare('SELECT * FROM agendamentos WHERE id = ?').get(req.params.id);
      if (!agendamento) return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado.' });

      if (req.usuario.tipo !== 'admin' && agendamento.usuario_id !== req.usuario.id) {
        return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
      }
      if (agendamento.status === 'realizado') {
        return res.status(400).json({ sucesso: false, mensagem: 'Não é possível cancelar um agendamento realizado.' });
      }

      db.prepare(`UPDATE agendamentos SET status = 'cancelado', atualizado_em = datetime('now','localtime') WHERE id = ?`).run(req.params.id);
      return res.json({ sucesso: true, mensagem: 'Agendamento cancelado.' });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/agendamentos/horarios-disponiveis?data=YYYY-MM-DD */
  horariosDisponiveis(req, res) {
    try {
      const { data } = req.query;
      if (!data) return res.status(400).json({ sucesso: false, mensagem: 'Data é obrigatória.' });

      const horariosPossiveis = [
        '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
        '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
      ];

      const db = getDb();
      const ocupados = db.prepare(`
        SELECT horario FROM agendamentos WHERE data = ? AND status NOT IN ('cancelado')
      `).all(data).map(r => r.horario);

      const disponiveis = horariosPossiveis.filter(h => !ocupados.includes(h));
      return res.json({ sucesso: true, dados: disponiveis });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  }
};

module.exports = AgendamentosController;
