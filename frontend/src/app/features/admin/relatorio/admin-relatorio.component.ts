// features/admin/relatorio/admin-relatorio.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

const API = 'https://vania-api.vercel.app/api';

@Component({
  selector: 'app-admin-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .colab-card { background:var(--pearl);border:1.5px solid var(--champagne);border-radius:var(--radius-md);padding:1.2rem;margin-bottom:.8rem; }
    .colab-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem;flex-wrap:wrap;gap:.5rem; }
    .colab-nome { font-size:1rem;font-weight:500; }
    .colab-total { font-family:var(--font-display);font-size:1.3rem;color:var(--gold-dark); }
    .mini-table { width:100%;font-size:.82rem;border-collapse:collapse; }
    .mini-table td { padding:.35rem .5rem;border-bottom:1px solid var(--champagne); }
    .mini-table tr:last-child td { border-bottom:none; }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Relatorio Geral</h1>
          <p>Faturamento e desempenho de toda a equipe.</p>
        </div>
      </div>

      <!-- Filtro periodo -->
      <div class="card card--elevated" style="padding:.8rem 1.2rem;margin-bottom:1.2rem;display:flex;gap:.8rem;flex-wrap:wrap;align-items:flex-end">
        <div class="form-group" style="margin:0;min-width:130px">
          <label>Data inicio</label>
          <input type="date" [(ngModel)]="filtro.inicio" (change)="carregar()" />
        </div>
        <div class="form-group" style="margin:0;min-width:130px">
          <label>Data fim</label>
          <input type="date" [(ngModel)]="filtro.fim" (change)="carregar()" />
        </div>
        <button class="btn btn--ghost btn--sm" style="align-self:flex-end" (click)="limpar()">Limpar</button>
      </div>

      <!-- Totais gerais -->
      <div class="dash-stats" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-card__label">Faturamento Total</div>
          <div class="stat-card__value" style="color:var(--gold-dark)">{{ curr(totalGeral()) }}</div>
          <span class="stat-card__icon">💰</span>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total de Servicos</div>
          <div class="stat-card__value">{{ registros().length }}</div>
          <span class="stat-card__icon">💎</span>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Colaboradores Ativos</div>
          <div class="stat-card__value">{{ porColaborador().length }}</div>
          <span class="stat-card__icon">👥</span>
        </div>
      </div>

      <!-- Por colaborador -->
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (porColaborador().length === 0) {
        <div class="empty-state card"><div class="icon">📊</div><h3>Nenhum registro no periodo</h3></div>
      } @else {
        <h3 style="font-size:1rem;font-weight:400;color:var(--text-muted);margin-bottom:.8rem;letter-spacing:.08em;text-transform:uppercase;font-size:.72rem">Por Colaborador</h3>
        @for (c of porColaborador(); track c.nome) {
          <div class="colab-card">
            <div class="colab-header">
              <div>
                <div class="colab-nome">{{ c.nome || 'Sem responsavel' }}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">{{ c.registros.length }} servico(s)</div>
              </div>
              <div class="colab-total">{{ curr(c.total) }}</div>
            </div>
            <table class="mini-table">
              <thead>
                <tr style="color:var(--text-muted)">
                  <td>Data</td><td>Cliente</td><td>Servico</td><td style="text-align:right">Valor</td>
                </tr>
              </thead>
              <tbody>
                @for (r of c.registros.slice(0,5); track r.id) {
                  <tr>
                    <td>{{ fmtData(r.data_realizacao) }}</td>
                    <td>{{ r.cliente }}</td>
                    <td>{{ r.servico }}</td>
                    <td style="text-align:right;font-family:var(--font-display)">{{ curr(r.valor) }}</td>
                  </tr>
                }
                @if (c.registros.length > 5) {
                  <tr><td colspan="4" style="color:var(--text-muted);font-size:.75rem">... e mais {{ c.registros.length - 5 }} registros</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `
})
export class AdminRelatorioComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  registros = signal<any[]>([]);
  loading   = signal(true);
  filtro    = { inicio: '', fim: '' };

  totalGeral = () => this.registros().reduce((a,r) => a + r.valor, 0);

  porColaborador = () => {
    const mapa = new Map<string, { nome:string; total:number; registros:any[] }>();
    this.registros().forEach(r => {
      const key = r.colaborador || 'Sem responsavel';
      if (!mapa.has(key)) mapa.set(key, { nome:key, total:0, registros:[] });
      const entry = mapa.get(key)!;
      entry.total += r.valor;
      entry.registros.push(r);
    });
    return [...mapa.values()].sort((a,b) => b.total - a.total);
  };

  private headers() {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.auth.token()}` });
  }

  ngOnInit() {
    // Padrão: mês atual
    const hoje = new Date().toISOString().split('T')[0];
    this.filtro.inicio = hoje.substring(0,7) + '-01';
    this.filtro.fim = hoje;
    this.carregar();
  }

  carregar() {
    this.loading.set(true);
    let url = `${API}/dashboard/financeiro`;
    if (this.filtro.inicio && this.filtro.fim) {
      url += `?data_inicio=${this.filtro.inicio}&data_fim=${this.filtro.fim}`;
    }
    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: r => { this.registros.set(r.dados || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  limpar() {
    this.filtro = { inicio: '', fim: '' };
    this.carregar();
  }

  curr(v: number) { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
  fmtData(d: string) {
    if (!d) return '';
    const p = d.substring(0,10).split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
}
