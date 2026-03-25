// core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (auth.logado()) router.navigate(['/cliente/dashboard']);
  else router.navigate(['/auth/login']);
  return false;
};

// Guard exclusivo para superadmin
export const superAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isSuperAdmin()) return true;
  if (auth.isAdmin()) router.navigate(['/admin/dashboard']);
  else router.navigate(['/auth/login']);
  return false;
};
