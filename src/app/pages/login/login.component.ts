import { CaptivePortalService, CaptiveLoginRequest, BackendPortalResponse } from './../../services/captive-portal.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
 loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  unifiOriginalParams: Params = {};
  clientMac: string | null = null;
  accessPointMac: string | null = null;
  ssid: string | null = null;
  originalUrl: string | null = null;

  private unsubscribe$ = new Subject<void>();

  // Termos de Uso
  touAccepted = false;
  showTouError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private captivePortalService: CaptivePortalService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]], // Usuário como e-mail
      password: ['', [Validators.required, Validators.minLength(6)]],
      acceptTou: [false, Validators.requiredTrue] // Para o checkbox de Termos de Uso
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {

        console.log('PortalComponent (Cadastro) - Query params recebidos:', params);
        this.unifiOriginalParams = { ...params };
        this.clientMac = params['mac'] || params['client_mac'] || params['id'] ||null;
        this.accessPointMac = params['ap'] || params['ap_mac'] || null;
        this.ssid = params['ssid'] || null;
        // UniFi pode enviar a URL original como 'url', 'redirect', ou 'original_url'
        this.originalUrl = params['url'] || params['redirect'] || params['original_url'] || null;

        if (!this.clientMac) {
          this.errorMessage = 'MAC address do cliente não fornecido. Impossível continuar.';
          console.error('Client MAC address is missing from URL parameters.');
        } else {
          console.log('Parâmetros recebidos do portal cativo:');
          console.log('Client MAC:', this.clientMac);
          console.log('AP MAC:', this.accessPointMac);
          console.log('SSID:', this.ssid);
          console.log('Original URL:', this.originalUrl);
        }
      });

    // Ouvir mudanças no checkbox de Termos de Uso
    this.loginForm.get('acceptTou')?.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => {
        this.touAccepted = value;
        if (value) {
          this.showTouError = false;
        }
      });
  }

  get f() { return this.loginForm.controls; } // Atalho para acesso aos controles do formulário

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach(control => {
        control.markAsTouched();
      });
      if (!this.touAccepted) {
        this.showTouError = true;
      }
      this.errorMessage = 'Por favor, preencha o formulário corretamente e aceite os Termos de Uso.';
      return;
    }

    if (!this.clientMac) {
      this.errorMessage = 'MAC address do cliente é obrigatório. Verifique o redirecionamento do portal.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.showTouError = false;

    const requestData: CaptiveLoginRequest = {
      username: this.f['username'].value,
      password: this.f['password'].value,
      mac: this.clientMac,
      ap: this.accessPointMac || undefined,
      ssid: this.ssid || undefined
    };

    this.captivePortalService.login(requestData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response: BackendPortalResponse) => {
          this.isLoading = false;
          if (response && response.payload && response.payload.message) { // Ajustado para estrutura SuccessResponseDTO
              this.successMessage = response.payload.message || 'Login bem-sucedido! Acesso à internet liberado.';
              console.log('Login successful, UniFi authorized.', response);
          } else {
              this.errorMessage = 'Resposta inesperada do servidor após o login.';
              console.warn('Login response structure might be different than expected.', response);
          }
        },
        error: (err: Error) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Falha no login. Verifique suas credenciais ou tente novamente mais tarde.';
          console.error('Login failed:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
