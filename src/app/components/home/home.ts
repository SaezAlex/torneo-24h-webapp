import { Component, inject, OnInit } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  
  esAdmin: boolean = false;

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (user) {
      // Leemos el documento del usuario logueado para ver su rol
      const userDoc = await getDoc(doc(this.firestore, 'usuarios', user.uid));
      if (userDoc.exists() && userDoc.data()['rol'] === 'admin') {
        this.esAdmin = true;
      }
    }
  }

}
