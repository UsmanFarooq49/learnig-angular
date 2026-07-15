import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FinancialYear, LoginRequest, LoginResponse, RefreshResponse } from '../../core/services/auth.service';

export const AuthActions = createActionGroup({
    source: 'Auth',
    events: {
        'Login': props<{ credentials: LoginRequest }>(),
        'Login Success': props<{ response: LoginResponse }>(),
        'Login Failure': props<{ error: any }>(),
        'Refresh Success': props<{ response: RefreshResponse }>(),
        'Set Financial Year': props<{ financialYear: FinancialYear }>(),
        'Logout': emptyProps(),
    }
});
