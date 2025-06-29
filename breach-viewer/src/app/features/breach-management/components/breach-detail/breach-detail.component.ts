import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { BreachApiService } from '../../../../core/services';
import { Breach } from '../../../../core/models';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { HeaderComponent } from '../../../../layout/header/header.component';
import { AiRiskSummaryComponent } from '../ai-risk-summary/ai-risk-summary.component';

interface BreachDetailState {
  breach: Breach | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-breach-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    HeaderComponent,
    AiRiskSummaryComponent
  ],
  template: `
    <app-header></app-header>
    
    <div class="container">
      <div class="content">
        <ng-container *ngIf="state$ | async as state">
          <app-loading-spinner *ngIf="state.loading"></app-loading-spinner>
          
          <app-error-display 
            *ngIf="state.error && !state.loading"
            [message]="state.error"
            (retry)="retry()">
          </app-error-display>
          
          <div *ngIf="!state.loading && !state.error && state.breach" class="breach-detail">
            <div class="header">
              <button mat-stroked-button (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Back to Breaches
              </button>
            </div>
            
            <mat-card class="breach-card">
              <mat-card-header>
                <div mat-card-avatar class="breach-avatar">
                  <img *ngIf="state.breach.logoPath" [src]="state.breach.logoPath" [alt]="state.breach.title">
                  <mat-icon *ngIf="!state.breach.logoPath">security</mat-icon>
                </div>
                <mat-card-title>{{ state.breach.title }}</mat-card-title>
                <mat-card-subtitle>{{ state.breach.domain }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="breach-stats">
                  <div class="stat">
                    <span class="label">Breach Date:</span>
                    <span class="value">{{ state.breach.breachDate | date:'longDate' }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Affected Accounts:</span>
                    <span class="value">{{ state.breach.pwnCount | number }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Status:</span>
                    <span class="value">
                      <mat-icon [color]="state.breach.isVerified ? 'primary' : 'warn'">
                        {{ state.breach.isVerified ? 'check_circle' : 'cancel' }}
                      </mat-icon>
                      {{ state.breach.isVerified ? 'Verified' : 'Unverified' }}
                    </span>
                  </div>
                </div>
                
                <mat-divider></mat-divider>
                
                <div class="breach-description">
                  <h3>Description</h3>
                  <p>{{ state.breach.description }}</p>
                </div>
                
                <div class="data-classes" *ngIf="state.breach.dataClasses && state.breach.dataClasses.length > 0">
                  <h3>Compromised Data Types</h3>
                  <div class="chips-container">
                    <mat-chip *ngFor="let dataClass of state.breach.dataClasses" color="warn" selected>
                      {{ dataClass }}
                    </mat-chip>
                  </div>
                </div>
                
                <div class="breach-flags">
                  <h3>Additional Information</h3>
                  <div class="flags-grid">
                    <div class="flag" *ngIf="state.breach.isFabricated">
                      <mat-icon color="warn">warning</mat-icon>
                      <span>Fabricated</span>
                    </div>
                    <div class="flag" *ngIf="state.breach.isSensitive">
                      <mat-icon color="warn">security</mat-icon>
                      <span>Sensitive</span>
                    </div>
                    <div class="flag" *ngIf="state.breach.isRetired">
                      <mat-icon color="warn">archive</mat-icon>
                      <span>Retired</span>
                    </div>
                    <div class="flag" *ngIf="state.breach.isSpamList">
                      <mat-icon color="warn">report</mat-icon>
                      <span>Spam List</span>
                    </div>
                    <div class="flag" *ngIf="state.breach.isMalware">
                      <mat-icon color="warn">bug_report</mat-icon>
                      <span>Malware</span>
                    </div>
                  </div>
                </div>
                
                <div class="breach-dates">
                  <h3>Timeline</h3>
                  <div class="date-info">
                    <div class="date-item">
                      <span class="label">Added to Database:</span>
                      <span class="value">{{ state.breach.addedDate | date:'longDate' }}</span>
                    </div>
                    <div class="date-item" *ngIf="state.breach.modifiedDate !== state.breach.addedDate">
                      <span class="label">Last Modified:</span>
                      <span class="value">{{ state.breach.modifiedDate | date:'longDate' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- AI Risk Summary -->
            <app-ai-risk-summary [breachName]="state.breach.name"></app-ai-risk-summary>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 16px;
    }
    
    .content {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 16px;
    }
    
    .breach-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    
    .breach-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .breach-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
    }
    
    .label {
      font-weight: 500;
      font-size: 0.875rem;
      opacity: 0.7;
    }
    
    .value {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .breach-description {
      margin: 16px 0;
    }
    
    .breach-description h3 {
      margin-bottom: 16px;
    }
    
    .data-classes {
      margin: 16px 0;
    }
    
    .data-classes h3 {
      margin-bottom: 16px;
    }
    
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .breach-flags {
      margin: 16px 0;
    }
    
    .breach-flags h3 {
      margin-bottom: 16px;
    }
    
    .flags-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }
    
    .flag {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
    }
    
    .breach-dates {
      margin: 16px 0;
    }
    
    .breach-dates h3 {
      margin-bottom: 16px;
    }
    
    .date-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .date-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }
    

    
    @media (max-width: 768px) {
      .container {
        padding: 8px;
      }
      
      .breach-stats {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .flags-grid {
        grid-template-columns: 1fr;
      }
      
      .date-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class BreachDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  state$: Observable<BreachDetailState>;

  constructor(
    private breachApiService: BreachApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.state$ = this.route.params.pipe(
      switchMap(params => {
        const breachName = params['name'];
        if (!breachName) {
          return of({ breach: null, loading: false, error: 'No breach specified' });
        }
        
        return this.breachApiService.getBreaches({}).pipe(
          map(breaches => {
            const breach = breaches.find(b => b.name === breachName);
            if (!breach) {
              return { breach: null, loading: false, error: 'Breach not found' };
            }
            return { breach, loading: false, error: null };
          }),
          catchError(error => of({ 
            breach: null, 
            loading: false, 
            error: error.message || 'Failed to load breach details' 
          }))
        );
      })
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/breaches']);
  }

  retry(): void {
    // This will trigger a reload of the current route
    this.router.navigateByUrl(this.router.url);
  }
} 