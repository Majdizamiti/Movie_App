import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Keeps authenticated users out of login and registration screens. */
export const guestGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuth();
  const user = authService.getCurrentUser();

  if (!user || !user.active) return true;
  return router.parseUrl(user.role === 'admin' ? '/admin' : '/home');
};
