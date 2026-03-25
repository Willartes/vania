// features/auth/reset-senha/reset-senha.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ResetSenhaService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [],
  template: `
    <div class="auth-page">
      <div class="auth-visual">
        <div class="auth-visual__content">
          <div class="auth-logo">
            <span class="mark">✦</span>
            Vania Herculano
            <em>Biomedicina Estetica</em>
          </div>
          <p class="auth-tagline">"Recupere seu acesso<br/>com seguranca."</p>
          <div class="auth-orb"></div>
        </div>
      </div>

      <div class="auth-form-side">
        <div class="auth-form-wrap">
          <a routerLink="/auth/login" class="back-link">← Voltar ao login</a>

          <!-- ETAPA 1: digitar e-mail -->
          @if (etapa() === 1) {
            <h1>Esqueceu a senha?</h1>
            <p class="auth-sub">
              Digite seu e-mail cadastrado. Enviaremos um codigo de verificacao
              via WhatsApp para redefinir sua senha.
            </p>

            @if (erro()) {
              <div class="alert alert--error">{{ erro() }}</div>
            }

            <form (ngSubmit)="solicitarCodigo()" class="auth-form">
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
              <button
                type="submit"
                class="btn btn--primary btn--full btn--lg"
                [disabled]="loading() || !email"
              >
                @if (loading()) {
                  <span class="spinner spinner--sm"></span>&nbsp;Enviando...
                } @else {
                  Enviar Codigo
                }
              </button>
            </form>

            <p class="auth-switch">
              Lembrou a senha? <a routerLink="/auth/login">Fazer login</a>
            </p>
          }

          <!-- ETAPA 2: enviar via WhatsApp e digitar código -->
          @if (etapa() === 2) {
            <h1>Verificar codigo</h1>
            <!-- Via e-mail -->
            @if (via === 'email') {
              <div class="alert alert--success" style="margin-bottom:1.2rem">
                ✉️ Codigo enviado para <strong>{{ email }}</strong>.<br>
                <small>Verifique sua caixa de entrada e pasta de spam.</small>
              </div>
            }

            <!-- Via WhatsApp (fallback) -->
            @if (via === 'whatsapp') {
              <p class="auth-sub">
                Clique no botao abaixo para receber o codigo pelo WhatsApp.
              </p>
              <button
                type="button"
                class="btn btn--full"
                style="background:#25d366;color:#fff;margin-bottom:1.2rem;gap:.6rem;border:none"
                (click)="abrirWhatsApp()"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Receber codigo pelo WhatsApp
              </button>
              <div style="text-align:center;margin:-0.5rem 0 1rem;font-size:.8rem;color:var(--text-muted)">
                ou ja tenho o codigo
              </div>
            }

            @if (erro()) {
              <div class="alert alert--error">{{ erro() }}</div>
            }

            <form (ngSubmit)="verificarCodigo()" class="auth-form">
              <div class="form-group">
                <label for="codigo">Codigo de verificacao (6 digitos)</label>
                <input
                  id="codigo"
                  [(ngModel)]="codigo"
                  name="codigo"
                  type="text"
                  placeholder="123456"
                  maxlength="6"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  [disabled]="loading()"
                  style="letter-spacing:.3em;font-size:1.2rem;text-align:center"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="novaSenha">Nova senha</label>
                  <input
                    id="novaSenha"
                    [(ngModel)]="novaSenha"
                    name="novaSenha"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    [disabled]="loading()"
                  />
                </div>
                <div class="form-group">
                  <label for="confirmar">Confirmar senha</label>
                  <input
                    id="confirmar"
                    [(ngModel)]="confirmar"
                    name="confirmar"
                    type="password"
                    placeholder="Repita a senha"
                    [disabled]="loading()"
                  />
                </div>
              </div>
              <button
                type="submit"
                class="btn btn--primary btn--full btn--lg"
                [disabled]="loading() || !codigo || !novaSenha || !confirmar"
              >
                @if (loading()) {
                  <span class="spinner spinner--sm"></span>&nbsp;Salvando...
                } @else {
                  Redefinir Senha
                }
              </button>
            </form>

            <div style="margin-top:1rem;text-align:center">
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                (click)="voltarEtapa1()"
                style="font-size:.75rem"
              >
                Nao recebi — usar outro e-mail
              </button>
            </div>
          }

          <!-- ETAPA 3: sucesso -->
          @if (etapa() === 3) {
            <div style="text-align:center;padding:2rem 0">
              <div style="width:64px;height:64px;border-radius:50%;background:rgba(46,125,82,.1);
                color:var(--success);font-size:1.8rem;display:flex;align-items:center;
                justify-content:center;margin:0 auto 1.2rem">
                ✓
              </div>
              <h1 style="margin-bottom:.6rem">Senha redefinida!</h1>
              <p class="auth-sub">
                Sua senha foi alterada com sucesso.
                Faca login com sua nova senha.
              </p>
              <a routerLink="/auth/login" class="btn btn--primary btn--lg" style="margin-top:1.5rem">
                Ir para o Login
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ResetSenhaComponent {
  private resetApi = inject(ResetSenhaService);
  private toast    = inject(ToastService);
  private router   = inject(Router);

  etapa    = signal(1);
  loading  = signal(false);
  erro     = signal('');

  email     = '';
  codigo    = '';
  novaSenha = '';
  confirmar = '';

  // Dados retornados pelo backend
  via           = 'whatsapp'; // 'email' | 'whatsapp'
  private codigoGerado  = '';
  private telefoneUser  = '';
  private nomeUser      = '';

  solicitarCodigo() {
    if (!this.email) { this.erro.set('Digite seu e-mail.'); return; }
    this.loading.set(true);
    this.erro.set('');

    this.resetApi.esqueciSenha(this.email.trim()).subscribe({
      next: r => {
        this.loading.set(false);
        if (r.sucesso) {
          this.via = (r as any).via || 'whatsapp';
          this.codigoGerado = (r as any).codigo || '';
          this.telefoneUser = (r as any).telefone || '';
          this.nomeUser     = (r as any).nome || 'cliente';
          this.etapa.set(2);
          if (this.via === 'email') {
            this.toast.success('Codigo enviado para seu e-mail!');
          }
        }
      },
      error: (e: any) => {
        this.loading.set(false);
        if (e.status === 0 || e.status === 503) {
          this.erro.set('Nao foi possivel conectar ao servidor. Verifique sua conexao.');
        } else {
          this.erro.set(e.error?.mensagem || 'Erro ao processar. Tente novamente.');
        }
      }
    });
  }

  abrirWhatsApp() {
    if (!this.codigoGerado) {
      this.toast.error('Solicite o codigo primeiro.');
      return;
    }

    // Numero do usuario ou numero de contato da clinica
    const tel = this.telefoneUser
      ? '55' + this.telefoneUser.replace(/\D/g, '')
      : '5511982916090'; // numero da clinica como fallback

    const msg =
      `Ola, ${this.nomeUser}!\n\n` +
      `Seu codigo de recuperacao de senha da\n` +
      `*Vania Herculano Biomedicina Estetica* e:\n\n` +
      `🔑 *${this.codigoGerado}*\n\n` +
      `Este codigo expira em 30 minutos.\n` +
      `Nao compartilhe com ninguem.\n\n` +
      `Se nao foi voce quem solicitou, ignore esta mensagem.`;

    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener'
    );

    this.toast.success('WhatsApp aberto! Envie a mensagem e anote o codigo.');
  }

  verificarCodigo() {
    if (!this.codigo || this.codigo.length < 6) {
      this.erro.set('Digite o codigo de 6 digitos.');
      return;
    }
    if (!this.novaSenha || this.novaSenha.length < 6) {
      this.erro.set('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (this.novaSenha !== this.confirmar) {
      this.erro.set('As senhas nao conferem.');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    this.resetApi.resetarSenha(this.email.trim(), this.codigo.trim(), this.novaSenha).subscribe({
      next: r => {
        this.loading.set(false);
        if (r.sucesso) {
          this.etapa.set(3);
        } else {
          this.erro.set(r.mensagem || 'Codigo invalido ou expirado.');
        }
      },
      error: e => {
        this.loading.set(false);
        this.erro.set(e.error?.mensagem || 'Erro ao validar. Tente novamente.');
      }
    });
  }

  voltarEtapa1() {
    this.etapa.set(1);
    this.erro.set('');
    this.codigo = '';
    this.novaSenha = '';
    this.confirmar = '';
    this.codigoGerado = '';
  }
}
