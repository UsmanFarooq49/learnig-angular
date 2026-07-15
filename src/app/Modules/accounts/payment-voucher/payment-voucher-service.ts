import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { generateVoucherNoResponse, paymentVoucherByIdResponse, paymentVoucherListRequest, paymentVoucherListResponse, paymentVoucherPayload, paymentVoucherSaveResponse } from './payment-voucher.types';

@Injectable({
  providedIn: 'root',
})
export class PaymentVoucherService {
  private http = inject(HttpClient);

  // Reference-data lookups (transaction types, accounts, currencies, etc.) live in
  // the shared LookupService — inject that directly where you need them.

  savePaymentVoucher(data: paymentVoucherPayload): Observable<paymentVoucherSaveResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher`;
    return this.http.post<paymentVoucherSaveResponse>(apiUrl, data);
  }

  updatePaymentVoucher(id: number, data: paymentVoucherPayload): Observable<paymentVoucherSaveResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher/${id}`;
    return this.http.put<paymentVoucherSaveResponse>(apiUrl, data);
  }

  getPaymentVoucherList(req: paymentVoucherListRequest): Observable<paymentVoucherListResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher/list`;
    return this.http.post<paymentVoucherListResponse>(apiUrl, req);
  }

  getPaymentVoucherById(id: number): Observable<paymentVoucherByIdResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher/${id}`;
    return this.http.get<paymentVoucherByIdResponse>(apiUrl);
  }

  deletePaymentVoucher(id: number): Observable<paymentVoucherSaveResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher/${id}`;
    return this.http.delete<paymentVoucherSaveResponse>(apiUrl);
  }

  /** Reverse a posted voucher. The backend creates a counter-entry and flips the original. */
  reversePaymentVoucher(id: number): Observable<paymentVoucherSaveResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher/${id}/reverse`;
    return this.http.post<paymentVoucherSaveResponse>(apiUrl, null);
  }

  generateVoucherNo(documentTypeId: number, financialYearId: number): Observable<generateVoucherNoResponse> {
    const apiUrl = `${environment.apiUrl}/Voucher/generate-no`;
    const params = new HttpParams()
      .set('documentTypeId', documentTypeId.toString())
      .set('financialYearId', financialYearId.toString());
    return this.http.get<generateVoucherNoResponse>(apiUrl, { params });
  }
}
