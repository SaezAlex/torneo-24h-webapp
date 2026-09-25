import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TorneoService } from '../../services/torneo';
import { Observable } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

// --- INTERFACES ---
export interface JugadorActa {
  id: string;
  nombre: string;
  dorsal: number;
  sancionado?: boolean;
}

export interface PartidoActa {
  id: string;
  estado: 'pendiente' | 'en_curso' | 'revision' | 'finalizado' | 'activo';
  fase: string;
  horaInicio: string;
  periodo?: string;
  equipoLocal: { id: string; nombre: string };
  equipoVisitante: { id: string; nombre: string };
  plantillaLocal: JugadorActa[];
  plantillaVisitante: JugadorActa[];
  marcador: { local: number; visitante: number };
  ganadorPenaltis?: 'local' | 'visitante';
  acta: {
    presentesLocal: string[];
    presentesVisitante: string[];
    dorsalesLocal: Record<string, string | number>;
    dorsalesVisitante: Record<string, string | number>;
    rojasLocal: string[];
    rojasVisitante: string[];
  };
}

@Component({
  selector: 'app-panel-arbitro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-arbitro.html',
  styleUrl: './panel-arbitro.css'
})
export class PanelArbitro implements OnInit {
  private torneoService = inject(TorneoService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Variables
  partidos: PartidoActa[] = []; 
  partidos$!: Observable<PartidoActa[]>;
  partidoSeleccionado: PartidoActa | null = null;
  pestanaActiva: 'pre' | 'directo' | 'post' = 'pre';
  equiposAIterar: ('local' | 'visitante')[] = ['local', 'visitante'];
  esAdmin: boolean = false;
  modoEdicionAdmin: boolean = false;

  ngOnInit() {
    this.partidos$ = this.torneoService.getPartidos() as Observable<PartidoActa[]>;
    this.partidos$.subscribe(data => this.partidos = data);

    authState(this.auth).subscribe(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this.firestore, `usuarios/${user.uid}`));
        if (userDoc.exists() && userDoc.data()['rol'] === 'admin') {
          this.esAdmin = true;
        }
      }
    });
  }

  get partidosOrdenados() {
    return [...this.partidos].sort((a, b) => {
      const prioridad = (p: PartidoActa) => {
        if (p.estado === 'en_curso') return 1;
        if (p.estado === 'pendiente') return 2;
        return 3;
      };
      
      const prioA = prioridad(a);
      const prioB = prioridad(b);
      
      if (prioA !== prioB) return prioA - prioB;
      return new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime();
    });
  }

  esDestacado(partido: PartidoActa): boolean {
    if (partido.estado === 'en_curso') return true;
    const pendientes = this.partidos.filter(p => p.estado === 'pendiente');
    return partido.estado === 'pendiente' && 
           pendientes.length > 0 && 
           partido.id === pendientes[0].id && 
           !this.hayPartidoEnCurso();
  }

  hayPartidoEnCurso(): boolean {
    return this.partidos.some(p => p.estado === 'en_curso');
  }

  // --- NAVEGACIÓN ---
  entrarAlPartido(partido: PartidoActa) {
    this.partidoSeleccionado = partido;
    this.modoEdicionAdmin = false;
    if (!this.partidoSeleccionado.marcador) {
      this.partidoSeleccionado.marcador = { local: 0, visitante: 0 };
    }
    if (partido.estado === 'pendiente' || partido.estado === 'activo') {
      this.pestanaActiva = 'pre';
    } else if (partido.estado === 'en_curso') {
      this.pestanaActiva = 'directo';
    } else {
      this.pestanaActiva = 'post';
    }
  }

  volverALaLista() {
    this.partidoSeleccionado = null;
    this.modoEdicionAdmin = false;
  }

  habilitarEdicionAdmin() { this.modoEdicionAdmin = true; }

  irAlDirecto() {
    if(!this.partidoSeleccionado) return;
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { estado: 'en_curso', periodo: '1ª Parte' });
    this.partidoSeleccionado.estado = 'en_curso';
    this.partidoSeleccionado.periodo = '1ª Parte'; 
    this.pestanaActiva = 'directo';
  }

  finalizarDirecto() {
    if(!this.partidoSeleccionado) return;
    if (confirm('¿Quieres dar por concluido el partido?')) {
      this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { estado: 'revision', periodo: 'Finalizado' });
      this.partidoSeleccionado.estado = 'revision';
      this.partidoSeleccionado.periodo = 'Finalizado';
      this.pestanaActiva = 'post';
    }
  }

  async cerrarActaDefinitiva() {
    if(!this.partidoSeleccionado) return;
    const mensaje = this.modoEdicionAdmin 
      ? '¿Guardar cambios en el acta?' 
      : '¿Cerrar acta definitivamente? ATENCIÓN: Se aplicará sanción automática a los jugadores con Tarjeta Roja.';
      
    if (confirm(mensaje)) {
      if (!this.modoEdicionAdmin) {
        await this.aplicarSanciones(
          this.partidoSeleccionado.equipoLocal.id, 
          this.partidoSeleccionado.acta?.rojasLocal || []
        );
        await this.aplicarSanciones(
          this.partidoSeleccionado.equipoVisitante.id, 
          this.partidoSeleccionado.acta?.rojasVisitante || []
        );
      }

      await this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { estado: 'finalizado' });
      this.partidoSeleccionado.estado = 'finalizado';
      this.volverALaLista();
    }
  }

  private async aplicarSanciones(equipoId: string, rojas: string[]) {
    if (!rojas || rojas.length === 0) return; 
    try {
      const equipoRef = doc(this.firestore, `equipos/${equipoId}`);
      const equipoSnap = await getDoc(equipoRef);
      if (equipoSnap.exists()) {
        const equipoData = equipoSnap.data();
        const jugadoresActualizados = equipoData['jugadores'].map((j: any) => {
          if (rojas.includes(j.id)) return { ...j, sancionado: true };
          return j;
        });
        await this.torneoService.actualizarEquipo(equipoId, { jugadores: jugadoresActualizados });
      }
    } catch (error) {
      console.error('Error aplicando sanciones al equipo:', error);
    }
  }

  toggleAsistencia(equipo: 'local'|'visitante', id: string) {
    if(!this.partidoSeleccionado) return;
    const acta = this.partidoSeleccionado.acta || { presentesLocal: [], presentesVisitante: [], dorsalesLocal: {}, dorsalesVisitante: {}, rojasLocal: [], rojasVisitante: [] };
    const campo = equipo === 'local' ? 'presentesLocal' : 'presentesVisitante';
    let presentes = [...(acta[campo] || [])];
    
    if (presentes.includes(id)) {
      presentes = presentes.filter(d => d !== id);
    } else {
      presentes.push(id);
    }
    const actaActualizada = { ...acta, [campo]: presentes };
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { acta: actaActualizada });
    this.partidoSeleccionado.acta = actaActualizada; 
  }

  estaPresente(equipo: 'local'|'visitante', id: string): boolean {
    if (!this.partidoSeleccionado || !this.partidoSeleccionado.acta) return false;
    const campo = equipo === 'local' ? 'presentesLocal' : 'presentesVisitante';
    return (this.partidoSeleccionado.acta[campo] || []).includes(id);
  }

  async actualizarDorsal(equipo: 'local'|'visitante', jugadorId: string, event: any) {
    if(!this.partidoSeleccionado) return;
    const nuevoDorsalStr = event.target.value;
    const nuevoDorsalNum = parseInt(nuevoDorsalStr) || 0; 

    const acta = this.partidoSeleccionado.acta || {} as any;
    const campo = equipo === 'local' ? 'dorsalesLocal' : 'dorsalesVisitante';
    const dorsales = { ...(acta[campo] || {}) };
    dorsales[jugadorId] = nuevoDorsalNum;
    
    const actaActualizada = { ...acta, [campo]: dorsales };
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { acta: actaActualizada });
    this.partidoSeleccionado.acta = actaActualizada;

    const equipoId = equipo === 'local' 
      ? this.partidoSeleccionado.equipoLocal.id 
      : this.partidoSeleccionado.equipoVisitante.id;

    try {
      const equipoDocRef = doc(this.firestore, `equipos/${equipoId}`);
      const equipoSnap = await getDoc(equipoDocRef);
      if (equipoSnap.exists()) {
        const equipoData = equipoSnap.data();
        const jugadoresActualizados = equipoData['jugadores'].map((j: any) => {
          if (j.id === jugadorId) return { ...j, dorsal: nuevoDorsalNum };
          return j;
        });
        await this.torneoService.actualizarEquipo(equipoId, { jugadores: jugadoresActualizados });
      }
    } catch (error) {
      console.error('Error actualizando el equipo oficial:', error);
    }
  }

  modificarGol(equipo: 'local'|'visitante', cantidad: number) {
    if(!this.partidoSeleccionado) return;
    const nuevoMarcador = { ...this.partidoSeleccionado.marcador };
    nuevoMarcador[equipo] = Math.max(0, nuevoMarcador[equipo] + cantidad);
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { marcador: nuevoMarcador });
    this.partidoSeleccionado.marcador = nuevoMarcador;
  }

  setGanadorPenaltis(equipo: 'local' | 'visitante') {
    if(!this.partidoSeleccionado) return;
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { ganadorPenaltis: equipo });
    this.partidoSeleccionado.ganadorPenaltis = equipo;
  }

  toggleRoja(equipo: 'local'|'visitante', id: string) {
    if(!this.partidoSeleccionado) return;
    const acta = this.partidoSeleccionado.acta || {} as any;
    const campoRojas = equipo === 'local' ? 'rojasLocal' : 'rojasVisitante';
    let rojas = [...(acta[campoRojas] || [])];
    
    if (rojas.includes(id)) {
      rojas = rojas.filter(d => d !== id);
    } else {
      rojas.push(id);
    }
    const actaActualizada = { ...acta, [campoRojas]: rojas };
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { acta: actaActualizada });
    this.partidoSeleccionado.acta = actaActualizada;
  }

  tieneRoja(equipo: 'local'|'visitante', id: string): boolean {
    if (!this.partidoSeleccionado || !this.partidoSeleccionado.acta) return false;
    const campo = equipo === 'local' ? 'rojasLocal' : 'rojasVisitante';
    return (this.partidoSeleccionado.acta[campo] || []).includes(id);
  }

  esPartidoAtrasado(partido: PartidoActa): boolean {
    if (partido.estado === 'finalizado' || partido.estado === 'en_curso') return false;
    if (!partido.horaInicio) return false;
    const inicio = new Date(partido.horaInicio).getTime();
    return (new Date().getTime() - inicio) > (60 * 60 * 1000);
  }

  esProximo(partido: PartidoActa): boolean {
    const ahora = new Date().getTime();
    const inicio = new Date(partido.horaInicio).getTime();
    return partido.estado === 'pendiente' && inicio > (ahora - 3600000);
  }

  cambiarPeriodo(nuevoPeriodo: string) {
    if(!this.partidoSeleccionado) return;
    this.torneoService.actualizarPartido(this.partidoSeleccionado.id, { periodo: nuevoPeriodo });
    this.partidoSeleccionado.periodo = nuevoPeriodo;
  }
}