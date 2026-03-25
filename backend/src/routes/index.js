/**
 * routes/index.js
 * Roteamento principal da API
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const express = require('express');
const router = express.Router();

const { autenticar, apenasAdmin } = require('../middleware/auth');

const AuthController = require('../controllers/authController');
const ServicosController = require('../controllers/servicosController');
const AgendamentosController = require('../controllers/agendamentosController');
const DashboardController = require('../controllers/dashboardController');
const UsuariosController = require('../controllers/usuariosController');

// ── Health check ──────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', app: 'Vania Herculano Biomedicina Estética API', version: '1.0.0' }));

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login', AuthController.login);
router.post('/auth/registrar', AuthController.registrar);
router.get('/auth/perfil', autenticar, AuthController.perfil);

// ── Serviços (público para leitura) ───────────────────────────
router.get('/servicos/categorias', ServicosController.categorias);
router.get('/servicos', ServicosController.listar);
router.get('/servicos/:id', ServicosController.buscarPorId);
router.post('/servicos', autenticar, apenasAdmin, ServicosController.criar);
router.put('/servicos/:id', autenticar, apenasAdmin, ServicosController.atualizar);
router.delete('/servicos/:id', autenticar, apenasAdmin, ServicosController.remover);

// ── Agendamentos ──────────────────────────────────────────────
router.get('/agendamentos/horarios-disponiveis', autenticar, AgendamentosController.horariosDisponiveis);
router.get('/agendamentos', autenticar, AgendamentosController.listar);
router.get('/agendamentos/:id', autenticar, AgendamentosController.buscarPorId);
router.post('/agendamentos', autenticar, AgendamentosController.criar);
router.patch('/agendamentos/:id/status', autenticar, apenasAdmin, AgendamentosController.atualizarStatus);
router.delete('/agendamentos/:id', autenticar, AgendamentosController.cancelar);

// ── Dashboard (admin) ─────────────────────────────────────────
router.get('/dashboard/resumo', autenticar, apenasAdmin, DashboardController.resumo);
router.get('/dashboard/faturamento-periodo', autenticar, apenasAdmin, DashboardController.faturamentoPeriodo);
router.get('/dashboard/servicos-mais-realizados', autenticar, apenasAdmin, DashboardController.servicosMaisRealizados);
router.get('/dashboard/agendamentos-recentes', autenticar, apenasAdmin, DashboardController.agendamentosRecentes);
router.get('/dashboard/financeiro', autenticar, apenasAdmin, DashboardController.relatorioFinanceiro);

// ── Usuários (admin) ──────────────────────────────────────────
router.get('/usuarios', autenticar, apenasAdmin, UsuariosController.listar);
router.get('/usuarios/:id', autenticar, UsuariosController.buscarPorId);
router.put('/usuarios/:id', autenticar, UsuariosController.atualizar);
router.delete('/usuarios/:id', autenticar, apenasAdmin, UsuariosController.remover);

module.exports = router;
