import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Importe as interfaces e o serviço
import { CaptivePortalService, GuestLoginRequest, BackendPortalResponse } from './../../services/captive-portal.service'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-login', // Mantenha o seletor original
  templateUrl: './login.component.html', // Este template deve conter o formulário de login de convidado
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  guestLoginForm: FormGroup; // Formulário para LOGIN (re-autenticação) de convidados existentes

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  unifiOriginalParams: Params = {};
  clientMac: string | null = null;
  accessPointMac: string | null = null;
  ssid: string | null = null;
  originalUrl: string | null = null;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private captivePortalService: CaptivePortalService
  ) {
    // Inicialização do Formulário de LOGIN de Convidado (apenas e-mail)
    this.guestLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {
        console.log('LoginComponent (Convidado) - Query params recebidos:', params);
        this.unifiOriginalParams = { ...params };
        this.clientMac = params['mac'] || params['client_mac'] || params['id'] || null;
        this.accessPointMac = params['ap'] || params['ap_mac'] || null;
        this.ssid = params['ssid'] || null;
        this.originalUrl = params['url'] || params['redirect'] || params['original_url'] || null;

        if (!this.clientMac) {
          this.errorMessage = 'Endereço MAC do dispositivo não fornecido. Impossível continuar o login.';
          console.error('Client MAC address is missing from URL parameters.');
        } else {
          console.log('Parâmetros capturados do portal cativo para login:');
          console.log('Client MAC:', this.clientMac);
          console.log('AP MAC:', this.accessPointMac);
          console.log('SSID:', this.ssid);
          console.log('Original URL:', this.originalUrl);
        }
      });
  }

  // Atalho para acesso aos controles do formulário de LOGIN de convidado
  get glf() { return this.guestLoginForm.controls; }

  // Método para submeter o formulário de LOGIN de convidado
  onSubmit(): void { // Renomeado para onSubmit para ser o método padrão do form
    if (this.guestLoginForm.invalid) {
      Object.values(this.guestLoginForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.errorMessage = 'Por favor, insira um e-mail válido para fazer login.';
      return;
    }

    if (!this.clientMac) {
      this.errorMessage = 'MAC address do cliente é obrigatório para login. Verifique o redirecionamento do portal.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const requestData: GuestLoginRequest = {
      email: this.glf['email'].value,
      deviceMac: this.clientMac,
      accessPointMac: this.accessPointMac || undefined
    };

    this.captivePortalService.guestLogin(requestData) // Chame o método de login de convidado no serviço
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response: BackendPortalResponse) => {
          this.isLoading = false;
          if (response && response.payload && response.payload.message) {
            this.successMessage = response.payload.message || 'Login de convidado bem-sucedido! Acesso à internet reativado.';
            console.log('Guest login successful, UniFi authorized.', response);
            // Redirecionar para a URL original ou uma página de sucesso
            if (this.originalUrl) {
              window.location.href = this.originalUrl;
            } else {
              this.router.navigate(['/success-page']); // Exemplo: uma página de sucesso genérica
            }
          } else {
            this.errorMessage = 'Resposta inesperada do servidor após o login de convidado.';
            console.warn('Guest login response structure might be different than expected.', response);
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          if (err.error && err.error.description) {
            this.errorMessage = err.error.description + ': ' + (err.error.payload || '');
          } else {
            this.errorMessage = 'Falha no login de convidado. Verifique seu e-mail ou tente novamente mais tarde.';
          }
          console.error('Guest login failed:', err);
        }
      });
  }

  // Método para navegar de volta para a página inicial (HomeComponent) ou para o cadastro
  goToRegistration(): void {
    if (!this.clientMac) {
      this.errorMessage = 'Não foi possível detectar o MAC do dispositivo para prosseguir com o cadastro.';
      return;
    }
    // Navega para a rota de cadastro, passando os parâmetros originais
    this.router.navigate(['/cadastro'], { queryParams: this.unifiOriginalParams });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
