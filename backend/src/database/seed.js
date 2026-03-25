/**
 * database/seed.js
 * Popula o banco com dados iniciais
 * Vania Herculano Biomedicina Estética — © 2025 William Rodrigues da Silva
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('./index');

async function seed() {
  const db = getDb();
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // ── Usuários ──────────────────────────────────────────────────
  const senhaAdmin = bcrypt.hashSync('admin123', 10);
  const senhaCliente = bcrypt.hashSync('cliente123', 10);

  const insertUsuario = db.prepare(`
    INSERT OR IGNORE INTO usuarios (nome, email, senha, telefone, tipo)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUsuario.run('Administrador', 'admin@vaniaherculano.com.br', senhaAdmin, '(11) 98291-6090', 'admin');
  insertUsuario.run('Maria Silva', 'maria@email.com', senhaCliente, '(11) 98888-1111', 'cliente');
  insertUsuario.run('Ana Souza', 'ana@email.com', senhaCliente, '(11) 97777-2222', 'cliente');
  insertUsuario.run('Patrícia Lima', 'patricia@email.com', senhaCliente, '(11) 96666-3333', 'cliente');

  console.log('✅ Usuários criados');

  // ── Serviços ──────────────────────────────────────────────────
  const insertServico = db.prepare(`
    INSERT OR IGNORE INTO servicos (nome, descricao, valor, duracao_min, categoria)
    VALUES (?, ?, ?, ?, ?)
  `);

  const servicos = [
    ['Toxina Botulínica', 'Aplicação ultraprecisa com mapeamento facial completo. Resultados naturais por até 6 meses.', 1200.00, 60, 'Facial'],
    ['Bioestimulador de Colágeno', 'Rejuvenescimento profundo com estímulo natural ao colágeno. Resultados progressivos e duradouros.', 2500.00, 90, 'Facial'],
    ['Preenchimento Facial', 'Harmonização com ácido hialurônico de última geração. Contornos precisos e volume equilibrado.', 1800.00, 75, 'Facial'],
    ['Laser CO₂ Fracionado', 'Renovação celular intensa para manchas, cicatrizes e rejuvenescimento global da pele.', 3200.00, 120, 'Laser'],
    ['Fio de Sustentação PDO', 'Lifting imediato sem cirurgia. Reposicionamento dos tecidos com fios reabsorvíveis premium.', 4500.00, 90, 'Procedimento'],
    ['Skinbooster & Hidratação', 'Microinjeções de ácido hialurônico para luminosidade, firmeza e textura impecável.', 1500.00, 60, 'Facial'],
    ['Limpeza de Pele Profunda', 'Higienização profunda com extração, peeling enzimático e máscara calmante.', 350.00, 60, 'Estética'],
    ['Peeling Químico', 'Renovação celular com ácidos de alta concentração. Indicado para manchas e poros dilatados.', 800.00, 75, 'Facial'],
    ['Microagulhamento', 'Estímulo de colágeno com micro perfurações controladas. Melhora textura e cicatrizes.', 950.00, 90, 'Facial'],
    ['Drenagem Linfática Facial', 'Técnica manual de drenagem para redução de inchaço e melhor definição dos contornos.', 280.00, 45, 'Estética'],
  ];

  servicos.forEach(s => insertServico.run(...s));
  console.log('✅ Serviços criados');

  // ── Agendamentos de exemplo ───────────────────────────────────
  const usuarios = db.prepare('SELECT id FROM usuarios WHERE tipo = ?').all('cliente');
  const servicosDb = db.prepare('SELECT id, valor FROM servicos').all();

  const insertAgendamento = db.prepare(`
    INSERT OR IGNORE INTO agendamentos (usuario_id, servico_id, data, horario, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const hoje = new Date();
  const agendamentos = [
    [usuarios[0]?.id, servicosDb[0]?.id, formatDate(hoje, 0), '09:00', 'confirmado'],
    [usuarios[0]?.id, servicosDb[1]?.id, formatDate(hoje, 1), '10:30', 'pendente'],
    [usuarios[1]?.id, servicosDb[2]?.id, formatDate(hoje, -1), '14:00', 'realizado'],
    [usuarios[1]?.id, servicosDb[3]?.id, formatDate(hoje, -3), '15:30', 'realizado'],
    [usuarios[2]?.id, servicosDb[4]?.id, formatDate(hoje, -5), '09:00', 'realizado'],
    [usuarios[0]?.id, servicosDb[5]?.id, formatDate(hoje, -7), '11:00', 'cancelado'],
    [usuarios[1]?.id, servicosDb[6]?.id, formatDate(hoje, 2), '13:00', 'pendente'],
    [usuarios[2]?.id, servicosDb[0]?.id, formatDate(hoje, -2), '16:00', 'realizado'],
  ];

  agendamentos.forEach(a => insertAgendamento.run(...a));
  console.log('✅ Agendamentos criados');

  // ── Financeiro (para agendamentos realizados) ─────────────────
  const realizados = db.prepare(`
    SELECT a.id, a.servico_id, a.usuario_id, a.data, s.valor
    FROM agendamentos a
    JOIN servicos s ON s.id = a.servico_id
    WHERE a.status = 'realizado'
  `).all();

  const insertFinanceiro = db.prepare(`
    INSERT OR IGNORE INTO financeiro (agendamento_id, servico_id, usuario_id, valor, data_realizacao)
    VALUES (?, ?, ?, ?, ?)
  `);

  realizados.forEach(r => {
    insertFinanceiro.run(r.id, r.servico_id, r.usuario_id, r.valor, r.data);
  });

  console.log('✅ Registros financeiros criados');
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais:');
  console.log('   Admin:   admin@vaniaherculano.com.br / admin123');
  console.log('   Cliente: maria@email.com / cliente123\n');

  process.exit(0);
}

function formatDate(base, offsetDays) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
