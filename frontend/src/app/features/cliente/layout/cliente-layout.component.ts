// features/cliente/layout/cliente-layout.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  styles: [`
    /* Menu mobile para área logada */
    .mob-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 595;
    }
    .mob-overlay.on { display: block; }

    .mob-topbar {
      display: none;
      position: sticky; top: 0; z-index: 200;
      background: var(--pearl);
      border-bottom: 1px solid var(--champagne);
      padding: 0 1rem;
      height: 56px;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 8px rgba(0,0,0,.06);
    }
    .mob-hamburger {
      width: 38px; height: 38px; border: 1.5px solid var(--champagne);
      border-radius: var(--radius-md); display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 5px;
      background: var(--pearl); cursor: pointer;
    }
    .mob-hamburger span {
      display: block; width: 18px; height: 1.5px;
      background: var(--text); transition: all .25s;
    }
    .mob-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .mob-hamburger.open span:nth-child(2) { opacity: 0; }
    .mob-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

    @media (max-width: 900px) {
      .mob-topbar { display: flex; }
    }

    /* Bottom nav mobile — navegação por abas */
    .bottom-nav {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
      background: var(--pearl);
      border-top: 1px solid var(--champagne);
      box-shadow: 0 -4px 20px rgba(0,0,0,.08);
      padding: 0;
      height: 60px;
    }
    .bottom-nav__inner {
      display: flex; align-items: stretch; height: 100%;
    }
    .bottom-nav__item {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 2px;
      text-decoration: none; color: var(--text-muted);
      font-size: .55rem; letter-spacing: .05em;
      text-transform: uppercase; font-weight: 500;
      transition: color .2s; cursor: pointer; border: none;
      background: none; font-family: var(--font-body);
      padding: .4rem .2rem;
    }
    .bottom-nav__item .nav-icon { font-size: 1.2rem; line-height: 1; }
    .bottom-nav__item:hover,
    .bottom-nav__item.active { color: var(--gold-dark); }
    .bottom-nav__item.active .nav-icon { transform: scale(1.1); }

    @media (max-width: 900px) {
      .bottom-nav { display: block; }
      /* Espaço para o bottom nav não cobrir conteúdo */
      .admin-main { padding-bottom: 72px !important; }
    }
  `],
  template: `
    <div class="admin-layout">

      <!-- SIDEBAR — desktop -->
      <aside class="sidebar" [class.sidebar-open]="menuOpen()">
        <div class="sidebar__brand">
          <a routerLink="/" class="sidebar__logo" (click)="fechar()">
            <span class="s-mark">✦</span>
            <span class="s-name">Vania Herculano</span>
            <span class="s-sub">Minha Área</span>
          </a>
        </div>
        <nav class="sidebar__nav">
          <a routerLink="/cliente/dashboard"    routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">⊞</span> Dashboard</a>
          <a routerLink="/cliente/agendar"      routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">📅</span> Novo Agendamento</a>
          <a routerLink="/cliente/agendamentos" routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">📋</span> Meus Agendamentos</a>
          <a routerLink="/cliente/perfil"       routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">👤</span> Meu Perfil</a>
          <a routerLink="/cliente/servicos"     routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">💎</span> Nossos Servicos</a>
          <a routerLink="/cliente/pacotes"      routerLinkActive="active" class="sidebar__link" (click)="fechar()"><span class="icon">📦</span> Meus Pacotes</a>
          <a routerLink="/"                                                class="sidebar__link" style="margin-top:1rem;opacity:.6" (click)="fechar()"><span class="icon">🏠</span> Site</a>
        </nav>
        <div class="sidebar__footer">
          <div class="user-info">
            <div class="user-avatar">{{ inicial() }}</div>
            <div><strong>{{ auth.usuario()?.nome }}</strong><span>Cliente</span></div>
          </div>
          <button class="sidebar__link" style="width:100%;margin-top:.6rem;color:var(--text-muted)" (click)="auth.logout()">
            <span class="icon">↩</span> Sair
          </button>
        </div>
      </aside>

      <!-- OVERLAY mobile (fecha ao clicar fora) -->
      <div class="mob-overlay" [class.on]="menuOpen()" (click)="fechar()"></div>

      <div class="admin-content">
        <!-- TOPBAR DESKTOP -->
        <header class="admin-topbar">
          <span style="font-family:var(--font-display);font-size:1.1rem;font-weight:300">
            Olá, <em>{{ primeiroNome() }}</em> 👋
          </span>
          <a routerLink="/cliente/agendar" class="btn btn--primary btn--sm">+ Agendar</a>
        </header>

        <!-- TOPBAR MOBILE (só aparece em < 900px) -->
        <div class="mob-topbar">
          <a routerLink="/cliente/dashboard" style="display:flex;align-items:center;gap:.5rem;text-decoration:none">
            <span style="color:var(--gold);font-size:.75rem">✦</span>
            <span style="font-family:var(--font-display);font-size:1rem;color:var(--text)">Minha Área</span>
          </a>
          <div style="display:flex;align-items:center;gap:.6rem">
            <a routerLink="/cliente/agendar" class="btn btn--primary btn--sm">+ Agendar</a>
            <button class="mob-hamburger" [class.open]="menuOpen()" (click)="toggleMenu()">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <main class="admin-main">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- BOTTOM NAV mobile -->
    <nav class="bottom-nav">
      <div class="bottom-nav__inner">
        <a routerLink="/cliente/dashboard"    routerLinkActive="active" class="bottom-nav__item">
          <span class="nav-icon">⊞</span> Início
        </a>
        <a routerLink="/cliente/agendar"      routerLinkActive="active" class="bottom-nav__item">
          <span class="nav-icon">📅</span> Agendar
        </a>
        <a routerLink="/cliente/agendamentos" routerLinkActive="active" class="bottom-nav__item">
          <span class="nav-icon">📋</span> Histórico
        </a>
        <a routerLink="/cliente/pacotes"      routerLinkActive="active" class="bottom-nav__item">
          <span class="nav-icon">📦</span> Pacotes
        </a>
        <a routerLink="/cliente/perfil"       routerLinkActive="active" class="bottom-nav__item">
          <span class="nav-icon">👤</span> Perfil
        </a>
      </div>
    </nav>

    <app-toast />
  `
})
export class ClienteLayoutComponent {
  auth      = inject(AuthService);
  menuOpen  = signal(false);
  inicial      = () => this.auth.usuario()?.nome?.[0].toUpperCase() || 'U';
  primeiroNome = () => this.auth.usuario()?.nome?.split(' ')[0] || '';

  @HostListener('document:keydown.escape') onEsc() { this.menuOpen.set(false); }
  @HostListener('window:resize')           onResize() { if (window.innerWidth > 900) this.menuOpen.set(false); }

  toggleMenu() { this.menuOpen.update(v => !v); }
  fechar()     { this.menuOpen.set(false); }
}
