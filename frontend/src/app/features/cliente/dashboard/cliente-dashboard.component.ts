// features/cliente/dashboard/cliente-dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AgendamentosApiService, Agendamento } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fade-in-up">
      <!-- Boas-vindas -->
      <div class="bv-banner">
        <div class="bv-text">
          <h1>Bem-vinda, <em>{{ primeiroNome() }}</em></h1>
          <p>Gerencie seus agendamentos e acompanhe seu histórico de tratamentos.</p>
        </div>
        <a routerLink="/cliente/agendar" class="btn btn--primary">Agendar Tratamento</a>
      </div>

      <!-- Stats -->
      <div class="dash-stats">
        <div class="stat-card">
          <div class="stat-card__label">Próximo Agendamento</div>
          <div class="stat-card__value">{{ proximoAgendamento() || '—' }}</div>
          <div class="stat-card__sub">{{ proximoServico() }}</div>
          <span class="stat-card__icon">📅</span>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total de Agendamentos</div>
          <div class="stat-card__value">{{ totalAgendamentos() }}</div>
          <div class="stat-card__sub">Histórico completo</div>
          <span class="stat-card__icon">📋</span>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Tratamentos Realizados</div>
          <div class="stat-card__value">{{ realizados() }}</div>
          <div class="stat-card__sub">Concluídos com sucesso</div>
          <span class="stat-card__icon">✓</span>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Pendentes</div>
          <div class="stat-card__value">{{ pendentes() }}</div>
          <div class="stat-card__sub">Aguardando confirmação</div>
          <span class="stat-card__icon">⏳</span>
        </div>
      </div>

      <!-- Agendamentos recentes -->
      <div class="card card--elevated" style="margin-top:2rem">
        <div class="card-header">
          <h3>Meus Agendamentos Recentes</h3>
          <a routerLink="/cliente/agendamentos" class="btn btn--ghost btn--sm">Ver todos</a>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (agendamentos().length === 0) {
          <div class="empty-state">
            <div class="icon">🌸</div>
            <h3>Nenhum agendamento ainda</h3>
            <p>Que tal agendar seu primeiro tratamento?</p>
            <a routerLink="/cliente/agendar" class="btn btn--primary" style="margin-top:1rem">Agendar agora</a>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="lc-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                @for (a of agendamentos().slice(0, 5); track a.id) {
                  <tr>
                    <td><strong>{{ a.servico_nome }}</strong></td>
                    <td>{{ formatarData(a.data) }}</td>
                    <td>{{ a.horario }}</td>
                    <td><span class="badge badge--{{ a.status }}">{{ a.status }}</span></td>
                    <td>
                      @if (a.status === 'pendente' || a.status === 'confirmado') {
                        <button class="btn btn--ghost btn--sm" (click)="cancelar(a.id)">Cancelar</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- CTA agendar -->
      <div class="cta-agendar card" style="margin-top:2rem;background:var(--dark);border-color:var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:2rem;flex-wrap:wrap">
          <div>
            <h3 style="color:#fff;font-size:1.5rem;font-weight:300;margin-bottom:.4rem">Pronta para um novo tratamento?</h3>
            <p style="color:rgba(255,255,255,.4);font-size:.9rem">Escolha entre nossos serviços exclusivos e agende seu horário.</p>
          </div>
          <a routerLink="/cliente/agendar" class="btn btn--primary btn--lg">Agendar Agora</a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  agApi = inject(AgendamentosApiService);

  agendamentos = signal<Agendamento[]>([]);
  loading = signal(true);

  primeiroNome = () => this.auth.usuario()?.nome?.split(' ')[0] || '';
  totalAgendamentos = () => this.agendamentos().length;
  realizados = () => this.agendamentos().filter(a => a.status === 'realizado').length;
  pendentes = () => this.agendamentos().filter(a => a.status === 'pendente').length;

  proximoAgendamento = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const prox = this.agendamentos()
      .filter(a => a.data >= hoje && ['pendente','confirmado'].includes(a.status))
      .sort((a, b) => a.data.localeCompare(b.data))[0];
    return prox ? this.formatarData(prox.data) : null;
  };
  proximoServico = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return this.agendamentos()
      .filter(a => a.data >= hoje && ['pendente','confirmado'].includes(a.status))
      .sort((a, b) => a.data.localeCompare(b.data))[0]?.servico_nome || 'Sem agendamentos futuros';
  };

  private intervalo: any;

  ngOnInit() {
    this.carregar();
    // Atualiza a cada 20 segundos
    this.intervalo = setInterval(() => this.carregar(), 20000);
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  carregar() {
    this.agApi.listar().subscribe({
      next: r => { this.agendamentos.set(r.dados); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  cancelar(id: number) {
    if (!confirm('Confirma o cancelamento?')) return;
    this.agApi.cancelar(id).subscribe(() => {
      this.agendamentos.update(list => list.map(a => a.id === id ? { ...a, status: 'cancelado' } : a));
      this.carregar(); // Recarrega lista atualizada
    });
  }

  formatarData(data: string) {
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }
}
