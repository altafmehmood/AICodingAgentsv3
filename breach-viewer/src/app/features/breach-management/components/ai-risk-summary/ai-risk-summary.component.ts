import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { BreachApiService } from '../../../../core/services/breach-api.service';
import { AiRiskSummary, RiskLevel } from '../../../../core/models';

@Component({
  selector: 'app-ai-risk-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  template: `
    <mat-card class="ai-risk-card">
      <mat-card-header>
        <mat-card-title class="flex items-center gap-2">
          <mat-icon>psychology</mat-icon>
          AI Risk Analysis
          @if (riskSummary()?.isFromCache) {
            <mat-icon class="cache-icon" [title]="'Cached result from ' + getRelativeTime(riskSummary()?.generatedAt || '')">cached</mat-icon>
          }
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Generating AI risk analysis...</span>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <mat-icon class="error-icon" color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-stroked-button color="primary" (click)="loadAiSummary()">
              <mat-icon>refresh</mat-icon>
              Retry Analysis
            </button>
          </div>
        } @else if (riskSummary()) {
          <div class="risk-summary">
            <!-- Risk Level Badge -->
            <div class="risk-level-section">
              <mat-chip-set>
                <mat-chip color="warn" selected>
                  <mat-icon matChipAvatar>{{ getRiskLevelIcon(riskSummary()!.riskLevel) }}</mat-icon>
                  {{ getRiskLevelText(riskSummary()!.riskLevel) }} Risk
                </mat-chip>
              </mat-chip-set>
            </div>

            <!-- Executive Summary -->
            <div class="executive-summary">
              <h3>Executive Summary</h3>
              <p>{{ riskSummary()!.executiveSummary }}</p>
            </div>

            <!-- Expandable Sections -->
            <mat-accordion>
              <!-- Business Impact -->
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>business</mat-icon>
                    Business Impact
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ riskSummary()!.businessImpact }}</p>
              </mat-expansion-panel>

              <!-- Recommended Actions -->
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>task_alt</mat-icon>
                    Recommended Actions
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <ul class="action-list">
                  @for (action of riskSummary()!.recommendedActions; track action) {
                    <li>
                      <mat-icon class="action-icon" color="primary">check_circle_outline</mat-icon>
                      {{ action }}
                    </li>
                  }
                </ul>
              </mat-expansion-panel>

              <!-- Industry Context -->
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>insights</mat-icon>
                    Industry Context
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ riskSummary()!.industryContext }}</p>
              </mat-expansion-panel>
            </mat-accordion>

            <!-- Generated Time -->
            <div class="generated-info">
              Analysis generated {{ getRelativeTime(riskSummary()!.generatedAt) }}
            </div>
          </div>
        } @else {
          <div class="text-center">
            <button mat-raised-button color="primary" (click)="loadAiSummary()">
              <mat-icon>psychology</mat-icon>
              Generate AI Risk Analysis
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ai-risk-card {
      margin: 16px 0;
    }

    .flex {
      display: flex;
    }

    .items-center {
      align-items: center;
    }

    .justify-center {
      justify-content: center;
    }

    .gap-2 {
      gap: 8px;
    }

    .loading-container {
      padding: 32px 16px;
      text-align: center;
    }

    .loading-container span {
      margin-left: 12px;
    }

    .error-state {
      padding: 16px;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .risk-level-section {
      margin-bottom: 16px;
    }

    .executive-summary {
      margin-bottom: 16px;
    }

    .executive-summary h3 {
      margin-bottom: 8px;
    }

    .action-list {
      list-style: none;
      padding: 0;
    }

    .action-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }

    .action-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .generated-info {
      margin-top: 16px;
      text-align: center;
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .text-center {
      text-align: center;
    }

    .cache-icon {
      font-size: 18px;
      opacity: 0.7;
    }

    mat-expansion-panel {
      margin-bottom: 8px;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class AiRiskSummaryComponent implements OnInit {
  @Input({ required: true }) breachName!: string;

  loading = signal(false);
  error = signal<string | null>(null);
  riskSummary = signal<AiRiskSummary | null>(null);

  constructor(private breachApiService: BreachApiService) {}

  ngOnInit() {
    // Auto-load AI summary when component initializes
    // this.loadAiSummary();
  }

  loadAiSummary() {
    this.loading.set(true);
    this.error.set(null);

    this.breachApiService.getAiRiskSummary(this.breachName).subscribe({
      next: (summary) => {
        this.riskSummary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading AI risk summary:', err);
        this.error.set('Failed to generate AI risk analysis. Please try again.');
        this.loading.set(false);
      }
    });
  }



  getRiskLevelIcon(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.Critical:
        return 'dangerous';
      case RiskLevel.High:
        return 'warning';
      case RiskLevel.Medium:
        return 'info';
      case RiskLevel.Low:
        return 'check_circle';
      default:
        return 'info';
    }
  }

  getRiskLevelText(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.Critical:
        return 'Critical';
      case RiskLevel.High:
        return 'High';
      case RiskLevel.Medium:
        return 'Medium';
      case RiskLevel.Low:
        return 'Low';
      default:
        return 'Medium';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }
}