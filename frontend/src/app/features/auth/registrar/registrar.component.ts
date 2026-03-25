// features/auth/registrar/registrar.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastComponent],
  styles: [],
  template: `
    <div class="auth-page">
      <div class="auth-visual">
        <div class="auth-visual__content">
          <div class="auth-logo">
            <span class="mark">✦</span>
            Vania Herculano
            <em>Biomedicina Estética</em>
          </div>
          <p class="auth-tagline">"O primeiro passo<br/>é cuidar de você."</p>
          <div class="auth-orb"></div>
        </div>
      </div>

      <div class="auth-form-side">
        <div class="auth-form-wrap">
          <a routerLink="/" class="back-link">← Voltar ao site</a>
          <h1>Criar conta</h1>
          <p class="auth-sub">Cadastre-se para agendar seus tratamentos.</p>

          @if (erro()) {
            <div class="alert alert--error">{{ erro() }}</div>
          }

          <form (ngSubmit)="registrar()" class="auth-form">
            <div class="form-group">
              <label>Nome completo</label>
              <input [(ngModel)]="form.nome" name="nome" placeholder="Seu nome" required [disabled]="loading()" />
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input [(ngModel)]="form.email" name="email" type="email" placeholder="seu@email.com" required [disabled]="loading()" />
            </div>
            <div class="form-group">
              <label>WhatsApp</label>
              <input [(ngModel)]="form.telefone" name="tel" placeholder="(11) 98291-6090" [disabled]="loading()" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Senha</label>
                <input [(ngModel)]="form.senha" name="senha" type="password" placeholder="Mín. 6 caracteres" required [disabled]="loading()" />
              </div>
              <div class="form-group">
                <label>Confirmar senha</label>
                <input [(ngModel)]="confirmar" name="confirmar" type="password" placeholder="Repita a senha" required [disabled]="loading()" />
              </div>
            </div>
            <button type="submit" class="btn btn--primary btn--full btn--lg" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner spinner--sm"></span>&nbsp;Criando conta...
              } @else {
                Criar Minha Conta
              }
            </button>
          </form>

          <p class="auth-switch">
            Já tem conta? <a routerLink="/auth/login">Entrar</a>
          </p>
        </div>
      </div>
    </div>
    <app-toast />
  `
})
export class RegistrarComponent {
  private auth = inject(AuthService);

  form      = { nome: '', email: '', telefone: '', senha: '' };
  confirmar = '';
  loading   = signal(false);
  erro      = signal('');

  registrar() {
    if (!this.form.nome || !this.form.email || !this.form.senha) {
      this.erro.set('Preencha todos os campos obrigatórios.');
      return;
    }
    if (this.form.senha !== this.confirmar) {
      this.erro.set('As senhas não conferem.');
      return;
    }
    if (this.form.senha.length < 6) {
      this.erro.set('Senha deve ter ao menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    this.auth.registrar(this.form).subscribe({
      next: () => {
        this.loading.set(false);
        setTimeout(() => this.auth.redirecionarPorPerfil(), 100);
      },
      error: (e) => {
        this.loading.set(false);
        const msg = e.error?.mensagem || e.message || '';
        if (msg.includes('cadastrado')) {
          this.erro.set('Este e-mail ja esta cadastrado. Faca login ou use outro e-mail.');
        } else if (e.status === 0 || e.status === 503) {
          this.erro.set('Nao foi possivel conectar ao servidor. Verifique sua conexao.');
        } else {
          this.erro.set(msg || 'Erro ao criar conta. Tente novamente.');
        }
      }
    });
  }
}
