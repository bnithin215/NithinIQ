import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Wait for auth state to be determined (Firebase might be restoring session)
  return authService.user$.pipe(
    take(1),
    timeout({
      each: 5000,
      with: () => of(null) // If timeout, assume not authenticated
    }),
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Wait for auth state to be determined
  // If user is already logged in, redirect to dashboard
  return authService.user$.pipe(
    take(1),
    timeout({
      each: 5000,
      with: () => of(null) // If timeout, assume not authenticated
    }),
    map(user => {
      if (user) {
        // User is already logged in, redirect to dashboard
        router.navigate(['/dashboard']);
        return false;
      } else {
        // User is not logged in, allow access to login/register
        return true;
      }
    }),
    catchError(() => {
      // On error, allow access to login page
      return of(true);
    })
  );
};

