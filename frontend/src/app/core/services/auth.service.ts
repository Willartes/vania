// core/services/auth.service.ts
// © 2025 William Rodrigues da Silva
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'cliente' | 'colaborador' | 'admin' | 'superadmin';
}

export interface AuthResponse {
  sucesso: boolean;
  token: string;
  usuario: Usuario;
  mensagem?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'vania_token';
  private readonly USER_KEY  = 'vania_user';
  private api = environment.apiUrl;

  private _usuario = signal<Usuario | null>(this.carregarUsuario());
  private _token   = signal<string | null>(this.carregarToken());

  readonly usuario     = this._usuario.asReadonly();
  readonly token       = this._token.asReadonly();
  readonly logado      = computed(() => !!this._token());
  readonly isAdmin     = computed(() => ['admin','superadmin','colaborador'].includes(this._usuario()?.tipo || ''));
  readonly isSuperAdmin= computed(() => this._usuario()?.tipo === 'superadmin');
  readonly isColaborador=computed(()=> this._usuario()?.tipo === 'colaborador');
  readonly isAdminPlus = computed(() => ['admin','superadmin'].includes(this._usuario()?.tipo || ''));
  readonly isCliente   = computed(() => this._usuario()?.tipo === 'cliente');

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, senha: string) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, senha })
      .pipe(tap(res => { if (res.sucesso && res.token) this.salvarSessao(res.token, res.usuario); }));
  }

  registrar(dados: { nome: string; email: string; senha: string; telefone?: string }) {
    return this.http.post<AuthResponse>(`${this.api}/auth/registrar`, dados)
      .pipe(tap(res => { if (res.sucesso && res.token) this.salvarSessao(res.token, res.usuario); }));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._usuario.set(null);
    this._token.set(null);
    this.router.navigate(['/auth/login']);
  }

  redirecionarPorPerfil() {
    const tipo = this._usuario()?.tipo;
    if (tipo === 'cliente') {
      this.router.navigate(['/cliente/dashboard']);
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  private salvarSessao(token: string, usuario: Usuario) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    this._token.set(token);
    this._usuario.set(usuario);
  }

  private carregarToken(): string | null {
    try { return localStorage.getItem(this.TOKEN_KEY); } catch { return null; }
  }

  private carregarUsuario(): Usuario | null {
    try { const u = localStorage.getItem(this.USER_KEY); return u ? JSON.parse(u) : null; } catch { return null; }
  }
}
