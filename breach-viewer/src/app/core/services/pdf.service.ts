import { Injectable } from '@angular/core';
import { BreachApiService } from './breach-api.service';
import { DateRangeParams } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor(private breachApiService: BreachApiService) {}

  downloadBreachReport(params?: DateRangeParams): void {
    this.breachApiService.downloadPdf(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `breach-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
      }
    });
  }
}