// features/admin/financeiro/financeiro.component.ts
// © 2025 William Rodrigues da Silva — inspirado na imagem de referência
import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardApiService, FinanceiroItem } from '../../../core/services/api.service';

declare const Chart: any;

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Controle <em>Financeiro</em></h1>
          <p>Análise financeira detalhada</p>
        </div>
        <button class="btn btn--outline btn--sm" (click)="exportarCSV()">⬇ Exportar CSV</button>
      </div>

      <!-- Filtros de período -->
      <div class="card card--elevated fin-filtro">
        <div class="fin-filtro__row">
          <div class="form-group" style="margin:0;flex:1">
            <label>Data Início</label>
            <input type="date" [(ngModel)]="filtros.data_inicio" (change)="buscar()" />
          </div>
          <div class="form-group" style="margin:0;flex:1">
            <label>Data Fim</label>
            <input type="date" [(ngModel)]="filtros.data_fim" (change)="buscar()" />
          </div>
          <button class="btn btn--ghost btn--sm" (click)="limpar()">Limpar</button>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="fin-stats">
        <div class="stat-card">
          <div class="stat-card__label">Total Faturado</div>
          <div class="stat-card__value">{{ formatCurrency(totalGeral()) }}</div>
          <div class="stat-card__sub">{{ registros().length }} transações</div>
          <div class="stat-card__icon">💰</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Serviços Realizados</div>
          <div class="stat-card__value">{{ registros().length }}</div>
          <div class="stat-card__sub">No período</div>
          <div class="stat-card__icon">📋</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Ticket Médio</div>
          <div class="stat-card__value">{{ formatCurrency(ticketMedio()) }}</div>
          <div class="stat-card__sub">Por atendimento</div>
          <div class="stat-card__icon">📊</div>
        </div>
      </div>

      <!-- Gráficos lado a lado -->
      <div class="fin-charts">
        <div class="card card--elevated chart-box">
          <h4>Faturamento Mensal</h4>
          <div class="chart-wrap"><canvas #chartMes></canvas></div>
        </div>
        <div class="card card--elevated chart-box">
          <h4>Faturamento Diário</h4>
          <div class="chart-wrap"><canvas #chartDia></canvas></div>
        </div>
      </div>

      <!-- Detalhamento por serviço -->
      <div class="card card--elevated" style="margin-top:1.5rem">
        <h4 style="margin-bottom:1.2rem;font-size:1rem;font-weight:400;color:var(--text)">Detalhamento por Serviço</h4>
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (porServico().length === 0) {
          <div class="empty-state"><div class="icon">💰</div><h3>Nenhum registro</h3><p>Marque agendamentos como realizados para gerar registros financeiros.</p></div>
        } @else {
          <div class="table-wrap">
            <table class="lc-table">
              <thead><tr><th>Serviço</th><th>Quantidade</th><th>Receita</th><th>% do Total</th></tr></thead>
              <tbody>
                @for (s of porServico(); track s.servico) {
                  <tr>
                    <td><strong>{{ s.servico }}</strong></td>
                    <td>{{ s.qtd }}</td>
                    <td><strong style="color:var(--gold-dark)">{{ formatCurrency(s.total) }}</strong></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.6rem">
                        <div class="prog-bar"><div class="prog-fill" [style.width]="s.pct + '%'"></div></div>
                        <span style="font-size:.8rem;color:var(--text-muted)">{{ s.pct.toFixed(1) }}%</span>
                      </div>
                    </td>
                  </tr>
                }
                <tr class="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>{{ registros().length }}</strong></td>
                  <td><strong style="color:var(--gold-dark)">{{ formatCurrency(totalGeral()) }}</strong></td>
                  <td><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class FinanceiroComponent implements OnInit, AfterViewInit {
  @ViewChild('chartMes') chartMesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDia') chartDiaRef!: ElementRef<HTMLCanvasElement>;

  dashApi = inject(DashboardApiService);

  registros   = signal<FinanceiroItem[]>([]);
  totalGeral  = signal(0);
  loading     = signal(true);
  filtros     = { data_inicio: '', data_fim: '' };

  ticketMedio  = () => this.registros().length ? this.totalGeral() / this.registros().length : 0;

  porServico = () => {
    const mapa: Record<string, number> = {};
    this.registros().forEach(r => { mapa[r.servico] = (mapa[r.servico] || 0) + r.valor; });
    const total = this.totalGeral() || 1;
    return Object.entries(mapa)
      .map(([servico, t]) => ({ servico, total: t, qtd: this.registros().filter(r => r.servico === servico).length, pct: (t / total) * 100 }))
      .sort((a, b) => b.total - a.total);
  };

  private chartM: any = null;
  private chartD: any = null;
  private viewReady = false;

  ngOnInit() {
    // Carrega Chart.js e depois busca dados
    const existing = document.getElementById('chartjs-script');
    if (existing) {
      this.buscar();
      return;
    }
    const s = document.createElement('script');
    s.id  = 'chartjs-script';
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
    s.onload  = () => this.buscar();
    s.onerror = () => { console.error('Chart.js falhou'); this.buscar(); };
    document.head.appendChild(s);
  }

  ngAfterViewInit() { this.viewReady = true; }

  buscar() {
    this.loading.set(true);
    this.dashApi.financeiro(this.filtros).subscribe({
      next: r => {
        this.registros.set(r.dados);
        this.totalGeral.set(r.total_geral);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 120);
      },
      error: err => {
        console.error('[Financeiro] Erro:', err);
        this.loading.set(false);
      }
    });
  }

  limpar() { this.filtros = { data_inicio:'', data_fim:'' }; this.buscar(); }

  renderCharts() {
    if (typeof Chart === 'undefined') return;
    this.renderMensal();
    this.renderDiario();
  }

  renderMensal() {
    if (this.chartM) this.chartM.destroy();
    const ctx = this.chartMesRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    const porMes: Record<string, number> = {};
    this.registros().forEach(r => {
      const m = r.data_realizacao.substring(0, 7);
      porMes[m] = (porMes[m] || 0) + r.valor;
    });
    const labels = Object.keys(porMes).sort();
    const dados  = labels.map(l => porMes[l]);
    this.chartM = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(l => { const [y, m] = l.split('-'); const ms = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${ms[+m-1]}/${y.slice(2)}`; }),
        datasets: [{ label: 'Faturamento', data: dados, borderColor: '#c8973a', backgroundColor: 'rgba(200,151,58,.1)', tension: .4, fill: true, pointRadius: 4, pointBackgroundColor: '#c8973a' }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{grid:{color:'rgba(0,0,0,.04)'}, ticks:{font:{family:'Jost',size:11},color:'#b0a48a'}}, y:{grid:{color:'rgba(0,0,0,.04)'}, ticks:{callback:(v: any) => `R$${v}`, font:{family:'Jost',size:11},color:'#b0a48a'}} } }
    });
  }

  renderDiario() {
    if (this.chartD) this.chartD.destroy();
    const ctx = this.chartDiaRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    const porDia: Record<string, number> = {};
    this.registros().forEach(r => {
      const d = r.data_realizacao.substring(0, 10);
      porDia[d] = (porDia[d] || 0) + r.valor;
    });
    const labels = Object.keys(porDia).sort().slice(-15);
    const dados  = labels.map(l => porDia[l]);
    this.chartD = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(l => { const [, m, d] = l.split('-'); return `${d}/${m}`; }),
        datasets: [{ data: dados, backgroundColor: 'rgba(200,151,58,.75)', borderRadius: 3, hoverBackgroundColor:'#c8973a' }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{grid:{display:false}, ticks:{font:{family:'Jost',size:10},color:'#b0a48a'}}, y:{grid:{color:'rgba(0,0,0,.04)'}, ticks:{callback:(v: any) => `R$${v}`, font:{family:'Jost',size:10},color:'#b0a48a'}} } }
    });
  }

  exportarCSV() {
    const rows = this.registros().map(r => [this.formatarData(r.data_realizacao), r.cliente, r.servico, r.valor.toFixed(2)]);
    const csv  = [['Data','Cliente','Serviço','Valor'], ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  formatCurrency(v: number) { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
  formatarData(d: string)  { return new Date(d).toLocaleDateString('pt-BR'); }
}
