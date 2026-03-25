// shared/components/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast--{{ t.tipo }}" (click)="toast.remover(t.id)">
          <span class="toast__icon">{{ iconMap[t.tipo] }}</span>
          <span class="toast__msg">{{ t.mensagem }}</span>
          <button class="toast__close">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 2rem; right: 2rem;
      z-index: 9999; display: flex; flex-direction: column; gap: .6rem;
      max-width: 380px;
    }
    .toast {
      display: flex; align-items: center; gap: .8rem;
      padding: 1rem 1.2rem; cursor: pointer;
      border-left: 3px solid currentColor;
      background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,.12);
      animation: slideIn .3s ease;
      font-size: .88rem; font-family: var(--font-body);
    }
    .toast--success { color: #27ae60; }
    .toast--error   { color: #c0392b; }
    .toast--warning { color: #e67e22; }
    .toast--info    { color: #2980b9; }
    .toast__msg { flex:1; color: var(--text); }
    .toast__close { color: var(--text-muted); font-size:.75rem; background:none; border:none; cursor:pointer; }
    @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
  iconMap: Record<string, string> = {
    success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
  };
}
