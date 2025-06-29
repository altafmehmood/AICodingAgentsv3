import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, startWith, switchMap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';

import { BreachApiService, PdfService } from '../../../../core/services';
import { Breach, DateRangeParams } from '../../../../core/models';
import { BreachCardComponent } from '../breach-card/breach-card.component';
import { DateRangePickerComponent } from '../../../../shared/components/date-range-picker/date-range-picker.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { HeaderComponent } from '../../../../layout/header/header.component';

interface BreachListState {
  breaches: Breach[];
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-breach-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    DateRangePickerComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    HeaderComponent
  ],
  template: `
    <app-header (exportPdf)="exportPdf()"></app-header>
    
    <div class="container">
      <app-date-range-picker (filterChange)="onFilterChange($event)"></app-date-range-picker>
      
      <div class="content">
        <ng-container *ngIf="state$ | async as state">
          <app-loading-spinner *ngIf="state.loading"></app-loading-spinner>
          
          <app-error-display 
            *ngIf="state.error && !state.loading"
            [message]="state.error"
            (retry)="retry()">
          </app-error-display>
          
          <div *ngIf="!state.loading && !state.error" class="breach-table-container">
            <div *ngIf="state.breaches.length === 0" class="no-results">
              <h3>No breaches found</h3>
              <p>Try adjusting your date range filter.</p>
            </div>
            
            <table mat-table [dataSource]="state.breaches" matSort *ngIf="state.breaches.length > 0" class="breach-table" 
                   role="table" aria-label="Data breaches table" [attr.aria-rowcount]="state.breaches.length + 1">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>
                <td mat-cell *matCellDef="let breach" data-label="Name"> {{breach.title}} </td>
              </ng-container>

              <ng-container matColumnDef="domain">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Domain </th>
                <td mat-cell *matCellDef="let breach" data-label="Domain"> {{breach.domain}} </td>
              </ng-container>

              <ng-container matColumnDef="breachDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Breach Date </th>
                <td mat-cell *matCellDef="let breach" data-label="Breach Date"> {{breach.breachDate | date:'mediumDate'}} </td>
              </ng-container>

              <ng-container matColumnDef="pwnCount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Affected Accounts </th>
                <td mat-cell *matCellDef="let breach" data-label="Affected Accounts"> {{breach.pwnCount | number}} </td>
              </ng-container>

              <ng-container matColumnDef="verified">
                <th mat-header-cell *matHeaderCellDef> Verified </th>
                <td mat-cell *matCellDef="let breach" data-label="Verified">
                  <mat-icon [class.verified]="breach.isVerified" [class.unverified]="!breach.isVerified">
                    {{breach.isVerified ? 'check_circle' : 'cancel'}}
                  </mat-icon>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let breach" data-label="Actions">
                  <button mat-button color="primary" (click)="onViewDetails(breach)" 
                          [attr.aria-label]="'View details for ' + breach.title">
                    <mat-icon>visibility</mat-icon>
                    View Details
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns; trackBy: trackByBreach" 
                  (click)="onViewDetails(row)" (keydown.enter)="onViewDetails(row)" (keydown.space)="onViewDetails(row)"
                  class="clickable-row" tabindex="0" role="button" [attr.aria-label]="'View details for ' + row.title"></tr>
            </table>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background: #fefefe;
      padding: 2rem 0;
    }
    
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .breach-table-container {
      margin-top: 2rem;
      background: #ffffff;
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
      border: 1px solid #f0f0f0;
      overflow: hidden;
    }
    
    .breach-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .clickable-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .clickable-row:hover {
      background-color: #fafafa;
    }
    
    .clickable-row:last-child {
      border-bottom: none;
    }
    
    .no-results {
      text-align: center;
      padding: 4rem 2rem;
      background: #ffffff;
      border: 1px solid #f0f0f0;
      border-radius: 2px;
    }
    
    .no-results h3 {
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: 500;
      font-family: 'Playfair Display', serif;
      color: #2c2c2c;
    }
    
    .no-results p {
      font-size: 1rem;
      color: #666666;
      font-family: 'Inter', sans-serif;
      line-height: 1.7;
    }
    
    .verified {
      color: #184B29;
    }
    
    .unverified {
      color: #cc0000;
    }
    
    mat-header-cell {
      font-weight: 600;
      color: #2c2c2c;
      background: #fafafa;
      padding: 1rem;
      font-size: 13px;
      text-transform: none;
      letter-spacing: 0.02em;
      border-bottom: 1px solid #e0e0e0;
      font-family: 'Inter', sans-serif;
    }
    
    mat-cell {
      padding: 1rem;
      font-size: 14px;
      color: #666666;
      vertical-align: middle;
      font-family: 'Inter', sans-serif;
      line-height: 1.5;
    }
    
    mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
    
    button[mat-button] {
      border-radius: 2px;
      padding: 8px 16px;
      font-weight: 500;
      transition: all 0.2s ease;
      background: #184B29;
      color: white;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      letter-spacing: 0.02em;
    }
    
    button[mat-button]:hover {
      background: #0f3319;
      box-shadow: 0 2px 4px rgba(24, 75, 41, 0.2);
    }
    
    /* Responsive Design */
    @media (max-width: 1024px) {
      .container {
        padding: 0.75rem;
      }
      
      .breach-table-container {
        margin-top: 1.5rem;
        border-radius: 8px;
      }
      
      mat-header-cell,
      mat-cell {
        padding: 1rem 0.75rem;
      }
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 0.5rem;
      }
      
      .content {
        padding: 0;
      }
      
      .breach-table-container {
        margin-top: 1rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      
      .displayedColumns {
        display: none;
      }
      
      /* Mobile table layout */
      .breach-table {
        display: block;
      }
      
      .breach-table thead {
        display: none;
      }
      
      .breach-table tbody {
        display: block;
      }
      
      .breach-table tr {
        display: block;
        margin-bottom: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
      }
      
      .breach-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border: none;
        font-size: 0.9rem;
      }
      
      .breach-table td::before {
        content: attr(data-label);
        font-weight: 600;
        color: #6b7280;
        margin-right: 1rem;
        min-width: 100px;
      }
      
      .breach-table td[data-label="Actions"] {
        justify-content: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }
      
      .breach-table td[data-label="Actions"]::before {
        display: none;
      }
      
      button[mat-button] {
        width: 100%;
        justify-content: center;
      }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 0.25rem;
      }
      
      .breach-table td {
        font-size: 0.85rem;
      }
      
      .breach-table td::before {
        min-width: 80px;
        font-size: 0.8rem;
      }
    }
  `]
})
export class BreachListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private filterSubject = new BehaviorSubject<DateRangeParams>({});
  
  state$: Observable<BreachListState>;
  displayedColumns: string[] = ['name', 'domain', 'breachDate', 'pwnCount', 'verified', 'actions'];

  constructor(
    private breachApiService: BreachApiService,
    private pdfService: PdfService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.state$ = this.filterSubject.pipe(
      switchMap(filter => 
        this.breachApiService.getBreaches(filter).pipe(
          map(breaches => ({ breaches, loading: false, error: null })),
          startWith({ breaches: [], loading: true, error: null }),
          catchError(error => of({ 
            breaches: [], 
            loading: false, 
            error: error.message || 'Failed to load breaches' 
          }))
        )
      )
    );
  }

  ngOnInit(): void {
    this.loadBreaches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(filter: DateRangeParams): void {
    this.filterSubject.next(filter);
  }

  onViewDetails(breach: Breach): void {
    this.router.navigate(['/breaches', breach.name]);
  }

  exportPdf(): void {
    const currentFilter = this.filterSubject.value;
    this.pdfService.downloadBreachReport(currentFilter);
  }

  retry(): void {
    const currentFilter = this.filterSubject.value;
    this.filterSubject.next(currentFilter);
  }

  private loadBreaches(): void {
    this.filterSubject.next({});
  }

  trackByBreach(index: number, breach: Breach): string {
    return breach.name || breach.title;
  }
}