/**
 * controllers/dashboardController.js
 * Dashboard e Financeiro — Métricas e Relatórios
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const { getDb } = require('../database');

const DashboardController = {

  /** GET /api/dashboard/resumo */
  resumo(req, res) {
    try {
      const db = getDb();
      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = hoje.substring(0, 7) + '-01';

      const totalFaturado = db.prepare('SELECT COALESCE(SUM(valor),0) AS total FROM financeiro').get().total;
      const faturadoMes = db.prepare('SELECT COALESCE(SUM(valor),0) AS total FROM financeiro WHERE data_realizacao >= ?').get(inicioMes).total;
      const agendamentosHoje = db.prepare("SELECT COUNT(*) AS total FROM agendamentos WHERE data = ? AND status NOT IN ('cancelado')").get(hoje).total;
      const pendentes = db.prepare("SELECT COUNT(*) AS total FROM agendamentos WHERE status = 'pendente'").get().total;
      const realizadosMes = db.prepare("SELECT COUNT(*) AS total FROM agendamentos WHERE data >= ? AND status = 'realizado'").get(inicioMes).total;
      const totalClientes = db.prepare("SELECT COUNT(*) AS total FROM usuarios WHERE tipo = 'cliente' AND ativo = 1").get().total;

      return res.json({
        sucesso: true,
        dados: { totalFaturado, faturadoMes, agendamentosHoje, pendentes, realizadosMes, totalClientes }
      });
    } catch (err) {
      console.error('[Dashboard] Resumo:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/dashboard/faturamento-periodo?periodo=mes|semana|dia&data_inicio=&data_fim= */
  faturamentoPeriodo(req, res) {
    try {
      const db = getDb();
      const { periodo = 'mes', data_inicio, data_fim } = req.query;

      let groupBy, dataInicio, dataFim;
      const hoje = new Date();

      if (data_inicio && data_fim) {
        dataInicio = data_inicio;
        dataFim = data_fim;
        groupBy = 'dia';
      } else if (periodo === 'semana') {
        const d = new Date(hoje);
        d.setDate(d.getDate() - 6);
        dataInicio = d.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        groupBy = 'dia';
      } else if (periodo === 'mes') {
        dataInicio = hoje.toISOString().split('T')[0].substring(0, 7) + '-01';
        dataFim = hoje.toISOString().split('T')[0];
        groupBy = 'dia';
      } else { // ano
        dataInicio = hoje.getFullYear() + '-01-01';
        dataFim = hoje.toISOString().split('T')[0];
        groupBy = 'mes';
      }

      let query;
      if (groupBy === 'dia') {
        query = db.prepare(`
          SELECT 
            substr(data_realizacao, 1, 10) AS periodo,
            COALESCE(SUM(valor), 0) AS total,
            COUNT(*) AS quantidade
          FROM financeiro
          WHERE substr(data_realizacao, 1, 10) BETWEEN ? AND ?
          GROUP BY substr(data_realizacao, 1, 10)
          ORDER BY periodo
        `).all(dataInicio, dataFim);
      } else {
        query = db.prepare(`
          SELECT
            substr(data_realizacao, 1, 7) AS periodo,
            COALESCE(SUM(valor), 0) AS total,
            COUNT(*) AS quantidade
          FROM financeiro
          WHERE substr(data_realizacao, 1, 10) BETWEEN ? AND ?
          GROUP BY substr(data_realizacao, 1, 7)
          ORDER BY periodo
        `).all(dataInicio, dataFim);
      }

      return res.json({ sucesso: true, dados: query });
    } catch (err) {
      console.error('[Dashboard] Faturamento:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/dashboard/servicos-mais-realizados */
  servicosMaisRealizados(req, res) {
    try {
      const db = getDb();
      const dados = db.prepare(`
        SELECT 
          s.nome,
          s.categoria,
          COUNT(f.id) AS quantidade,
          SUM(f.valor) AS total_faturado,
          AVG(f.valor) AS ticket_medio
        FROM financeiro f
        JOIN servicos s ON s.id = f.servico_id
        GROUP BY f.servico_id
        ORDER BY quantidade DESC
        LIMIT 10
      `).all();
      return res.json({ sucesso: true, dados });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/dashboard/agendamentos-recentes */
  agendamentosRecentes(req, res) {
    try {
      const db = getDb();
      const dados = db.prepare(`
        SELECT 
          a.id, a.data, a.horario, a.status,
          u.nome AS cliente, u.telefone,
          s.nome AS servico, s.valor
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.usuario_id
        JOIN servicos s ON s.id = a.servico_id
        ORDER BY a.criado_em DESC
        LIMIT 20
      `).all();
      return res.json({ sucesso: true, dados });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  },

  /** GET /api/dashboard/financeiro */
  relatorioFinanceiro(req, res) {
    try {
      const db = getDb();
      const { data_inicio, data_fim } = req.query;
      let query = `
        SELECT 
          f.id, f.valor, f.data_realizacao,
          u.nome AS cliente, u.email AS cliente_email,
          s.nome AS servico, s.categoria
        FROM financeiro f
        JOIN usuarios u ON u.id = f.usuario_id
        JOIN servicos s ON s.id = f.servico_id
      `;
      const params = [];

      if (data_inicio && data_fim) {
        query += ' WHERE substr(f.data_realizacao,1,10) BETWEEN ? AND ?';
        params.push(data_inicio, data_fim);
      }
      query += ' ORDER BY f.data_realizacao DESC';

      const dados = db.prepare(query).all(...params);
      const totalGeral = dados.reduce((acc, r) => acc + r.valor, 0);

      return res.json({ sucesso: true, dados, total_geral: totalGeral });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
  }
};

module.exports = DashboardController;
