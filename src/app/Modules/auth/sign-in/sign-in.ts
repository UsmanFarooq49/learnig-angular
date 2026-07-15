import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormFieldComponent } from '../../../shared';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../../store/auth/auth.selectors';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { LoginRequest } from '../../../core/services/auth.service';
import { LoginLeftPage } from '../login-left-page/login-left-page';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    FormFieldComponent,
    LoginLeftPage,
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    this.loading$.subscribe(state => {
      console.log('loading$', state);
    });
  }

  get emailControl() { return this.form.get('email')!; }
  get passwordControl() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials = this.form.value as LoginRequest;
    this.store.dispatch(AuthActions.login({ credentials }));
  }
}
