import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuth();
  const user = authService.getCurrentUser();
  if (user && user.active && user.role === 'admin') {
    return true;
  }

  return router.parseUrl('/home');
};
