// features/admin/equipe/admin-equipe.component.ts
// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

const API = 'https://vania-api.vercel.app/api';

@Component({
  selector: 'app-admin-equipe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .membro-card {
      background:var(--pearl); border:1.5px solid var(--champagne);
      border-radius:var(--radius-md); padding:1rem 1.2rem;
      display:flex; align-items:center; justify-content:space-between;
      gap:1rem; flex-wrap:wrap; margin-bottom:.7rem; transition:border-color .2s;
    }
    .membro-card:hover { border-color:var(--gold); }
    .membro-card.inativo { opacity:.5; }
    .avatar { width:42px; height:42px; border-radius:50%; background:var(--gold-ultra);
              color:var(--gold-dark); display:flex; align-items:center; justify-content:center;
              font-weight:500; font-size:1rem; flex-shrink:0; border:1.5px solid var(--gold); }
    .tipo-badge { font-size:.65rem; padding:.2rem .65rem; border-radius:20px; font-weight:500; text-transform:uppercase; letter-spacing:.06em; }
    .tipo-superadmin { background:#e8d5f0; color:#6b2fa0; }
    .tipo-admin      { background:var(--gold-ultra); color:var(--gold-dark); }
    .tipo-colaborador{ background:#e3f0ff; color:#1a5fa0; }
    .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:700;display:flex;align-items:center;justify-content:center;padding:1rem; }
    .modal { background:var(--pearl);border-radius:var(--radius-lg);width:100%;max-width:460px;padding:1.8rem; }
  `],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Minha Equipe</h1>
          <p>Gerencie colaboradores e administradores do sistema.</p>
        </div>
        <button class="btn btn--primary" (click)="abrirNovo()">+ Novo Membro</button>
      </div>

      <!-- Resumo -->
      <div style="display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:1.5rem">
        @for (t of tipos; track t.key) {
          <div class="card" style="padding:.8rem 1.2rem;flex:1;min-width:140px;text-align:center">
            <div style="font-size:1.4rem;margin-bottom:.3rem">{{ t.icon }}</div>
            <div style="font-size:1.3rem;font-weight:500">{{ contarTipo(t.key) }}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">{{ t.label }}</div>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (membros().length === 0) {
        <div class="empty-state card">
          <div class="icon">👥</div>
          <h3>Nenhum membro na equipe</h3>
          <p>Adicione colaboradores ou outros administradores.</p>
        </div>
      } @else {
        @for (m of membros(); track m.id) {
          <div class="membro-card" [class.inativo]="!m.ativo">
            <div style="display:flex;align-items:center;gap:.9rem;flex:1;min-width:0">
              <div class="avatar">{{ m.nome[0].toUpperCase() }}</div>
              <div>
                <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                  <strong>{{ m.nome }}</strong>
                  <span class="tipo-badge tipo-{{ m.tipo }}">{{ m.tipo }}</span>
                </div>
                <div style="font-size:.8rem;color:var(--text-muted)">{{ m.email }}</div>
                @if (m.especialidade) {
                  <div style="font-size:.78rem;color:var(--gold-dark);margin-top:.2rem">{{ m.especialidade }}</div>
                }
              </div>
            </div>
            <div style="display:flex;gap:.4rem">
              <button class="btn btn--ghost btn--sm" (click)="editar(m)">✏️ Editar</button>
              <button
                class="btn btn--ghost btn--sm"
                (click)="toggleAtivo(m)"
                [style]="m.ativo ? 'color:var(--error)' : 'color:var(--success)'"
              >{{ m.ativo ? 'Desativar' : 'Ativar' }}</button>
            </div>
          </div>
        }
      }
    </div>

    <!-- Modal -->
    @if (modalAberto()) {
      <div class="modal-bg" (click)="fecharModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 style="font-size:1.2rem;font-weight:400;margin-bottom:1.2rem">
            {{ editando()?.id ? 'Editar Membro' : 'Novo Membro da Equipe' }}
          </h3>

          <div class="form-group">
            <label>Nome completo</label>
            <input [(ngModel)]="form.nome" placeholder="Nome do profissional" />
          </div>
          <div class="form-group">
            <label>E-mail</label>
            <input [(ngModel)]="form.email" type="email" placeholder="email@exemplo.com" [disabled]="!!editando()?.id" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Telefone</label>
              <input [(ngModel)]="form.telefone" placeholder="(11) 99999-9999" />
            </div>
            <div class="form-group">
              <label>Funcao</label>
              <select [(ngModel)]="form.tipo">
                <option value="colaborador">Colaborador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Especialidade (opcional)</label>
            <input [(ngModel)]="form.especialidade" placeholder="Ex: Esteticista, Massagista..." />
          </div>
          @if (!editando()?.id) {
            <div class="form-group">
              <label>Senha inicial</label>
              <input [(ngModel)]="form.senha" type="password" placeholder="Minimo 6 caracteres" />
            </div>
          }

          @if (erroModal()) {
            <div class="alert alert--error">{{ erroModal() }}</div>
          }

          <div class="etapa-actions">
            <button class="btn btn--ghost" (click)="fecharModal()">Cancelar</button>
            <button class="btn btn--primary" (click)="salvar()" [disabled]="salvando()">
              @if (salvando()) { <span class="spinner spinner--sm"></span> }
              {{ editando()?.id ? 'Salvar' : 'Criar Membro' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminEquipeComponent implements OnInit {
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);

  membros    = signal<any[]>([]);
  loading    = signal(true);
  modalAberto= signal(false);
  editando   = signal<any>(null);
  salvando   = signal(false);
  erroModal  = signal('');

  form = this.formVazio();

  tipos = [
    { key: 'superadmin', label: 'Super Admin', icon: '👑' },
    { key: 'admin',      label: 'Admins',      icon: '🔑' },
    { key: 'colaborador',label: 'Colaboradores',icon: '👤' },
  ];

  private headers() {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.auth.token()}` });
  }

  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading.set(true);
    this.http.get<any>(`${API}/colaboradores`, { headers: this.headers() }).subscribe({
      next: r => { this.membros.set(r.dados || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  contarTipo(tipo: string) {
    if (tipo === 'superadmin') return 1; // sempre 1
    return this.membros().filter(m => m.tipo === tipo).length;
  }

  formVazio() {
    return { nome: '', email: '', telefone: '', tipo: 'colaborador', especialidade: '', senha: '' };
  }

  abrirNovo() {
    this.editando.set(null);
    this.form = this.formVazio();
    this.erroModal.set('');
    this.modalAberto.set(true);
  }

  editar(m: any) {
    this.editando.set(m);
    this.form = { nome: m.nome, email: m.email, telefone: m.telefone||'', tipo: m.tipo, especialidade: m.especialidade||'', senha: '' };
    this.erroModal.set('');
    this.modalAberto.set(true);
  }

  fecharModal() { this.modalAberto.set(false); }

  salvar() {
    if (!this.form.nome || !this.form.email) { this.erroModal.set('Nome e e-mail obrigatorios.'); return; }
    const id = this.editando()?.id;
    if (!id && this.form.senha.length < 6) { this.erroModal.set('Senha minima: 6 caracteres.'); return; }

    this.salvando.set(true);
    this.erroModal.set('');

    const req = id
      ? this.http.put<any>(`${API}/usuarios/${id}`, this.form, { headers: this.headers() })
      : this.http.post<any>(`${API}/usuarios/colaborador`, this.form, { headers: this.headers() });

    req.subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.toast.success(id ? 'Membro atualizado!' : 'Membro criado com sucesso!');
        this.carregar();
      },
      error: e => { this.salvando.set(false); this.erroModal.set(e.error?.mensagem || 'Erro ao salvar.'); }
    });
  }

  toggleAtivo(m: any) {
    this.http.put<any>(`${API}/usuarios/${m.id}`, { ativo: !m.ativo }, { headers: this.headers() }).subscribe({
      next: () => { this.toast.success(m.ativo ? 'Membro desativado.' : 'Membro ativado.'); this.carregar(); },
      error: () => this.toast.error('Erro ao atualizar.')
    });
  }
}
