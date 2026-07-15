import { createReducer, on } from '@ngrx/store';
import { FinancialYear } from '../../core/services/auth.service';
import { AuthActions } from './auth.actions';

export interface AuthState {
    user: any | null;
    token: string | null;
    loading: boolean;
    error: any | null;
    refreshToken: string | null;
    financialYear: FinancialYear | null;
}

function getStoredJson<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export const initialState: AuthState = {
    user: getStoredJson<any>('user'),
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    refreshToken: localStorage.getItem('refreshToken'),
    financialYear: getStoredJson<FinancialYear>('financialYear'),
};

export const authReducer = createReducer(
    initialState,
    on(AuthActions.login, (state) => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(AuthActions.loginSuccess, (state, { response }) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        return {
            ...state,
            user: response.user,
            token: response.accessToken,
            loading: false,
            error: null,
            refreshToken: response.refreshToken,
        };
    }),
    on(AuthActions.refreshSuccess, (state, { response }) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        return {
            ...state,
            token: response.accessToken,
            refreshToken: response.refreshToken,
        };
    }),
    on(AuthActions.setFinancialYear, (state, { financialYear }) => {
        localStorage.setItem('financialYear', JSON.stringify(financialYear));
        return { ...state, financialYear };
    }),
    on(AuthActions.loginFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error: error,
    })),
    on(AuthActions.logout, (state) => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('financialYear');
        return {
            ...state,
            user: null,
            token: null,
            refreshToken: null,
            loading: false,
            error: null,
            financialYear: null,
        };
    })
);
