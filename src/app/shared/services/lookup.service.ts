import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, shareReplay, throwError } from 'rxjs';
import {
    bankAccountResponse,
    ChequeBookResponse,
    ChequeLeafResponse,
    costCenterLookupResponse,
    currencyLookupResponse,
    departmentLookupResponse,
    LookupTypeResponse,
    taxTypeLookupResponse,
} from './lookup.types';

/**
 * Central source for reference-data (lookup) lists used across the app —
 * transaction types, departments, cost centers, accounts, currencies, etc.
 *
 * Lookups are static for a session and requested from many places, so each
 * distinct request is fetched once and shared (`shareReplay`). A failed request
 * is evicted so the next caller retries instead of replaying a cached error.
 */
@Injectable({ providedIn: 'root' })
export class LookupService {
    private http = inject(HttpClient);
    private cache = new Map<string, Observable<unknown>>();

    private cached<T>(key: string, request: () => Observable<T>): Observable<T> {
        const existing = this.cache.get(key) as Observable<T> | undefined;
        if (existing) return existing;

        const shared = request().pipe(
            catchError((err) => {
                this.cache.delete(key);
                return throwError(() => err);
            }),
            shareReplay({ bufferSize: 1, refCount: false }),
        );
        this.cache.set(key, shared);
        return shared;
    }

    /** Drop all cached lookups (call if reference data is known to have changed). */
    clearCache(): void {
        this.cache.clear();
    }

    getTransactionTypes(): Observable<LookupTypeResponse> {
        return this.cached('transaction-types', () =>
            this.http.get<LookupTypeResponse>(`${environment.apiUrl}/lookup/transaction-types`));
    }

    getCurrencies(): Observable<currencyLookupResponse> {
        return this.cached('currencies', () =>
            this.http.get<currencyLookupResponse>(`${environment.apiUrl}/currencies`));
    }

    getSubLedgerTypes(): Observable<LookupTypeResponse> {
        return this.cached('sub-ledger-types', () =>
            this.http.get<LookupTypeResponse>(`${environment.apiUrl}/lookup/sub-ledger-types`));
    }

    /**
     * Sub ledgers for a given Sub Ledger Type, optionally further filtered by
     * the Debit Account (`accountId`) so the dropdown only shows sub ledgers
     * that belong to that account.
     */
    getSubLedgers(ledgerTypeId: number, accountId?: number | null): Observable<LookupTypeResponse> {
        const key = `sub-ledgers:${ledgerTypeId}:${accountId ?? 0}`;
        return this.cached(key, () => {
            let params = new HttpParams().set('subLedgerTypeId', ledgerTypeId.toString());
            if (accountId != null && accountId !== 0) {
                params = params.set('accountId', accountId.toString());
            }
            return this.http.get<LookupTypeResponse>(`${environment.apiUrl}/lookup/sub-ledgers`, { params });
        });
    }

    getDepartments(): Observable<departmentLookupResponse> {
        return this.cached('departments', () =>
            this.http.get<departmentLookupResponse>(`${environment.apiUrl}/lookup/departments`));
    }

    getCostCenters(): Observable<costCenterLookupResponse> {
        return this.cached('cost-centers', () =>
            this.http.get<costCenterLookupResponse>(`${environment.apiUrl}/lookup/cost-centers`));
    }

    getChequeTypes(): Observable<LookupTypeResponse> {
        return this.cached('cheque-types', () =>
            this.http.get<LookupTypeResponse>(`${environment.apiUrl}/lookup/cheque-types`));
    }

    getPaymentModes(): Observable<LookupTypeResponse> {
        return this.cached('payment-modes', () =>
            this.http.get<LookupTypeResponse>(`${environment.apiUrl}/lookup/payment-modes`));
    }

    getTaxTypes(): Observable<taxTypeLookupResponse> {
        return this.cached('tax-types', () =>
            this.http.get<taxTypeLookupResponse>(`${environment.apiUrl}/lookup/tax-types`));
    }

    /** Chart-of-account dropdown. `accountTypeId`/`classType`/`controlType` of 0 are treated as "any". */
    getAccountDropdown(classType?: number, controlType?: number, accountTypeId?: number, postingAllowed = true): Observable<bankAccountResponse> {
        const key = `accounts:${classType ?? 0}:${controlType ?? 0}:${accountTypeId ?? 0}:${postingAllowed}`;
        return this.cached(key, () => {
            let params = new HttpParams().set('postingAllowed', postingAllowed.toString());
            if (classType != null && classType !== 0) params = params.set('classType', classType.toString());
            if (controlType != null && controlType !== 0) params = params.set('controlType', controlType.toString());
            if (accountTypeId != null && accountTypeId !== 0) params = params.set('accountTypeId', accountTypeId.toString());
            return this.http.get<bankAccountResponse>(`${environment.apiUrl}/ChartOfAccount/dropdown`, { params });
        });
    }

    // ── Cheque book (transactional — not cached so available leaves stay fresh) ──

    /** Cheque books for a bank account. */
    getChequeBooks(bankAccountId: number): Observable<ChequeBookResponse> {
        const params = new HttpParams().set('bankAccountId', bankAccountId);
        return this.http.get<ChequeBookResponse>(`${environment.apiUrl}/ChequeBook/dropdown`, { params });
    }

    /** Available (unused) cheque leaves for a given cheque book + bank account. */
    getChequeLeaves(bookId: number, bankAccountId: number): Observable<ChequeLeafResponse> {
        const params = new HttpParams().set('bankAccountId', bankAccountId);
        return this.http.get<ChequeLeafResponse>(`${environment.apiUrl}/ChequeBook/${bookId}/available-leaves`, { params });
    }
}