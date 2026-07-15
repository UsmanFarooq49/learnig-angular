import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '../../core/services/auth.service';
import { AuthActions } from './auth.actions';
import { catchError, map, switchMap, of, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthEffects {
    private actions$ = inject(Actions);
    private authService = inject(AuthService);
    private router = inject(Router);

    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.login),
            switchMap(({ credentials }) =>
                this.authService.login(credentials).pipe(
                    map((response) => AuthActions.loginSuccess({ response })),
                    catchError((error) => of(AuthActions.loginFailure({ error })))
                )
            )
        )
    );

    loginSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.loginSuccess),
                tap(() => this.router.navigate(['/']))
            ),
        { dispatch: false }
    );

    logout$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.logout),
                tap(() => {
                    this.router.navigate(['/auth/sign-in']);
                    localStorage.clear();
                })
            ),
        { dispatch: false }
    );
}
