import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        fullName: string;
        firstName: string;
        lastName: string;
    };
}

export type RefreshResponse = Omit<LoginResponse, 'user'>;

export interface FinancialYear {
    id: number;
    financialYearName: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    isActive: boolean;
}

export interface FinancialYearResponse {
    success: boolean;
    message: string;
    data: FinancialYear[];
    errors: string | null;
    errorCode: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/auth`;

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
    }

    refresh(refreshToken: string): Observable<RefreshResponse> {
        return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken });
    }

    getFinancialYearList(): Observable<FinancialYearResponse> {
        return this.http.get<FinancialYearResponse>(`${environment.apiUrl}/financial-years`);
    }
}
