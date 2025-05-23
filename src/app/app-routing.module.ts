// Seu AppRoutingModule
import { AuthModule } from './auth/auth.module'; // AuthModule é importado, então suas rotas são eager
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PortalComponent } from './pages/portal/portal.component';
import { HomeComponent } from './pages/home/home.component';       // Tela inicial do UniFi redirect

const routes: Routes = [
  {path:'',component:HomeComponent}, // Rota raiz, alvo do redirect do UniFi
  {path:'cadastro',component: PortalComponent},
  {path:'login',component:LoginComponent},
  {
    path: 'administrator', // <<< ADICIONAR UM PATH PARA ADMIN
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
