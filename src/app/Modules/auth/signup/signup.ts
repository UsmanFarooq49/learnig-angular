import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { FormFieldComponent, PhoneFieldComponent } from '../../../shared';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { LoginLeftPage } from '../login-left-page/login-left-page';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    MessageModule,
    FormFieldComponent,
    PhoneFieldComponent,
    LoginLeftPage,
  ],
  templateUrl: './signup.html',
  styleUrl: '../sign-in/sign-in.scss',
})
export class Signup {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    businessName: ['', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    recaptcha: [false, [Validators.requiredTrue]]
  });

  get fullNameControl() { return this.form.get('fullName')!; }
  get emailControl() { return this.form.get('email')!; }
  get businessNameControl() { return this.form.get('businessName')!; }
  get phoneNumberControl() { return this.form.get('phoneNumber')!; }
  get passwordControl() { return this.form.get('password')!; }
  get confirmPasswordControl() { return this.form.get('confirmPassword')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Signup form submitted:', this.form.value);
  }
}
