import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { LayoutComponent } from './layout/layout.component';

import {MatSidenavModule} from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatDialogModule} from '@angular/material/dialog';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatTableModule} from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';

import { ReactiveFormsModule } from '@angular/forms';

import { DashboardComponent } from './dashboard/dashboard.component';
import { AdministradoresComponent } from './administradores/administradores.component';
import { ToolsComponent } from './tools/tools.component';
import { SessoesComponent } from './sessoes/sessoes.component';
import { AccessLogsComponent } from './access-logs/access-logs.component';
import { AddAdminDialogComponent } from './administradores/admin/add-admin-dialog.component';
import { ChangePasswordDialogComponent } from './administradores/change-password-dialog/change-password-dialog.component';
import { ConfirmDialogComponent } from './confirm/confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    SessoesComponent,
    AdministradoresComponent,
    ToolsComponent,
    AccessLogsComponent,
    AddAdminDialogComponent,
    ChangePasswordDialogComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatSortModule
  ]
})
export class AdminModule { }
