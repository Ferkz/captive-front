import { AuthModule } from './auth/auth.module';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PortalComponent } from './pages/portal/portal.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  {path:'acesso',component:HomeComponent},
  {path:'cadastro',component: PortalComponent},
  {path:'login',component:LoginComponent},
  {
      path: '',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
      path: '',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
