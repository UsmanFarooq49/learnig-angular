import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { isDevMode } from '@angular/core';
import { AuthState, authReducer } from './auth/auth.reducer';

export interface AppState {
    router: RouterReducerState;
    auth: AuthState;
}

export const reducers: ActionReducerMap<AppState> = {
    router: routerReducer,
    auth: authReducer,
};

export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];
