// features/cliente/pacotes/meus-pacotes.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

const API = 'https://vania-api.vercel.app/api';

@Component({
  selector: 'app-meus-pacotes',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .pacote-card {
      background:var(--pearl); border:1.5px solid var(--gold);
      border-radius:var(--radius-md); padding:1.2rem 1.4rem;
      margin-bottom:.8rem;
    }
    .pacote-titulo { font-family:var(--font-display); font-size:1.15rem; font-weight:400; margin-bottom:.5rem; }
    .pacote-info   { font-size:.84rem; color:var(--text-muted); margin-bottom:.3rem; }
    .dias-row      { display:flex; gap:.3rem; flex-wrap:wrap; margin-top:.6rem; }
    .dia-pill      { font-size:.72rem; padding:.25rem .7rem; border-radius:20px; font-weight:500; }
    .dia-pill.on   { background:var(--gold-pale); color:var(--gold-dark); border:1px solid var(--gold); }
    .dia-pill.off  { background:var(--champagne); color:var(--text-muted); }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Meus Pacotes</h1>
          <p>Seus horarios fixos reservados. Esses horarios sao automaticamente bloqueados para outros clientes.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (pacotes().length === 0) {
        <div class="empty-state card">
          <div class="icon">📦</div>
          <h3>Nenhum pacote ativo</h3>
          <p>Voce nao possui pacotes com horarios fixos no momento.</p>
        </div>
      } @else {
        @for (p of pacotes(); track p.id) {
          <div class="pacote-card">
            <div class="pacote-titulo">{{ p.nome }}</div>
            <div class="pacote-info">💎 {{ p.servico_nome }}</div>
            <div class="pacote-info">🕐 Horario fixo: <strong>{{ p.horario }}</strong></div>
            @if (p.data_inicio || p.data_fim) {
              <div class="pacote-info">
                📅
                @if (p.data_inicio) { De {{ fmt(p.data_inicio) }} }
                @if (p.data_fim) { ate {{ fmt(p.data_fim) }} }
                @else { sem data fim }
              </div>
            }
            <div class="dias-row">
              @for (d of DIAS; track d.val) {
                <span class="dia-pill" [class.on]="p.dias_semana?.includes(d.val)" [class.off]="!p.dias_semana?.includes(d.val)">
                  {{ d.label }}
                </span>
              }
            </div>
          </div>
        }
      }
    </div>
  `
})
export class MeusPacotesComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  pacotes = signal<any[]>([]);
  loading = signal(true);

  readonly DIAS = [
    { val:1,label:'Seg' },{ val:2,label:'Ter' },{ val:3,label:'Qua' },
    { val:4,label:'Qui' },{ val:5,label:'Sex' },{ val:6,label:'Sab' },{ val:0,label:'Dom' }
  ];

  ngOnInit() {
    const t = this.auth.token();
    this.http.get<any>(`${API}/meus-pacotes`, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${t}` })
    }).subscribe({
      next: r => { this.pacotes.set(r.dados || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  fmt(d: string) {
    if (!d) return '';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }
}
