import { Component, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
private auth: Auth = inject(Auth);
private router = inject(Router);

  async loginConGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // esto abre la ventana emergente de Google
      const resultado = await signInWithPopup(this.auth, provider); 
      
      console.log('¡Éxito! Usuario logueado:', resultado.user.displayName);
      
      this.router.navigate(['/home']);
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  }
}
