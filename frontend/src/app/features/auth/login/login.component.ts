// features/auth/login/login.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastComponent],
  styles: [],
  template: `
    <div class="auth-page">
      <!-- Visual lateral — oculto no mobile -->
      <div class="auth-visual">
        <div class="auth-visual__content">
          <div class="auth-logo">
            <span class="mark">✦</span>
            Vania Herculano
            <em>Biomedicina Estética</em>
          </div>
          <p class="auth-tagline">"Beleza é ciência<br/>e arte em equilíbrio."</p>
          <div class="auth-orb"></div>
        </div>
      </div>

      <!-- Formulário -->
      <div class="auth-form-side">
        <div class="auth-form-wrap">
          <a routerLink="/" class="back-link">← Voltar ao site</a>
          <h1>Bem-vinda de volta</h1>
          <p class="auth-sub">Acesse sua conta para gerenciar seus agendamentos.</p>

          @if (erro()) {
            <div class="alert alert--error">{{ erro() }}</div>
          }

          <form (ngSubmit)="entrar()" class="auth-form" autocomplete="on">
            <div class="form-group">
              <label for="email">E-mail</label>
              <input
                id="email"
                [(ngModel)]="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autocomplete="email"
                inputmode="email"
                [disabled]="loading()"
              />
            </div>

            <div class="form-group" style="position:relative">
              <label for="senha">Senha</label>
              <input
                id="senha"
                [(ngModel)]="senha"
                name="senha"
                [type]="mostrarSenha ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                [disabled]="loading()"
              />
              <button
                type="button"
                class="toggle-senha"
                (click)="toggleSenha()"
                aria-label="Mostrar senha"
              >{{ mostrarSenha ? '🙈' : '👁' }}</button>
            </div>

            <button
              type="submit"
              class="btn btn--primary btn--full btn--lg"
              [disabled]="loading() || !email || !senha"
            >
              @if (loading()) {
                <span class="spinner spinner--sm"></span>&nbsp;Entrando...
              } @else {
                Entrar na Minha Conta
              }
            </button>
          </form>

          <p style="text-align:center;margin-bottom:.5rem">
            <a routerLink="/auth/reset-senha" style="font-size:.82rem;color:var(--text-muted)">
              Esqueceu a senha?
            </a>
          </p>
          <p class="auth-switch">
            Não tem conta?
            <a routerLink="/auth/registrar">Cadastre-se gratuitamente</a>
          </p>
        </div>
      </div>
    </div>
    <app-toast />
  `
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email        = '';
  senha        = '';
  mostrarSenha = false;
  loading      = signal(false);
  erro         = signal('');

  toggleSenha() { this.mostrarSenha = !this.mostrarSenha; }

  entrar() {
    if (!this.email || !this.senha) {
      this.erro.set('Preencha e-mail e senha.');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    this.auth.login(this.email.trim(), this.senha).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.sucesso) {
          setTimeout(() => this.auth.redirecionarPorPerfil(), 100);
        } else {
          this.erro.set(res.mensagem || 'Erro ao fazer login.');
        }
      },
      error: (e) => {
        this.loading.set(false);
        if (e.status === 0 || e.status === 503) {
          this.erro.set('Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente.');
        } else {
          this.erro.set(e.error?.mensagem || 'E-mail ou senha incorretos.');
        }
      }
    });
  }
}
