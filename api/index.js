/**
 * api/index.js — Vercel Serverless — Vania Herculano
 * Banco JSON puro em /tmp — zero dependencias nativas
 * Resend via fetch nativo (Node 18+) — sem require dinamico
 */
require('dotenv').config();
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const app     = express();

app.use(require('cors')({ origin:(o,cb)=>cb(null,true), methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization'], credentials:true }));
app.use(express.json({ limit:'5mb' }));
app.use(express.urlencoded({ extended:true }));

// ════════════════════════════════════════════════
// BANCO JSON em /tmp
// ════════════════════════════════════════════════
const DB_PATH = path.join(os.tmpdir(), 'vania_db.json');
let _db = null;

function loadDb() {
  if (_db) return _db;
  if (fs.existsSync(DB_PATH)) {
    try { _db = JSON.parse(fs.readFileSync(DB_PATH,'utf8')); } catch { _db=null; }
  }
  if (!_db) { _db={ usuarios:[], servicos:[], agendamentos:[], financeiro:[], agenda:[], tokens_reset:[], pacotes:[], _seq:{} }; seed(); }
  saveDb(); return _db;
}
function saveDb() { try { fs.writeFileSync(DB_PATH, JSON.stringify(_db)); } catch(e) { console.error('saveDb:',e.message); } }
function nextId(t) { _db._seq[t]=(_db._seq[t]||0)+1; return _db._seq[t]; }
function now()     { return new Date().toISOString().replace('T',' ').substring(0,19); }

function seed() {
  const ae=process.env.ADMIN_EMAIL||'vaniashsantos@hotmail.com';
  const as=bcrypt.hashSync(process.env.ADMIN_SENHA||'v@nia123',10);
  const cs=bcrypt.hashSync('cliente123',10);
  const sc = bcrypt.hashSync('colab123', 10);
  _db.usuarios=[
    {id:1,nome:'Vania Herculano',email:ae,senha:as,telefone:'(11) 98291-6090',tipo:'superadmin',ativo:1,criado_em:now()},
    {id:2,nome:'Maria Silva',email:'maria@email.com',senha:cs,telefone:'(11) 99509-9920',tipo:'cliente',ativo:1,criado_em:now()},
    {id:3,nome:'Ana Colaboradora',email:'ana@vaniaherculano.com.br',senha:sc,telefone:'(11) 91111-2222',tipo:'colaborador',ativo:1,criado_em:now()},
  ];
  _db._seq.usuarios=3;
  _db.servicos=[
    {id:1,nome:'Toxina Botulinica',descricao:'Aplicacao ultraprecisa. Resultados naturais por ate 6 meses.',valor:1200,duracao_min:60,categoria:'Facial',ativo:1,criado_em:now()},
    {id:2,nome:'Bioestimulador de Colageno',descricao:'Rejuvenescimento profundo com estimulo ao colageno.',valor:2500,duracao_min:90,categoria:'Facial',ativo:1,criado_em:now()},
    {id:3,nome:'Preenchimento Facial',descricao:'Harmonizacao com acido hialuronico.',valor:1800,duracao_min:75,categoria:'Facial',ativo:1,criado_em:now()},
    {id:4,nome:'Laser CO2 Fracionado',descricao:'Renovacao celular para manchas e rejuvenescimento.',valor:3200,duracao_min:120,categoria:'Laser',ativo:1,criado_em:now()},
    {id:5,nome:'Fio de Sustentacao PDO',descricao:'Lifting imediato sem cirurgia.',valor:4500,duracao_min:90,categoria:'Procedimento',ativo:1,criado_em:now()},
    {id:6,nome:'Skinbooster',descricao:'Microinjecoes de acido hialuronico para luminosidade.',valor:1500,duracao_min:60,categoria:'Facial',ativo:1,criado_em:now()},
    {id:7,nome:'Limpeza de Pele Profunda',descricao:'Higienizacao com extracao e peeling enzimatico.',valor:350,duracao_min:60,categoria:'Estetica',ativo:1,criado_em:now()},
    {id:8,nome:'Peeling Quimico',descricao:'Renovacao celular com acidos para manchas.',valor:800,duracao_min:75,categoria:'Facial',ativo:1,criado_em:now()},
  ];
  _db._seq.servicos=8;
  _db.agendamentos=[]; _db.financeiro=[]; _db.agenda=[]; _db.tokens_reset=[]; _db.pacotes=[];
}

// ════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════
const HORARIOS_PADRAO=['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];

const db = {
  u:()=>{loadDb();return _db.usuarios;},
  s:()=>{loadDb();return _db.servicos;},
  ag:()=>{loadDb();return _db.agendamentos;},
  fin:()=>{loadDb();return _db.financeiro;},
  agenda:()=>{loadDb();if(!_db.agenda)_db.agenda=[];return _db.agenda;},
  findU: fn=>{loadDb();return _db.usuarios.find(fn)||null;},
  findS: fn=>{loadDb();return _db.servicos.find(fn)||null;},
  findAg:fn=>{loadDb();return _db.agendamentos.find(fn)||null;},
  findFin:fn=>{loadDb();return _db.financeiro.find(fn)||null;},
  findAgenda:data=>{loadDb();if(!_db.agenda)_db.agenda=[];return _db.agenda.find(a=>a.data===data)||null;},
  insU: o=>{loadDb();o.id=nextId('usuarios');o.criado_em=now();_db.usuarios.push(o);saveDb();return o;},
  insS: o=>{loadDb();o.id=nextId('servicos');o.criado_em=now();_db.servicos.push(o);saveDb();return o;},
  insAg:o=>{loadDb();o.id=nextId('agendamentos');o.criado_em=now();_db.agendamentos.push(o);saveDb();return o;},
  insFin:o=>{loadDb();o.id=nextId('financeiro');o.data_realizacao=o.data_realizacao||now();_db.financeiro.push(o);saveDb();return o;},
  updU:(id,d)=>{loadDb();const i=_db.usuarios.findIndex(u=>u.id==id);if(i>=0){Object.assign(_db.usuarios[i],d);saveDb();return _db.usuarios[i];}return null;},
  updS:(id,d)=>{loadDb();const i=_db.servicos.findIndex(s=>s.id==id);if(i>=0){Object.assign(_db.servicos[i],d);saveDb();return _db.servicos[i];}return null;},
  updAg:(id,d)=>{loadDb();const i=_db.agendamentos.findIndex(a=>a.id==id);if(i>=0){Object.assign(_db.agendamentos[i],d);saveDb();return _db.agendamentos[i];}return null;},
  setAgenda:(data,horarios,bloqueado,colaboradorId=null)=>{loadDb();if(!_db.agenda)_db.agenda=[];const i=_db.agenda.findIndex(a=>a.data===data&&(colaboradorId?a.colaborador_id==colaboradorId:!a.colaborador_id));const cfg={data,horarios:horarios||[],bloqueado:!!bloqueado,colaborador_id:colaboradorId};if(i>=0)_db.agenda[i]=cfg;else _db.agenda.push(cfg);saveDb();return cfg;},
  delAgenda:data=>{loadDb();if(!_db.agenda)_db.agenda=[];_db.agenda=_db.agenda.filter(a=>a.data!==data);saveDb();},
  pacotes:()=>{loadDb();if(!_db.pacotes)_db.pacotes=[];return _db.pacotes;},
  findPacote:fn=>{loadDb();if(!_db.pacotes)_db.pacotes=[];return _db.pacotes.find(fn)||null;},
  insPacote:o=>{loadDb();if(!_db.pacotes)_db.pacotes=[];o.id=nextId('pacotes');o.criado_em=now();_db.pacotes.push(o);saveDb();return o;},
  updPacote:(id,d)=>{loadDb();if(!_db.pacotes)_db.pacotes=[];const i=_db.pacotes.findIndex(p=>p.id==id);if(i>=0){Object.assign(_db.pacotes[i],d);saveDb();return _db.pacotes[i];}return null;},
  delPacote:id=>{loadDb();if(!_db.pacotes)_db.pacotes=[];_db.pacotes=_db.pacotes.filter(p=>p.id!=id);saveDb();},
};

// ════════════════════════════════════════════════
// JWT
// ════════════════════════════════════════════════
const SECRET=process.env.JWT_SECRET||'vania_secret_2025';
const tok=u=>jwt.sign({id:u.id,nome:u.nome,email:u.email,tipo:u.tipo},SECRET,{expiresIn:'7d'});
function auth(req,res,next){const t=(req.headers.authorization||'').replace('Bearer ','');if(!t)return res.status(401).json({sucesso:false,mensagem:'Token nao fornecido.'});try{req.usuario=jwt.verify(t,SECRET);next();}catch{res.status(401).json({sucesso:false,mensagem:'Token invalido.'});}}
// superadmin → acesso total
function sadm(req,res,next){if(req.usuario?.tipo!=='superadmin')return res.status(403).json({sucesso:false,mensagem:'Apenas super administrador.'});next();}
// admin OU superadmin
function adm(req,res,next){if(!['admin','superadmin','colaborador'].includes(req.usuario?.tipo))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});next();}
// apenas superadmin ou admin (colaborador nao pode)
function admPlus(req,res,next){if(!['admin','superadmin'].includes(req.usuario?.tipo))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});next();}
// helper
function isSuperAdmin(req){return req.usuario?.tipo==='superadmin';}
function isAdmin(req){return ['admin','superadmin'].includes(req.usuario?.tipo);}
function isColaborador(req){return req.usuario?.tipo==='colaborador';}
function isAnyAdmin(req){return ['admin','superadmin','colaborador'].includes(req.usuario?.tipo);}

