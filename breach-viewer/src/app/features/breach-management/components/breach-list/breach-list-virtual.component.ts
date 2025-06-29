import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, startWith, switchMap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

import { BreachApiService, PdfService } from '../../../../core/services';
import { Breach, DateRangeParams } from '../../../../core/models';
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
  selector: 'app-breach-list-virtual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    ScrollingModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
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
          
          <div *ngIf="!state.loading && !state.error" class="breach-virtual-container">
            <div *ngIf="state.breaches.length === 0" class="no-results">
              <h3>No breaches found</h3>
              <p>Try adjusting your date range filter.</p>
            </div>
            
            <cdk-virtual-scroll-viewport 
              *ngIf="state.breaches.length > 0" 
              itemSize="120" 
              class="virtual-viewport"
              [attr.aria-label]="'Virtual list of ' + state.breaches.length + ' data breaches'">
              
              <mat-card 
                *cdkVirtualFor="let breach of state.breaches; trackBy: trackByBreach" 
                class="breach-card"
                (click)="onViewDetails(breach)"
                (keydown.enter)="onViewDetails(breach)"
                (keydown.space)="onViewDetails(breach)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'View details for ' + breach.title">
                
                <mat-card-header>
                  <div mat-card-avatar class="breach-avatar">
                    <mat-icon [class.verified]="breach.isVerified" [class.fabricated]="breach.isFabricated">
                      {{ getBreachIcon(breach) }}
                    </mat-icon>
                  </div>
                  <mat-card-title>{{ breach.title }}</mat-card-title>
                  <mat-card-subtitle>{{ breach.domain }}</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="breach-info">
                    <div class="info-row">
                      <mat-icon class="info-icon">event</mat-icon>
                      <span>{{ breach.breachDate | date:'mediumDate' }}</span>
                    </div>
                    
                    <div class="info-row">
                      <mat-icon class="info-icon">people</mat-icon>
                      <span>{{ breach.pwnCount | number }} accounts</span>
                    </div>
                    
                    <div class="status-row">
                      <mat-icon [class.verified]="breach.isVerified" [class.unverified]="!breach.isVerified">
                        {{ breach.isVerified ? 'check_circle' : 'cancel' }}
                      </mat-icon>
                      <span>{{ breach.isVerified ? 'Verified' : 'Unverified' }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </cdk-virtual-scroll-viewport>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 1rem;
    }
    
    .content {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .breach-virtual-container {
      margin-top: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    .virtual-viewport {
      height: 600px;
      width: 100%;
    }
    
    .breach-card {
      margin: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 6px;
      border: 1px solid #f1f5f9;
    }
    
    .breach-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #e2e8f0;
    }
    
    .breach-card:focus {
      outline: 2px solid #0f172a;
      outline-offset: 2px;
    }
    
    .breach-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f5f5f5;
    }
    
    .breach-avatar mat-icon {
      color: #666;
    }
    
    .breach-avatar mat-icon.verified {
      color: #4caf50;
    }
    
    .breach-avatar mat-icon.fabricated {
      color: #f44336;
    }
    
    .breach-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .info-row, .status-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .info-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #666;
    }
    
    .verified {
      color: #059669;
    }
    
    .unverified {
      color: #dc2626;
    }
    
    .no-results {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }
    
    .no-results h3 {
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }
    
    .no-results p {
      font-size: 1.1rem;
      color: #888;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 0.5rem;
      }
      
      .virtual-viewport {
        height: 500px;
      }
      
      .breach-card {
        margin: 0.5rem;
      }
    }
  `]
})
export class BreachListVirtualComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private filterSubject = new BehaviorSubject<DateRangeParams>({});
  
  state$: Observable<BreachListState>;

  constructor(
    private breachApiService: BreachApiService,
    private pdfService: PdfService,
    private router: Router
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

  getBreachIcon(breach: Breach): string {
    if (breach.isFabricated) return 'warning';
    if (breach.isVerified) return 'verified';
    return 'help_outline';
  }
} 