import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // authState vigila en tiempo real si hay un usuario de Google activo
  return authState(auth).pipe(
    map(user => {
      if (user) {
        return true; 
      } else {
        router.navigate(['/login']); 
        return false;
      }
    })
  );
};