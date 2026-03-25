// features/admin/clientes/admin-clientes.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosApiService, Usuario } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fade-in-up">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Clientes</h1>
          <p>Gerencie a base de clientes da clínica.</p>
        </div>
        <div style="display:flex;gap:.8rem;align-items:center">
          <input type="search" [(ngModel)]="busca" (input)="filtrar()" placeholder="Buscar por nome ou e-mail..."
            style="padding:.6rem 1rem;border:1px solid var(--border-light);font-family:var(--font-body);font-size:.88rem;outline:none;width:260px;color:var(--text)"/>
        </div>
      </div>

      <div class="card card--elevated">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
        } @else {
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <span class="text-muted">{{ clientesFiltrados().length }} clientes</span>
          </div>
          <div class="table-wrap">
            <table class="lc-table">
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Desde</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                @for (c of clientesFiltrados(); track c.id) {
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:.8rem">
                        <div style="width:32px;height:32px;border-radius:50%;background:var(--gold);color:var(--dark);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.9rem;flex-shrink:0">{{ c.nome[0] }}</div>
                        <strong>{{ c.nome }}</strong>
                      </div>
                    </td>
                    <td>{{ c.email }}</td>
                    <td>{{ c.telefone || '—' }}</td>
                    <td>{{ formatarData(c.criado_em || '') }}</td>
                    <td><span class="badge" [class.badge--ativo]="c.ativo" [class.badge--inativo]="!c.ativo">{{ c.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                    <td>
                      <button class="btn btn--ghost btn--sm" (click)="toggleAtivo(c)">{{ c.ativo ? 'Desativar' : 'Ativar' }}</button>
                    </td>
                  </tr>
                }
                @empty {
                  <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhum cliente encontrado</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminClientesComponent implements OnInit {
  usrApi = inject(UsuariosApiService);
  toast = inject(ToastService);

  clientes = signal<Usuario[]>([]);
  clientesFiltrados = signal<Usuario[]>([]);
  loading = signal(true);
  busca = '';

  ngOnInit() {
    this.usrApi.listar({ tipo: 'cliente' }).subscribe(r => {
      this.clientes.set(r.dados);
      this.clientesFiltrados.set(r.dados);
      this.loading.set(false);
    });
  }

  filtrar() {
    const q = this.busca.toLowerCase();
    this.clientesFiltrados.set(
      this.clientes().filter(c => c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  }

  toggleAtivo(c: Usuario) {
    if (!confirm(`${c.ativo ? 'Desativar' : 'Ativar'} cliente ${c.nome}?`)) return;
    this.usrApi.atualizar(c.id, { ativo: c.ativo ? 0 : 1 } as any).subscribe({
      next: () => {
        this.toast.success('Status atualizado!');
        this.clientes.update(l => l.map(x => x.id === c.id ? { ...x, ativo: c.ativo ? 0 : 1 } : x));
        this.filtrar();
      },
      error: () => this.toast.error('Erro ao atualizar.')
    });
  }

  formatarData(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  }
}
