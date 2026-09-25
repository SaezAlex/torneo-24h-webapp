import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  updateDoc, 
  deleteDoc,
  addDoc,
  query,       
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TorneoService {
  private firestore = inject(Firestore);

  constructor() { }

  // ==========================================
  //                EQUIPOS
  // ==========================================

  // Obtener todos los equipos en tiempo real
  getEquipos(): Observable<any[]> {
    const equiposRef = collection(this.firestore, 'equipos');
    // { idField: 'id' } mete el ID del documento de Firestore dentro del objeto
    return collectionData(equiposRef, { idField: 'id' });
  }

  // Crear un nuevo equipo (Para el panel de Admin)
  async addEquipo(equipo: any): Promise<any> {
    const equiposRef = collection(this.firestore, 'equipos');
    return addDoc(equiposRef, equipo);
  }

 
  
  

  actualizarEquipo(id: string, data: any) {
    const equipoRef = doc(this.firestore, `equipos/${id}`);
    return updateDoc(equipoRef, data);
  }

  eliminarEquipo(id: string) {
    const equipoRef = doc(this.firestore, `equipos/${id}`);
    return deleteDoc(equipoRef); 
  }

  // ==========================================
  //                PARTIDOS
  // ==========================================

  // Obtener la lista de todos los partidos (Para el cuadrante público)
 getPartidos(): Observable<any[]> {
    const partidosRef = collection(this.firestore, 'partidos');
    // Creamos la consulta con ordenamiento
    const q = query(partidosRef, orderBy('horaInicio', 'asc')); 
    // Usamos la consulta 'q' en lugar de la referencia directa
    return collectionData(q, { idField: 'id' });
  }

  // Obtener un solo partido en tiempo real (Para cuando pinchas en un partido concreto)
  getPartido(id: string): Observable<any> {
    const partidoRef = doc(this.firestore, `partidos/${id}`);
    return docData(partidoRef, { idField: 'id' });
  }

  // Actualizar cualquier dato de un partido (Marcador, faltas, actas, estado...)
  async actualizarPartido(id: string, datosAActualizar: any): Promise<void> {
    const partidoRef = doc(this.firestore, `partidos/${id}`);
    return updateDoc(partidoRef, datosAActualizar);
  }

  async borrarPartido(partidoId: string) {
  const partidoRef = doc(this.firestore, `partidos/${partidoId}`);
  return await deleteDoc(partidoRef);
}
}