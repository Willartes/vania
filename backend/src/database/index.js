/**
 * database/index.js
 * Inicialização e configuração do SQLite com better-sqlite3
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './src/database/vaniaherculano.db';
const dbPath = path.resolve(DB_PATH);

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? null : null
    });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    -- ============================================
    -- Tabela: usuarios
    -- ============================================
    CREATE TABLE IF NOT EXISTS usuarios (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL,
      email     TEXT NOT NULL UNIQUE,
      senha     TEXT NOT NULL,
      telefone  TEXT,
      tipo      TEXT NOT NULL DEFAULT 'cliente' CHECK(tipo IN ('cliente','admin')),
      ativo     INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ============================================
    -- Tabela: servicos
    -- ============================================
    CREATE TABLE IF NOT EXISTS servicos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT NOT NULL,
      descricao   TEXT,
      valor       REAL NOT NULL DEFAULT 0,
      duracao_min INTEGER NOT NULL DEFAULT 60,
      categoria   TEXT,
      imagem_url  TEXT,
      ativo       INTEGER NOT NULL DEFAULT 1,
      criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ============================================
    -- Tabela: agendamentos
    -- ============================================
    CREATE TABLE IF NOT EXISTS agendamentos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
      servico_id  INTEGER NOT NULL REFERENCES servicos(id),
      data        TEXT NOT NULL,
      horario     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pendente' 
                  CHECK(status IN ('pendente','confirmado','realizado','cancelado')),
      observacoes TEXT,
      criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ============================================
    -- Tabela: financeiro (gerado automaticamente)
    -- ============================================
    CREATE TABLE IF NOT EXISTS financeiro (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      agendamento_id  INTEGER UNIQUE REFERENCES agendamentos(id),
      servico_id      INTEGER NOT NULL REFERENCES servicos(id),
      usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
      valor           REAL NOT NULL,
      data_realizacao TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      observacoes     TEXT
    );

    -- ============================================
    -- Índices para performance
    -- ============================================
    CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario  ON agendamentos(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_servico  ON agendamentos(servico_id);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data     ON agendamentos(data);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_status   ON agendamentos(status);
    CREATE INDEX IF NOT EXISTS idx_financeiro_data       ON financeiro(data_realizacao);
    CREATE INDEX IF NOT EXISTS idx_financeiro_servico    ON financeiro(servico_id);
  `);
}

module.exports = { getDb };
