import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs';

import { DevicesService } from './services/devices.service';
import { Devices } from './interface/devices';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['state', 'name', 'model', 'macAddress', 'ipAddress', 'firmwareVersion', 'actions'];
  dataSource = new MatTableDataSource<Devices>();
  isLoading = true;
  error: string | null = null;
  resultsLength = 0;

   private _paginator!: MatPaginator;
  private _sort!: MatSort;

  @ViewChild(MatPaginator, { static: false })
  set paginator(value: MatPaginator) {
    if (value) {
      this._paginator = value;
      this.dataSource.paginator = this._paginator;
      this._paginator._intl.itemsPerPageLabel = 'Itens por página';
    }
  }

  @ViewChild(MatSort, { static: false })
  set sort(value: MatSort) {
    if (value) {
      this._sort = value;
      this.dataSource.sort = this._sort;
      this._sort.sortChange.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });
    }
  }

  private unsubscribe$ = new Subject<void>();


  constructor(
    private deviceService: DevicesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  }
   ngAfterViewInit(): void {
    this.loadDevices();
  }
   ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  loadDevices(): void {
    this.isLoading = true;
    this.error = null;
    this.deviceService.getDevices()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (devices) => {
          this.dataSource.data = devices;
          this.resultsLength = devices.length;
        },
        error: (err) => {
          this.error = 'Falha ao carregar os dispositivos.';
          console.error(err);
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  restartDevice(device: Devices): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirmar Reinicialização',
      message: `Tem certeza que deseja reiniciar o dispositivo "${device.name}"?`,
      confirmButtonText: 'Reiniciar',
      confirmButtonColor: 'warn',
      cancelButtonText: 'Cancelar'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, { data: dialogData });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.deviceService.restartDevice(device.id)
          .pipe(
            takeUntil(this.unsubscribe$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: () => {
              this.snackBar.open(`Dispositivo "${device.name}" reiniciando...`, 'OK', { duration: 3000 });
            },
            error: (err) => {
              this.snackBar.open(`Falha ao reiniciar o dispositivo.`, 'Erro', { duration: 5000 });
              console.error(err);
            }
          });
      }
    });
  }


}
