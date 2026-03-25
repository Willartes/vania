// features/admin/agendamentos/admin-agendamentos.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AgendamentosApiService, ServicosApiService, UsuariosApiService, Agendamento } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-agendamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .btn-acao { display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:4px;border:1.5px solid;font-size:.72rem;font-weight:500;letter-spacing:.04em;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .18s;background:transparent; }
    .btn-confirmar { border-color:#2878b0;color:#2878b0; } .btn-confirmar:hover { background:#2878b0;color:#fff; }
    .btn-realizar  { border-color:#2e7d52;color:#2e7d52; } .btn-realizar:hover  { background:#2e7d52;color:#fff; }
    .btn-cancelar  { border-color:#c0392b;color:#c0392b; } .btn-cancelar:hover  { background:#c0392b;color:#fff; }
    .btn-whats     { border-color:#25d366;color:#1a9e4a; } .btn-whats:hover     { background:#25d366;color:#fff; }
    .acoes-cell { display:flex;gap:.35rem;flex-wrap:wrap; }
    .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:700;display:flex;align-items:center;justify-content:center;padding:1rem; }
    .modal { background:var(--pearl);border-radius:var(--radius-lg);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;padding:1.8rem; }
    .modal h3 { font-size:1.2rem;font-weight:400;margin-bottom:1.2rem; }
    .horarios-mini { display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.4rem; }
    .h-btn { padding:.35rem .6rem;border:1.5px solid var(--champagne);border-radius:4px;cursor:pointer;font-size:.75rem;background:var(--pearl);transition:all .18s; }
    .h-btn:hover { border-color:var(--gold); }
    .h-btn.sel { background:var(--gold);color:#fff;border-color:var(--gold); }
    .h-btn:disabled { opacity:.4;cursor:not-allowed; }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Agendamentos</h1>
          <p style="font-size:.82rem;color:var(--text-muted)">
            Ultima atualizacao: {{ ultimaAt() || '...' }}
            @if (loading()) { <span style="color:var(--gold)"> ⟳</span> }
          </p>
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn--outline btn--sm" (click)="buscar()" [disabled]="loading()">⟳ Atualizar</button>
          <button class="btn btn--primary btn--sm" (click)="abrirModal()">+ Novo Agendamento</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card card--elevated" style="padding:1rem 1.2rem;margin-bottom:1.2rem">
        <div style="display:flex;gap:.8rem;flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="margin:0;min-width:130px;flex:1">
            <label>Status</label>
            <select [(ngModel)]="filtros.status" (ngModelChange)="buscar()">
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;min-width:130px;flex:1">
            <label>Data inicio</label>
            <input type="date" [(ngModel)]="filtros.data_inicio" (change)="buscar()" />
          </div>
          <div class="form-group" style="margin:0;min-width:130px;flex:1">
            <label>Data fim</label>
            <input type="date" [(ngModel)]="filtros.data_fim" (change)="buscar()" />
          </div>
          <button class="btn btn--ghost btn--sm" style="align-self:flex-end" (click)="limpar()">Limpar</button>
        </div>
      </div>

      <!-- Lista -->
      <div class="card card--elevated">
        @if (loading() && lista().length === 0) {
          <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
        } @else if (lista().length === 0) {
          <div class="empty-state">
            <div class="icon">📅</div>
            <h3>Nenhum agendamento</h3>
            <p>Clique em <strong>+ Novo Agendamento</strong> para criar.</p>
          </div>
        } @else {
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
            <span style="font-size:.82rem;color:var(--text-muted)">{{ lista().length }} registros</span>
            @if (novos() > 0) {
              <span style="background:rgba(200,151,58,.15);color:var(--gold-dark);padding:.3rem .9rem;border-radius:20px;font-size:.78rem;font-weight:500">
                🔔 {{ novos() }} novo(s)
              </span>
            }
          </div>
          <div class="table-wrap">
            <table class="lc-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Servico</th>
                  <th>Data</th>
                  <th>Horario</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                @for (ag of lista(); track ag.id) {
                  <tr>
                    <td>
                      <strong style="display:block">{{ ag.usuario_nome }}</strong>
                      <small style="color:var(--text-muted)">{{ ag.usuario_telefone || '—' }}</small>
                    </td>
                    <td>
                      <span style="display:block">{{ ag.servico_nome }}</span>
                      <small style="color:var(--text-muted)">{{ ag.servico_categoria || '' }}</small>
                    </td>
                    <td style="white-space:nowrap">{{ fmt(ag.data) }}</td>
                    <td>{{ ag.horario }}</td>
                    <td>
                      <strong style="font-family:var(--font-display);color:var(--gold-dark)">
                        {{ curr(ag.servico_valor || 0) }}
                      </strong>
                    </td>
                    <td><span class="badge badge--{{ ag.status }}">{{ ag.status }}</span></td>
                    <td>
                      <div class="acoes-cell">
                        @if (ag.status === 'pendente') {
                          <button type="button" class="btn-acao btn-confirmar" (click)="confirmar(ag)">✓ Confirmar</button>
                        }
                        @if (ag.status === 'confirmado') {
                          <button type="button" class="btn-acao btn-realizar" (click)="realizar(ag)">✓ Realizar</button>
                        }
                        @if (ag.status !== 'cancelado' && ag.status !== 'realizado') {
                          <button type="button" class="btn-acao btn-cancelar" (click)="cancelar(ag)">✗ Cancelar</button>
                        }
                        @if (ag.usuario_telefone) {
                          <button type="button" class="btn-acao btn-whats" (click)="whats(ag)" title="Enviar WhatsApp">
                            📱 WhatsApp
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal Novo Agendamento -->
    @if (modalAberto()) {
      <div class="modal-bg" (click)="fecharModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Novo Agendamento</h3>

          <div class="form-group">
            <label>Cliente</label>
            <select [(ngModel)]="form.cliente_id">
              <option value="">Selecione o cliente</option>
              @for (c of clientes(); track c.id) {
                <option [value]="c.id">{{ c.nome }} {{ c.telefone ? '— ' + c.telefone : '' }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Servico</label>
            <select [(ngModel)]="form.servico_id" (ngModelChange)="onServicoChange()">
              <option value="">Selecione o servico</option>
              @for (s of servicos(); track s.id) {
                <option [value]="s.id">{{ s.nome }} ({{ s.duracao_min }}min — {{ curr(s.valor) }})</option>
              }
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Data</label>
              <input type="date" [(ngModel)]="form.data" [min]="hoje" (change)="buscarHorarios()" />
            </div>
          </div>

          @if (form.data && form.servico_id) {
            <div class="form-group">
              <label>Horario disponivel</label>
              @if (loadingH()) {
                <p style="color:var(--text-muted);font-size:.82rem">Carregando...</p>
              } @else if (horariosDisp().length === 0) {
                <p style="color:var(--error);font-size:.82rem">Nenhum horario disponivel nesta data.</p>
              } @else {
                <div class="horarios-mini">
                  @for (h of horariosDisp(); track h) {
                    <button
                      type="button"
                      class="h-btn"
                      [class.sel]="form.horario === h"
                      (click)="form.horario = h"
                    >{{ h }}</button>
                  }
                </div>
              }
            </div>
          }

          <div class="form-group">
            <label>Observacoes (opcional)</label>
            <textarea [(ngModel)]="form.obs" rows="2" placeholder="Alguma observacao?"></textarea>
          </div>

          @if (erroModal()) {
            <div class="alert alert--error">{{ erroModal() }}</div>
          }

          <div class="etapa-actions">
            <button class="btn btn--ghost" (click)="fecharModal()">Cancelar</button>
            <button class="btn btn--primary" (click)="criar()" [disabled]="salvando()">
              @if (salvando()) { <span class="spinner spinner--sm"></span> }
              Agendar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminAgendamentosComponent implements OnInit, OnDestroy {
  private http   = inject(HttpClient);
  private agApi  = inject(AgendamentosApiService);
  private srvApi = inject(ServicosApiService);
  private usrApi = inject(UsuariosApiService);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private API    = environment.apiUrl;

  lista    = signal<Agendamento[]>([]);
  loading  = signal(true);
  ultimaAt = signal('');
  novos    = signal(0);
  private timer: any;
  private prvLen = 0;

  filtros = { status: '', data_inicio: '', data_fim: '' };

  // Modal
  modalAberto = signal(false);
  clientes    = signal<any[]>([]);
  servicos    = signal<any[]>([]);
  horariosDisp= signal<string[]>([]);
  loadingH    = signal(false);
  salvando    = signal(false);
  erroModal   = signal('');
  hoje        = new Date().toISOString().split('T')[0];
  form        = this.formVazio();

  private headers() {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.auth.token()}` });
  }

  formVazio() {
    return { cliente_id: '', servico_id: '', data: '', horario: '', obs: '' };
  }

  ngOnInit() {
    this.buscar();
    this.timer = setInterval(() => this.buscar(true), 30000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  buscar(silencioso = false) {
    if (!silencioso) this.loading.set(true);
    this.agApi.listar(this.filtros).subscribe({
      next: r => {
        const dados = r.dados || [];
        if (silencioso && dados.length > this.prvLen) {
          const diff = dados.length - this.prvLen;
          this.novos.set(diff);
          this.toast.info(`🔔 ${diff} novo(s) agendamento(s)!`);
        }
        this.prvLen = dados.length;
        this.lista.set(dados);
        this.loading.set(false);
        this.novos.set(0);
        this.ultimaAt.set(new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
      },
      error: () => this.loading.set(false)
    });
  }

  limpar() { this.filtros = { status:'', data_inicio:'', data_fim:'' }; this.buscar(); }

  // Modal
  abrirModal() {
    this.form = this.formVazio();
    this.erroModal.set('');
    this.horariosDisp.set([]);
    // Carregar clientes e serviços se necessário
    if (!this.clientes().length) {
      this.usrApi.listar({ tipo: 'cliente' }).subscribe(r => this.clientes.set(r.dados || []));
    }
    if (!this.servicos().length) {
      this.srvApi.listar({ ativo: true }).subscribe(r => this.servicos.set(r.dados || []));
    }
    this.modalAberto.set(true);
  }

  fecharModal() { this.modalAberto.set(false); }

  onServicoChange() {
    this.form.horario = '';
    if (this.form.data && this.form.servico_id) this.buscarHorarios();
  }

  buscarHorarios() {
    if (!this.form.data || !this.form.servico_id) return;
    const srv = this.servicos().find(s => s.id == this.form.servico_id);
    const dur = srv?.duracao_min || 30;
    // Colaborador busca horários da sua própria agenda
    const colabId = this.auth.isColaborador() ? this.auth.usuario()?.id : undefined;
    this.form.horario = '';
    this.loadingH.set(true);
    this.agApi.horariosDisponiveis(this.form.data, dur, colabId).subscribe({
      next: r => { this.horariosDisp.set(r.dados || []); this.loadingH.set(false); },
      error: () => { this.horariosDisp.set([]); this.loadingH.set(false); }
    });
  }

  criar() {
    if (!this.form.cliente_id) { this.erroModal.set('Selecione o cliente.'); return; }
    if (!this.form.servico_id) { this.erroModal.set('Selecione o servico.'); return; }
    if (!this.form.data)       { this.erroModal.set('Informe a data.'); return; }
    if (!this.form.horario)    { this.erroModal.set('Selecione o horario.'); return; }

    this.salvando.set(true);
    this.erroModal.set('');

    // Colaborador é automaticamente o responsável
    const colabId = this.auth.isColaborador() ? this.auth.usuario()?.id : undefined;

    // Usar http para incluir usuario_id
    this.http.post<any>(`${this.API}/agendamentos`, {
      usuario_id:     Number(this.form.cliente_id),
      servico_id:     Number(this.form.servico_id),
      data:           this.form.data,
      horario:        this.form.horario,
      colaborador_id: colabId,
      observacoes:    this.form.obs || undefined,
    }, { headers: this.headers() }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.toast.success('Agendamento criado com sucesso!');
        this.buscar();
      },
      error: e => {
        this.salvando.set(false);
        this.erroModal.set(e.error?.mensagem || 'Erro ao criar agendamento.');
      }
    });
  }

  // Ações de status
  confirmar(ag: Agendamento) {
    this.agApi.atualizarStatus(ag.id, 'confirmado').subscribe({
      next: () => { this.toast.success('Confirmado!'); this.buscar(); },
      error: e => this.toast.error(e.error?.mensagem || 'Erro.')
    });
  }

  realizar(ag: Agendamento) {
    this.agApi.atualizarStatus(ag.id, 'realizado').subscribe({
      next: () => {
        this.toast.success('Marcado como realizado!');
        this.buscar();
        if (ag.usuario_telefone) {
          const msg = encodeURIComponent(
            `Ola ${ag.usuario_nome?.split(' ')[0] || ''}! ` +
            `Seu atendimento de *${ag.servico_nome}* foi concluido. ` +
            `Valor: *R$ ${(ag.servico_valor || 0).toFixed(2).replace('.', ',')}*. ` +
            `Obrigada pela preferencia! ✦ Vania Herculano`
          );
          const tel = ag.usuario_telefone.replace(/\D/g, '');
          window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
        }
      },
      error: e => this.toast.error(e.error?.mensagem || 'Erro.')
    });
  }

  cancelar(ag: Agendamento) {
    if (!confirm('Cancelar este agendamento?')) return;
    this.agApi.cancelar(ag.id).subscribe({
      next: () => { this.toast.success('Cancelado.'); this.buscar(); },
      error: e => this.toast.error(e.error?.mensagem || 'Erro.')
    });
  }

  whats(ag: Agendamento) {
    const tel = ag.usuario_telefone?.replace(/\D/g, '');
    if (!tel) return;
    const msg = encodeURIComponent(
      `Ola ${ag.usuario_nome?.split(' ')[0]}! ` +
      `Lembrando seu agendamento: *${ag.servico_nome}* em *${this.fmt(ag.data)}* as *${ag.horario}*. ` +
      `Vania Herculano Biomedicina Estetica.`
    );
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
  }

  fmt(d: string) {
    if (!d) return '—';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }

  curr(v: number) {
    return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  }
}
