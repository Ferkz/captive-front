import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PortalComponent } from './pages/portal/portal.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  {path:'',component:HomeComponent},
  {path:'cadastro',component: PortalComponent},
  {path:'login',component:LoginComponent},
  {
    path: 'administrator',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
