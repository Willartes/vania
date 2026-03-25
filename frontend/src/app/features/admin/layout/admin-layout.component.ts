// features/admin/layout/admin-layout.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  styles: [`
    .mob-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:595; }
    .mob-overlay.on { display:block; }
    .mob-topbar { display:none;position:sticky;top:0;z-index:200;background:var(--pearl);border-bottom:1px solid var(--champagne);padding:0 1rem;height:56px;align-items:center;justify-content:space-between;box-shadow:0 1px 8px rgba(0,0,0,.06); }
    .mob-hamburger { width:38px;height:38px;border:1.5px solid var(--champagne);border-radius:var(--radius-md);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:var(--pearl);cursor:pointer; }
    .mob-hamburger span { display:block;width:18px;height:1.5px;background:var(--text);transition:all .25s; }
    .mob-hamburger.open span:nth-child(1) { transform:translateY(6.5px) rotate(45deg); }
    .mob-hamburger.open span:nth-child(2) { opacity:0; }
    .mob-hamburger.open span:nth-child(3) { transform:translateY(-6.5px) rotate(-45deg); }
    .bottom-nav { display:none;position:fixed;bottom:0;left:0;right:0;z-index:300;background:var(--pearl);border-top:1px solid var(--champagne);box-shadow:0 -4px 20px rgba(0,0,0,.08);height:60px; }
    .bottom-nav__inner { display:flex;align-items:stretch;height:100%; }
    .bottom-nav__item { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-decoration:none;color:var(--text-muted);font-size:.52rem;letter-spacing:.04em;text-transform:uppercase;font-weight:500;transition:color .2s;cursor:pointer;border:none;background:none;font-family:var(--font-body);padding:.3rem .1rem; }
    .bottom-nav__item .nav-icon { font-size:1.1rem;line-height:1; }
    .bottom-nav__item:hover, .bottom-nav__item.active { color:var(--gold-dark); }
    .tipo-badge-top { font-size:.58rem;padding:.15rem .5rem;border-radius:20px;font-weight:600;letter-spacing:.06em;text-transform:uppercase; }
    .superadmin-badge { background:#e8d5f0;color:#6b2fa0; }
    .admin-badge      { background:var(--gold-ultra);color:var(--gold-dark); }
    .colab-badge      { background:#e3f0ff;color:#1a5fa0; }
    @media(max-width:900px) { .mob-topbar{display:flex;} .bottom-nav{display:block;} .admin-main{padding-bottom:72px!important;} }
  `],
  template: `
    <div class="admin-layout">
      <aside class="sidebar" [class.sidebar-open]="menuOpen()">
        <div class="sidebar__brand">
          <a routerLink="/" class="sidebar__logo" (click)="fechar()">
            <span class="s-mark">✦</span>
            <span class="s-name">Vania Herculano</span>
            <span class="s-sub">
              @if (auth.isSuperAdmin()) { Super Admin }
              @else if (auth.isColaborador()) { Colaborador }
              @else { Admin }
            </span>
          </a>
        </div>

        <nav class="sidebar__nav">
          <span class="sidebar__section-label">Principal</span>
          <a routerLink="/admin/dashboard"    routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">⊞</span> Dashboard</a>
          <a routerLink="/admin/agendamentos" routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">📅</span> Agendamentos</a>

          <span class="sidebar__section-label" style="margin-top:.8rem">Configuracoes</span>
          <a routerLink="/admin/agenda"       routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">🗓</span> Minha Agenda</a>
          <a routerLink="/admin/servicos"     routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">💎</span> Servicos</a>

          <!-- Pacotes Fixos para todos os tipos admin -->
          <a routerLink="/admin/pacotes"    routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">📦</span> Pacotes Fixos</a>

          <!-- Clientes e Financeiro para todos os admin tipos -->
          <a routerLink="/admin/clientes"   routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">👥</span> Clientes</a>
          <a routerLink="/admin/financeiro" routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">💰</span> {{ auth.isColaborador() ? 'Meu Financeiro' : 'Financeiro' }}</a>

          @if (auth.isSuperAdmin()) {
            <span class="sidebar__section-label" style="margin-top:.8rem">Super Admin</span>
            <a routerLink="/admin/equipe"     routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">🏢</span> Equipe</a>
            <a routerLink="/admin/relatorio"  routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">📊</span> Relatorio Geral</a>
          }

          <a routerLink="/" class="sidebar__link" style="margin-top:1.2rem;opacity:.6" (click)="fechar()"><span class="icon">←</span> Ver Site</a>
        </nav>

        <div class="sidebar__footer">
          <div class="user-info">
            <div class="user-avatar">{{ inicial() }}</div>
            <div>
              <strong>{{ auth.usuario()?.nome }}</strong>
              <span class="tipo-badge-top"
                [class.superadmin-badge]="auth.isSuperAdmin()"
                [class.admin-badge]="auth.usuario()?.tipo==='admin'"
                [class.colab-badge]="auth.isColaborador()"
              >{{ auth.usuario()?.tipo }}</span>
            </div>
          </div>
          <button class="sidebar__link" style="width:100%;margin-top:.6rem;color:var(--text-muted)" (click)="auth.logout()">
            <span class="icon">↩</span> Sair
          </button>
        </div>
      </aside>

      <div class="mob-overlay" [class.on]="menuOpen()" (click)="fechar()"></div>

      <div class="admin-content">
        <header class="admin-topbar">
          <span style="font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)">
            @if (auth.isSuperAdmin()) { Super Administrador }
            @else if (auth.isColaborador()) { Colaborador }
            @else { Painel Administrativo }
          </span>
          <span style="font-size:.82rem;color:var(--text-muted)">{{ dataHoje() }}</span>
        </header>

        <div class="mob-topbar">
          <span style="font-family:var(--font-display);font-size:1rem;color:var(--text)">✦ Admin</span>
          <button class="mob-hamburger" [class.open]="menuOpen()" (click)="toggleMenu()">
            <span></span><span></span><span></span>
          </button>
        </div>

        <main class="admin-main"><router-outlet /></main>
      </div>
    </div>

    <!-- Bottom nav adaptado ao tipo -->
    <nav class="bottom-nav">
      <div class="bottom-nav__inner">
        <a routerLink="/admin/dashboard"    routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">⊞</span>Dashboard</a>
        <a routerLink="/admin/agendamentos" routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">📅</span>Agenda</a>
        <a routerLink="/admin/agenda"       routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">🗓</span>Horarios</a>
        @if (auth.isSuperAdmin()) {
          <a routerLink="/admin/equipe"     routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">🏢</span>Equipe</a>
          <a routerLink="/admin/relatorio"  routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">📊</span>Relatorio</a>
        } @else if (auth.isAdminPlus()) {
          <a routerLink="/admin/clientes"   routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">👥</span>Clientes</a>
          <a routerLink="/admin/financeiro" routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">💰</span>Financeiro</a>
        } @else {
          <a routerLink="/admin/clientes"   routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">👥</span>Clientes</a>
          <a routerLink="/admin/financeiro" routerLinkActive="active" class="bottom-nav__item"><span class="nav-icon">💰</span>Financeiro</a>
        }
      </div>
    </nav>

    <app-toast />
  `
})
export class AdminLayoutComponent {
  auth     = inject(AuthService);
  menuOpen = signal(false);
  inicial  = () => this.auth.usuario()?.nome?.[0].toUpperCase() || 'A';
  dataHoje = () => new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

  @HostListener('document:keydown.escape') onEsc()    { this.menuOpen.set(false); }
  @HostListener('window:resize')           onResize() { if (window.innerWidth > 900) this.menuOpen.set(false); }
  toggleMenu() { this.menuOpen.update(v => !v); }
  fechar()     { this.menuOpen.set(false); }
}
