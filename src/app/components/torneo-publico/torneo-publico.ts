import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TorneoService } from '../../services/torneo';
import { Observable, map } from 'rxjs';

export interface PartidoPublico {
  id: string;
  fase: string;
  estado: 'pendiente' | 'en_curso' | 'revision' | 'finalizado' | 'activo';
  horaInicio: string;
  periodo?: string;
  equipoLocal: { nombre: string };
  equipoVisitante: { nombre: string };
  marcador?: { local: number; visitante: number };
  ganadorPenaltis?: 'local' | 'visitante';
}

export interface EquipoRepesca {
  nombre: string;
  golesEnContra: number;
  golesAFavor: number;
  diferencia: number;
}

@Component({
  selector: 'app-torneo-publico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './torneo-publico.html',
  styleUrl: './torneo-publico.css'
})
export class TorneoPublico implements OnInit {
  private torneoService = inject(TorneoService);
  
  pestanaActiva: 'partidos' | 'repesca' = 'partidos';

  partidos$!: Observable<Record<string, PartidoPublico[]>>; 
  tablaRepesca: EquipoRepesca[] = [];
  
  // Ahora manejamos fases en lugar de días
  fasesDisponibles: string[] = [];
  faseSeleccionada: string = '';
  partidoDestacadoId: string | null = null; 

  // Orden ideal de las pestañas
  ordenFases = ['Dieciseisavos', 'Repesca', 'Octavos', 'Cuartos', 'Semis', 'Final'];

  ngOnInit() {
    this.partidos$ = (this.torneoService.getPartidos() as Observable<PartidoPublico[]>).pipe(
      map(partidos => {
        
        // --- 1. CALCULAR TABLA DE REPESCA ---
        const perdedores: EquipoRepesca[] = [];
        
        partidos.forEach(p => {
          // AHORA SÍ BUSCA LA PALABRA "DIECISEISAVOS"
          const esPrimeraRonda = p.fase.toLowerCase().includes('dieciseisavos') || p.fase.toLowerCase().includes('1') || p.fase.toLowerCase().includes('primera');
          
          if (p.estado === 'finalizado' && esPrimeraRonda) {
            const gl = p.marcador?.local || 0;
            const gv = p.marcador?.visitante || 0;
            let nombrePerdedor = '';
            let gc = 0, gf = 0;

            if (gl < gv) {
              nombrePerdedor = p.equipoLocal?.nombre;
              gc = gv; 
              gf = gl; 
            } else if (gv < gl) {
              nombrePerdedor = p.equipoVisitante?.nombre;
              gc = gl;
              gf = gv;
            } else if (gl === gv) {
              
              if (p.ganadorPenaltis === 'local') {
                nombrePerdedor = p.equipoVisitante?.nombre;
              } else if (p.ganadorPenaltis === 'visitante') {
                nombrePerdedor = p.equipoLocal?.nombre;
              }
              gc = gl; 
              gf = gv;
            }

            
            if (nombrePerdedor) {
              perdedores.push({
                nombre: nombrePerdedor,
                golesEnContra: gc,
                golesAFavor: gf,
                diferencia: gf - gc
              });
            }
          }
        });

        // Ordenar repesca: 1º Menos goles en contra, 2º Mejor diferencia, 3º Goles a favor
        this.tablaRepesca = perdedores.sort((a, b) => {
          if (a.golesEnContra !== b.golesEnContra) return a.golesEnContra - b.golesEnContra;
          if (a.diferencia !== b.diferencia) return b.diferencia - a.diferencia;
          return b.golesAFavor - a.golesAFavor;
        });

        // --- 2. LÓGICA DE PARTIDOS POR FASE ---
        let destacado = partidos.find(p => p.estado === 'en_curso');
        if (!destacado) {
          const pendientes = partidos
            .filter(p => p.estado === 'pendiente' && p.horaInicio)
            .sort((a, b) => new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime());
          if (pendientes.length > 0) destacado = pendientes[0];
        }
        this.partidoDestacadoId = destacado ? destacado.id : null;

        const grupos: Record<string, PartidoPublico[]> = {};
        
        partidos.forEach(p => {
          const faseKey = p.fase || 'Sin Fase';
          if (!grupos[faseKey]) grupos[faseKey] = [];
          grupos[faseKey].push(p);
        });

        // Ordenar cronológicamente DENTRO de cada fase
        Object.keys(grupos).forEach(fase => {
          grupos[fase].sort((a, b) => {
            if (!a.horaInicio || !b.horaInicio) return 0;
            return new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime();
          });
        });

        // Ordenar las pestañas según el array "ordenFases"
        this.fasesDisponibles = Object.keys(grupos).sort((a, b) => {
          let indexA = this.ordenFases.findIndex(f => f.toLowerCase() === a.toLowerCase());
          let indexB = this.ordenFases.findIndex(f => f.toLowerCase() === b.toLowerCase());
          
          if (indexA === -1) indexA = 99; // Si el admin escribe una fase rara, va al final
          if (indexB === -1) indexB = 99;
          
          return indexA - indexB;
        });

        // Autoseleccionar la pestaña donde esté el partido destacado
        if (destacado && destacado.fase) {
          this.faseSeleccionada = destacado.fase;
        } else if (this.fasesDisponibles.length > 0) {
          this.faseSeleccionada = this.fasesDisponibles[0];
        }

        return grupos;
      })
    );
  }

  // Comprueba si un equipo ha ganado por goles o penaltis
  haGanado(partido: PartidoPublico, equipo: 'local' | 'visitante'): boolean {
    if (partido.estado !== 'finalizado' || !partido.marcador) return false;
    
    if (partido.ganadorPenaltis) {
      return partido.ganadorPenaltis === equipo;
    }
    
    const local = partido.marcador.local || 0;
    const visitante = partido.marcador.visitante || 0;
    return equipo === 'local' ? local > visitante : visitante > local;
  }

  setFase(fase: string) {
    this.faseSeleccionada = fase;
  }
}