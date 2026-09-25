import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaz estricta para evitar el 'any'
export interface Patrocinador {
  nombre: string;
  logo: string;
  error?: boolean;
}

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css'
})
export class ColaboradoresComponent {
  
  organizadores: Patrocinador[] = [
    { nombre: 'Portus Samanus', logo: 'assets/portusamanus.png' } 
  ];

  colaboradores: Patrocinador[] = [
    { nombre: 'Excmo. Ayuntamiento de Castro-Urdiales', logo: 'assets/ayuntamientoCastro.jpg' },
    { nombre: 'ATLEET', logo: 'assets/atleet.jpg' },
    { nombre: 'Castro F.S.', logo: 'assets/castrofs.jpg' }
  ];
}