import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaz para tipar estrictamente las noticias
export interface Noticia {
  id?: string;
  titulo: string;
  resumen: string;
  destacada: boolean;
  fecha: string;
  timestamp: number;
}

@Component({
  selector: 'app-info-noticias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-noticias.html',
  styleUrl: './info-noticias.css'
})
export class InfoNoticiasComponent implements OnInit {
  private firestore = inject(Firestore);
  
  // Hemos quitado 'premios'
  pestanaSubmenu: 'noticias' | 'reglamento' = 'noticias';
  noticias$!: Observable<Noticia[]>;

  ngOnInit() {
    const noticiasRef = collection(this.firestore, 'noticias');
    
    // Obtenemos y ordenamos por timestamp
    this.noticias$ = collectionData(noticiasRef, { idField: 'id' }).pipe(
      map(noticias => (noticias as Noticia[]).sort((a, b) => b.timestamp - a.timestamp))
    );
  }
}