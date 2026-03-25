// features/admin/dashboard/dashboard.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, AfterViewInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardApiService, DashboardResumo, FaturamentoPeriodo, ServicoRanking } from '../../../core/services/api.service';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Dashboard</h1>
          <p>Visão geral do desempenho da clínica.</p>
        </div>
        <select [(ngModel)]="periodo" (change)="carregarGraficos()" class="periodo-sel">
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="ano">Este ano</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div><span>Carregando...</span></div>
      } @else {

        <!-- STAT CARDS -->
        <div class="dash-stats">
          <div class="stat-card">
            <div class="stat-card__label">Total Faturado</div>
            <div class="stat-card__value">{{ fmt(resumo()?.totalFaturado || 0) }}</div>
            <div class="stat-card__sub">Acumulado histórico</div>
            <div class="stat-card__icon">💰</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Faturamento do Mês</div>
            <div class="stat-card__value">{{ fmt(resumo()?.faturadoMes || 0) }}</div>
            <div class="stat-card__sub">Mês atual</div>
            <div class="stat-card__icon">📈</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Agendamentos Hoje</div>
            <div class="stat-card__value">{{ resumo()?.agendamentosHoje || 0 }}</div>
            <div class="stat-card__sub">Pendentes: {{ resumo()?.pendentes || 0 }}</div>
            <div class="stat-card__icon">📅</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Total de Clientes</div>
            <div class="stat-card__value">{{ resumo()?.totalClientes || 0 }}</div>
            <div class="stat-card__sub">Realizados mês: {{ resumo()?.realizadosMes || 0 }}</div>
            <div class="stat-card__icon">👥</div>
          </div>
        </div>

        <!-- GRÁFICOS -->
        <div class="dash-charts">
          <div class="card card--elevated chart-box">
            <h4>Faturamento por Período</h4>
            <div class="chart-wrap"><canvas #fatChart></canvas></div>
          </div>
          <div class="card card--elevated chart-box">
            <h4>Serviços Mais Realizados</h4>
            <div class="chart-wrap"><canvas #srvChart></canvas></div>
          </div>
        </div>

        <!-- RANKING + RECENTES -->
        <div class="dash-bottom">
          <div class="card card--elevated">
            <h4 style="margin-bottom:1.2rem;font-size:1rem;font-weight:400;color:var(--text-light)">Ranking de Serviços</h4>
            <div class="table-wrap">
              <table class="lc-table">
                <thead><tr><th>#</th><th>Serviço</th><th>Realizações</th><th>Faturado</th><th>Ticket Médio</th></tr></thead>
                <tbody>
                  @for (s of ranking(); track s.nome; let i = $index) {
                    <tr>
                      <td><strong style="color:var(--gold);font-family:var(--font-display)">{{ i+1 }}º</strong></td>
                      <td><strong>{{ s.nome }}</strong><br><small style="color:var(--text-muted)">{{ s.categoria }}</small></td>
                      <td>{{ s.quantidade }}x</td>
                      <td style="color:var(--gold-dark);font-weight:500">{{ fmt(s.total_faturado) }}</td>
                      <td>{{ fmt(s.ticket_medio) }}</td>
                    </tr>
                  }
                  @empty { <tr><td colspan="5" class="text-muted" style="padding:2rem;text-align:center">Sem dados</td></tr> }
                </tbody>
              </table>
            </div>
          </div>

          <div class="card card--elevated">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem">
              <h4 style="font-size:1rem;font-weight:400;color:var(--text-light)">Agendamentos Recentes</h4>
              <a routerLink="/admin/agendamentos" class="btn btn--ghost btn--sm">Ver todos</a>
            </div>
            <div class="table-wrap">
              <table class="lc-table">
                <thead><tr><th>Cliente</th><th>Serviço</th><th>Data</th><th>Status</th></tr></thead>
                <tbody>
                  @for (a of recentes().slice(0,7); track a.id) {
                    <tr>
                      <td><strong>{{ a.cliente }}</strong></td>
                      <td>{{ a.servico }}</td>
                      <td>{{ fmtData(a.data) }}</td>
                      <td><span class="badge badge--{{ a.status }}">{{ a.status }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('fatChart') fatRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('srvChart') srvRef!: ElementRef<HTMLCanvasElement>;

  dashApi  = inject(DashboardApiService);
  resumo   = signal<DashboardResumo | null>(null);
  ranking  = signal<ServicoRanking[]>([]);
  recentes = signal<any[]>([]);
  loading  = signal(true);
  periodo  = 'mes';

  private cFat: any = null;
  private cSrv: any = null;
  private viewReady = false;
  private fatData: FaturamentoPeriodo[] = [];

  ngOnInit() {
    const existing = document.getElementById('chartjs-script');
    if (existing) { this.inicializar(); return; }
    const s = document.createElement('script');
    s.id  = 'chartjs-script';
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
    s.onload  = () => this.inicializar();
    s.onerror = () => { console.error('Chart.js falhou — dados carregando sem gráficos'); this.inicializar(); };
    document.head.appendChild(s);
  }
  ngAfterViewInit() { this.viewReady = true; if (this.fatData.length) this.renderCharts(); }

  inicializar() {
    Promise.all([
      this.dashApi.resumo().toPromise(),
      this.dashApi.servicosMaisRealizados().toPromise(),
      this.dashApi.agendamentosRecentes().toPromise(),
    ]).then(([r, s, a]) => {
      this.resumo.set(r?.dados || null);
      this.ranking.set(s?.dados || []);
      this.recentes.set(a?.dados || []);
      this.loading.set(false);
      this.carregarGraficos();
    }).catch(err => {
      // Garante que loading para mesmo com erro de API
      console.error('[Dashboard] Erro ao carregar dados:', err);
      this.loading.set(false);
    });
  }

  carregarGraficos() {
    this.dashApi.faturamentoPeriodo({ periodo: this.periodo }).subscribe({
      next: r => {
        this.fatData = r.dados;
        if (this.viewReady) this.renderCharts();
      },
      error: err => console.error('[Dashboard] Faturamento erro:', err)
    });
  }

  renderCharts() {
    setTimeout(() => { this.renderFat(); this.renderSrv(); }, 80);
  }

  renderFat() {
    if (this.cFat) this.cFat.destroy();
    const ctx = this.fatRef?.nativeElement?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    this.cFat = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.fatData.map(d => this.fmtLabel(d.periodo)),
        datasets: [{ data: this.fatData.map(d => d.total), backgroundColor: 'rgba(200,151,58,.72)', borderRadius: 3, hoverBackgroundColor: '#c8973a' }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{font:{family:'Jost',size:11},color:'#b0a48a'}}, y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:(v: any)=>`R$${v}`,font:{family:'Jost',size:11},color:'#b0a48a'}} } }
    });
  }

  renderSrv() {
    if (this.cSrv) this.cSrv.destroy();
    const ctx = this.srvRef?.nativeElement?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    const d = this.ranking().slice(0, 6);
    this.cSrv = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: d.map(x => x.nome),
        datasets: [{ data: d.map(x => x.quantidade), backgroundColor: ['#c8973a','#e2bb6e','#8a6520','#d4aa50','#b0a48a','#f7f2e8'], borderWidth: 0 }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ font:{family:'Jost',size:11}, boxWidth:10, color:'#5a5340' } } } }
    });
  }

  fmt(v: number)     { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
  fmtData(d: string) { const [y,m,dia] = d.split('-'); return `${dia}/${m}/${y}`; }
  fmtLabel(p: string) {
    if (p.length === 10) { const [,m,d] = p.split('-'); return `${d}/${m}`; }
    const [y,m] = p.split('-'); const ms=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${ms[+m-1]}/${y.slice(2)}`;
  }
}
