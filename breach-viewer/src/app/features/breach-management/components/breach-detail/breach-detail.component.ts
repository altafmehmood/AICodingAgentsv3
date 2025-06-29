import { Component, OnInit, OnDestroy } from '@angular/core';
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

interface BreachDetailState {
  breach: Breach | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-breach-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    HeaderComponent
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
              <button mat-button (click)="goBack()" class="back-button">
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
                      <mat-icon [class.verified]="state.breach.isVerified" [class.unverified]="!state.breach.isVerified">
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
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    
    .content {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 2rem;
    }
    
    .back-button {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 0.75rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      font-weight: 500;
    }
    
    .back-button:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
    
    .breach-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .breach-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
      border: 3px solid #e0e7ff;
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.2);
    }
    
    .breach-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .breach-avatar mat-icon {
      font-size: 40px;
      color: #6366f1;
    }
    
    .breach-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin: 2rem 0;
      padding: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      transition: all 0.3s ease;
    }
    
    .stat:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    }
    
    .label {
      font-weight: 600;
      color: #64748b;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .value {
      font-size: 1.25rem;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
    }
    
    .breach-description {
      margin: 2rem 0;
      padding: 0 2rem;
    }
    
    .breach-description h3 {
      margin-bottom: 1rem;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 700;
      position: relative;
    }
    
    .breach-description h3::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 2px;
    }
    
    .breach-description p {
      line-height: 1.8;
      color: #475569;
      font-size: 1.1rem;
      margin: 0;
    }
    
    .data-classes {
      margin: 2rem 0;
      padding: 0 2rem;
    }
    
    .data-classes h3 {
      margin-bottom: 1.5rem;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 700;
      position: relative;
    }
    
    .data-classes h3::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
      border-radius: 2px;
    }
    
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .chips-container mat-chip {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      color: #dc2626;
      font-weight: 600;
      border: 1px solid #fecaca;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      transition: all 0.3s ease;
    }
    
    .chips-container mat-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
    }
    
    .breach-flags {
      margin: 2rem 0;
      padding: 0 2rem;
    }
    
    .breach-flags h3 {
      margin-bottom: 1.5rem;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 700;
      position: relative;
    }
    
    .breach-flags h3::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 2px;
    }
    
    .flags-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    
    .flag {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-radius: 12px;
      border-left: 4px solid #f59e0b;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.1);
    }
    
    .flag:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
    }
    
    .flag mat-icon {
      color: #d97706;
      font-size: 1.5rem;
    }
    
    .flag span {
      font-weight: 600;
      color: #92400e;
    }
    
    .breach-dates {
      margin: 2rem 0;
      padding: 0 2rem 2rem;
    }
    
    .breach-dates h3 {
      margin-bottom: 1.5rem;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 700;
      position: relative;
    }
    
    .breach-dates h3::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 2px;
    }
    
    .date-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #bbf7d0;
    }
    
    .date-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    
    .date-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    
    .date-item .label {
      font-weight: 600;
      color: #374151;
    }
    
    .date-item .value {
      font-weight: 600;
      color: #059669;
    }
    
    .verified {
      color: #10b981;
    }
    
    .unverified {
      color: #ef4444;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 0.5rem;
      }
      
      .content {
        padding: 0;
      }
      
      .breach-card {
        border-radius: 16px;
        margin: 0 0.5rem;
      }
      
      .breach-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1rem;
        margin: 1.5rem 0;
      }
      
      .stat {
        padding: 1rem;
      }
      
      .breach-description,
      .data-classes,
      .breach-flags,
      .breach-dates {
        padding: 0 1rem;
        margin: 1.5rem 0;
      }
      
      .breach-description h3,
      .data-classes h3,
      .breach-flags h3,
      .breach-dates h3 {
        font-size: 1.25rem;
      }
      
      .flags-grid {
        grid-template-columns: 1fr;
      }
      
      .date-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .chips-container {
        gap: 0.5rem;
      }
      
      .chips-container mat-chip {
        font-size: 0.875rem;
        padding: 0.375rem 0.75rem;
      }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 0.25rem;
      }
      
      .breach-card {
        border-radius: 12px;
        margin: 0 0.25rem;
      }
      
      .breach-avatar {
        width: 60px;
        height: 60px;
      }
      
      .breach-avatar mat-icon {
        font-size: 30px;
      }
      
      .breach-stats {
        padding: 0.75rem;
      }
      
      .stat {
        padding: 0.75rem;
      }
      
      .value {
        font-size: 1.1rem;
      }
      
      .breach-description p {
        font-size: 1rem;
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