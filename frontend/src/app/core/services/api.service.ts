// core/services/api.service.ts
// Serviços de API centralizados — Vania Herculano
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

// ── Interfaces ────────────────────────────────────────────────
export interface Servico {
  id: number; nome: string; descricao: string; valor: number;
  duracao_min: number; categoria: string; ativo: number; imagem_url?: string;
}

export interface Agendamento {
  id: number; usuario_id: number; servico_id: number;
  data: string; horario: string; status: string; observacoes?: string;
  usuario_nome?: string; usuario_email?: string; usuario_telefone?: string;
  servico_nome?: string; servico_valor?: number; servico_duracao?: number; servico_categoria?: string;
  criado_em?: string;
}

export interface Usuario {
  id: number; nome: string; email: string; telefone?: string;
  tipo: 'cliente' | 'colaborador' | 'admin' | 'superadmin';
  ativo: number; criado_em?: string; especialidade?: string;
}

export interface DashboardResumo {
  totalFaturado: number; faturadoMes: number; agendamentosHoje: number;
  pendentes: number; realizadosMes: number; totalClientes: number;
}

export interface FaturamentoPeriodo {
  periodo: string; total: number; quantidade: number;
}

export interface ServicoRanking {
  nome: string; categoria: string; quantidade: number;
  total_faturado: number; ticket_medio: number;
}

export interface FinanceiroItem {
  id: number; valor: number; data_realizacao: string;
  cliente: string; cliente_email: string; servico: string; categoria: string;
}

// ── Serviços API ──────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ServicosApiService {
  constructor(private http: HttpClient) {}

  listar(params?: { ativo?: boolean; categoria?: string }) {
    let p = new HttpParams();
    if (params?.ativo !== undefined) p = p.set('ativo', String(params.ativo));
    if (params?.categoria) p = p.set('categoria', params.categoria);
    return this.http.get<{ sucesso: boolean; dados: Servico[] }>(`${API}/servicos`, { params: p });
  }

  buscar(id: number) {
    return this.http.get<{ sucesso: boolean; dados: Servico }>(`${API}/servicos/${id}`);
  }

  criar(dados: Partial<Servico>) {
    return this.http.post<{ sucesso: boolean; dados: Servico }>(`${API}/servicos`, dados);
  }

  atualizar(id: number, dados: Partial<Servico>) {
    return this.http.put<{ sucesso: boolean; dados: Servico }>(`${API}/servicos/${id}`, dados);
  }

  remover(id: number) {
    return this.http.delete<{ sucesso: boolean; mensagem: string }>(`${API}/servicos/${id}`);
  }

  categorias() {
    return this.http.get<{ sucesso: boolean; dados: string[] }>(`${API}/servicos/categorias`);
  }
}

@Injectable({ providedIn: 'root' })
export class AgendamentosApiService {
  constructor(private http: HttpClient) {}

  listar(params?: { status?: string; data_inicio?: string; data_fim?: string }) {
    let p = new HttpParams();
    if (params?.status) p = p.set('status', params.status);
    if (params?.data_inicio) p = p.set('data_inicio', params.data_inicio);
    if (params?.data_fim) p = p.set('data_fim', params.data_fim);
    return this.http.get<{ sucesso: boolean; dados: Agendamento[] }>(`${API}/agendamentos`, { params: p });
  }

  criar(dados: { servico_id: number; data: string; horario: string; colaborador_id?: number; observacoes?: string }) {
    return this.http.post<{ sucesso: boolean; dados: Agendamento }>(`${API}/agendamentos`, dados);
  }

  atualizarStatus(id: number, status: string) {
    return this.http.patch<{ sucesso: boolean; mensagem: string; dados?: any }>(`${API}/agendamentos/${id}/status`, { status });
  }

  cancelar(id: number) {
    return this.http.delete<{ sucesso: boolean; mensagem: string }>(`${API}/agendamentos/${id}`);
  }

