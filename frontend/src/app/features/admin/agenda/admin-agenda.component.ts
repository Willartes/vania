// features/admin/agenda/admin-agenda.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AgendaApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

const H_PADRAO = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
                  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];
const H_TODOS  = H_PADRAO;
const MESES    = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

@Component({
  selector: 'app-admin-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .cal-wrap { overflow-x:auto; }
    .cal-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:3px;min-width:280px; }
    .cal-head { text-align:center;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:.4rem 0; }
    .cal-cell { aspect-ratio:1;min-height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;border:1.5px solid transparent;font-size:.82rem;transition:all .18s;gap:1px;padding:.2rem;position:relative; }
    .cal-cell:hover:not(.past):not(.empty) { border-color:var(--gold);background:var(--gold-ultra); }
    .cal-cell.hoje   { border-color:var(--gold);background:var(--gold-ultra);font-weight:600; }
    .cal-cell.sel    { background:var(--gold)!important;color:#fff!important;border-color:var(--gold)!important; }
    .cal-cell.bloq   { background:rgba(192,57,43,.08);border-color:rgba(192,57,43,.2); }
    .cal-cell.conf   { background:rgba(46,125,82,.06);border-color:rgba(46,125,82,.25); }
    .cal-cell.past   { opacity:.3;cursor:default; }
    .cal-cell.empty  { cursor:default; }
    .cal-num  { font-size:.85rem;line-height:1; }
    .cal-tag  { font-size:.55rem;line-height:1; }
    .h-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem; }
    .h-slot { padding:.5rem .2rem;text-align:center;border:1.5px solid var(--champagne);border-radius:4px;cursor:pointer;font-size:.78rem;transition:all .18s;background:var(--pearl);user-select:none; }
    .h-slot:hover { border-color:var(--gold); }
    .h-slot.on    { background:var(--gold);color:#fff;border-color:var(--gold); }
    .h-slot.ocup  { background:rgba(46,42,30,.05);color:var(--text-muted);cursor:not-allowed;border-style:dashed; }
    .nav-mes { display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem; }
    .nav-btn { width:32px;height:32px;border:1.5px solid var(--champagne);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--pearl);font-size:.95rem;transition:all .2s; }
    .nav-btn:hover { border-color:var(--gold);color:var(--gold); }
    .rapido { display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.8rem; }
    .rapido button { font-size:.68rem;padding:.3rem .75rem;border:1px solid var(--champagne);border-radius:20px;cursor:pointer;background:var(--pearl);transition:all .18s;color:var(--text-muted); }
    .rapido button:hover { border-color:var(--gold);color:var(--gold); }
    .agenda-layout { display:grid;grid-template-columns:1fr 360px;gap:1.2rem;align-items:start; }
    @media(max-width:900px) { .agenda-layout { grid-template-columns:1fr; } }
    @media(max-width:480px) { .h-grid { grid-template-columns:repeat(3,1fr); } }
    .ocup-row { display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid var(--champagne);font-size:.83rem; }
    .ocup-row:last-child { border-bottom:none; }
    .prof-selector { display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.2rem; }
    .prof-btn { padding:.4rem 1rem;border:1.5px solid var(--champagne);border-radius:20px;cursor:pointer;background:var(--pearl);font-size:.78rem;transition:all .18s;color:var(--text-muted); }
    .prof-btn:hover { border-color:var(--gold); }
    .prof-btn.ativo { background:var(--gold);color:#fff;border-color:var(--gold); }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>{{ auth.isSuperAdmin() ? 'Gestao de Agendas' : 'Minha Agenda' }}</h1>
          <p>{{ auth.isSuperAdmin() ? 'Gerencie os horarios de toda a equipe.' : 'Configure seus dias e horarios disponiveis.' }}</p>
        </div>
      </div>

      <!-- Seletor de profissional (apenas superadmin/admin) -->
      @if (auth.isAdminPlus() && profissionais().length > 0) {
        <div style="margin-bottom:1.2rem">
          <p style="font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:.5rem">Profissional</p>
          <div class="prof-selector">
            @for (p of profissionais(); track p.id) {
              <button
                type="button"
                class="prof-btn"
                [class.ativo]="profAtivo()?.id === p.id"
                (click)="selecionarProf(p)"
              >
                {{ p.nome }}
                @if (p.tipo === 'superadmin') { (Proprietaria) }
                @else if (p.especialidade) { ({{ p.especialidade }}) }
              </button>
            }
          </div>
        </div>
      }

      <!-- Legenda -->
      <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem">
        @for (l of legenda; track l.cor) {
          <span style="display:flex;align-items:center;gap:.35rem;font-size:.76rem;color:var(--text-muted)">
            <span [style]="'width:11px;height:11px;border-radius:3px;display:inline-block;' + l.cor"></span>
            {{ l.label }}
          </span>
        }
      </div>

      <div class="agenda-layout">
        <!-- Calendario -->
        <div class="card card--elevated">
          <div class="nav-mes">
            <button class="nav-btn" type="button" (click)="mesAnterior()">‹</button>
            <strong style="font-size:1rem;font-weight:400">{{ MESES[mes()] }} {{ ano() }}</strong>
            <button class="nav-btn" type="button" (click)="proximoMes()">›</button>
          </div>

          <div class="rapido">
            <button type="button" (click)="liberarSemana()">✓ Liberar semana</button>
            <button type="button" (click)="bloquearSemana()">✗ Bloquear semana</button>
            <button type="button" (click)="liberarMes()">✓ Liberar mes</button>
            <button type="button" (click)="bloquearFds()">✗ Bloquear fds</button>
          </div>

          <div class="cal-wrap">
            <div class="cal-grid">
              @for (d of ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']; track d) {
                <div class="cal-head">{{ d }}</div>
              }
              @for (c of celulas(); track c.key) {
                <div
                  class="cal-cell"
                  [class.empty]="!c.dia"
                  [class.hoje]="c.isHoje"
                  [class.past]="c.past"
                  [class.sel]="diaSel() === c.data"
                  [class.bloq]="c.bloqueado"
                  [class.conf]="c.conf && !c.bloqueado"
                  (click)="c.dia && !c.past ? selDia(c.data) : null"
                >
                  @if (c.dia) {
                    <span class="cal-num">{{ c.dia }}</span>
                    @if (c.bloqueado) { <span class="cal-tag" style="color:var(--error)">✗</span> }
                    @else if (c.ags > 0) { <span class="cal-tag" style="color:var(--gold-dark)">{{ c.ags }}ag</span> }
                    @else if (c.conf) { <span class="cal-tag" style="color:var(--success)">✓</span> }
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Painel do dia -->
        @if (diaSel()) {
          <div class="card card--elevated">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
              <h3 style="font-size:1.1rem;font-weight:400">{{ fmtBr(diaSel()) }}</h3>
              <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                @if (!diaConfig()?.bloqueado) {
                  <button type="button" class="btn btn--sm btn--danger" (click)="bloquear()">✗ Bloquear</button>
                }
                <button type="button" class="btn btn--sm btn--ghost" (click)="restaurar()">↩ Padrao</button>
              </div>
            </div>

            @if (carregandoDia()) {
              <div class="loading-overlay" style="min-height:100px"><div class="spinner"></div></div>
            } @else if (diaConfig()?.bloqueado) {
              <div class="alert alert--error" style="margin-bottom:.8rem">
                <strong>Dia bloqueado</strong> — nenhum agendamento aceito.
              </div>
              <button type="button" class="btn btn--outline btn--full" (click)="desbloquear()">
                ✓ Desbloquear este dia
              </button>
            } @else {
              <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:.7rem">
                Clique para ativar/desativar horarios.
              </p>
              <div class="h-grid" style="margin-bottom:1rem">
                @for (h of H_TODOS; track h) {
                  <div
                    class="h-slot"
                    [class.on]="hAtivo(h)"
                    [class.ocup]="hOcup(h)"
                    (click)="!hOcup(h) && toggleH(h)"
                    [title]="hOcup(h) ? 'Com agendamento' : (hAtivo(h) ? 'Desativar' : 'Ativar')"
                  >
                    {{ h }}
                    @if (hOcup(h)) { <span style="display:block;font-size:.55rem">●</span> }
                  </div>
                }
              </div>

              <button
                type="button"
                class="btn btn--primary btn--full"
                (click)="salvar()"
                [disabled]="salvando()"
              >
                @if (salvando()) { <span class="spinner spinner--sm"></span>&nbsp; }
                💾 Salvar horarios
              </button>

              @if (ocupados().length > 0) {
                <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--champagne)">
                  <p style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:.6rem">
                    Agendamentos do dia
                  </p>
                  @for (oc of ocupados(); track oc.id) {
                    <div class="ocup-row">
                      <div>
                        <strong>{{ oc.horario }}</strong>
                        <span style="color:var(--text-muted)"> — {{ oc.cliente }}</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:.4rem">
                        <span style="font-size:.75rem;color:var(--text-muted)">{{ oc.servico }}</span>
                        <span class="badge badge--{{ oc.status }}">{{ oc.status }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        } @else {
          <div class="card card--elevated" style="display:flex;align-items:center;justify-content:center;min-height:220px">
            <div class="empty-state">
              <div class="icon">📅</div>
              <h3>Selecione um dia</h3>
              <p>Clique em qualquer data no calendario para configurar os horarios.</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminAgendaComponent implements OnInit {
  private http   = inject(HttpClient);
  api    = inject(AgendaApiService);
  auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private API    = environment.apiUrl;

  readonly MESES = MESES;
  readonly H_TODOS = H_TODOS;

  mes  = signal(new Date().getMonth());
  ano  = signal(new Date().getFullYear());
  hoje = new Date().toISOString().split('T')[0];

  // Seletor de profissional (superadmin/admin)
  profissionais = signal<any[]>([]);
  profAtivo     = signal<any>(null);

  configs       = signal<any[]>([]);
  diaSel        = signal('');
  diaConfig     = signal<any>(null);
  carregandoDia = signal(false);
  ocupados      = signal<any[]>([]);
  horariosSel   = signal<string[]>([...H_PADRAO]);
  salvando      = signal(false);

  legenda = [
    { cor:'background:rgba(46,125,82,.12);border:1px solid rgba(46,125,82,.3)', label:'Configurado' },
    { cor:'background:rgba(192,57,43,.1);border:1px solid rgba(192,57,43,.25)', label:'Bloqueado' },
    { cor:'background:var(--gold)', label:'Selecionado' },
    { cor:'background:var(--gold-ultra);border:1px solid var(--gold)', label:'Hoje' },
  ];

  private headers() {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.auth.token()}` });
  }

  ngOnInit() {
    // Superadmin/admin carrega lista de profissionais para seletor
    if (this.auth.isAdminPlus()) {
      this.http.get<any>(`${this.API}/profissionais`, { headers: this.headers() }).subscribe({
        next: r => {
          this.profissionais.set(r.dados || []);
          // Padrão: selecionar o próprio usuário logado
          const meu = r.dados?.find((p: any) => p.id === this.auth.usuario()?.id);
          this.profAtivo.set(meu || r.dados?.[0] || null);
          this.carregar();
        },
        error: () => this.carregar()
      });
    } else {
      // Colaborador: sempre sua própria agenda
      this.profAtivo.set({ id: this.auth.usuario()?.id, nome: this.auth.usuario()?.nome });
      this.carregar();
    }
  }

  selecionarProf(p: any) {
    this.profAtivo.set(p);
    this.diaSel.set('');
    this.diaConfig.set(null);
    this.carregar();
  }

  get profId(): number | undefined {
    return this.profAtivo()?.id || undefined;
  }

  carregar() {
    this.api.listar(this.profId).subscribe({
      next: r => this.configs.set(r.dados || []),
      error: () => {}
    });
  }

  // Calendario
  celulas = computed(() => {
    const a = this.ano(), m = this.mes();
    const primeiro = new Date(a, m, 1);
    const ultimo   = new Date(a, m + 1, 0).getDate();
    const cells: any[] = [];
    for (let i = 0; i < primeiro.getDay(); i++) cells.push({ dia:null, key:`e${i}` });
    for (let d = 1; d <= ultimo; d++) {
      const data = `${a}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const cfg  = this.configs().find(c => c.data === data);
      cells.push({ dia:d, data, key:data,
        past: data < this.hoje, isHoje: data === this.hoje,
        bloqueado: cfg?.bloqueado || false, conf: !!cfg,
        ags: cfg?.agendamentos || 0,
      });
    }
    return cells;
  });

  mesAnterior() {
    if (this.mes() === 0) { this.mes.set(11); this.ano.update(a => a-1); }
    else this.mes.update(m => m-1);
  }
  proximoMes() {
    if (this.mes() === 11) { this.mes.set(0); this.ano.update(a => a+1); }
    else this.mes.update(m => m+1);
  }

  selDia(data: string) {
    this.diaSel.set(data);
    this.carregandoDia.set(true);
    this.api.buscarDia(data, this.profId).subscribe({
      next: r => {
        const cfg = r.dados;
        this.diaConfig.set(cfg);
        this.ocupados.set(cfg.ocupados || []);
        this.horariosSel.set(cfg.bloqueado ? [] : (cfg.horarios?.length ? [...cfg.horarios] : [...H_PADRAO]));
        this.carregandoDia.set(false);
      },
      error: () => {
        this.diaConfig.set({ data, horarios: H_PADRAO, bloqueado: false, ocupados: [] });
        this.horariosSel.set([...H_PADRAO]);
        this.ocupados.set([]);
        this.carregandoDia.set(false);
      }
    });
  }

  hAtivo(h: string)  { return this.horariosSel().includes(h); }
  hOcup(h: string)   { return this.ocupados().some(o => o.horario === h); }
  toggleH(h: string) {
    this.horariosSel.update(l => l.includes(h) ? l.filter(x => x !== h) : [...l, h].sort());
  }

  salvar() {
    const data = this.diaSel();
    if (!data) return;
    this.salvando.set(true);
    this.api.configurar(data, this.horariosSel(), false, this.profId).subscribe({
      next: () => { this.toast.success(`Agenda de ${this.fmtBr(data)} salva!`); this.salvando.set(false); this.carregar(); },
      error: () => { this.toast.error('Erro ao salvar.'); this.salvando.set(false); }
    });
  }

  bloquear() {
    const data = this.diaSel();
    if (!confirm(`Bloquear ${this.fmtBr(data)}?`)) return;
    this.api.configurar(data, [], true, this.profId).subscribe({
      next: () => { this.toast.success('Dia bloqueado.'); this.diaConfig.update(c => ({...c, bloqueado:true})); this.carregar(); },
      error: () => this.toast.error('Erro.')
    });
  }

  desbloquear() {
    const data = this.diaSel();
    this.api.configurar(data, [...H_PADRAO], false, this.profId).subscribe({
      next: () => { this.toast.success('Dia desbloqueado.'); this.selDia(data); this.carregar(); },
      error: () => this.toast.error('Erro.')
    });
  }

  restaurar() {
    const data = this.diaSel();
    if (!confirm('Restaurar horarios padrao?')) return;
    this.api.remover(data).subscribe({
      next: () => { this.toast.success('Configuracao removida.'); this.selDia(data); this.carregar(); },
      error: () => this.toast.error('Erro.')
    });
  }

  // Acoes em massa
  private diasUteis(semanaOnly = false): string[] {
    const hoje = new Date();
    const dias = [];
    if (semanaOnly) {
      const dom = new Date(hoje); dom.setDate(hoje.getDate() - hoje.getDay());
      for (let i = 1; i <= 5; i++) {
        const d = new Date(dom); d.setDate(dom.getDate() + i);
        const s = d.toISOString().split('T')[0];
        if (s >= this.hoje) dias.push(s);
      }
    } else {
      const a = this.ano(), m = this.mes();
      const ultimo = new Date(a, m+1, 0).getDate();
      for (let d = 1; d <= ultimo; d++) {
        const data = `${a}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dw = new Date(data+'T12:00:00').getDay();
        if (data >= this.hoje && dw !== 0 && dw !== 6) dias.push(data);
      }
    }
    return dias;
  }

  liberarSemana() {
    const dias = this.diasUteis(true);
    if (!dias.length) { this.toast.error('Sem dias uteis esta semana.'); return; }
    Promise.all(dias.map(d => lastValueFrom(this.api.configurar(d, [...H_PADRAO], false, this.profId))))
      .then(() => { this.toast.success('Semana liberada!'); this.carregar(); });
  }
  bloquearSemana() {
    const dias = this.diasUteis(true);
    if (!dias.length || !confirm(`Bloquear ${dias.length} dias?`)) return;
    Promise.all(dias.map(d => lastValueFrom(this.api.configurar(d, [], true, this.profId))))
      .then(() => { this.toast.success('Semana bloqueada.'); this.carregar(); });
  }
  liberarMes() {
    const dias = this.diasUteis(false);
    Promise.all(dias.map(d => lastValueFrom(this.api.configurar(d, [...H_PADRAO], false, this.profId))))
      .then(() => { this.toast.success(`${MESES[this.mes()]} liberado!`); this.carregar(); });
  }
  bloquearFds() {
    const a = this.ano(), m = this.mes();
    const ultimo = new Date(a, m+1, 0).getDate();
    const dias = [];
    for (let d = 1; d <= ultimo; d++) {
      const data = `${a}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dw = new Date(data+'T12:00:00').getDay();
      if (data >= this.hoje && (dw === 0 || dw === 6)) dias.push(data);
    }
    Promise.all(dias.map(d => lastValueFrom(this.api.configurar(d, [], true, this.profId))))
      .then(() => { this.toast.success('Fins de semana bloqueados!'); this.carregar(); });
  }

  fmtBr(data: string) {
    if (!data) return '';
    const [y,m,d] = data.split('-');
    const ds = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
    const dw = new Date(data+'T12:00:00').getDay();
    return `${ds[dw]}, ${d}/${m}/${y}`;
  }
}
