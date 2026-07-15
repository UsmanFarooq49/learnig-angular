import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuthUser = createSelector(
    selectAuthState,
    (state) => state.user
);

export const selectAuthLoading = createSelector(
    selectAuthState,
    (state) => state.loading
);

export const selectAuthError = createSelector(
    selectAuthState,
    (state) => state.error
);

export const selectIsAuthenticated = createSelector(
    selectAuthState,
    (state) => !!state.token
);

export const selectRefreshToken = createSelector(
    selectAuthState,
    (state) => state.refreshToken
);

export const selectFinancialYear = createSelector(
    selectAuthState,
    (state) => state.financialYear
);

export const selectFinancialYearId = createSelector(
    selectFinancialYear,
    (fy) => fy?.id ?? null
);

/** True once the user is logged in AND has picked a financial year. */
export const selectIsReady = createSelector(
    selectAuthState,
    (state) => !!state.token && !!state.financialYear
);
