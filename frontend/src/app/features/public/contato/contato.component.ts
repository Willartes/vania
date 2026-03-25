// features/public/contato/contato.component.ts
// © 2025 William Rodrigues da Silva
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contato',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [],
  template: `
    <div>
      <div class="page-hero"><div class="container">
        <p class="section-overline">Fale Conosco</p>
        <h1>Entre em <em>Contato</em></h1>
        <p>Estamos prontas para atendê-la e responder todas as suas dúvidas.</p>
      </div></div>

      <section style="padding:6rem 0;background:var(--cream)"><div class="container">
        <div class="contato-grid">

          <!-- Informacoes -->
          <div>
            <h2 class="section-title">Informações de <em>atendimento</em></h2>
            <div class="info-items">
              @for (i of infos; track i.label) {
                <div class="info-item">
                  <span class="info-icon">{{ i.icon }}</span>
                  <div><strong>{{ i.label }}</strong><p>{{ i.valor }}</p></div>
                </div>
              }
            </div>
            <div class="mapa-placeholder">📍 Av. Brig. Faria Lima, 3900, Itaim Bibi</div>
          </div>

          <!-- Formulario -->
          <div class="contato-form-wrap">
            <h3>Enviar Mensagem</h3>

            @if (enviado()) {
              <div class="alert alert--success" style="margin-bottom:0">
                ✓ Mensagem enviada! Retornaremos em breve.
              </div>
            } @else {
              @if (erro()) {
                <div class="alert alert--error">{{ erro() }}</div>
              }
              <form (ngSubmit)="enviar()">
                <div class="form-group">
                  <label>Nome</label>
                  <input
                    [(ngModel)]="form.nome"
                    name="nome"
                    placeholder="Seu nome"
                    required
                    [disabled]="loading()"
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>E-mail</label>
                    <input
                      [(ngModel)]="form.email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      [disabled]="loading()"
                    />
                  </div>
                  <div class="form-group">
                    <label>WhatsApp</label>
                    <input
                      [(ngModel)]="form.tel"
                      name="tel"
                      placeholder="(11) 98291-6090"
                      [disabled]="loading()"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label>Mensagem</label>
                  <textarea
                    [(ngModel)]="form.msg"
                    name="msg"
                    rows="5"
                    placeholder="Como podemos ajudá-la?"
                    required
                    [disabled]="loading()"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  class="btn btn--primary btn--full"
                  [disabled]="loading() || !form.nome || !form.email || !form.msg"
                >
                  @if (loading()) {
                    <span class="spinner spinner--sm"></span>&nbsp;Enviando...
                  } @else {
                    Enviar Mensagem
                  }
                </button>
              </form>
            }
          </div>

        </div>
      </div></section>
    </div>
  `
})
export class ContatoComponent {
  private http = inject(HttpClient);

  // URL fixa do backend — nao depende de environment
  private readonly API = 'https://vania-api.vercel.app/api';

  enviado = signal(false);
  loading = signal(false);
  erro    = signal('');

  form = { nome: '', email: '', tel: '', msg: '' };

  infos = [
    { icon: '📍', label: 'Endereco',            valor: 'Av. Brigadeiro Faria Lima, 3900 — Itaim Bibi, Sao Paulo' },
    { icon: '📞', label: 'Telefone & WhatsApp', valor: '(11) 98291-6090' },
    { icon: '✉️', label: 'E-mail',              valor: 'contato@vaniaherculano.com.br' },
    { icon: '🕐', label: 'Horario',             valor: 'Seg–Sex: 9h–19h | Sab: 9h–14h' },
  ];

  enviar() {
    if (!this.form.nome || !this.form.email || !this.form.msg) return;
    this.loading.set(true);
    this.erro.set('');

    this.http.post<{ sucesso: boolean; mensagem: string }>(
      `${this.API}/contato`,
      this.form
    ).subscribe({
      next: r => {
        this.loading.set(false);
        if (r.sucesso) {
          this.enviado.set(true);
        } else {
          this.erro.set(r.mensagem || 'Erro ao enviar. Tente novamente.');
        }
      },
      error: e => {
        this.loading.set(false);
        if (e.status === 0) {
          this.erro.set('Nao foi possivel conectar ao servidor. Tente novamente.');
        } else {
          this.erro.set(e.error?.mensagem || 'Erro ao enviar mensagem. Tente novamente.');
        }
      }
    });
  }
}
