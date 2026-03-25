// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServicosApiService, Servico } from '../../../core/services/api.service';
@Component({
  selector: 'app-servicos-publico', standalone: true, imports: [CommonModule, RouterLink], styles: [],
  template: `
    <div>
      <div class="page-hero"><div class="container">
        <p class="section-overline">Procedimentos</p>
        <h1>Nossos <em>Tratamentos</em></h1>
        <p>Soluções de alta performance com protocolos desenvolvidos por especialistas.</p>
      </div></div>
      <section style="padding:5rem 0;background:var(--cream)"><div class="container">
        <div class="srv-filtros">
          <button class="filtro-btn" [class.active]="catAtiva() === ''" (click)="filtrar('')">Todos</button>
          @for (c of categorias(); track c) {
            <button class="filtro-btn" [class.active]="catAtiva() === c" (click)="filtrar(c)">{{ c }}</button>
          }
        </div>
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
        } @else {
          <div class="srv-list-grid">
            @for (s of servicosFiltrados(); track s.id) {
              <div class="srv-list-card">
                <div class="srv-list-card__cat">{{ s.categoria }}</div>
                <h3>{{ s.nome }}</h3>
                <p>{{ s.descricao }}</p>
                <div class="srv-list-card__footer">
                  <div class="srv-list-card__info"><span>⏱ {{ s.duracao_min }} min</span><span class="preco">R$ {{ s.valor | number:"1.2-2" }}</span></div>
                  <a routerLink="/auth/registrar" class="btn btn--primary btn--sm">Agendar</a>
                </div>
              </div>
            }
            @empty { <div class="empty-state"><div class="icon">🌿</div><h3>Nenhum serviço nessa categoria</h3></div> }
          </div>
        }
      </div></section>
    </div>
  `
})
export class ServicosPublicoComponent implements OnInit {
  private srvApi = inject(ServicosApiService);
  servicos = signal<Servico[]>([]);
  categorias = signal<string[]>([]);
  catAtiva = signal("");
  loading = signal(true);
  servicosFiltrados = signal<Servico[]>([]);
  ngOnInit() {
    this.srvApi.listar({ ativo: true }).subscribe(r => {
      this.servicos.set(r.dados);
      this.servicosFiltrados.set(r.dados);
      this.categorias.set([...new Set(r.dados.map(s => s.categoria).filter(Boolean))] as string[]);
      this.loading.set(false);
    });
  }
  filtrar(cat: string) {
    this.catAtiva.set(cat);
    this.servicosFiltrados.set(cat ? this.servicos().filter(s => s.categoria === cat) : this.servicos());
  }
}
