// features/cliente/perfil/perfil.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UsuariosApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="perfil-page fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações pessoais.</p>
        </div>
      </div>
      <div class="perfil-grid">
        <!-- Avatar -->
        <div class="perfil-avatar-card card card--elevated">
          <div class="avatar-grande">{{ inicial() }}</div>
          <h3>{{ auth.usuario()?.nome }}</h3>
          <span class="badge badge--gold">{{ auth.usuario()?.tipo }}</span>
          <p class="text-muted" style="margin-top:.5rem;font-size:.84rem">{{ auth.usuario()?.email }}</p>
        </div>
        <!-- Formulário -->
        <div class="card card--elevated">
          <h3 style="font-size:1.4rem;font-weight:300;margin-bottom:1.5rem">Editar Informações</h3>
          @if (sucesso()) { <div class="alert alert--success">✓ Perfil atualizado com sucesso!</div> }
          @if (erro()) { <div class="alert alert--error">{{ erro() }}</div> }
          <form (ngSubmit)="salvar()">
            <div class="form-group"><label>Nome completo</label><input [(ngModel)]="form.nome" name="nome" /></div>
            <div class="form-group"><label>WhatsApp</label><input [(ngModel)]="form.telefone" name="tel" placeholder="(11) 98291-6090" /></div>
            <hr style="border:none;border-top:1px solid var(--border-light);margin:1.5rem 0">
            <h4 style="font-size:1rem;font-weight:400;margin-bottom:1rem;color:var(--text-muted)">Alterar Senha (opcional)</h4>
            <div class="form-row">
              <div class="form-group"><label>Nova Senha</label><input [(ngModel)]="form.senha" name="senha" type="password" placeholder="••••••••" /></div>
              <div class="form-group"><label>Confirmar</label><input [(ngModel)]="confirmar" name="confirmar" type="password" placeholder="••••••••" /></div>
            </div>
            <button type="submit" class="btn btn--primary" [disabled]="salvando()">
              @if (salvando()) { <span class="spinner spinner--sm"></span> } Salvar Alterações
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PerfilComponent implements OnInit {
  auth = inject(AuthService);
  usrApi = inject(UsuariosApiService);
  toast = inject(ToastService);

  form = { nome: '', telefone: '', senha: '' };
  confirmar = '';
  salvando = signal(false);
  sucesso = signal(false);
  erro = signal('');

  inicial = () => this.auth.usuario()?.nome?.[0].toUpperCase() || 'U';

  ngOnInit() {
    const u = this.auth.usuario();
    if (u) { this.form.nome = u.nome; this.form.telefone = u.telefone || ''; }
  }

  salvar() {
    if (this.form.senha && this.form.senha !== this.confirmar) { this.erro.set('Senhas não conferem.'); return; }
    this.salvando.set(true); this.sucesso.set(false); this.erro.set('');
    const dados: any = { nome: this.form.nome, telefone: this.form.telefone };
    if (this.form.senha) dados.senha = this.form.senha;
    this.usrApi.atualizar(this.auth.usuario()!.id, dados).subscribe({
      next: () => { this.salvando.set(false); this.sucesso.set(true); this.toast.success('Perfil atualizado!'); },
      error: () => { this.salvando.set(false); this.erro.set('Erro ao salvar.'); }
    });
  }
}
