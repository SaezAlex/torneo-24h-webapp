import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TorneoService } from '../../services/torneo';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, writeBatch, doc, collection, setDoc, deleteDoc, updateDoc, collectionData } from '@angular/fire/firestore';

export interface Jugador {
  id: string;
  nombre: string;
  dorsal: number;
  sancionado: boolean;
}

export interface Equipo {
  id: string;
  nombre: string;
  delegado: string;
  jugadores: Jugador[];
}

export interface Noticia {
  id?: string;
  titulo: string;
  resumen: string;
  destacada: boolean;
  fecha?: string;
  timestamp?: number;
}

export interface FormularioPartido {
  id?: string;
  fase: string;
  diaStr: string;  
  horaStr: string; 
  tipoLocal: 'decidido' | 'pendiente';
  localEquipo: Equipo | null;
  localPendiente: string;
  tipoVisitante: 'decidido' | 'pendiente';
  visitanteEquipo: Equipo | null;
  visitantePendiente: string;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css'
})
export class PanelAdmin implements OnInit {
  private torneoService = inject(TorneoService);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  pestanaActiva: 'carga' | 'equipos' | 'eliminatorias' | 'noticias' = 'equipos';
  
  equipos$!: Observable<Equipo[]>;
  equiposRaw: Equipo[] = []; 
  equipoSeleccionado: Equipo | null = null;
  
  partidos$!: Observable<any[]>;
  noticias$!: Observable<Noticia[]>;
  nuevaNoticia: Noticia = { titulo: '', resumen: '', destacada: false };

  // --- VARIABLES DEL NUEVO GESTOR DE PARTIDOS ---
  fasesDisponibles = ['Dieciseisavos', 'Repesca', 'Octavos', 'Cuartos', 'Semis', 'Final'];
  
  // Lista de opciones para cuando un equipo aún no se sabe
  opcionesPendientes = [
    'Por definir',
    'Ganador 10:00', 'Ganador 11:00', 'Ganador 12:00', 'Ganador 13:00', 'Ganador 14:00', 
    'Ganador 15:00', 'Ganador 16:00', 'Ganador 17:00', 'Ganador 18:00', 'Ganador 19:00', 'Ganador 20:00',
    'Repesca 1', 'Repesca 2', 'Repesca 3', 'Repesca 4', 'Repesca 5',
    'Ganador Octavos 1', 'Ganador Octavos 2', 'Ganador Octavos 3', 'Ganador Octavos 4',
    'Ganador Cuartos 1', 'Ganador Cuartos 2', 'Ganador Cuartos 3', 'Ganador Cuartos 4',
    'Ganador Semi 1', 'Ganador Semi 2'
  ];

  // NUEVO: Opciones rápidas de Día y Hora
  diasTorneo = [
    { nombre: 'Sábado 25', valor: '2026-07-25' },
    { nombre: 'Domingo 26', valor: '2026-07-26' }
  ];

