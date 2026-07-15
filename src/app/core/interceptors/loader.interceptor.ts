import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

/**
 * Opt-out flag for the global loader. Pass via HttpContext on the request:
 *
 *   this.http.post(url, body, {
 *       context: new HttpContext().set(SKIP_LOADER, true)
 *   });
 *
 * Useful for endpoints that already render their own progress UI
 * (e.g. file uploads with a per-row spinner, background menu refresh).
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.context.get(SKIP_LOADER)) {
        return next(req);
    }
    const loader = inject(LoaderService);
    loader.show();
    return next(req).pipe(finalize(() => loader.hide()));
};