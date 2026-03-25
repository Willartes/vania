// features/public/layout/public-layout.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  styles: [`
    /* ── Overlay escuro ao abrir o menu mobile ── */
    .menu-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 595;
      animation: fadeIn .25s ease;
    }
    .menu-overlay.visible { display: block; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    /* ── Botão fechar dentro do drawer ── */
    .menu-close {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      width: 36px;
      height: 36px;
      border: 1.5px solid var(--champagne);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: var(--text-light);
      cursor: pointer;
      background: var(--pearl);
      transition: all .2s;
    }
    .menu-close:hover { border-color: var(--gold); color: var(--gold); }

    /* ── Logo do menu mobile ── */
    .menu-logo {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.2rem;
      border-bottom: 2px solid var(--gold);
    }
    .menu-logo .m-name {
      font-family: var(--font-display);
      font-size: 1.1rem;
      color: var(--text);
      display: block;
      line-height: 1.1;
    }
    .menu-logo .m-sub {
      font-size: .58rem;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--gold);
      display: block;
    }

    /* ── Ações dentro do drawer mobile ── */
    .menu-actions {
      display: flex;
      flex-direction: column;
      gap: .7rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--champagne);
    }
    .menu-actions .btn { justify-content: center; }

    /* ── Hambúrguer acima do overlay ── */
    .hamburger { z-index: 610 !important; }
  `],
  template: `
    <div class="pub-layout">

      <!-- NAVBAR -->
      <nav class="pub-nav" [class.scrolled]="scrolled()">
        <div class="pub-nav__inner">

          <!-- Logo -->
          <a routerLink="/" class="pub-nav__logo" (click)="fecharMenu()">
            <span class="nav-mark">✦</span>
            <div>
              <span class="nav-name">Vania Herculano</span>
              <span class="nav-sub">Biomedicina Estética</span>
            </div>
          </a>

          <!-- Links desktop -->
          <ul class="pub-nav__links" [class.open]="menuOpen()">

            <!-- Botão fechar (só mobile) -->
            <button class="menu-close" (click)="fecharMenu()" aria-label="Fechar menu">✕</button>

            <!-- Logo dentro do drawer mobile -->
            <li class="menu-logo" style="list-style:none">
              <span class="nav-mark" style="color:var(--gold)">✦</span>
              <div>
                <span class="m-name">Vania Herculano</span>
                <span class="m-sub">Biomedicina Estética</span>
              </div>
            </li>

            <!-- Links de navegação -->
            <li><a routerLink="/"         routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="fecharMenu()">🏠 Home</a></li>
            <li><a routerLink="/sobre"    routerLinkActive="active" (click)="fecharMenu()">✦ Sobre</a></li>
            <li><a routerLink="/servicos" routerLinkActive="active" (click)="fecharMenu()">💎 Serviços</a></li>
            <li><a routerLink="/contato"  routerLinkActive="active" (click)="fecharMenu()">📞 Contato</a></li>

            <!-- Ações (Login/Agendar) dentro do drawer mobile -->
            <li class="menu-actions" style="list-style:none">
              @if (auth.logado()) {
                <a [routerLink]="auth.isAdmin() ? '/admin/dashboard' : '/cliente/dashboard'"
                   class="btn btn--primary btn--full" (click)="fecharMenu()">
                  Minha Área
                </a>
                <button class="btn btn--ghost btn--full" (click)="auth.logout()">Sair</button>
              } @else {
                <a routerLink="/auth/registrar" class="btn btn--primary btn--full" (click)="fecharMenu()">Agendar Consulta</a>
                <a routerLink="/auth/login"     class="btn btn--ghost btn--full"   (click)="fecharMenu()">Entrar</a>
              }
            </li>
          </ul>

          <!-- Botões desktop -->
          <div class="pub-nav__actions">
            @if (auth.logado()) {
              <a [routerLink]="auth.isAdmin() ? '/admin/dashboard' : '/cliente/dashboard'"
                 class="btn btn--ghost btn--sm">Minha Área</a>
            } @else {
              <a routerLink="/auth/login"     class="btn btn--ghost btn--sm">Login</a>
              <a routerLink="/auth/registrar" class="btn btn--primary btn--sm">Agendar</a>
            }
          </div>

          <!-- Hambúrguer -->
          <button
            class="hamburger"
            (click)="toggleMenu()"
            [class.open]="menuOpen()"
            aria-label="Menu"
            [attr.aria-expanded]="menuOpen()"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <!-- Overlay escuro (fecha ao clicar fora) -->
      <div
        class="menu-overlay"
        [class.visible]="menuOpen()"
        (click)="fecharMenu()"
        aria-hidden="true"
      ></div>

      <!-- Conteúdo -->
      <main class="pub-main">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="pub-footer">
        <div class="pub-footer__top">
          <div class="container">
            <div class="pub-footer__grid">
              <div class="pub-footer__brand">
                <div class="f-logo">
                  <span class="nav-mark">✦</span>
                  <div>
                    <span class="nav-name" style="color:#fff">Vania Herculano</span>
                    <span class="nav-sub" style="color:rgba(255,255,255,.45)">Biomedicina Estética</span>
                  </div>
                </div>
                <p>Tratamentos estéticos de alta performance com resultados naturais, segurança e excelência.</p>
                <div class="footer-social">
                  <a href="#" aria-label="Instagram">IG</a>
                  <a href="#" aria-label="Facebook">FB</a>
                  <a href="#" aria-label="YouTube">YT</a>
                </div>
              </div>
              <div>
                <h4>Tratamentos</h4>
                <ul>
                  <li><a routerLink="/servicos">Toxina Botulínica</a></li>
                  <li><a routerLink="/servicos">Bioestimulador</a></li>
                  <li><a routerLink="/servicos">Preenchimento Facial</a></li>
                  <li><a routerLink="/servicos">Laser CO₂</a></li>
                  <li><a routerLink="/servicos">Skinbooster</a></li>
                </ul>
              </div>
              <div>
                <h4>Clínica</h4>
                <ul>
                  <li><a routerLink="/sobre">Nossa História</a></li>
                  <li><a routerLink="/sobre">Equipe</a></li>
                  <li><a routerLink="/contato">Contato</a></li>
                  <li><a routerLink="/auth/registrar">Agendamento</a></li>
                </ul>
              </div>
              <div>
                <h4>Contato</h4>
                <ul>
                  <li>Av. Brig. Faria Lima, 3900</li>
                  <li>Itaim Bibi — São Paulo, SP</li>
                  <li><a href="tel:+5511982916090">(11) 98291-6090</a></li>
                  <li>Seg–Sex: 9h–19h | Sáb: 9h–14h</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="pub-footer__bottom">
          <div class="container">
            <p>© {{ ano }} Vania Herculano Biomedicina Estética. Todos os direitos reservados. William Rodrigues da Silva.</p>
            <div class="footer-legal">
              <a href="#">Privacidade</a>
              <a href="#">Termos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>

    <!-- WhatsApp flutuante -->
    <a href="https://wa.me/5511982916090" class="whatsapp-btn" target="_blank" rel="noopener" title="WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>

    <app-toast />
  `
})
export class PublicLayoutComponent {
  auth     = inject(AuthService);
  scrolled = signal(false);
  menuOpen = signal(false);
  ano      = new Date().getFullYear();

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 40); }

  @HostListener('window:resize')
  onResize() {
    // Fecha o menu se a janela crescer para desktop
    if (window.innerWidth > 900) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.menuOpen.set(false); }

  toggleMenu() { this.menuOpen.update(v => !v); }
  fecharMenu() { this.menuOpen.set(false); }
}
