// features/admin/servicos/admin-servicos.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicosApiService, Servico } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Serviços</h1>
          <p>Gerencie os tratamentos oferecidos pela clínica.</p>
        </div>
        <button class="btn btn--primary" (click)="abrirModal()">+ Novo Serviço</button>
      </div>

      <!-- Lista -->
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else {
        <div class="servicos-admin-grid">
          @for (s of servicos(); track s.id) {
            <div class="srv-admin-card card card--elevated" [class.inativo]="!s.ativo">
              <div class="srv-admin-card__header">
                <div>
                  <span class="badge badge--gold" style="margin-bottom:.4rem">{{ s.categoria }}</span>
                  <h3>{{ s.nome }}</h3>
                </div>
                <span class="badge" [class.badge--ativo]="s.ativo" [class.badge--inativo]="!s.ativo">{{ s.ativo ? 'Ativo' : 'Inativo' }}</span>
              </div>
              <p>{{ s.descricao }}</p>
              <div class="srv-admin-card__info">
                <div><span>Valor</span><strong>{{ formatCurrency(s.valor) }}</strong></div>
                <div><span>Duração</span><strong>{{ s.duracao_min }} min</strong></div>
              </div>
              <div class="srv-admin-card__actions">
                <button class="btn btn--ghost btn--sm" (click)="editarServico(s)">✏ Editar</button>
                <button class="btn btn--sm" [class.btn--danger]="s.ativo" [class.btn--outline]="!s.ativo"
                        (click)="toggleAtivo(s)">{{ s.ativo ? 'Desativar' : 'Ativar' }}</button>
              </div>
            </div>
          }
          @empty {
            <div class="empty-state card" style="grid-column:span 3">
              <div class="icon">💎</div>
              <h3>Nenhum serviço cadastrado</h3>
              <button class="btn btn--primary" style="margin-top:1rem" (click)="abrirModal()">Criar primeiro serviço</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- MODAL -->
    @if (modalAberto()) {
      <div class="modal-backdrop" (click)="fecharModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3>{{ editando() ? 'Editar Serviço' : 'Novo Serviço' }}</h3>
            <button class="close-btn" (click)="fecharModal()">✕</button>
          </div>
          <div class="modal__body">
            @if (erroModal()) { <div class="alert alert--error">{{ erroModal() }}</div> }
            <div class="form-group"><label>Nome do Serviço *</label><input [(ngModel)]="form.nome" placeholder="Ex: Toxina Botulínica" /></div>
            <div class="form-group"><label>Descrição</label><textarea [(ngModel)]="form.descricao" rows="3" placeholder="Descreva o tratamento..."></textarea></div>
            <div class="form-row">
              <div class="form-group"><label>Valor (R$) *</label><input [(ngModel)]="form.valor" type="number" min="0" step="0.01" placeholder="0.00" /></div>
              <div class="form-group"><label>Duração (min) *</label><input [(ngModel)]="form.duracao_min" type="number" min="15" step="15" placeholder="60" /></div>
            </div>
            <div class="form-group">
              <label>Categoria</label>
              <select [(ngModel)]="form.categoria">
                <option value="">Selecionar</option>
                <option>Facial</option><option>Laser</option><option>Procedimento</option><option>Estética</option><option>Corporal</option>
              </select>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="fecharModal()">Cancelar</button>
            <button class="btn btn--primary" [disabled]="salvando()" (click)="salvar()">
              @if (salvando()) { <span class="spinner spinner--sm"></span> }
              {{ editando() ? 'Salvar Alterações' : 'Criar Serviço' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class AdminServicosComponent implements OnInit {
  srvApi = inject(ServicosApiService);
  toast = inject(ToastService);

  servicos = signal<Servico[]>([]);
  loading = signal(true);
  modalAberto = signal(false);
  editando = signal<number | null>(null);
  salvando = signal(false);
  erroModal = signal('');

  form: Partial<Servico> = {};

  ngOnInit() { this.carregar(); }

  carregar() {
    this.srvApi.listar().subscribe(r => { this.servicos.set(r.dados); this.loading.set(false); });
  }

  abrirModal() {
    this.form = { nome: '', descricao: '', valor: 0, duracao_min: 60, categoria: '' };
    this.editando.set(null); this.erroModal.set(''); this.modalAberto.set(true);
  }

  editarServico(s: Servico) {
    this.form = { ...s };
    this.editando.set(s.id); this.erroModal.set(''); this.modalAberto.set(true);
  }

  fecharModal() { this.modalAberto.set(false); }

  salvar() {
    if (!this.form.nome || this.form.valor === undefined) { this.erroModal.set('Nome e valor são obrigatórios.'); return; }
    this.salvando.set(true);
    const obs$ = this.editando()
      ? this.srvApi.atualizar(this.editando()!, this.form)
      : this.srvApi.criar(this.form);

    obs$.subscribe({
      next: () => {
        this.salvando.set(false); this.fecharModal();
        this.toast.success(this.editando() ? 'Serviço atualizado!' : 'Serviço criado!');
        this.carregar();
      },
      error: e => { this.salvando.set(false); this.erroModal.set(e.error?.mensagem || 'Erro ao salvar.'); }
    });
  }

  toggleAtivo(s: Servico) {
    if (!confirm(`${s.ativo ? 'Desativar' : 'Ativar'} este serviço?`)) return;
    this.srvApi.atualizar(s.id, { ativo: s.ativo ? 0 : 1 }).subscribe({
      next: () => { this.toast.success('Status atualizado!'); this.carregar(); },
      error: () => this.toast.error('Erro ao atualizar.')
    });
  }

  formatCurrency(v: number) { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
}
