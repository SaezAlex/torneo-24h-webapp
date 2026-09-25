import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { map, switchMap, from, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);
  
  // Leemos qué roles tienen permiso para entrar a esta ruta
  const rolesPermitidos = route.data['rolesPermitidos'] as string[];

  return authState(auth).pipe(
    switchMap(user => {
      if (!user) {
        return of(false); // Si no hay usuario, el authGuard ya lo habrá mandado al login
      }

      // Buscamos el documento del usuario en Firestore
      const userDocRef = doc(firestore, `usuarios/${user.uid}`);
      
      // 'from' convierte la Promesa de getDoc en un Observable compatible con RxJS
      return from(getDoc(userDocRef)).pipe(
        map(snapshot => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            const userRole = userData['rol'];

            // Si el rol del usuario está en la lista de permitidos, adelante
            if (rolesPermitidos.includes(userRole)) {
              return true;
            }
          }
          
          // Si no tiene el rol adecuado o no existe el documento, lo mandamos a la vista pública
          console.warn('Acceso denegado: No tienes el rol necesario.');
          router.navigate(['/torneo']);
          return false;
        })
      );
    })
  );
};