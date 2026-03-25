// core/guards/public.guard.ts
// Não usado mais no pai de auth — mantido para compatibilidade
// © 2025 William Rodrigues da Silva
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  // Se já logado, redireciona para área correta
  if (auth.logado()) {
    auth.redirecionarPorPerfil();
    return false;
  }
  return true;
};
