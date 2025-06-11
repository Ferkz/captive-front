import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TermsAndPrivacy } from './interfaces/tools';
import { ToolsService } from './services/tools.service';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  termsForm!: FormGroup;
  privacyForm!: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder,
    private termsService: ToolsService,
    private snackBar: MatSnackBar
  ){
    this.termsForm = this.fb.group({
      content:['', Validators.required]
    });
    this.privacyForm = this.fb.group({
      content: ['', Validators.required]
    })

  }

  ngOnInit(): void {
    this.loadTerms('TERMS_OF_USE', this.termsForm);
    this.loadTerms('PRIVACY_POLICY', this.privacyForm);
  }
  loadTerms(type: string, form: FormGroup): void {
    this.termsService.getTermsByType(type)
      .subscribe({
        next: (terms) => {
          form.patchValue({ content: terms.content });
        },
        error: (err) => {
          console.error(`Erro ao carregar ${type}:`, err);
          this.snackBar.open(`Erro ao carregar ${type}.`, 'Fechar', { duration: 3000 });
        }
      });
  }
   saveTerms(type: string, form: FormGroup): void {
    if (form.invalid) {
      this.snackBar.open('O conteúdo não pode ser vazio.', 'Fechar', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    const terms: TermsAndPrivacy = {
      type: type,
      content: form.value.content
    };
    this.termsService.saveOrUpdateTerms(terms)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (savedTerms) => {
          this.snackBar.open(`${type === 'TERMS_OF_USE' ? 'Termos de Uso' : 'Política de Privacidade'} salvos com sucesso!`, 'Fechar', { duration: 3000 });
        },
        error: (err) => {
          console.error(`Erro ao salvar ${type}:`, err);
          this.snackBar.open(`Erro ao salvar ${type}.`, 'Fechar', { duration: 3000 });
        }
      });
  }
}
