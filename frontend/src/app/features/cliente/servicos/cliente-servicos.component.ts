// features/cliente/servicos/cliente-servicos.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServicosApiService, Servico } from '../../../core/services/api.service';

@Component({
  selector: 'app-cliente-servicos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .srv-card-cli {
      background: var(--pearl);
      border: 1.5px solid var(--champagne);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      transition: all .25s;
      display: flex;
      flex-direction: column;
      gap: .6rem;
    }
    .srv-card-cli:hover { box-shadow: var(--shadow-md); border-color: var(--gold); }
    .srv-cat {
      font-size: .62rem; letter-spacing: .14em; text-transform: uppercase;
      color: var(--gold-dark); font-weight: 500;
    }
    .srv-nome { font-family: var(--font-display); font-size: 1.2rem; font-weight: 400; color: var(--text); }
    .srv-desc { font-size: .85rem; color: var(--text-light); line-height: 1.7; flex: 1; }
    .srv-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: .8rem; border-top: 1px solid var(--champagne); margin-top: .3rem;
    }
    .srv-info { display: flex; flex-direction: column; gap: .15rem; }
    .srv-info span { font-size: .75rem; color: var(--text-muted); }
    .srv-valor { font-family: var(--font-display); font-size: 1.25rem; color: var(--gold-dark); }
    .grid-servicos {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem;
    }
    @media (max-width: 900px) { .grid-servicos { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 540px) { .grid-servicos { grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Nossos Serviços</h1>
          <p>Conheça todos os tratamentos disponíveis para agendar.</p>
        </div>
        <a routerLink="/cliente/agendar" class="btn btn--primary">📅 Agendar Agora</a>
      </div>

      <!-- Filtro por categoria -->
      @if (categorias().length > 1) {
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.5rem">
          <button class="filtro-btn" [class.active]="catAtiva() === ''"
            (click)="catAtiva.set('')">Todos</button>
          @for (c of categorias(); track c) {
            <button class="filtro-btn" [class.active]="catAtiva() === c"
              (click)="catAtiva.set(c)">{{ c }}</button>
          }
        </div>
      }

      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (filtrados().length === 0) {
        <div class="empty-state"><div class="icon">💎</div><h3>Nenhum serviço encontrado</h3></div>
      } @else {
        <!-- Totais -->
        <p style="font-size:.82rem;color:var(--text-muted);margin-bottom:1rem">
          {{ filtrados().length }} tratamento(s) disponível(is)
        </p>

        <div class="grid-servicos">
          @for (s of filtrados(); track s.id) {
            <div class="srv-card-cli">
              <div class="srv-cat">{{ s.categoria }}</div>
              <div class="srv-nome">{{ s.nome }}</div>
              <div class="srv-desc">{{ s.descricao }}</div>
              <div class="srv-footer">
                <div class="srv-info">
                  <span>⏱ {{ s.duracao_min }} minutos</span>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem">
                  <span class="srv-valor">R$ {{ s.valor | number:'1.2-2' }}</span>
                  <a routerLink="/cliente/agendar" class="btn btn--primary btn--sm">Agendar</a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ClienteServicosComponent implements OnInit {
  private srvApi = inject(ServicosApiService);

  servicos  = signal<Servico[]>([]);
  loading   = signal(true);
  catAtiva  = signal('');

  categorias = computed(() =>
    [...new Set(this.servicos().map(s => s.categoria).filter(Boolean))] as string[]
  );
  filtrados = computed(() =>
    this.catAtiva()
      ? this.servicos().filter(s => s.categoria === this.catAtiva())
      : this.servicos()
  );

  ngOnInit() {
    this.srvApi.listar({ ativo: true }).subscribe({
      next: r => { this.servicos.set(r.dados); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
