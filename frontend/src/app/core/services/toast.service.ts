// core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'success' | 'error' | 'warning' | 'info';
  mensagem: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  show(mensagem: string, tipo: Toast['tipo'] = 'info', duracao = 4000) {
    const id = ++this.nextId;
    this._toasts.update(t => [...t, { id, tipo, mensagem }]);
    setTimeout(() => this.remover(id), duracao);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error', 5000); }
  warning(msg: string) { this.show(msg, 'warning'); }
  info(msg: string)    { this.show(msg, 'info'); }

  remover(id: number) {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
