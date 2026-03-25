// app.routes.ts — Vania Herculano
// © 2025 William Rodrigues da Silva
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, superAdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  // ── Público ────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/public/layout/public-layout.component')
        .then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/public/home/home.component')
            .then(m => m.HomeComponent)
      },
      {
        path: 'sobre',
        loadComponent: () =>
          import('./features/public/sobre/sobre.component')
            .then(m => m.SobreComponent)
      },
      {
        path: 'servicos',
        loadComponent: () =>
          import('./features/public/servicos-publico/servicos-publico.component')
            .then(m => m.ServicosPublicoComponent)
      },
      {
        path: 'contato',
        loadComponent: () =>
          import('./features/public/contato/contato.component')
            .then(m => m.ContatoComponent)
      },
    ]
  },

  // ── Auth (SEM guard no pai — guard é feito dentro do componente) ──
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'auth/registrar',
    loadComponent: () =>
      import('./features/auth/registrar/registrar.component')
        .then(m => m.RegistrarComponent)
  },
  {
    path: 'auth/reset-senha',
    loadComponent: () =>
      import('./features/auth/reset-senha/reset-senha.component')
        .then(m => m.ResetSenhaComponent)
  },
  {
    path: 'auth',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // ── Área do Cliente ────────────────────────────────────
  {
    path: 'cliente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cliente/layout/cliente-layout.component')
        .then(m => m.ClienteLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/cliente/dashboard/cliente-dashboard.component')
            .then(m => m.ClienteDashboardComponent)
      },
      {
        path: 'agendar',
        loadComponent: () =>
          import('./features/cliente/agendar/agendar.component')
            .then(m => m.AgendarComponent)
      },
      {
        path: 'agendamentos',
        loadComponent: () =>
          import('./features/cliente/agendamentos/meus-agendamentos.component')
            .then(m => m.MeusAgendamentosComponent)
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/cliente/perfil/perfil.component')
            .then(m => m.PerfilComponent)
      },
      {
        path: 'servicos',
        loadComponent: () =>
          import('./features/cliente/servicos/cliente-servicos.component')
            .then(m => m.ClienteServicosComponent)
      },
      {
        path: 'pacotes',
        loadComponent: () =>
          import('./features/cliente/pacotes/meus-pacotes.component')
            .then(m => m.MeusPacotesComponent)
      },
    ]
  },

  // ── Área Admin ─────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'agendamentos',
        loadComponent: () =>
          import('./features/admin/agendamentos/admin-agendamentos.component')
            .then(m => m.AdminAgendamentosComponent)
      },
      {
        path: 'servicos',
        loadComponent: () =>
          import('./features/admin/servicos/admin-servicos.component')
            .then(m => m.AdminServicosComponent)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin/clientes/admin-clientes.component')
            .then(m => m.AdminClientesComponent)
      },
      {
        path: 'financeiro',
        loadComponent: () =>
          import('./features/admin/financeiro/financeiro.component')
            .then(m => m.FinanceiroComponent)
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/admin/agenda/admin-agenda.component')
            .then(m => m.AdminAgendaComponent)
      },
      {
        path: 'pacotes',
        loadComponent: () =>
          import('./features/admin/pacotes/admin-pacotes.component')
            .then(m => m.AdminPacotesComponent)
      },
      {
        path: 'equipe',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/equipe/admin-equipe.component')
            .then(m => m.AdminEquipeComponent)
      },
      {
        path: 'relatorio',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/relatorio/admin-relatorio.component')
            .then(m => m.AdminRelatorioComponent)
      },
    ]
  },

  // ── Fallback — qualquer rota desconhecida volta para home ──
  { path: '**', redirectTo: '', pathMatch: 'full' }

];
