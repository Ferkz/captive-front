import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null=>{
    const cpf = control.value

    if(!cpf){
      return null
    }
    const numbersOnlyCpf = cpf.replace(/[^\d]/g, '')
    if(numbersOnlyCpf.length !==11){
      return { cpfInvalido: true}
    }
     if (/^(\d)\1+$/.test(numbersOnlyCpf)) {
      return { cpfInvalido: true };
    }
    let sum = 0;
    let remainder: number;

    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(numbersOnlyCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(numbersOnlyCpf.substring(9, 10))) {
      return { cpfInvalido: true };
    }
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(numbersOnlyCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(numbersOnlyCpf.substring(10, 11))) {
      return { cpfInvalido: true };
    }
    return null;
  }
}
