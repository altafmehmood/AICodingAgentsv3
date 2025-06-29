import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { Breach } from '../../../../core/models';
import { BreachDatePipe } from '../../../../shared/pipes/breach-date.pipe';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-breach-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    BreachDatePipe,
    DecimalPipe
  ],
  template: `
    <mat-card class="breach-card" [class.sensitive]="breach.isSensitive" [class.fabricated]="breach.isFabricated">
      <mat-card-header>
        <div mat-card-avatar class="breach-avatar">
          <mat-icon [class.verified]="breach.isVerified" [class.fabricated]="breach.isFabricated">
            {{ getBreachIcon() }}
          </mat-icon>
        </div>
        <mat-card-title>{{ breach.title }}</mat-card-title>
        <mat-card-subtitle>{{ breach.domain }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="breach-info">
          <div class="info-row">
            <mat-icon class="info-icon">event</mat-icon>
            <span>Breach Date: {{ breach.breachDate | breachDate }}</span>
          </div>
          
          <div class="info-row">
            <mat-icon class="info-icon">people</mat-icon>
            <span>Accounts Affected: {{ breach.pwnCount | number }}</span>
          </div>
          
          <div class="status-badges">
            <mat-chip-set>
              <mat-chip [class.verified]="breach.isVerified" [class.fabricated]="breach.isFabricated">
                <mat-icon matChipAvatar>{{ getStatusIcon() }}</mat-icon>
                {{ getStatusText() }}
              </mat-chip>
              <mat-chip *ngIf="breach.isSensitive" class="sensitive">
                <mat-icon matChipAvatar>warning</mat-icon>
                Sensitive
              </mat-chip>
              <mat-chip *ngIf="breach.isMalware" class="malware">
                <mat-icon matChipAvatar>bug_report</mat-icon>
                Malware
              </mat-chip>
            </mat-chip-set>
          </div>
          
          <div class="data-classes" *ngIf="breach.dataClasses?.length">
            <h4>Compromised Data:</h4>
            <mat-chip-set>
              <mat-chip *ngFor="let dataClass of breach.dataClasses" class="data-chip">
                {{ dataClass }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button (click)="onViewDetails()">
          <mat-icon>info</mat-icon>
          View Details
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .breach-card {
      margin: 1rem;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }
    
    .breach-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .breach-card.sensitive {
      border-left: 4px solid #ff9800;
    }
    
    .breach-card.fabricated {
      border-left: 4px solid #f44336;
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
      gap: 1rem;
    }
    
    .info-row {
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
    
    .status-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .data-classes h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: #666;
    }
    
    mat-chip.verified {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    mat-chip.fabricated {
      background-color: #ffebee;
      color: #c62828;
    }
    
    mat-chip.sensitive {
      background-color: #fff3e0;
      color: #ef6c00;
    }
    
    mat-chip.malware {
      background-color: #fce4ec;
      color: #ad1457;
    }
    
    .data-chip {
      font-size: 0.75rem;
      height: 24px;
    }
    
    mat-card-actions {
      padding: 0 16px 16px;
    }
    
    mat-card-actions button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `]
})
export class BreachCardComponent {
  @Input() breach!: Breach;
  @Output() viewDetails = new EventEmitter<Breach>();

  getBreachIcon(): string {
    if (this.breach.isFabricated) return 'warning';
    if (this.breach.isVerified) return 'verified';
    return 'help_outline';
  }

  getStatusIcon(): string {
    if (this.breach.isFabricated) return 'cancel';
    if (this.breach.isVerified) return 'check_circle';
    return 'help';
  }

  getStatusText(): string {
    if (this.breach.isFabricated) return 'Fabricated';
    if (this.breach.isVerified) return 'Verified';
    return 'Unverified';
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.breach);
  }
}