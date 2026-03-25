# 🌸 Vania Herculano — Biomedicina Estética
## Guia Completo de Deploy

© 2025 William Rodrigues da Silva

---

## ▶️ Rodar localmente

```bash
# 1. Backend
cd backend
npm install
npm run seed     # popula banco (só primeira vez)
npm run dev      # roda em http://localhost:3000

# 2. Frontend (outro terminal)
cd frontend
npm install
ng serve         # roda em http://localhost:4200
```

**Credenciais de teste:**
- Admin: `admin@vaniaherculano.com.br` / `admin123`
- Cliente: `maria@email.com` / `cliente123`

---

## 🚀 Deploy no Vercel (Frontend)

### Pré-requisitos
1. Conta no [vercel.com](https://vercel.com)
2. Repositório no GitHub com o projeto

### Passo a passo

**1. Faça build local para testar:**
```bash
cd frontend
npm run build
# Deve gerar a pasta: dist/lumiere-clinic/browser/
```

**2. Suba no GitHub:**
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/SEU_USUARIO/vania-herculano.git
git push -u origin main
```

**3. No Vercel:**
- Acesse vercel.com → New Project
- Importe o repositório do GitHub
- Configure:

| Campo | Valor |
|-------|-------|
| Root Directory | `frontend` |
| Framework Preset | `Angular` (ou Other) |
| Build Command | `npm run build` |
| Output Directory | `dist/lumiere-clinic/browser` |
| Install Command | `npm install` |

**4. Variável de Ambiente:**
- Vá em Settings → Environment Variables
- Adicione: `API_URL` = URL do seu backend

---

## 🖥️ Deploy do Backend (Railway - gratuito)

**1.** Acesse [railway.app](https://railway.app)

**2.** New Project → Deploy from GitHub Repo

**3.** Selecione seu repositório e configure:
- Root Directory: `backend`
- Start Command: `npm start`

**4.** Variáveis de ambiente no Railway:
```
PORT=3000
JWT_SECRET=vania_herculano_secret_2025_ultra_secure
JWT_EXPIRES_IN=7d
NODE_ENV=production
DB_PATH=./src/database/vaniaherculano.db
```

**5.** Copie a URL gerada (ex: `https://vania-api.up.railway.app`)

**6.** Cole no frontend em `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://vania-api.up.railway.app/api'
};
```

---

## 🔧 Alternativas de hospedagem

| Serviço | Tipo | Gratuito |
|---------|------|----------|
| **Vercel** | Frontend (Angular) | ✅ Sim |
| **Railway** | Backend (Node.js) | ✅ Plano grátis |
| **Render** | Backend (Node.js) | ✅ Plano grátis |
| **Netlify** | Frontend (Angular) | ✅ Sim |
| **Fly.io** | Fullstack | ✅ Plano grátis |

---

## 📁 Estrutura do Projeto

```
vania-herculano/
├── frontend/                    ← Angular 17
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           ← Guards, Interceptors, Services
│   │   │   ├── shared/         ← Toast, componentes reutilizáveis
│   │   │   └── features/       ← Páginas e módulos
│   │   │       ├── public/     ← Site institucional
│   │   │       ├── auth/       ← Login e Registro
│   │   │       ├── cliente/    ← Área do cliente
│   │   │       └── admin/      ← Painel administrativo
│   │   ├── environments/
│   │   └── styles.scss         ← Design system global
│   ├── angular.json
│   └── package.json
│
├── backend/                     ← Node.js + Express + SQLite
│   ├── src/
│   │   ├── controllers/        ← Lógica de negócio
│   │   ├── database/           ← SQLite schema + seed
│   │   ├── middleware/         ← JWT auth
│   │   └── routes/             ← Endpoints da API
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 🔐 Endpoints da API

| Método | Rota | Autenticação |
|--------|------|--------------|
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/registrar` | Público |
| GET | `/api/servicos` | Público |
| GET | `/api/agendamentos` | JWT |
| POST | `/api/agendamentos` | JWT |
| PATCH | `/api/agendamentos/:id/status` | Admin |
| GET | `/api/dashboard/resumo` | Admin |
| GET | `/api/dashboard/financeiro` | Admin |
