import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('token');

    if (!token) {
        return true;
    }

    router.navigate(['/']);
    return false;
};
