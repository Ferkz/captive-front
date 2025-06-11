import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-terms-modal',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content [innerHTML]="data.content"></mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,

  styles: [`
    mat-dialog-content { max-height: 60vh; overflow-y: auto; white-space: pre-wrap; }
  `]
})
export class TermsModalComponent implements OnInit {

  constructor( public dialogRef: MatDialogRef<TermsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, content: string }) { }

  ngOnInit(): void {
  }

}
