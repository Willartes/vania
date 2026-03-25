// features/cliente/agendamentos/meus-agendamentos.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgendamentosApiService, Agendamento } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Meus Agendamentos</h1>
          <p>Histórico completo dos seus tratamentos.</p>
        </div>
        <a routerLink="/cliente/agendar" class="btn btn--primary">+ Novo Agendamento</a>
      </div>

      <!-- Filtros -->
      <div class="card card--elevated filtros-card" style="margin-bottom:1.5rem">
        <div class="filtros-row">
          <label style="font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted)">
            Filtrar por status:
          </label>
          <select [(ngModel)]="filtroStatus" (change)="aplicarFiltro()"
            style="padding:.5rem 1rem;border:1px solid var(--champagne);font-family:var(--font-body);font-size:.88rem;color:var(--text);outline:none;border-radius:var(--radius);background:var(--pearl)">
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      @if (loading() && agendamentos().length === 0) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (agendamentosFiltrados().length === 0) {
        <div class="empty-state card">
          <div class="icon">🌸</div>
          <h3>Nenhum agendamento encontrado</h3>
          <p>{{ filtroStatus ? 'Sem resultados para este filtro.' : 'Você ainda não tem agendamentos.' }}</p>
          <a routerLink="/cliente/agendar" class="btn btn--primary" style="margin-top:1rem">Agendar agora</a>
        </div>
      } @else {
        <div class="ag-list">
          @for (a of agendamentosFiltrados(); track a.id) {
            <div class="card card--elevated ag-item">
              <div class="ag-item__status">
                <span class="badge badge--{{ a.status }}">{{ a.status }}</span>
                @if (a.status === 'confirmado') {
                  <div style="margin-top:.4rem;font-size:.68rem;color:var(--success);font-weight:500">✓ Confirmado!</div>
                }
              </div>
              <div class="ag-item__info">
                <h3>{{ a.servico_nome }}</h3>
                <div class="ag-item__meta">
                  <span>📅 {{ formatarData(a.data) }}</span>
                  <span>🕐 {{ a.horario }}</span>
                  @if (a.servico_duracao) { <span>⏱ {{ a.servico_duracao }}min</span> }
                </div>
                @if (a.observacoes) {
                  <p class="ag-item__obs">Obs: {{ a.observacoes }}</p>
                }
              </div>
              <div class="ag-item__valor">
                <span class="valor">{{ formatCurrency(a.servico_valor || 0) }}</span>
                @if (a.status === 'pendente' || a.status === 'confirmado') {
                  <button class="btn btn--ghost btn--sm" style="margin-top:.5rem" (click)="cancelar(a.id)">
                    Cancelar
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class MeusAgendamentosComponent implements OnInit, OnDestroy {
  agApi = inject(AgendamentosApiService);
  toast = inject(ToastService);

  agendamentos         = signal<Agendamento[]>([]);
  agendamentosFiltrados = signal<Agendamento[]>([]);
  loading              = signal(true);
  filtroStatus         = '';

  private intervalo: any;

  ngOnInit() {
    this.carregar();
    // Atualiza a cada 20s para pegar confirmações do admin
    this.intervalo = setInterval(() => this.carregar(), 20000);
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  carregar() {
    this.agApi.listar().subscribe({
      next: r => {
        const anterior = this.agendamentos();
        const novos    = r.dados;

        // Verificar se algum agendamento foi confirmado
        novos.forEach(ag => {
          const ant = anterior.find(a => a.id === ag.id);
          if (ant && ant.status === 'pendente' && ag.status === 'confirmado') {
            this.toast.success(`✓ Seu agendamento de ${ag.servico_nome} foi confirmado!`);
          }
        });

        this.agendamentos.set(novos);
        this.aplicarFiltro();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  aplicarFiltro() {
    if (!this.filtroStatus) {
      this.agendamentosFiltrados.set(this.agendamentos());
    } else {
      this.agendamentosFiltrados.set(
        this.agendamentos().filter(a => a.status === this.filtroStatus)
      );
    }
  }

  cancelar(id: number) {
    if (!confirm('Confirma o cancelamento deste agendamento?')) return;
    this.agApi.cancelar(id).subscribe({
      next: () => {
        this.agendamentos.update(l => l.map(a => a.id === id ? { ...a, status: 'cancelado' } : a));
        this.aplicarFiltro();
        this.toast.success('Agendamento cancelado.');
        this.carregar();
      },
      error: e => this.toast.error(e.error?.mensagem || 'Erro ao cancelar.')
    });
  }

  formatarData(d: string) {
    if (!d) return '—';
    const [y, m, dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }

  formatCurrency(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
