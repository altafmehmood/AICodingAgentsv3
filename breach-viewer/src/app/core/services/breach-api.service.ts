import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, catchError, delay, mergeMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Breach, DateRangeParams, AiRiskSummary } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BreachApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBreaches(params?: DateRangeParams): Observable<Breach[]> {
    let httpParams = new HttpParams();
    
    if (params?.from) {
      httpParams = httpParams.set('from', params.from);
    }
    
    if (params?.to) {
      httpParams = httpParams.set('to', params.to);
    }

    return this.http.get<Breach[]>(`${this.baseUrl}/breach`, { params: httpParams }).pipe(
      retry({ count: 3, delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000) })
    );
  }

  downloadPdf(params?: DateRangeParams): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params?.from) {
      httpParams = httpParams.set('from', params.from);
    }
    
    if (params?.to) {
      httpParams = httpParams.set('to', params.to);
    }

    return this.http.get(`${this.baseUrl}/breach/pdf`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  getAiRiskSummary(breachName: string): Observable<AiRiskSummary> {
    return this.http.get<AiRiskSummary>(`${this.baseUrl}/breach/${encodeURIComponent(breachName)}/ai-summary`).pipe(
      retry({ count: 2, delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000) })
    );
  }
}