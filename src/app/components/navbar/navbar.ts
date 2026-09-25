import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  usuarioLogueado = false;
  rol: string | null = null;

  ngOnInit() {
    // Escuchamos en tiempo real si hay un usuario conectado
    authState(this.auth).subscribe(async (user) => {
      if (user) {
        this.usuarioLogueado = true;
        // Si hay usuario, vamos a Firestore a ver qué permisos tiene
        const userDoc = await getDoc(doc(this.firestore, `usuarios/${user.uid}`));
        if (userDoc.exists()) {
          this.rol = userDoc.data()['rol'];
        }
      } else {
        // Si no hay usuario, reseteamos las variables
        this.usuarioLogueado = false;
        this.rol = null;
      }
    });
  }

  // Función para cerrar sesión
  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/torneo']);
  }
}