import { Routes } from '@angular/router';
import { SignIn } from './sign-in/sign-in';
import { Signup } from './signup/signup';

export default [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', title: 'Login | Zascare', component: SignIn },
    { path: 'signup', title: 'Sign Up | Zascare', component: Signup },
    { path: '**', redirectTo: 'login', pathMatch: 'full' },
] as Routes;
