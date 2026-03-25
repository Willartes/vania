// core/guards/auth.guard.ts
// © 2025 William Rodrigues da Silva
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.logado()) {
    return true;
  }

  // Não está logado — redireciona para login
  router.navigate(['/auth/login']);
  return false;
};
