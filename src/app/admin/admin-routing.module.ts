import { SessoesComponent } from './sessoes/sessoes.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from '../auth/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdministradoresComponent } from './administradores/administradores.component';
import { ToolsComponent } from './tools/tools.component';
import { AccessLogsComponent } from './access-logs/access-logs.component';
import { DevicesComponent } from './devices/devices.component';

const routes: Routes = [
  {
    path:'',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children:[
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent},
      {path: 'sessoes', component: SessoesComponent},
      { path:'administradores', component: AdministradoresComponent},
      { path: 'logs', component: AccessLogsComponent},
      { path: 'tools', component: ToolsComponent},
      { path:'devices', component: DevicesComponent }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