  horasTorneo = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00',
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ];


  formPartido: FormularioPartido = this.getFormularioVacio();

  ngOnInit() {
    this.equipos$ = this.torneoService.getEquipos();
    this.equipos$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(eqs => this.equiposRaw = eqs);
    this.partidos$ = this.torneoService.getPartidos();
    const noticiasRef = collection(this.firestore, 'noticias');
    this.noticias$ = collectionData(noticiasRef, { idField: 'id' }) as Observable<Noticia[]>;
  }

  // --- MÉTODOS DEL CREADOR/EDITOR DE PARTIDOS ---

  getFormularioVacio(): FormularioPartido {
    return {
      fase: 'Dieciseisavos',
      diaStr: '2026-07-25', 
      horaStr: '10:00',     
      tipoLocal: 'decidido',
      localEquipo: null,
      localPendiente: 'Por definir',
      tipoVisitante: 'decidido',
      visitanteEquipo: null,
      visitantePendiente: 'Por definir'
    };
  }

  // Evita que seleccionen el mismo equipo en local y visitante
  getEquiposFiltrados(tipo: 'local' | 'visitante'): Equipo[] {
    const elOtro = tipo === 'local' ? this.formPartido.visitanteEquipo : this.formPartido.localEquipo;
    if (!elOtro) return this.equiposRaw;
    return this.equiposRaw.filter(eq => eq.id !== elOtro.id);
  }

  abrirEditorPartido(p: any) {
    
    let d = '2026-07-25';
    let h = '10:00';
    if (p.horaInicio && p.horaInicio.includes('T')) {
      const partes = p.horaInicio.split('T');
      d = partes[0];
      h = partes[1];
    }

    this.formPartido = {
      id: p.id,
      fase: p.fase || 'Dieciseisavos',
      diaStr: d,
      horaStr: h,
      tipoLocal: p.equipoLocal?.id === 'pendiente' ? 'pendiente' : 'decidido',
      localEquipo: p.equipoLocal?.id !== 'pendiente' ? this.equiposRaw.find(e => e.id === p.equipoLocal?.id) || null : null,
      localPendiente: p.equipoLocal?.id === 'pendiente' ? p.equipoLocal.nombre : 'Por definir',
      tipoVisitante: p.equipoVisitante?.id === 'pendiente' ? 'pendiente' : 'decidido',
      visitanteEquipo: p.equipoVisitante?.id !== 'pendiente' ? this.equiposRaw.find(e => e.id === p.equipoVisitante?.id) || null : null,
      visitantePendiente: p.equipoVisitante?.id === 'pendiente' ? p.equipoVisitante.nombre : 'Por definir',
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.formPartido = this.getFormularioVacio();
  }

  async guardarPartido() {
    if (this.formPartido.tipoLocal === 'decidido' && !this.formPartido.localEquipo) { alert('⚠️ Selecciona el equipo local.'); return; }
    if (this.formPartido.tipoVisitante === 'decidido' && !this.formPartido.visitanteEquipo) { alert('⚠️ Selecciona el equipo visitante.'); return; }

    // UNIMOS EL DÍA Y LA HORA PARA GUARDARLO EN FIREBASE COMO SIEMPRE
    const horaInicioFinal = `${this.formPartido.diaStr}T${this.formPartido.horaStr}`;

    const equipoLocal = this.formPartido.tipoLocal === 'decidido'
      ? { id: this.formPartido.localEquipo!.id, nombre: this.formPartido.localEquipo!.nombre }
      : { id: 'pendiente', nombre: this.formPartido.localPendiente };
    
    const equipoVisitante = this.formPartido.tipoVisitante === 'decidido'
      ? { id: this.formPartido.visitanteEquipo!.id, nombre: this.formPartido.visitanteEquipo!.nombre }
      : { id: 'pendiente', nombre: this.formPartido.visitantePendiente };

    const plantillaLocal = this.formPartido.tipoLocal === 'decidido' 
      ? this.prepararPlantilla(this.formPartido.localEquipo!.jugadores) : [];
      
    const plantillaVisitante = this.formPartido.tipoVisitante === 'decidido' 
      ? this.prepararPlantilla(this.formPartido.visitanteEquipo!.jugadores) : [];

    const datosPartido: any = {
      fase: this.formPartido.fase,
      horaInicio: horaInicioFinal, // <--- Usamos la variable unida aquí
      equipoLocal,
      equipoVisitante,
      plantillaLocal,
      plantillaVisitante,
    };

    try {
      if (this.formPartido.id) {
        await this.torneoService.actualizarPartido(this.formPartido.id, datosPartido);
        alert('✅ Partido actualizado correctamente.');
      } else {
        datosPartido.estado = 'pendiente';
        datosPartido.marcador = { local: 0, visitante: 0 };
        datosPartido.acta = { presentesLocal: [], presentesVisitante: [], rojasLocal: [], rojasVisitante: [], dorsalesLocal: {}, dorsalesVisitante: {} };
        
        const nuevoDocRef = doc(collection(this.firestore, 'partidos'));
        await setDoc(nuevoDocRef, datosPartido);
        alert('✅ Partido creado correctamente.');
      }
      this.cancelarEdicion();
    } catch (e) {
      console.error(e);
      alert('❌ Error al guardar el partido');
    }
  }

  async eliminarPartido(partidoId: string) {
    if (confirm('¿Estás seguro de eliminar este partido permanentemente?')) {
      try {
        await this.torneoService.borrarPartido(partidoId);
        alert('🗑️ Partido eliminado');
      } catch (e) {
        alert('Error al eliminar');
      }
    }
  }

  // --- RESTO DE FUNCIONES INTACTAS ---
  verEquipo(equipo: Equipo) { this.equipoSeleccionado = equipo; }
  volverAEquipos() { this.equipoSeleccionado = null; }
  
  private prepararPlantilla(jugadores: Jugador[]): Jugador[] {
    return (jugadores || []).map(j => ({
      ...j, dorsal: (typeof j.dorsal === 'number' && !isNaN(j.dorsal)) ? j.dorsal : 0
    }));
  }

  eliminarEquipoCompleto(id: string) {
    if(confirm('¿Estás seguro de eliminar este equipo y TODOS sus jugadores? Esta acción no se puede deshacer.')) {
      this.torneoService.eliminarEquipo(id);
      this.volverAEquipos();
    }
  }

  async anadirEquipoManual() {
    const nombre = prompt('Introduce el nombre del nuevo equipo:');
    if (!nombre) return; 
    const delegado = prompt('Introduce el nombre del delegado (opcional):') || 'Sin delegado';
    const nuevoEquipo: Omit<Equipo, 'id'> = { nombre: nombre.trim(), delegado: delegado.trim(), jugadores: [] };
    try {
      await setDoc(doc(collection(this.firestore, 'equipos')), nuevoEquipo);
      alert('✅ Equipo creado correctamente.');
    } catch (error) {
      alert('❌ Error al crear el equipo.');
    }
  }

  editarEquipo() {
    if (!this.equipoSeleccionado) return;
    const nuevoNombre = prompt('Editar nombre del equipo:', this.equipoSeleccionado.nombre);
    if (nuevoNombre === null) return;
    const nuevoDelegado = prompt('Editar delegado:', this.equipoSeleccionado.delegado);
    if (nuevoDelegado === null) return;
    this.equipoSeleccionado.nombre = nuevoNombre.trim();
    this.equipoSeleccionado.delegado = nuevoDelegado.trim();
    this.torneoService.actualizarEquipo(this.equipoSeleccionado.id, {
      nombre: this.equipoSeleccionado.nombre, delegado: this.equipoSeleccionado.delegado
    });
  }

  toggleSancionManual(jugador: Jugador) {
    if (!this.equipoSeleccionado) return;
    if(confirm(`¿Quieres cambiar el estado de sanción de ${jugador.nombre}?`)) {
      jugador.sancionado = !jugador.sancionado;
      this.torneoService.actualizarEquipo(this.equipoSeleccionado.id, { jugadores: this.equipoSeleccionado.jugadores });
    }
  }

  eliminarJugador(jugadorAEliminar: Jugador) {
    if (!this.equipoSeleccionado) return;
    if(confirm(`¿Expulsar a ${jugadorAEliminar.nombre} del equipo?`)) {
      this.equipoSeleccionado.jugadores = this.equipoSeleccionado.jugadores.filter(j => j.id !== jugadorAEliminar.id);
      this.torneoService.actualizarEquipo(this.equipoSeleccionado.id, { jugadores: this.equipoSeleccionado.jugadores });
    }
  }

  anadirJugador() {
    if (!this.equipoSeleccionado) return;
    const nombre = prompt('Nombre del nuevo jugador:');
    if (!nombre) return;
    this.equipoSeleccionado.jugadores.push({
      id: crypto.randomUUID(), nombre: nombre.trim(), dorsal: 0, sancionado: false
    });
    this.torneoService.actualizarEquipo(this.equipoSeleccionado.id, { jugadores: this.equipoSeleccionado.jugadores });
  }

  editarJugador(jugador: Jugador) {
    if (!this.equipoSeleccionado) return;
    const nuevoNombre = prompt('Editar nombre del jugador:', jugador.nombre);
    if (nuevoNombre === null) return; 
    const nuevoDorsalStr = prompt('Editar dorsal:', jugador.dorsal.toString());
    if (nuevoDorsalStr === null) return;
    jugador.nombre = nuevoNombre.trim();
    jugador.dorsal = parseInt(nuevoDorsalStr) || 0;
    this.torneoService.actualizarEquipo(this.equipoSeleccionado.id, { jugadores: this.equipoSeleccionado.jugadores });
  }

  subirCSV(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = async (e: any) => {
      const lineas = e.target.result.split('\n');
      const equiposMap = new Map<string, Omit<Equipo, 'id'>>();
      for (let i = 1; i < lineas.length; i++) {
        if (!lineas[i].trim()) continue;
        const [nombreEquipo, delegado, nombreJugador, dorsal] = lineas[i].split(',');
        if (!equiposMap.has(nombreEquipo)) equiposMap.set(nombreEquipo, { nombre: nombreEquipo, delegado: delegado || '', jugadores: [] });
        equiposMap.get(nombreEquipo)?.jugadores.push({ id: crypto.randomUUID(), nombre: nombreJugador ? nombreJugador.trim() : 'Desconocido', dorsal: dorsal ? parseInt(dorsal.trim()) : 0, sancionado: false });
      }
      try {
        const batch = writeBatch(this.firestore);
        equiposMap.forEach(equipoData => batch.set(doc(collection(this.firestore, 'equipos')), equipoData));
        await batch.commit();
        alert('¡Equipos importados con éxito!');
      } catch (error) { alert('Hubo un error subiendo los equipos.'); }
    };
    lector.readAsText(archivo);
  }

  // --- GESTIÓN DE NOTICIAS ---
  async crearNoticia() {
    if (!this.nuevaNoticia.titulo.trim()) return;
    try {
      await setDoc(doc(collection(this.firestore, 'noticias')), {
        ...this.nuevaNoticia,
        titulo: this.nuevaNoticia.titulo.trim(),
        resumen: this.nuevaNoticia.resumen.trim(),
        fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        timestamp: new Date().getTime() 
      });
      alert('✅ Noticia publicada con éxito.');
      this.nuevaNoticia = { titulo: '', resumen: '', destacada: false };
    } catch (error) { alert('❌ Error al publicar la noticia.'); }
  }

  async editarNoticia(noticia: Noticia) {
    const nuevoTitulo = prompt('Editar título:', noticia.titulo);
    if (nuevoTitulo === null) return; 
    const nuevoResumen = prompt('Editar cuerpo:', noticia.resumen);
    if (nuevoResumen === null) return; 
    const esDestacada = confirm('¿Quieres que esta noticia sea DESTACADA? (Aceptar = Sí, Cancelar = No)');
    try {
      await updateDoc(doc(this.firestore, `noticias/${noticia.id}`), { titulo: nuevoTitulo.trim(), resumen: nuevoResumen.trim(), destacada: esDestacada });
      alert('✅ Noticia actualizada.');
    } catch (error) { alert('❌ Error al actualizar.'); }
  }

  async eliminarNoticia(id: string | undefined) {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar esta noticia?')) {
      await deleteDoc(doc(this.firestore, `noticias/${id}`));
      alert('🗑️ Noticia eliminada.');
    }
  }
}