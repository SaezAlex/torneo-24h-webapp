import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { TorneoPublico } from './components/torneo-publico/torneo-publico'; // Componente de vista pública
import { PanelAdmin } from './components/panel-admin/panel-admin';
import { PanelArbitro } from './components/panel-arbitro/panel-arbitro';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { InfoNoticiasComponent } from './components/info-noticias/info-noticias';
import { ColaboradoresComponent } from './components/colaboradores/colaboradores';

export const routes: Routes = [
  // Ruta pública por defecto
  { path: '', redirectTo: 'torneo', pathMatch: 'full' },
  { path: 'torneo', component: TorneoPublico }, 
  { path: 'login', component: Login },
  { path: 'noticias', component: InfoNoticiasComponent },
  { path: 'colaboradores', component: ColaboradoresComponent },
  
  // Rutas protegidas
  { 
    path: 'admin', 
    component: PanelAdmin,
    canActivate: [authGuard, roleGuard], 
    data: { rolesPermitidos: ['admin'] } // Solo el organizador
  },
  { 
    path: 'arbitro', 
    component: PanelArbitro,
    canActivate: [authGuard, roleGuard], 
    // El admin también debería poder hacer de árbitro si hace falta
    data: { rolesPermitidos: ['admin', 'arbitro'] } 
  },
  
  // Ruta comodín para errores
  { path: '**', redirectTo: 'torneo', pathMatch: 'full' } 
];