// features/cliente/agendar/agendar.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ServicosApiService, AgendamentosApiService, Servico } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface Profissional { id: number; nome: string; tipo: string; especialidade: string | null; }

@Component({
  selector: 'app-agendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    /* Cards de profissional */
    .prof-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: .9rem;
      margin-bottom: 1.5rem;
    }
    .prof-card {
      border: 1.5px solid var(--champagne);
      border-radius: var(--radius-md);
      padding: 1.2rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: all .2s;
      background: var(--pearl);
      position: relative;
    }
    .prof-card:hover   { border-color: var(--gold); box-shadow: 0 2px 12px rgba(200,151,58,.12); }
    .prof-card.selected{ border-color: var(--gold); background: var(--gold-ultra); }
    .prof-avatar {
      width: 54px; height: 54px; border-radius: 50%;
      background: var(--gold-ultra); border: 2px solid var(--gold);
      color: var(--gold-dark); font-size: 1.3rem; font-weight: 500;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto .7rem;
    }
    .prof-nome     { font-size: .9rem; font-weight: 500; color: var(--text); margin-bottom: .2rem; }
    .prof-espec    { font-size: .72rem; color: var(--text-muted); }
    .prof-check    {
      position: absolute; top: .5rem; right: .5rem;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--gold); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 700;
    }
    .qualquer-card {
      border: 1.5px dashed var(--champagne);
      border-radius: var(--radius-md);
      padding: 1rem 1.2rem;
      cursor: pointer;
      transition: all .2s;
      display: flex; align-items: center; gap: .8rem;
      margin-bottom: 1rem;
      background: var(--pearl);
    }
    .qualquer-card:hover   { border-color: var(--gold); }
    .qualquer-card.selected{ border-color: var(--gold); background: var(--gold-ultra); }
    /* Serviços */
    .srv-escolha-card { position:relative; cursor:pointer; }
    .srv-escolha-card.selected { border-color:var(--gold)!important; background:var(--gold-ultra)!important; }
    .check-badge { position:absolute;top:.7rem;right:.7rem;width:24px;height:24px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700; }
    .sel-resumo { background:var(--pearl);border:1.5px solid var(--gold);border-radius:var(--radius-md);padding:1rem 1.2rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.8rem; }
    .sel-tags { display:flex;gap:.4rem;flex-wrap:wrap; }
    .sel-tag { display:inline-flex;align-items:center;gap:.35rem;background:var(--gold-pale);color:var(--gold-dark);border:1px solid var(--gold);border-radius:20px;padding:.22rem .75rem;font-size:.75rem; }
    .sel-tag button { background:none;border:none;cursor:pointer;color:var(--gold-dark);font-size:.8rem;padding:0;line-height:1;opacity:.7;transition:opacity .15s; }
    .sel-tag button:hover { opacity:1; }
    /* Horários */
    .servico-horario-card { border:1.5px solid var(--champagne);border-radius:var(--radius-md);overflow:hidden;margin-bottom:1rem; }
    .sh-header { background:var(--gold-ultra);padding:.75rem 1.1rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--champagne); }
    .sh-header h4 { font-size:.95rem;font-weight:400;color:var(--text); }
    .sh-header span { font-family:var(--font-display);font-size:1rem;color:var(--gold-dark); }
    .sh-body { padding:.9rem 1.1rem; }
    .sh-body p { font-size:.8rem;color:var(--text-muted);margin-bottom:.7rem; }
    .horario-btn { font-size:.78rem; }
    .horario-btn.selected { background:var(--gold);color:#fff;border-color:var(--gold); }
    /* Total */
    .total-box { background:linear-gradient(135deg,var(--dark2),var(--dark3));border-radius:var(--radius-md);padding:1.2rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.8rem;margin-top:1rem; }
    .total-box .t-label { color:rgba(255,255,255,.55);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase; }
    .total-box .t-valor { font-family:var(--font-display);font-size:2rem;color:var(--gold-light);font-weight:300; }
  `],
  template: `
    <div class="agendar-page fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Novo Agendamento</h1>
          <p>Escolha o profissional, os tratamentos, data e horario.</p>
        </div>
      </div>

      <!-- Stepper -->
      <div class="stepper">
        @for (s of steps; track s.num) {
          <div class="step" [class.active]="etapa() === s.num" [class.done]="etapa() > s.num">
            <div class="step__num">{{ etapa() > s.num ? '✓' : s.num }}</div>
            <span>{{ s.label }}</span>
          </div>
          @if (!$last) { <div class="step__line"></div> }
        }
      </div>

      <div class="agendar-body">

        <!-- ══ ETAPA 1: Profissional ══════════════════════════════ -->
        @if (etapa() === 1) {
          <div class="etapa slide-up">
            <h2>Escolha o Profissional</h2>
            <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:1.4rem">
              Selecione com qual profissional deseja realizar seu tratamento.
            </p>

            @if (loadingProf()) {
              <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
            } @else {

              <!-- Opção: qualquer profissional disponível -->
              <div
                class="qualquer-card"
                [class.selected]="profSel()?.id === 0"
                (click)="selecionarProf({ id: 0, nome: 'Qualquer profissional', tipo: '', especialidade: null })"
              >
                <div style="width:42px;height:42px;border-radius:50%;background:var(--champagne);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">✦</div>
                <div>
                  <div style="font-weight:500;font-size:.95rem">Qualquer profissional disponivel</div>
                  <div style="font-size:.78rem;color:var(--text-muted)">O sistema escolhe o melhor horario</div>
                </div>
                @if (profSel()?.id === 0) { <div class="prof-check" style="position:static;margin-left:auto">✓</div> }
              </div>

              <!-- Lista de profissionais -->
              <div class="prof-grid">
                @for (p of profissionais(); track p.id) {
                  <div
                    class="prof-card"
                    [class.selected]="profSel()?.id === p.id"
                    (click)="selecionarProf(p)"
                  >
                    <div class="prof-avatar">{{ p.nome[0].toUpperCase() }}</div>
                    <div class="prof-nome">{{ p.nome }}</div>
                    <div class="prof-espec">{{ p.especialidade || tipoLabel(p.tipo) }}</div>
                    @if (profSel()?.id === p.id) {
                      <div class="prof-check">✓</div>
                    }
                  </div>
                }
              </div>
            }

            <div class="etapa-actions">
              <button
                class="btn btn--primary"
                [disabled]="!profSel()"
                (click)="irParaEtapa2()"
              >
                Continuar →
              </button>
            </div>
          </div>
        }

        <!-- ══ ETAPA 2: Serviços ══════════════════════════════════ -->
        @if (etapa() === 2) {
          <div class="etapa slide-up">
            <h2>Escolha os Tratamentos</h2>

            @if (profSel()?.id !== 0) {
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:1.2rem;padding:.7rem 1rem;background:var(--gold-ultra);border-radius:var(--radius-md);border:1px solid var(--gold)">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:500;font-size:.85rem;flex-shrink:0">{{ profSel()!.nome[0] }}</div>
                <div>
                  <div style="font-size:.85rem;font-weight:500">{{ profSel()!.nome }}</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">{{ profSel()!.especialidade || tipoLabel(profSel()!.tipo) }}</div>
                </div>
                <button type="button" class="btn btn--ghost btn--sm" style="margin-left:auto" (click)="etapa.set(1)">Trocar</button>
              </div>
            }

            <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:1.4rem">
              Voce pode selecionar <strong>mais de um servico</strong> para o mesmo dia.
            </p>

            @if (loadingServicos()) {
              <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
            } @else {
              @if (categorias().length > 1) {
                <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.2rem">
                  <button class="filtro-btn" [class.active]="catFiltro() === ''" (click)="catFiltro.set('')">Todos</button>
                  @for (c of categorias(); track c) {
                    <button class="filtro-btn" [class.active]="catFiltro() === c" (click)="catFiltro.set(c)">{{ c }}</button>
                  }
                </div>
              }
              <div class="srv-escolha-grid">
                @for (s of servicosFiltrados(); track s.id) {
                  <div class="srv-escolha-card" [class.selected]="estaSelected(s.id)" (click)="toggleServico(s)">
                    <div class="srv-escolha-card__cat">{{ s.categoria }}</div>
                    <h3>{{ s.nome }}</h3>
                    <p>{{ s.descricao }}</p>
                    <div class="srv-escolha-card__footer">
                      <span>⏱ {{ s.duracao_min }} min</span>
                      <strong>R$ {{ s.valor | number:'1.2-2' }}</strong>
                    </div>
                    @if (estaSelected(s.id)) { <div class="check-badge">✓</div> }
                  </div>
                }
              </div>
            }

            @if (servicosSel().length > 0) {
              <div class="sel-resumo">
                <div>
                  <span style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted)">{{ servicosSel().length }} tratamento(s)</span>
                  <div class="sel-tags" style="margin-top:.4rem">
                    @for (s of servicosSel(); track s.id) {
                      <span class="sel-tag">{{ s.nome }}<button type="button" (click)="removerServico(s.id);$event.stopPropagation()">✕</button></span>
                    }
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:.7rem;color:var(--text-muted)">Total estimado</div>
                  <div style="font-family:var(--font-display);font-size:1.4rem;color:var(--gold-dark)">R$ {{ totalValor() | number:'1.2-2' }}</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">⏱ {{ totalDuracao() }} min</div>
                </div>
              </div>
            }

            <div class="etapa-actions">
              <button class="btn btn--ghost" (click)="etapa.set(1)">← Voltar</button>
              <button class="btn btn--primary" [disabled]="servicosSel().length === 0" (click)="irParaEtapa3()">
                Continuar → ({{ servicosSel().length }} servico(s))
              </button>
            </div>
          </div>
        }

        <!-- ══ ETAPA 3: Data e Horários ════════════════════════════ -->
        @if (etapa() === 3) {
          <div class="etapa slide-up">
            <h2>Escolha a Data e Horarios</h2>
            <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:1.4rem">
              Escolha a data e um horario <strong>diferente para cada tratamento</strong>.
            </p>

            <div class="card" style="margin-bottom:1.2rem">
              <h4 style="margin-bottom:.7rem;font-size:1rem;font-weight:400">📅 Data do Agendamento</h4>
              <input type="date" [(ngModel)]="dataSelecionada" [min]="hoje" (change)="carregarHorarios()" class="date-input" style="max-width:220px" />
            </div>

            @if (dataSelecionada) {
              @if (loadingHorarios()) {
                <div class="loading-overlay" style="min-height:120px"><div class="spinner"></div></div>
              } @else if (nenhumHorarioDisponivel()) {
                <div class="alert alert--warning">Nenhum horario disponivel nessa data. Escolha outra data.</div>
              } @else {
                @for (s of servicosSel(); track s.id; let i = $index) {
                  <div class="servico-horario-card">
                    <div class="sh-header">
                      <div>
                        <h4>{{ i + 1 }}. {{ s.nome }}</h4>
                        <small style="color:var(--text-light);font-size:.78rem">{{ s.categoria }} · {{ s.duracao_min }}min</small>
                      </div>
                      <span>R$ {{ s.valor | number:'1.2-2' }}</span>
                    </div>
                    <div class="sh-body">
                      @if (getHorario(s.id)) {
                        <p style="color:var(--success);font-size:.82rem;margin-bottom:.5rem">
                          ✓ Horario: <strong>{{ getHorario(s.id) }}</strong>
                          <button type="button" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.75rem;margin-left:.5rem" (click)="limparHorario(s.id)">trocar</button>
                        </p>
                      }
                      <p>Selecione o horario para <strong>{{ s.nome }}</strong>:</p>
                      <div class="horarios-grid">
                        @for (h of horariosParaServico(s.id); track h) {
                          <button type="button" class="horario-btn" [class.selected]="getHorario(s.id) === h"
                            [disabled]="horarioEmUsoOutroServico(h, s.id)"
                            (click)="setHorario(s.id, h)">{{ h }}</button>
                        }
                      </div>
                    </div>
                  </div>
                }
              }
            } @else {
              <div class="card" style="text-align:center;padding:2rem;color:var(--text-muted)">
                <div style="font-size:2rem;margin-bottom:.5rem">📅</div>
                Selecione uma data para ver os horarios disponiveis.
              </div>
            }

            <div class="form-group" style="margin-top:1rem">
              <label>Observacoes (opcional)</label>
              <textarea [(ngModel)]="observacoes" rows="3" placeholder="Alguma informacao relevante?"></textarea>
            </div>

            <div class="etapa-actions">
              <button class="btn btn--ghost" (click)="etapa.set(2)">← Voltar</button>
              <button class="btn btn--primary" [disabled]="!todosComHorario()" (click)="etapa.set(4)">Continuar → Revisar</button>
            </div>
          </div>
        }

        <!-- ══ ETAPA 4: Confirmação ════════════════════════════════ -->
        @if (etapa() === 4) {
          <div class="etapa slide-up">
            <h2>Confirmar Agendamento</h2>
            <div class="confirmacao-card card">
              <!-- Profissional -->
              <div class="confirmacao-item">
                <span>Profissional</span>
                <strong>{{ profSel()?.id === 0 ? 'Melhor disponivel' : profSel()?.nome }}</strong>
              </div>
              <div class="confirmacao-item">
                <span>Data</span>
                <strong>{{ formatarData(dataSelecionada) }}</strong>
              </div>
              @for (s of servicosSel(); track s.id) {
                <div class="confirmacao-item" style="padding:.8rem 0;border-bottom:1px solid var(--champagne)">
                  <div>
                    <strong style="display:block">{{ s.nome }}</strong>
                    <small style="color:var(--text-muted)">{{ s.categoria }} · {{ s.duracao_min }}min · 🕐 {{ getHorario(s.id) }}</small>
                  </div>
                  <strong style="font-family:var(--font-display);color:var(--gold-dark)">R$ {{ s.valor | number:'1.2-2' }}</strong>
                </div>
              }
              @if (observacoes) {
                <div class="confirmacao-item">
                  <span>Observacoes</span>
                  <strong style="font-weight:400;font-style:italic">{{ observacoes }}</strong>
                </div>
              }
            </div>

            <div class="total-box">
              <div>
                <div class="t-label">Total</div>
                <div class="t-valor">R$ {{ totalValor() | number:'1.2-2' }}</div>
                <div style="color:rgba(255,255,255,.4);font-size:.8rem">⏱ {{ totalDuracao() }} minutos</div>
              </div>
              <div style="text-align:right;color:rgba(255,255,255,.4);font-size:.82rem">
                {{ servicosSel().length }} tratamento(s)<br>{{ formatarData(dataSelecionada) }}
              </div>
            </div>

            <div class="etapa-actions">
              <button class="btn btn--ghost" (click)="etapa.set(3)">← Voltar</button>
              <button class="btn btn--primary btn--lg" [disabled]="salvando()" (click)="confirmar()">
                @if (salvando()) { <span class="spinner spinner--sm"></span>&nbsp;Agendando... }
                @else { ✓ Confirmar {{ servicosSel().length }} Agendamento(s) }
              </button>
            </div>
          </div>
        }

        <!-- ══ ETAPA 5: Sucesso ════════════════════════════════════ -->
        @if (etapa() === 5) {
          <div class="etapa sucesso slide-up">
            <div class="sucesso-icon">✓</div>
            <h2>Agendamento(s) Realizado(s)!</h2>
            <p>
              {{ servicosSel().length }} tratamento(s) agendado(s) para
              <strong>{{ formatarData(dataSelecionada) }}</strong>
              @if (profSel()?.id !== 0) { com <strong>{{ profSel()?.nome }}</strong> }.
            </p>
            <div class="confirmacao-card card" style="margin:1.5rem auto;max-width:460px">
              @for (s of servicosSel(); track s.id) {
                <div class="confirmacao-item">
                  <span>{{ getHorario(s.id) }}</span>
                  <strong>{{ s.nome }}</strong>
                </div>
              }
              <div class="confirmacao-item total">
                <span>Total</span>
                <strong class="text-gold">R$ {{ totalValor() | number:'1.2-2' }}</strong>
              </div>
            </div>
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
              <button class="btn btn--outline" (click)="novoAgendamento()">+ Novo Agendamento</button>
              <button class="btn btn--primary" (click)="router.navigate(['/cliente/agendamentos'])">Ver Meus Agendamentos</button>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class AgendarComponent implements OnInit {
  router  = inject(Router);
  private http = inject(HttpClient);
  srvApi  = inject(ServicosApiService);
  agApi   = inject(AgendamentosApiService);
  auth    = inject(AuthService);
  toast   = inject(ToastService);

  private readonly API = environment.apiUrl;

  etapa = signal(1);
  steps = [
    { num:1, label:'Profissional' },
    { num:2, label:'Tratamentos' },
    { num:3, label:'Data & Horarios' },
    { num:4, label:'Confirmacao' },
  ];

  // Profissionais
  profissionais  = signal<Profissional[]>([]);
  loadingProf    = signal(true);
  profSel        = signal<Profissional | null>(null);

  // Servicos
  servicos        = signal<Servico[]>([]);
  loadingServicos = signal(true);
  servicosSel     = signal<Servico[]>([]);
  catFiltro       = signal('');

  categorias = computed(() =>
    [...new Set(this.servicos().map(s => s.categoria).filter(Boolean))] as string[]
  );
  servicosFiltrados = computed(() =>
    this.catFiltro() ? this.servicos().filter(s => s.categoria === this.catFiltro()) : this.servicos()
  );
  totalValor   = computed(() => this.servicosSel().reduce((a,s) => a + s.valor, 0));
  totalDuracao = computed(() => this.servicosSel().reduce((a,s) => a + s.duracao_min, 0));
  nenhumHorarioDisponivel = computed(() => {
    const mapa = this.horariosLivresPorId();
    if (!Object.keys(mapa).length) return false;
    return this.servicosSel().every(s => (mapa[s.id]||[]).length === 0);
  });

  // Data e horarios
  dataSelecionada = '';
  loadingHorarios = signal(false);
  horariosPorServ     = signal<Record<number,string>>({});
  horariosLivresPorId = signal<Record<number,string[]>>({});
  observacoes = '';
  salvando    = signal(false);
  hoje        = new Date().toISOString().split('T')[0];

  private headers() {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.auth.token()}` });
  }

  ngOnInit() {
    // Carregar profissionais
    this.http.get<any>(`${this.API}/profissionais`, { headers: this.headers() }).subscribe({
      next: r => { this.profissionais.set(r.dados || []); this.loadingProf.set(false); },
      error: () => this.loadingProf.set(false)
    });
    // Carregar servicos
    this.srvApi.listar({ ativo: true }).subscribe(r => {
      this.servicos.set(r.dados);
      this.loadingServicos.set(false);
    });
  }

  tipoLabel(tipo: string) {
    const m: Record<string,string> = { superadmin:'Proprietaria', admin:'Administradora', colaborador:'Colaboradora' };
    return m[tipo] || tipo;
  }

  // ── Profissional ──────────────────────────────────────────────
  selecionarProf(p: Profissional) { this.profSel.set(p); }

  irParaEtapa2() {
    this.servicosSel.set([]);
    this.catFiltro.set('');
    this.etapa.set(2);
  }

  // ── Servicos ──────────────────────────────────────────────────
  estaSelected(id: number) { return this.servicosSel().some(s => s.id === id); }

  toggleServico(s: Servico) {
    if (this.estaSelected(s.id)) this.servicosSel.update(l => l.filter(x => x.id !== s.id));
    else this.servicosSel.update(l => [...l, s]);
  }

  removerServico(id: number) {
    this.servicosSel.update(l => l.filter(s => s.id !== id));
    this.horariosPorServ.update(m => { const n={...m}; delete n[id]; return n; });
  }

  irParaEtapa3() {
    this.horariosPorServ.set({});
    this.horariosLivresPorId.set({});
    this.dataSelecionada = '';
    this.etapa.set(3);
  }

  // ── Horarios por profissional e servico ───────────────────────
  carregarHorarios() {
    if (!this.dataSelecionada) return;
    this.horariosPorServ.set({});
    this.horariosLivresPorId.set({});
    this.loadingHorarios.set(true);

    const servicos = this.servicosSel();
    const profId   = this.profSel()?.id !== 0 ? this.profSel()?.id : null;
    if (!servicos.length) { this.loadingHorarios.set(false); return; }

    let pendentes = servicos.length;
    const mapa: Record<number,string[]> = {};

    servicos.forEach(s => {
      // Passa colaborador_id para filtrar horarios especificos do profissional
      this.agApi.horariosDisponiveis(this.dataSelecionada, s.duracao_min || 30, profId || undefined).subscribe({
        next: r => {
          mapa[s.id] = r.dados;
          if (--pendentes === 0) { this.horariosLivresPorId.set({...mapa}); this.loadingHorarios.set(false); }
        },
        error: () => {
          mapa[s.id] = [];
          if (--pendentes === 0) { this.horariosLivresPorId.set({...mapa}); this.loadingHorarios.set(false); }
        }
      });
    });
  }

  private hToMin(h: string) { const [hh,mm]=h.split(':').map(Number); return hh*60+mm; }
  private conflita(h1:string,d1:number,h2:string,d2:number) {
    const s1=this.hToMin(h1),e1=s1+d1,s2=this.hToMin(h2),e2=s2+d2; return s1<e2&&s2<e1;
  }

  horariosParaServico(servicoId: number): string[] {
    const dur  = this.servicosSel().find(s => s.id === servicoId)?.duracao_min || 30;
    const base = this.horariosLivresPorId()[servicoId] || [];
    const outros = this.servicosSel()
      .filter(s => s.id !== servicoId && !!this.getHorario(s.id))
      .map(s => ({ horario: this.getHorario(s.id), duracao: s.duracao_min || 30 }));
    return base.filter(h => !outros.some(o => this.conflita(h, dur, o.horario, o.duracao)));
  }

  horarioEmUsoOutroServico(horario: string, servicoId: number): boolean {
    const dur = this.servicosSel().find(s => s.id === servicoId)?.duracao_min || 30;
    return this.servicosSel()
      .filter(s => s.id !== servicoId && !!this.getHorario(s.id))
      .some(s => this.conflita(horario, dur, this.getHorario(s.id), s.duracao_min || 30));
  }

  getHorario(id: number)  { return this.horariosPorServ()[id] || ''; }
  setHorario(id: number, h: string) { this.horariosPorServ.update(m => ({...m,[id]:h})); }
  limparHorario(id: number) { this.horariosPorServ.update(m => { const n={...m}; delete n[id]; return n; }); }
  todosComHorario() {
    return this.dataSelecionada.length > 0 && this.servicosSel().every(s => !!this.getHorario(s.id));
  }

  // ── Confirmar em serie ────────────────────────────────────────
  async confirmar() {
    this.salvando.set(true);
    const servicos  = this.servicosSel();
    const horarios  = this.horariosPorServ();
    const data      = this.dataSelecionada;
    const obs       = this.observacoes;
    const profId    = this.profSel()?.id !== 0 ? this.profSel()?.id : undefined;
    const ordenados = [...servicos].sort((a,b) => horarios[a.id].localeCompare(horarios[b.id]));

    try {
      for (const s of ordenados) {
        await lastValueFrom(this.agApi.criar({
          servico_id:     s.id,
          data,
          horario:        horarios[s.id],
          colaborador_id: profId,
          observacoes:    obs || undefined,
        }));
      }
      this.salvando.set(false);
      this.etapa.set(5);
      this.toast.success(
        servicos.length === 1 ? 'Agendamento realizado!' : `${servicos.length} agendamentos realizados!`
      );
    } catch (e: any) {
      this.salvando.set(false);
      this.toast.error(e?.error?.mensagem || 'Erro ao agendar. Verifique os horarios.');
    }
  }

  novoAgendamento() {
    this.etapa.set(1);
    this.profSel.set(null);
    this.servicosSel.set([]);
    this.catFiltro.set('');
    this.dataSelecionada = '';
    this.horariosLivresPorId.set({});
    this.horariosPorServ.set({});
    this.observacoes = '';
  }

  formatarData(data: string) {
    if (!data) return '';
    const [y,m,d] = data.split('-');
    const ds = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
    return `${ds[new Date(data+'T12:00:00').getDay()]}, ${d}/${m}/${y}`;
  }
}
