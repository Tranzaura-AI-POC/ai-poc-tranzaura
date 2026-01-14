import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/signin']);
    return false;
  }

  const requiredRoles = route.data && (route.data as any).roles as string[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    const ok = requiredRoles.some(r => auth.hasRole(r));
    if (!ok) {
      // show a toast and navigate to forbidden
      const toast = inject(ToastService);
      try { toast.show('Access denied: you need the required role to view this page', 'error'); } catch {}
      router.navigate(['/forbidden']);
      return false;
    }
  }

  return true;
};