function enrich(a){loadDb();const u=_db.usuarios.find(u=>u.id==a.usuario_id)||{};const s=_db.servicos.find(s=>s.id==a.servico_id)||{};const c=a.colaborador_id?(_db.usuarios.find(u=>u.id==a.colaborador_id)||{}):null;return{...a,usuario_nome:u.nome,usuario_email:u.email,usuario_telefone:u.telefone,servico_nome:s.nome,servico_valor:s.valor,servico_duracao:s.duracao_min,servico_categoria:s.categoria,colaborador_nome:c?c.nome:null};}

// ════════════════════════════════════════════════
// RESEND — via fetch nativo (Node 18+), sem require dinamico
// ════════════════════════════════════════════════
async function enviarEmail({ para, assunto, html }) {
  const key  = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  if (!key) { console.log('[Email] Sem RESEND_API_KEY'); return false; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Vania Herculano <${from}>`, to: [para], subject: assunto, html })
    });
    const data = await r.json();
    if (!r.ok) { console.error('[Email] Resend erro:', data); return false; }
    return true;
  } catch(e) { console.error('[Email] fetch erro:', e.message); return false; }
}

// ════════════════════════════════════════════════
// ROTAS AUTH
// ════════════════════════════════════════════════
app.get('/api/health', (_,res) => res.json({ status:'ok', ts: Date.now() }));

app.post('/api/auth/login', (req,res) => {
  try {
    loadDb();
    const {email,senha}=req.body;
    if(!email||!senha) return res.status(400).json({sucesso:false,mensagem:'E-mail e senha obrigatorios.'});
    const u=db.findU(u=>u.email===email.toLowerCase().trim()&&u.ativo);
    if(!u||!bcrypt.compareSync(senha,u.senha)) return res.status(401).json({sucesso:false,mensagem:'E-mail ou senha incorretos.'});
    res.json({sucesso:true,token:tok(u),usuario:{id:u.id,nome:u.nome,email:u.email,telefone:u.telefone,tipo:u.tipo}});
  } catch(e){res.status(500).json({sucesso:false,mensagem:e.message});}
});

app.post('/api/auth/registrar', (req,res) => {
  try {
    loadDb();
    const {nome,email,senha,telefone,tipo:tipoReq}=req.body;
    if(!nome||!email||!senha) return res.status(400).json({sucesso:false,mensagem:'Nome, e-mail e senha obrigatorios.'});
    if(senha.length<6) return res.status(400).json({sucesso:false,mensagem:'Senha minima: 6 caracteres.'});
    if(db.findU(u=>u.email===email.toLowerCase().trim())) return res.status(409).json({sucesso:false,mensagem:'E-mail ja cadastrado.'});
    // tipo padrao = cliente; colaborador/admin/superadmin só pode ser criado por superadmin
    let tipo = 'cliente';
    if(tipoReq && ['colaborador','admin'].includes(tipoReq)) {
      // Requer autenticacao de superadmin
      const t=(req.headers.authorization||'').replace('Bearer ','');
      if(t){try{const u=require('jsonwebtoken').verify(t,process.env.JWT_SECRET||'vania_secret_2025');if(u.tipo==='superadmin')tipo=tipoReq;}catch{}}
    }
    const novo=db.insU({nome:nome.trim(),email:email.toLowerCase().trim(),senha:bcrypt.hashSync(senha,10),telefone:telefone||null,tipo,ativo:1});
    res.status(201).json({sucesso:true,token:tok(novo),usuario:{id:novo.id,nome:novo.nome,email:novo.email,telefone:novo.telefone,tipo:novo.tipo}});
  } catch(e){res.status(500).json({sucesso:false,mensagem:e.message});}
});

// Criar colaborador diretamente (apenas superadmin)
app.post('/api/usuarios/colaborador', auth, sadm, (req,res) => {
  try {
    loadDb();
    const {nome,email,senha,telefone,tipo:tipoReq}=req.body;
    const tipo = ['colaborador','admin'].includes(tipoReq) ? tipoReq : 'colaborador';
    if(!nome||!email||!senha) return res.status(400).json({sucesso:false,mensagem:'Nome, e-mail e senha obrigatorios.'});
    if(senha.length<6) return res.status(400).json({sucesso:false,mensagem:'Senha minima: 6 caracteres.'});
    if(db.findU(u=>u.email===email.toLowerCase().trim())) return res.status(409).json({sucesso:false,mensagem:'E-mail ja cadastrado.'});
    const novo=db.insU({nome:nome.trim(),email:email.toLowerCase().trim(),senha:bcrypt.hashSync(senha,10),telefone:telefone||null,tipo,ativo:1,especialidade:req.body.especialidade||null});
    res.status(201).json({sucesso:true,dados:{id:novo.id,nome:novo.nome,email:novo.email,telefone:novo.telefone,tipo:novo.tipo}});
  } catch(e){res.status(500).json({sucesso:false,mensagem:e.message});}
});

app.get('/api/auth/perfil', auth, (req,res) => {
  loadDb();
  const u=db.findU(u=>u.id===req.usuario.id);
  res.json({sucesso:true,usuario:u?{id:u.id,nome:u.nome,email:u.email,telefone:u.telefone,tipo:u.tipo}:null});
});

// ════════════════════════════════════════════════
// SERVICOS
// ════════════════════════════════════════════════
app.get('/api/servicos/categorias',(_,res)=>{loadDb();const cats=[...new Set(db.s().filter(s=>s.ativo&&s.categoria).map(s=>s.categoria))].sort();res.json({sucesso:true,dados:cats});});
app.get('/api/servicos',(req,res)=>{loadDb();let list=db.s();if(req.query.ativo!==undefined)list=list.filter(s=>s.ativo==(req.query.ativo==='true'?1:0));if(req.query.categoria)list=list.filter(s=>s.categoria===req.query.categoria);res.json({sucesso:true,dados:[...list].sort((a,b)=>(a.categoria||'').localeCompare(b.categoria||'')||a.nome.localeCompare(b.nome))});});
app.get('/api/servicos/:id',(req,res)=>{loadDb();const s=db.findS(s=>s.id==req.params.id);if(!s)return res.status(404).json({sucesso:false,mensagem:'Nao encontrado.'});res.json({sucesso:true,dados:s});});
app.post('/api/servicos',auth,adm,(req,res)=>{loadDb();const{nome,descricao,valor,duracao_min,categoria}=req.body;if(!nome||valor===undefined)return res.status(400).json({sucesso:false,mensagem:'Nome e valor obrigatorios.'});res.status(201).json({sucesso:true,dados:db.insS({nome,descricao:descricao||null,valor:parseFloat(valor),duracao_min:duracao_min||60,categoria:categoria||null,ativo:1})});});
app.put('/api/servicos/:id',auth,adm,(req,res)=>{loadDb();const s=db.findS(s=>s.id==req.params.id);if(!s)return res.status(404).json({sucesso:false,mensagem:'Nao encontrado.'});const{nome,descricao,valor,duracao_min,categoria,ativo}=req.body;res.json({sucesso:true,dados:db.updS(req.params.id,{nome:nome||s.nome,descricao:descricao!==undefined?descricao:s.descricao,valor:valor?parseFloat(valor):s.valor,duracao_min:duracao_min||s.duracao_min,categoria:categoria!==undefined?categoria:s.categoria,ativo:ativo!==undefined?(ativo?1:0):s.ativo})});});
app.delete('/api/servicos/:id',auth,adm,(req,res)=>{loadDb();db.updS(req.params.id,{ativo:0});res.json({sucesso:true});});

// ════════════════════════════════════════════════
// AGENDAMENTOS
// ════════════════════════════════════════════════
function hToMin(h){const[hh,mm]=h.split(':').map(Number);return hh*60+mm;}
function temConflito(h1,dur1,h2,dur2){const s1=hToMin(h1),e1=s1+dur1,s2=hToMin(h2),e2=s2+dur2;return s1<e2&&s2<e1;}

app.get('/api/agendamentos/horarios-disponiveis',auth,(req,res)=>{
  loadDb();
  const{data,duracao_min}=req.query;
  if(!data)return res.status(400).json({sucesso:false,mensagem:'Data obrigatoria.'});
  const cfg=db.findAgenda(data);
  if(cfg&&cfg.bloqueado)return res.json({sucesso:true,dados:[],bloqueado:true});
  const liberados=(cfg&&cfg.horarios&&cfg.horarios.length>0)?cfg.horarios:HORARIOS_PADRAO;
  const durNovo=Number(duracao_min)||30;
  // Filtrar agendamentos existentes — se colaborador especificado, filtra apenas os dele
  const agsEx=db.ag()
    .filter(a=>{
      if(a.data!==data||a.status==='cancelado') return false;
      if(colab) return a.colaborador_id==colab; // apenas agendamentos deste profissional
      return true; // sem filtro de profissional
    })
    .map(a=>{const srv=_db.servicos.find(s=>s.id==a.servico_id)||{};return{horario:a.horario,duracao_min:srv.duracao_min||30};});
  res.json({sucesso:true,dados:liberados.filter(h=>!agsEx.some(ag=>temConflito(h,durNovo,ag.horario,ag.duracao_min)))});
});
app.get('/api/agendamentos',auth,(req,res)=>{
  loadDb();
  const isAdm=isAnyAdmin(req);
  let list=db.ag().filter(a=>a.status!=='pacote_fixo');
  if(isColaborador(req)){
    // Colaborador ve apenas agendamentos atribuidos a ele
    list=list.filter(a=>a.colaborador_id==req.usuario.id);
  } else if(!isAdm) {
    // Cliente ve apenas seus proprios agendamentos
    list=list.filter(a=>a.usuario_id==req.usuario.id);
  }
  if(req.query.status)list=list.filter(a=>a.status===req.query.status);
  if(req.query.data_inicio)list=list.filter(a=>a.data>=req.query.data_inicio);
  if(req.query.data_fim)list=list.filter(a=>a.data<=req.query.data_fim);
  list=[...list].sort((a,b)=>b.data.localeCompare(a.data)||a.horario.localeCompare(b.horario));
  res.json({sucesso:true,dados:list.map(enrich)});
});
app.post('/api/agendamentos',auth,(req,res)=>{
  loadDb();
  const{servico_id,data,horario,observacoes}=req.body;
  if(!servico_id||!data||!horario)return res.status(400).json({sucesso:false,mensagem:'Servico, data e horario obrigatorios.'});
  const srv=db.findS(s=>s.id==servico_id&&s.ativo);
  if(!srv)return res.status(404).json({sucesso:false,mensagem:'Servico nao encontrado.'});
  const durNovo=srv.duracao_min||30;
  const agsEx=db.ag().filter(a=>a.data===data&&a.status!=='cancelado').map(a=>{const s=_db.servicos.find(s=>s.id==a.servico_id)||{};return{horario:a.horario,duracao_min:s.duracao_min||30};});
  // pacote_fixo ja esta nos agendamentos — verificacao unificada
  const conflito=agsEx.find(ag=>temConflito(horario,durNovo,ag.horario,ag.duracao_min));
  if(conflito)return res.status(409).json({sucesso:false,mensagem:`Conflito: servico de ${durNovo}min as ${horario} se sobrepos com horario das ${conflito.horario}.`});
  const uid=isAnyAdmin(req)&&req.body.usuario_id?req.body.usuario_id:req.usuario.id;
  // colaborador_id: passado pelo cliente ao agendar, ou pelo admin, ou pelo colaborador (sempre ele)
  const colab_id = req.body.colaborador_id ? Number(req.body.colaborador_id) : (isColaborador(req) ? req.usuario.id : null);
  const novo=db.insAg({usuario_id:Number(uid),servico_id:Number(servico_id),colaborador_id:colab_id,data,horario,status:'pendente',observacoes:observacoes||null});
  res.status(201).json({sucesso:true,dados:enrich(novo)});
});
app.patch('/api/agendamentos/:id/status',auth,(req,res)=>{
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  const{status}=req.body;
  if(!['pendente','confirmado','realizado','cancelado'].includes(status))return res.status(400).json({sucesso:false,mensagem:'Status invalido.'});
  const ag=db.findAg(a=>a.id==req.params.id);
  if(!ag)return res.status(404).json({sucesso:false,mensagem:'Nao encontrado.'});
  db.updAg(req.params.id,{status});
  if(status==='realizado'&&ag.status!=='realizado'&&!db.findFin(f=>f.agendamento_id==ag.id)){const srv=db.findS(s=>s.id==ag.servico_id);db.insFin({agendamento_id:ag.id,servico_id:ag.servico_id,usuario_id:ag.usuario_id,colaborador_id:ag.colaborador_id||req.usuario.id,valor:srv?.valor||0,data_realizacao:ag.data});}
  const atualizado=db.findAg(a=>a.id==req.params.id);
  res.json({sucesso:true,mensagem:`Status: ${status}`,dados:enrich(atualizado)});
});
app.delete('/api/agendamentos/:id',auth,(req,res)=>{
  loadDb();
  const ag=db.findAg(a=>a.id==req.params.id);
  if(!ag)return res.status(404).json({sucesso:false,mensagem:'Nao encontrado.'});
  if(!isAnyAdmin(req)&&ag.usuario_id!==req.usuario.id)return res.status(403).json({sucesso:false,mensagem:'Acesso negado.'});
  if(ag.status==='realizado')return res.status(400).json({sucesso:false,mensagem:'Nao e possivel cancelar realizado.'});
  db.updAg(req.params.id,{status:'cancelado'});
  res.json({sucesso:true});
});

// ════════════════════════════════════════════════
// AGENDA
// ════════════════════════════════════════════════
app.get('/api/agenda',auth,(req,res)=>{
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  // Colaborador vê apenas sua agenda; superadmin/admin vê todas
  const userId = isColaborador(req) ? req.usuario.id : (req.query.colaborador_id ? Number(req.query.colaborador_id) : null);
  let lista = db.agenda();
  if(userId) lista = lista.filter(cfg => !cfg.colaborador_id || cfg.colaborador_id == userId);
  const dados = lista.map(cfg=>({
    ...cfg,
    agendamentos: db.ag().filter(a=>a.data===cfg.data&&a.status!=='cancelado'&&(!userId||a.colaborador_id==userId)).length
  })).sort((a,b)=>a.data.localeCompare(b.data));
  res.json({sucesso:true,dados});
});
app.get('/api/agenda/:data',auth,(req,res)=>{loadDb();const{data}=req.params;const cfg=db.findAgenda(data)||{data,horarios:HORARIOS_PADRAO,bloqueado:false};const ocupados=db.ag().filter(a=>a.data===data&&a.status!=='cancelado').map(a=>{const u=_db.usuarios.find(u=>u.id==a.usuario_id)||{};const s=_db.servicos.find(s=>s.id==a.servico_id)||{};return{id:a.id,horario:a.horario,cliente:u.nome||'?',telefone:u.telefone||'',servico:s.nome||'?',status:a.status};});res.json({sucesso:true,dados:{...cfg,ocupados}});});
app.put('/api/agenda/:data',auth,(req,res)=>{
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  const{data}=req.params;
  const{horarios,bloqueado}=req.body;
  // Colaborador sempre salva com seu proprio ID; admin/superadmin pode especificar
  const colabId = isColaborador(req) ? req.usuario.id : (req.body.colaborador_id||null);
  const cfg=db.setAgenda(data,horarios||[],!!bloqueado,colabId);
  res.json({sucesso:true,dados:cfg});
});
app.delete('/api/agenda/:data',auth,adm,(req,res)=>{loadDb();db.delAgenda(req.params.data);res.json({sucesso:true});});

// ════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════
app.get('/api/dashboard/resumo',auth,(req,res)=>{
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  const hoje=new Date().toISOString().split('T')[0],im=hoje.substring(0,7)+'-01';
  // Colaborador ve apenas seus proprios dados
  const uid = isColaborador(req) ? req.usuario.id : null;
  const fins = uid ? _db.financeiro.filter(f=>f.colaborador_id==uid) : _db.financeiro;
  const ags  = _db.agendamentos.filter(a=>a.status!=='pacote_fixo');
  const meuAgs = uid ? ags.filter(a=>a.colaborador_id==uid) : ags;
  res.json({sucesso:true,dados:{
    totalFaturado:   fins.reduce((a,f)=>a+f.valor,0),
    faturadoMes:     fins.filter(f=>f.data_realizacao>=im).reduce((a,f)=>a+f.valor,0),
    agendamentosHoje:meuAgs.filter(a=>a.data===hoje&&a.status!=='cancelado').length,
    pendentes:       meuAgs.filter(a=>a.status==='pendente').length,
    realizadosMes:   meuAgs.filter(a=>a.data>=im&&a.status==='realizado').length,
    totalClientes:   _db.usuarios.filter(u=>u.tipo==='cliente'&&u.ativo).length,
    isSuperAdmin:    isSuperAdmin(req),
    isColaborador:   isColaborador(req),
  }});
});
app.get('/api/dashboard/faturamento-periodo',auth,adm,(req,res)=>{loadDb();const{periodo='mes',data_inicio,data_fim}=req.query;const hoje=new Date().toISOString().split('T')[0];let di=data_inicio,df=data_fim||hoje;if(!di){if(periodo==='semana'){const d=new Date();d.setDate(d.getDate()-6);di=d.toISOString().split('T')[0];}else if(periodo==='mes')di=hoje.substring(0,7)+'-01';else di=new Date().getFullYear()+'-01-01';}const fins=_db.financeiro.filter(f=>f.data_realizacao>=di&&f.data_realizacao<=df);const mapa={};fins.forEach(f=>{const k=f.data_realizacao.substring(0,10);if(!mapa[k])mapa[k]={total:0,quantidade:0};mapa[k].total+=f.valor;mapa[k].quantidade++;});res.json({sucesso:true,dados:Object.entries(mapa).sort((a,b)=>a[0].localeCompare(b[0])).map(([periodo,v])=>({periodo,...v}))});});
app.get('/api/dashboard/servicos-mais-realizados',auth,adm,(_,res)=>{loadDb();const mapa={};_db.financeiro.forEach(f=>{if(!mapa[f.servico_id])mapa[f.servico_id]={quantidade:0,total_faturado:0};mapa[f.servico_id].quantidade++;mapa[f.servico_id].total_faturado+=f.valor;});const dados=Object.entries(mapa).map(([id,v])=>{const s=db.findS(s=>s.id==id)||{};return{nome:s.nome,categoria:s.categoria,...v,ticket_medio:v.total_faturado/v.quantidade};}).sort((a,b)=>b.quantidade-a.quantidade).slice(0,10);res.json({sucesso:true,dados});});
app.get('/api/dashboard/agendamentos-recentes',auth,adm,(_,res)=>{loadDb();const dados=[..._db.agendamentos].reverse().slice(0,20).map(a=>{const u=db.findU(u=>u.id==a.usuario_id)||{};const s=db.findS(s=>s.id==a.servico_id)||{};return{id:a.id,data:a.data,horario:a.horario,status:a.status,cliente:u.nome,telefone:u.telefone,servico:s.nome,valor:s.valor};});res.json({sucesso:true,dados});});
app.get('/api/dashboard/financeiro',auth,(req,res)=>{
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  const{data_inicio,data_fim}=req.query;
  let fins=_db.financeiro;
  // Colaborador ve apenas seus proprios registros
  if(isColaborador(req)) fins=fins.filter(f=>f.colaborador_id==req.usuario.id);
  if(data_inicio&&data_fim) fins=fins.filter(f=>f.data_realizacao>=data_inicio&&f.data_realizacao<=data_fim);
  const dados=fins.map(f=>{
    const u=db.findU(u=>u.id==f.usuario_id)||{};
    const s=db.findS(s=>s.id==f.servico_id)||{};
    const c=db.findU(u=>u.id==f.colaborador_id)||{};
    return{id:f.id,valor:f.valor,data_realizacao:f.data_realizacao,cliente:u.nome,cliente_email:u.email,servico:s.nome,categoria:s.categoria,colaborador:c.nome||'—'};
  }).sort((a,b)=>b.data_realizacao.localeCompare(a.data_realizacao));
  res.json({sucesso:true,dados,total_geral:dados.reduce((a,r)=>a+r.valor,0)});
});

// ════════════════════════════════════════════════
// USUARIOS
// ════════════════════════════════════════════════
app.get('/api/usuarios',auth,(req,res)=>{
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  let list=db.u();
  if(req.query.tipo) list=list.filter(u=>u.tipo===req.query.tipo);
  // Colaborador pode ver apenas clientes (para agendar)
  if(isColaborador(req)) list=list.filter(u=>u.tipo==='cliente');
  res.json({sucesso:true,dados:list.map(u=>({id:u.id,nome:u.nome,email:u.email,telefone:u.telefone,tipo:u.tipo,ativo:u.ativo,criado_em:u.criado_em}))});
});
app.put('/api/usuarios/:id',auth,(req,res)=>{loadDb();const u=db.findU(u=>u.id==req.params.id);if(!u)return res.status(404).json({sucesso:false,mensagem:'Nao encontrado.'});const{nome,telefone,senha,ativo}=req.body;db.updU(req.params.id,{nome:nome||u.nome,telefone:telefone||u.telefone,senha:senha?bcrypt.hashSync(senha,10):u.senha,ativo:ativo!==undefined?(ativo?1:0):u.ativo});res.json({sucesso:true});});
app.delete('/api/usuarios/:id',auth,adm,(req,res)=>{loadDb();db.updU(req.params.id,{ativo:0});res.json({sucesso:true});});


// ════════════════════════════════════════════════
// PACOTES FIXOS — clientes com horários reservados
// ════════════════════════════════════════════════
// Estrutura de um pacote:
// { id, cliente_id, nome, servico_id, horario, dias_semana:[0-6], data_inicio, data_fim, ativo, criado_em }
// dias_semana: 0=dom,1=seg,...,6=sab — reserva recorrente
// Pacotes fixos geram agendamentos reais com status='pacote_fixo'
// Esses agendamentos sao incluídos automaticamente na verificacao de conflito
// pois o filtro ja usa status !== 'cancelado'

function gerarBloqueiosPacote(pacote) {
  if (!_db.pacotes) _db.pacotes = [];
  const hoje  = new Date().toISOString().split('T')[0];
  const fim   = pacote.data_fim || (() => {
    const d = new Date(); d.setDate(d.getDate() + 180);
    return d.toISOString().split('T')[0];
  })();
  const inicio = (pacote.data_inicio && pacote.data_inicio > hoje) ? pacote.data_inicio : hoje;
  let d = new Date(inicio + 'T12:00:00');
  const fimDate = new Date(fim + 'T12:00:00');
  let criados = 0;
  while (d <= fimDate && criados < 300) {
    const dow  = d.getDay();
    const data = d.toISOString().split('T')[0];
    if (pacote.dias_semana.includes(dow)) {
      const jaExiste = _db.agendamentos.find(a =>
        a.pacote_id == pacote.id && a.data === data && a.status === 'pacote_fixo'
      );
      if (!jaExiste) {
        _db.agendamentos.push({
          id:          nextId('agendamentos'),
          usuario_id:  Number(pacote.cliente_id),
          servico_id:  Number(pacote.servico_id),
          pacote_id:   pacote.id,
          data,
          horario:     pacote.horario,
          status:      'pacote_fixo',
          observacoes: 'Pacote fixo: ' + pacote.nome,
          criado_em:   now()
        });
        criados++;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  saveDb();
  return criados;
}

function removerBloqueiosPacote(pacoteId) {
  if (!_db.agendamentos) return;
  _db.agendamentos = _db.agendamentos.filter(a =>
    !(a.pacote_id == pacoteId && a.status === 'pacote_fixo')
  );
  saveDb();
}

app.get('/api/pacotes', auth, adm, (req,res) => {
  loadDb();
  let list = db.pacotes();
  const dados = list.map(p => {
    const u = _db.usuarios.find(u=>u.id==p.cliente_id)||{};
    const s = _db.servicos.find(s=>s.id==p.servico_id)||{};
    return { ...p, cliente_nome:u.nome, cliente_email:u.email, servico_nome:s.nome, servico_duracao:s.duracao_min };
  }).sort((a,b)=>a.cliente_nome?.localeCompare(b.cliente_nome||'')||0);
  res.json({ sucesso:true, dados });
});

app.post('/api/pacotes', auth, adm, (req,res) => {
  loadDb();
  const { cliente_id, nome, servico_id, horario, dias_semana, data_inicio, data_fim } = req.body;
  if(!cliente_id||!servico_id||!horario||!dias_semana?.length)
    return res.status(400).json({ sucesso:false, mensagem:'Cliente, servico, horario e dias da semana sao obrigatorios.' });
  if(!db.findU(u=>u.id==cliente_id&&u.ativo))
    return res.status(404).json({ sucesso:false, mensagem:'Cliente nao encontrado.' });
  if(!db.findS(s=>s.id==servico_id&&s.ativo))
    return res.status(404).json({ sucesso:false, mensagem:'Servico nao encontrado.' });
  const novo = db.insPacote({ cliente_id:Number(cliente_id), nome:nome||'Pacote Fixo', servico_id:Number(servico_id), horario, dias_semana, data_inicio:data_inicio||null, data_fim:data_fim||null, ativo:1 });
  const criados = gerarBloqueiosPacote(novo);
  res.status(201).json({ sucesso:true, dados:novo, bloqueios_criados:criados });
});

app.put('/api/pacotes/:id', auth, adm, (req,res) => {
  loadDb();
  const p = db.findPacote(p=>p.id==req.params.id);
  if(!p) return res.status(404).json({ sucesso:false, mensagem:'Pacote nao encontrado.' });
  const { nome, servico_id, horario, dias_semana, data_inicio, data_fim, ativo } = req.body;
  db.updPacote(req.params.id, {
    nome:        nome        !== undefined ? nome               : p.nome,
    servico_id:  servico_id  !== undefined ? Number(servico_id) : p.servico_id,
    horario:     horario     !== undefined ? horario            : p.horario,
    dias_semana: dias_semana !== undefined ? dias_semana        : p.dias_semana,
    data_inicio: data_inicio !== undefined ? data_inicio        : p.data_inicio,
    data_fim:    data_fim    !== undefined ? data_fim           : p.data_fim,
    ativo:       ativo       !== undefined ? (ativo?1:0)        : p.ativo,
  });
  removerBloqueiosPacote(req.params.id);
  const pAt = db.findPacote(p=>p.id==req.params.id);
  if (pAt && pAt.ativo) gerarBloqueiosPacote(pAt);
  res.json({ sucesso:true });
});

app.delete('/api/pacotes/:id', auth, adm, (req,res) => {
  loadDb();
  removerBloqueiosPacote(req.params.id);
  db.delPacote(req.params.id);
  res.json({ sucesso:true });
});

// Regenerar todos os bloqueios (usar quando /tmp for zerado no Vercel)
app.post('/api/pacotes/regenerar', auth, adm, (req,res) => {
  loadDb();
  if (!_db.agendamentos) _db.agendamentos = [];
  _db.agendamentos = _db.agendamentos.filter(a => a.status !== 'pacote_fixo');
  let total = 0;
  db.pacotes().filter(p=>p.ativo).forEach(p => { total += gerarBloqueiosPacote(p); });
  res.json({ sucesso:true, mensagem: total + ' bloqueios regenerados para ' + db.pacotes().filter(p=>p.ativo).length + ' pacotes.', total });
});

// GET pacotes do cliente logado
app.get('/api/meus-pacotes', auth, (req,res) => {
  loadDb();
  const list = db.pacotes().filter(p=>p.cliente_id==req.usuario.id&&p.ativo);
  const dados = list.map(p => {
    const s = _db.servicos.find(s=>s.id==p.servico_id)||{};
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
    return { ...p, servico_nome:s.nome, dias_label: (p.dias_semana||[]).map(d=>dias[d]).join(', ') };
  });
  res.json({ sucesso:true, dados });
});

// ════════════════════════════════════════════════
// CONTATO — e-mail via fetch nativo
// ════════════════════════════════════════════════
app.post('/api/contato', async (req,res) => {
  try {
    const{nome,email,tel,msg}=req.body;
    if(!nome||!email||!msg) return res.status(400).json({sucesso:false,mensagem:'Nome, e-mail e mensagem obrigatorios.'});
    const dest=process.env.ADMIN_EMAIL||'vaniashsantos@hotmail.com';
    const html=`<div style="font-family:Arial,sans-serif;max-width:520px;padding:24px;background:#fdf8ef"><h2 style="color:#c8973a;font-weight:300">Nova mensagem do site</h2><p><b>Nome:</b> ${nome}</p><p><b>Email:</b> <a href="mailto:${email}">${email}</a></p><p><b>WhatsApp:</b> ${tel||'—'}</p><hr><p><b>Mensagem:</b></p><p>${msg.replace(/\n/g,'<br>')}</p></div>`;
    const enviado=await enviarEmail({para:dest,assunto:`Nova mensagem de ${nome}`,html});
    res.json({sucesso:true,mensagem:enviado?'Mensagem enviada com sucesso!':'Mensagem recebida! Retornaremos em breve.'});
  } catch(e){console.error('[Contato]',e.message);res.status(500).json({sucesso:false,mensagem:'Erro ao processar. Tente novamente.'});}
});

// ════════════════════════════════════════════════
// RESET DE SENHA
// ════════════════════════════════════════════════
app.post('/api/auth/esqueci-senha', async (req,res) => {
  try {
    loadDb();
    const{email}=req.body;
    if(!email) return res.status(400).json({sucesso:false,mensagem:'E-mail obrigatorio.'});
    const usuario=db.findU(u=>u.email===email.toLowerCase().trim()&&u.ativo);
    if(!usuario) return res.json({sucesso:true,via:'email',mensagem:'Se o e-mail estiver cadastrado, voce recebera o codigo.'});
    const codigo=String(Math.floor(100000+Math.random()*900000));
    const expira=Date.now()+30*60*1000;
    if(!_db.tokens_reset)_db.tokens_reset=[];
    _db.tokens_reset=_db.tokens_reset.filter(t=>t.usuario_id!==usuario.id);
    _db.tokens_reset.push({usuario_id:usuario.id,codigo,expira});
    saveDb();
    const nome=usuario.nome.split(' ')[0];
    const html=`<div style="font-family:Arial,sans-serif;max-width:480px;padding:32px;background:#fdf8ef;border-radius:12px"><h2 style="color:#2e2a1e;font-weight:300">Vania Herculano</h2><p>Ola, <b>${nome}</b>!</p><p>Seu codigo para redefinir a senha:</p><div style="background:#fff;border:2px solid #c8973a;border-radius:10px;padding:20px;text-align:center;margin:20px 0"><span style="font-size:2.5rem;font-weight:700;color:#c8973a;letter-spacing:.3em">${codigo}</span><p style="color:#b0a48a;font-size:.78rem;margin:8px 0 0">Valido por 30 minutos</p></div><p style="color:#b0a48a;font-size:.82rem">Se nao foi voce, ignore este e-mail.</p></div>`;
    const enviado=await enviarEmail({para:email.toLowerCase().trim(),assunto:'Codigo de recuperacao de senha — Vania Herculano',html});
    if(enviado){
      res.json({sucesso:true,via:'email',mensagem:'Codigo enviado para seu e-mail!'});
    } else {
      const telefone=usuario.telefone?usuario.telefone.replace(/\D/g,''):null;
      res.json({sucesso:true,via:'whatsapp',codigo,telefone,nome,mensagem:'Use o WhatsApp para receber o codigo.'});
    }
  } catch(e){console.error('[EsqueciSenha]',e);res.status(500).json({sucesso:false,mensagem:'Erro interno.'});}
});

app.post('/api/auth/resetar-senha', (req,res) => {
  try {
    loadDb();
    const{email,codigo,nova_senha}=req.body;
    if(!email||!codigo||!nova_senha) return res.status(400).json({sucesso:false,mensagem:'E-mail, codigo e nova senha obrigatorios.'});
    if(nova_senha.length<6) return res.status(400).json({sucesso:false,mensagem:'Senha minima: 6 caracteres.'});
    const usuario=db.findU(u=>u.email===email.toLowerCase().trim()&&u.ativo);
    if(!usuario) return res.status(404).json({sucesso:false,mensagem:'E-mail nao encontrado.'});
    if(!_db.tokens_reset)_db.tokens_reset=[];
    const token=_db.tokens_reset.find(t=>t.usuario_id===usuario.id&&t.codigo===codigo.trim());
    if(!token) return res.status(400).json({sucesso:false,mensagem:'Codigo invalido.'});
    if(Date.now()>token.expira){_db.tokens_reset=_db.tokens_reset.filter(t=>t!==token);saveDb();return res.status(400).json({sucesso:false,mensagem:'Codigo expirado. Solicite um novo.'});}
    db.updU(usuario.id,{senha:bcrypt.hashSync(nova_senha,10)});
    _db.tokens_reset=_db.tokens_reset.filter(t=>t!==token);
    saveDb();
    res.json({sucesso:true,mensagem:'Senha alterada com sucesso!'});
  } catch(e){console.error('[ResetarSenha]',e);res.status(500).json({sucesso:false,mensagem:'Erro interno.'});}
});


// Lista colaboradores e admins (superadmin ve todos)
app.get('/api/colaboradores', auth, (req,res) => {
  if(!isAnyAdmin(req))return res.status(403).json({sucesso:false,mensagem:'Sem permissao.'});
  loadDb();
  let list = _db.usuarios.filter(u=>['colaborador','admin','superadmin'].includes(u.tipo)&&u.ativo);
  res.json({sucesso:true,dados:list.map(u=>({id:u.id,nome:u.nome,email:u.email,telefone:u.telefone,tipo:u.tipo,especialidade:u.especialidade||null}))});
});

// Rota publica de profissionais — acessivel por clientes logados para agendar
app.get('/api/profissionais', auth, (req,res) => {
  loadDb();
  // Retorna todos os profissionais ativos (superadmin, admin, colaborador)
  const list = _db.usuarios.filter(u=>['colaborador','admin','superadmin'].includes(u.tipo)&&u.ativo);
  res.json({sucesso:true,dados:list.map(u=>({
    id:u.id, nome:u.nome, tipo:u.tipo,
    especialidade:u.especialidade||null,
  }))});
});

// Atualizar tipo de usuario (apenas superadmin)
app.patch('/api/usuarios/:id/tipo', auth, sadm, (req,res) => {
  loadDb();
  const {tipo} = req.body;
  if(!['cliente','colaborador','admin'].includes(tipo))
    return res.status(400).json({sucesso:false,mensagem:'Tipo invalido.'});
  db.updU(req.params.id, {tipo});
  res.json({sucesso:true});
});

app.use((_,res)=>res.status(404).json({sucesso:false,mensagem:'Rota nao encontrada.'}));
module.exports = app;
