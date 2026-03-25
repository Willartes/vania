// features/admin/pacotes/admin-pacotes.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ServicosApiService, UsuariosApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

const API = 'https://vania-api.vercel.app/api';

const DIAS = [
  { val: 1, label: 'Seg' }, { val: 2, label: 'Ter' }, { val: 3, label: 'Qua' },
  { val: 4, label: 'Qui' }, { val: 5, label: 'Sex' }, { val: 6, label: 'Sab' },
  { val: 0, label: 'Dom' },
];

const HORARIOS: string[] = [];
for (let h = 8; h <= 20; h++) {
  HORARIOS.push(`${String(h).padStart(2,'0')}:00`);
  if (h < 20) HORARIOS.push(`${String(h).padStart(2,'0')}:30`);
}

@Component({
  selector: 'app-admin-pacotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .pacote-card {
      background:var(--pearl); border:1.5px solid var(--champagne);
      border-radius:var(--radius-md); padding:1rem 1.2rem;
      display:flex; align-items:flex-start; justify-content:space-between;
      gap:1rem; flex-wrap:wrap; transition:border-color .2s;
    }
    .pacote-card:hover { border-color:var(--gold); }
    .pacote-card.inativo { opacity:.5; }
    .dias-grid { display:flex; gap:.35rem; flex-wrap:wrap; margin-top:.4rem; }
    .dia-chip {
      display:inline-flex; align-items:center; justify-content:center;
      width:34px; height:34px; border-radius:50%; border:1.5px solid var(--champagne);
      font-size:.72rem; font-weight:500; cursor:pointer; transition:all .18s;
      background:var(--pearl); color:var(--text-muted); user-select:none;
    }
    .dia-chip.on { background:var(--gold); color:#fff; border-color:var(--gold); }
    .modal-bg {
      position:fixed; inset:0; background:rgba(0,0,0,.45);
      z-index:700; display:flex; align-items:center; justify-content:center;
      padding:1rem;
    }
    .modal {
      background:var(--pearl); border-radius:var(--radius-lg);
      width:100%; max-width:520px; max-height:90vh; overflow-y:auto;
      padding:1.8rem;
    }
    .modal h3 { font-size:1.3rem; font-weight:300; margin-bottom:1.2rem; }
    .acoes { display:flex; gap:.4rem; flex-wrap:wrap; }
    .btn-icon {
      width:32px; height:32px; border:1.5px solid var(--champagne);
      border-radius:var(--radius); background:var(--pearl); cursor:pointer;
      display:flex; align-items:center; justify-content:center; font-size:.85rem;
      transition:all .18s;
    }
    .btn-icon:hover { border-color:var(--gold); }
    .btn-icon.del:hover { border-color:var(--error); }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Pacotes Fixos</h1>
          <p>Clientes com horarios reservados recorrentes. Esses horarios ficam bloqueados na agenda.</p>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn--outline btn--sm" (click)="regenerar()" [disabled]="regenerando()"
            title="Use quando os bloqueios sumirem apos reinicio do servidor">
            @if (regenerando()) { <span class="spinner spinner--sm"></span> }
            ↺ Regenerar Bloqueios
          </button>
          <button class="btn btn--primary" (click)="abrirNovo()">+ Novo Pacote</button>
        </div>
      </div>

      <!-- Filtro -->
      <div class="card card--elevated" style="padding:.8rem 1.2rem;margin-bottom:1rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center">
        <select [(ngModel)]="filtroCliente" style="min-width:180px;flex:1">
          <option value="">Todos os clientes</option>
          @for (c of clientes(); track c.id) {
            <option [value]="c.id">{{ c.nome }}</option>
          }
        </select>
        <label style="display:flex;align-items:center;gap:.4rem;font-size:.82rem;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" [(ngModel)]="mostrarInativos" /> Mostrar inativos
        </label>
        <span style="font-size:.8rem;color:var(--text-muted)">{{ listaFiltrada().length }} pacote(s)</span>
      </div>

      <!-- Lista -->
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (listaFiltrada().length === 0) {
        <div class="empty-state card">
          <div class="icon">📦</div>
          <h3>Nenhum pacote cadastrado</h3>
          <p>Cadastre clientes com horarios fixos recorrentes.</p>
          <button class="btn btn--primary" style="margin-top:1rem" (click)="abrirNovo()">+ Novo Pacote</button>
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:.7rem">
          @for (p of listaFiltrada(); track p.id) {
            <div class="pacote-card" [class.inativo]="!p.ativo">
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem">
                  <strong style="font-size:.95rem">{{ p.nome }}</strong>
                  @if (!p.ativo) { <span class="badge badge--cancelado">inativo</span> }
                  @if (p.data_fim) {
                    <span style="font-size:.72rem;color:var(--text-muted)">ate {{ fmt(p.data_fim) }}</span>
                  }
                </div>
                <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.4rem">
                  👤 {{ p.cliente_nome }} &nbsp;|&nbsp;
                  💎 {{ p.servico_nome }} &nbsp;|&nbsp;
                  🕐 {{ p.horario }}
                  @if (p.servico_duracao) { ({{ p.servico_duracao }}min) }
                </div>
                <div class="dias-grid">
                  @for (d of DIAS; track d.val) {
                    <span
                      class="dia-chip"
                      [class.on]="p.dias_semana?.includes(d.val)"
                      style="cursor:default"
                    >{{ d.label }}</span>
                  }
                </div>
                @if (p.data_inicio) {
                  <div style="font-size:.72rem;color:var(--text-muted);margin-top:.4rem">
                    De {{ fmt(p.data_inicio) }}
                    @if (p.data_fim) { ate {{ fmt(p.data_fim) }} }
                    @else { (sem data fim) }
                  </div>
                }
              </div>
              <div class="acoes">
                <button class="btn-icon" title="Editar" (click)="editar(p)">✏️</button>
                <button
                  class="btn-icon"
                  [title]="p.ativo ? 'Desativar' : 'Ativar'"
                  (click)="toggleAtivo(p)"
                >{{ p.ativo ? '⏸' : '▶' }}</button>
                <button class="btn-icon del" title="Excluir" (click)="excluir(p)">🗑</button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal novo/editar -->
    @if (modalAberto()) {
      <div class="modal-bg" (click)="fecharModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editando()?.id ? 'Editar Pacote' : 'Novo Pacote Fixo' }}</h3>

          <div class="form-group">
            <label>Cliente</label>
            <select [(ngModel)]="form.cliente_id" [disabled]="!!editando()?.id">
              <option value="">Selecione o cliente</option>
              @for (c of clientes(); track c.id) {
                <option [value]="c.id">{{ c.nome }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Nome do Pacote</label>
            <input [(ngModel)]="form.nome" placeholder="Ex: Pacote Botox Mensal" />
          </div>

          <div class="form-group">
            <label>Servico</label>
            <select [(ngModel)]="form.servico_id">
              <option value="">Selecione o servico</option>
              @for (s of servicos(); track s.id) {
                <option [value]="s.id">{{ s.nome }} ({{ s.duracao_min }}min)</option>
              }
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Horario Fixo</label>
              <select [(ngModel)]="form.horario">
                <option value="">Selecione</option>
                @for (h of HORARIOS; track h) {
                  <option [value]="h">{{ h }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Dias da Semana</label>
            <div class="dias-grid" style="margin-top:.4rem">
              @for (d of DIAS; track d.val) {
                <span
                  class="dia-chip"
                  [class.on]="form.dias_semana.includes(d.val)"
                  (click)="toggleDia(d.val)"
                >{{ d.label }}</span>
              }
            </div>
            @if (form.dias_semana.length === 0) {
              <small style="color:var(--error);font-size:.75rem">Selecione ao menos um dia</small>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Data Inicio (opcional)</label>
              <input type="date" [(ngModel)]="form.data_inicio" />
            </div>
            <div class="form-group">
              <label>Data Fim (opcional)</label>
              <input type="date" [(ngModel)]="form.data_fim" />
            </div>
          </div>

          @if (erroModal()) {
            <div class="alert alert--error">{{ erroModal() }}</div>
          }

          <div class="etapa-actions">
            <button class="btn btn--ghost" (click)="fecharModal()">Cancelar</button>
            <button
              class="btn btn--primary"
              (click)="salvar()"
              [disabled]="salvando()"
            >
              @if (salvando()) { <span class="spinner spinner--sm"></span> }
              {{ editando()?.id ? 'Salvar' : 'Criar Pacote' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminPacotesComponent implements OnInit {
  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private srvApi  = inject(ServicosApiService);
  private usrApi  = inject(UsuariosApiService);
  private toast   = inject(ToastService);

  readonly DIAS    = DIAS;
  readonly HORARIOS = HORARIOS;

  lista          = signal<any[]>([]);
  clientes       = signal<any[]>([]);
  servicos       = signal<any[]>([]);
  loading        = signal(true);
  modalAberto    = signal(false);
  editando       = signal<any>(null);
  salvando       = signal(false);
  regenerando    = signal(false);
  erroModal      = signal('');
  filtroCliente  = '';
  mostrarInativos = false;

  form = this.formVazio();

  listaFiltrada = computed(() => {
    let l = this.lista();
    if (this.filtroCliente) l = l.filter(p => p.cliente_id == this.filtroCliente);
    if (!this.mostrarInativos) l = l.filter(p => p.ativo);
    return l;
  });

  ngOnInit() {
    this.carregar();
    this.srvApi.listar({ ativo: true }).subscribe(r => this.servicos.set(r.dados));
    this.usrApi.listar({ tipo: 'cliente' }).subscribe(r => this.clientes.set(r.dados));
  }

  private headers() {
    const t = this.auth.token();
    return new HttpHeaders({ 'Authorization': `Bearer ${t}` });
  }

  carregar() {
    this.loading.set(true);
    this.http.get<any>(`${API}/pacotes`, { headers: this.headers() }).subscribe({
      next: r => { this.lista.set(r.dados || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  formVazio() {
    return { cliente_id: '', nome: '', servico_id: '', horario: '', dias_semana: [] as number[], data_inicio: '', data_fim: '' };
  }

  abrirNovo() {
    this.editando.set(null);
    this.form = this.formVazio();
    this.erroModal.set('');
    this.modalAberto.set(true);
  }

  editar(p: any) {
    this.editando.set(p);
    this.form = {
      cliente_id: p.cliente_id, nome: p.nome, servico_id: p.servico_id,
      horario: p.horario, dias_semana: [...(p.dias_semana||[])],
      data_inicio: p.data_inicio||'', data_fim: p.data_fim||''
    };
    this.erroModal.set('');
    this.modalAberto.set(true);
  }

  fecharModal() { this.modalAberto.set(false); }

  toggleDia(d: number) {
    const l = this.form.dias_semana;
    const i = l.indexOf(d);
    if (i >= 0) l.splice(i, 1); else l.push(d);
  }

  salvar() {
    if (!this.form.cliente_id) { this.erroModal.set('Selecione o cliente.'); return; }
    if (!this.form.servico_id) { this.erroModal.set('Selecione o servico.'); return; }
    if (!this.form.horario)    { this.erroModal.set('Selecione o horario.'); return; }
    if (!this.form.dias_semana.length) { this.erroModal.set('Selecione ao menos um dia.'); return; }

    this.salvando.set(true);
    this.erroModal.set('');
    const body = { ...this.form };
    const id = this.editando()?.id;
    const req = id
      ? this.http.put<any>(`${API}/pacotes/${id}`, body, { headers: this.headers() })
      : this.http.post<any>(`${API}/pacotes`, body, { headers: this.headers() });

    req.subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.toast.success(id ? 'Pacote atualizado!' : 'Pacote criado!');
        this.carregar();
      },
      error: e => {
        this.salvando.set(false);
        this.erroModal.set(e.error?.mensagem || 'Erro ao salvar.');
      }
    });
  }

  toggleAtivo(p: any) {
    this.http.put<any>(`${API}/pacotes/${p.id}`, { ativo: !p.ativo }, { headers: this.headers() }).subscribe({
      next: () => { this.toast.success(p.ativo ? 'Pacote desativado.' : 'Pacote ativado.'); this.carregar(); },
      error: () => this.toast.error('Erro ao atualizar.')
    });
  }

  regenerar() {
    if (!confirm('Regenerar todos os bloqueios de pacote para os proximos 180 dias?')) return;
    this.regenerando.set(true);
    this.http.post<any>(`${API}/pacotes/regenerar`, {}, { headers: this.headers() }).subscribe({
      next: r => { this.regenerando.set(false); this.toast.success(r.mensagem || 'Bloqueios regenerados!'); this.carregar(); },
      error: () => { this.regenerando.set(false); this.toast.error('Erro ao regenerar.'); }
    });
  }

  excluir(p: any) {
    if (!confirm(`Excluir pacote "${p.nome}" de ${p.cliente_nome}?`)) return;
    this.http.delete<any>(`${API}/pacotes/${p.id}`, { headers: this.headers() }).subscribe({
      next: () => { this.toast.success('Pacote excluido.'); this.carregar(); },
      error: () => this.toast.error('Erro ao excluir.')
    });
  }

  fmt(d: string) {
    if (!d) return '';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }
}
