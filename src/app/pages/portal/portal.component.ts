import { ToolsService } from './../../admin/tools/services/tools.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  GuestRegistrationService,
  GuestRegistrationData,
  GuestRegistrationResponse,
} from '../../services/guest-registration.service';
import { cpfValidator } from 'src/app/shared/validators/cpf.validator';
import { TermsModalComponent } from 'src/app/shared/terms-modal/terms-modal.component';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss'],
})
export class PortalComponent implements OnInit, OnDestroy {
  cadastroPortalForm: FormGroup;
  isLoading = false;
  erro: string | null = null;
  successMessage: string | null = null;

  unifiOriginalParams: Params = {};
  clientMacFromUrl: string | null = null;
  apMacFromUrl: string | null = null;
  originalRedirectUrl: string | null = null;

  termsOfUseContent: string | null = null;
  privacyPolicyContent: string | null = null;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private guestRegistrationService: GuestRegistrationService,
    private snackBar: MatSnackBar,
    private termsService: ToolsService,
    private dialog: MatDialog // Injete MatDialog
  ) {
    this.cadastroPortalForm = this.fb.group({
      nome: [
        '',
        [
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(66),
          Validators.pattern(
            /^(?!([A-Za-zÀ-ÖØ-öø-ÿ\s'-])\1{2,})[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/
          ),
        ],
      ],
      cpf: [
        '',
        [
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(11),
          cpfValidator(),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      telefone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[0-9\s\-()]{10,20}$/)],
      ],
      acceptTou: [false, Validators.requiredTrue],
    });
  }
  openTermsModal(): void {
    this.dialog.open(TermsModalComponent, {
      width: '800px',
      data: {
        title: 'Termos de Uso',
        content: this.termsOfUseContent || 'Carregando Termos de Uso...',
      },
    });
  }
  openPrivacyModal(): void {
    this.dialog.open(TermsModalComponent, {
      width: '800px',
      data: {
        title: 'Política de Privacidade',
        content:
          this.privacyPolicyContent || 'Carregando Política de Privacidade...',
      },
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        console.log(
          'PortalComponent (Cadastro) - Query params recebidos:',
          params
        );
        this.unifiOriginalParams = { ...params };
        this.clientMacFromUrl =
          params['mac'] || params['client_mac'] || params['id'] || null;
        this.apMacFromUrl = params['ap'] || params['ap_mac'] || null;
        this.originalRedirectUrl = params['url'] || params['redirect'] || null;

        if (!this.clientMacFromUrl) {
          this.erro =
            'Informações do dispositivo (MAC address) não encontradas na URL. Não é possível prosseguir com o cadastro.';
          this.snackBar.open(this.erro, 'Fechar', {
            duration: 7000,
            panelClass: ['error-snackbar'],
          });
        }
        console.log('MAC do cliente da URL:', this.clientMacFromUrl);
        console.log('AP MAC da URL:', this.apMacFromUrl);
        console.log('URL Original:', this.originalRedirectUrl);
      });

    this.loadTermsAndPrivacy();
  }
  loadTermsAndPrivacy(): void {
    this.termsService
      .getTermsByType('TERMS_OF_USE')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (terms) => (this.termsOfUseContent = terms.content),
        error: (err) => console.error('Erro ao carregar Termos de Uso:', err),
      });

    this.termsService
      .getTermsByType('PRIVACY_POLICY')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (policy) => (this.privacyPolicyContent = policy.content),
        error: (err) =>
          console.error('Erro ao carregar Política de Privacidade:', err),
      });
  }
  get f() {
    return this.cadastroPortalForm.controls;
  }

  onSubmit(): void {
    this.erro = null;
    this.successMessage = null;
    if (this.f['nome'].errors) {
      console.log('Erros no campo Nome:', this.f['nome'].errors);
    }
    if (this.f['cpf'].errors) {
      console.log('Erros no campo CPF:', this.f['cpf'].errors);
    }
    if (this.f['email'].errors) {
      console.log('Erros no campo Email:', this.f['email'].errors);
    }
    if (this.f['telefone'].errors) {
      console.log('Erros no campo Telefone:', this.f['telefone'].errors);
    }
    if (this.f['acceptTou'].errors) {
      console.log('Erros no campo Aceitar Termos:', this.f['acceptTou'].errors);
    }
    if (this.cadastroPortalForm.invalid) {
      Object.values(this.cadastroPortalForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      this.erro =
        'Por favor, preencha todos os campos obrigatórios corretamente.';
      if (this.f['acceptTou'] && !this.f['acceptTou'].value) {
        this.erro = 'Você deve aceitar os Termos de Uso para prosseguir.';
      }
      this.snackBar.open(this.erro, 'Fechar', {
        duration: 4000,
        panelClass: ['warning-snackbar'],
      });
      return;
    }
    if (!this.clientMacFromUrl) {
      this.erro =
        'MAC address do dispositivo não detectado. Recarregue a página ou reconecte-se ao Wi-Fi.';
      this.snackBar.open(this.erro, 'Fechar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }
    this.isLoading = true;
    const formValue = this.cadastroPortalForm.value;

    const registrationData: GuestRegistrationData = {
      fullName: `${formValue.nome}`,
      cpf: `${formValue.cpf}`,
      email: formValue.email,
      phoneNumber: formValue.telefone,
      acceptTou: formValue.acceptTou,
      deviceMac: this.clientMacFromUrl,
      accessPointMac: this.apMacFromUrl || undefined,
    };

    this.guestRegistrationService
      .registerAndAuthorize(registrationData)
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this.unsubscribe$)
      )
      .subscribe({
        next: (response: GuestRegistrationResponse) => {
          this.isLoading = false;
          const descriptionLower = response.responseDescription
            ?.trim()
            .toLowerCase();
          const payloadString = response.payload || '';
          const finalRedirectUrl = response.redirectUrl;

          if (response.responseId === 200 || finalRedirectUrl) {
            let urlCompletaPararedirecionar = finalRedirectUrl || '';
            if (
              urlCompletaPararedirecionar.endsWith('?authed=true&url=') &&
              this.originalRedirectUrl
            ) {
              urlCompletaPararedirecionar += encodeURIComponent(
                this.originalRedirectUrl
              );
            } else if (!urlCompletaPararedirecionar) {
              urlCompletaPararedirecionar =
                this.originalRedirectUrl || 'https://www.google.com';
            }

            if (descriptionLower === 'already active') {
              this.successMessage =
                payloadString ||
                'Seu dispositivo já está autorizado e com uma sessão ativa.';
            } else if (descriptionLower === 'registration updated') {
              this.successMessage =
                payloadString ||
                'Cadastro atualizado e acesso à internet liberado!';
            } else if (descriptionLower === 'registration successful') {
              this.successMessage =
                payloadString ||
                'Cadastro e autorização realizados com sucesso! Você já pode navegar.';
            } else if (descriptionLower === 'cpf already registered') {
              this.successMessage =
                payloadString ||
                'Usuário já possui um cadastro. Por favor, use a opção Login.';
              return;
            } else {
              this.successMessage =
                payloadString ||
                descriptionLower ||
                'Operação realizada com sucesso.';
            }

            this.snackBar.open(
              this.successMessage || 'Acesso liberado.',
              'OK',
              {
                duration: 7000,
                panelClass: ['success-snackbar'],
              }
            );
            this.cadastroPortalForm.disable();

            setTimeout(() => {
              console.log('Redirecionando para:', urlCompletaPararedirecionar);
              window.location.href =
                urlCompletaPararedirecionar || 'https://www.google.com';
            }, 2500);
          } else {
            this.erro =
              payloadString ||
              descriptionLower ||
              'Falha na operação de cadastro.';
            this.snackBar.open(this.erro || 'Erro desconhecido', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
            });
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Falha na requisição (error handler):', err);
          if (err){
            this.erro= err.payload
            this.snackBar.open (this.erro || 'Error desconhecido','Fechar',{
              duration:5000,
              panelClass:['error-snackbar']
            })
          }
        },
      });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  redirectUserLogin(): void {
    this.router.navigate(['/login'], { queryParams: this.unifiOriginalParams });
  }
}