  horariosDisponiveis(data: string, duracao_min?: number, colaborador_id?: number) {
    let params = new HttpParams().set('data', data);
    if (duracao_min)    params = params.set('duracao_min', duracao_min.toString());
    if (colaborador_id) params = params.set('colaborador_id', colaborador_id.toString());
    return this.http.get<{ sucesso: boolean; dados: string[] }>(`${API}/agendamentos/horarios-disponiveis`, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  constructor(private http: HttpClient) {}

  resumo() {
    return this.http.get<{ sucesso: boolean; dados: DashboardResumo }>(`${API}/dashboard/resumo`);
  }

  faturamentoPeriodo(params?: { periodo?: string; data_inicio?: string; data_fim?: string }) {
    let p = new HttpParams();
    if (params?.periodo) p = p.set('periodo', params.periodo);
    if (params?.data_inicio) p = p.set('data_inicio', params.data_inicio);
    if (params?.data_fim) p = p.set('data_fim', params.data_fim);
    return this.http.get<{ sucesso: boolean; dados: FaturamentoPeriodo[] }>(`${API}/dashboard/faturamento-periodo`, { params: p });
  }

  servicosMaisRealizados() {
    return this.http.get<{ sucesso: boolean; dados: ServicoRanking[] }>(`${API}/dashboard/servicos-mais-realizados`);
  }

  agendamentosRecentes() {
    return this.http.get<{ sucesso: boolean; dados: any[] }>(`${API}/dashboard/agendamentos-recentes`);
  }

  financeiro(params?: { data_inicio?: string; data_fim?: string }) {
    let p = new HttpParams();
    if (params?.data_inicio) p = p.set('data_inicio', params.data_inicio);
    if (params?.data_fim) p = p.set('data_fim', params.data_fim);
    return this.http.get<{ sucesso: boolean; dados: FinanceiroItem[]; total_geral: number }>(`${API}/dashboard/financeiro`, { params: p });
  }
}

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  constructor(private http: HttpClient) {}

  listar(params?: { tipo?: string }) {
    let p = new HttpParams();
    if (params?.tipo) p = p.set('tipo', params.tipo);
    return this.http.get<{ sucesso: boolean; dados: Usuario[] }>(`${API}/usuarios`, { params: p });
  }

  atualizar(id: number, dados: Partial<Usuario & { senha?: string }>) {
    return this.http.put<{ sucesso: boolean; mensagem: string }>(`${API}/usuarios/${id}`, dados);
  }

  remover(id: number) {
    return this.http.delete<{ sucesso: boolean; mensagem: string }>(`${API}/usuarios/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AgendaApiService {
  constructor(private http: HttpClient) {}

  listar(colaboradorId?: number) {
    const params = colaboradorId ? `?colaborador_id=${colaboradorId}` : '';
    return this.http.get<{ sucesso: boolean; dados: any[] }>(`${API}/agenda${params}`);
  }

  buscarDia(data: string, colaboradorId?: number) {
    const params = colaboradorId ? `?colaborador_id=${colaboradorId}` : '';
    return this.http.get<{ sucesso: boolean; dados: any }>(`${API}/agenda/${data}${params}`);
  }

  configurar(data: string, horarios: string[], bloqueado: boolean, colaboradorId?: number) {
    return this.http.put<{ sucesso: boolean; dados: any }>(`${API}/agenda/${data}`, { horarios, bloqueado, colaborador_id: colaboradorId });
  }

  remover(data: string) {
    return this.http.delete<{ sucesso: boolean; mensagem: string }>(`${API}/agenda/${data}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ResetSenhaService {
  constructor(private http: HttpClient) {}

  esqueciSenha(email: string) {
    return this.http.post<{
      sucesso: boolean;
      via?: 'email' | 'whatsapp';
      codigo?: string;
      telefone?: string;
      nome?: string;
      mensagem: string;
    }>(`${API}/auth/esqueci-senha`, { email });
  }

  resetarSenha(email: string, codigo: string, nova_senha: string) {
    return this.http.post<{ sucesso: boolean; mensagem: string }>(
      `${API}/auth/resetar-senha`, { email, codigo, nova_senha }
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ColaboradoresApiService {
  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<{ sucesso: boolean; dados: Usuario[] }>(`${API}/colaboradores`);
  }

  criar(dados: { nome: string; email: string; senha: string; telefone?: string; tipo: string; especialidade?: string }) {
    return this.http.post<{ sucesso: boolean; dados: Usuario }>(`${API}/usuarios/colaborador`, dados);
  }

  alterarTipo(id: number, tipo: string) {
    return this.http.patch<{ sucesso: boolean }>(`${API}/usuarios/${id}/tipo`, { tipo });
  }
}
