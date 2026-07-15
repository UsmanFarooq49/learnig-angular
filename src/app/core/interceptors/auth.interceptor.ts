import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@/app/store/auth/auth.selectors';
import { AuthActions } from '@/app/store/auth/auth.actions';
import { AuthService } from '@/app/core/services/auth.service';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

// Module-level state shared across all requests (the interceptor fn runs per-request).
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const store = inject(Store);
    const authService = inject(AuthService);

    let token: string | null = null;
    let refreshToken: string | null = null;
    store
        .select(selectAuthState)
        .pipe(take(1))
        .subscribe((s) => {
            token = s?.token ?? null;
            refreshToken = s?.refreshToken ?? null;
        });

    const authReq = token ? addToken(req, token) : req;

    return next(authReq).pipe(
        catchError((error) => {
            const is401 = error instanceof HttpErrorResponse && error.status === 401;
            if (!is401 || isAuthEndpoint(req.url)) {
                return throwError(() => error);
            }

            // No refresh token to work with -> session is dead.
            if (!refreshToken) {
                store.dispatch(AuthActions.logout());
                return throwError(() => error);
            }

            // A refresh is already in flight: wait for it, then retry with the new token.
            if (isRefreshing) {
                return refreshedToken$.pipe(
                    filter((t): t is string => t !== null),
                    take(1),
                    switchMap((newToken) => next(addToken(req, newToken)))
                );
            }

            // Start a refresh; block other 401s from starting their own.
            isRefreshing = true;
            refreshedToken$.next(null);

            return authService.refresh(refreshToken).pipe(
                switchMap((response) => {
                    isRefreshing = false;
                    store.dispatch(AuthActions.refreshSuccess({ response }));
                    refreshedToken$.next(response.accessToken);
                    return next(addToken(req, response.accessToken));
                }),
                catchError((refreshError) => {
                    isRefreshing = false;
                    store.dispatch(AuthActions.logout());
                    return throwError(() => refreshError);
                })
            );
        })
    );
};
