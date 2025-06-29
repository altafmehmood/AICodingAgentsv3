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
            <mat-icon class="cache-icon" [title]="'Cached result from ' + formatDate(riskSummary()?.generatedAt || '')">cached</mat-icon>
          }
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        @if (loading()) {
          <div class="flex justify-center items-center py-8">
            <mat-spinner diameter="40"></mat-spinner>
            <span class="ml-3">Generating AI risk analysis...</span>
          </div>
        } @else if (error()) {
          <div class="error-state p-4 text-center">
            <mat-icon class="error-icon">error</mat-icon>
            <p class="mt-2 text-red-600">{{ error() }}</p>
            <button mat-stroked-button color="primary" (click)="loadAiSummary()">
              <mat-icon>refresh</mat-icon>
              Retry Analysis
            </button>
          </div>
        } @else if (riskSummary()) {
          <div class="risk-summary">
            <!-- Risk Level Badge -->
            <div class="risk-level-section mb-4">
              <mat-chip-set>
                <mat-chip [class]="getRiskLevelClass(riskSummary()!.riskLevel)">
                  <mat-icon matChipAvatar>{{ getRiskLevelIcon(riskSummary()!.riskLevel) }}</mat-icon>
                  {{ getRiskLevelText(riskSummary()!.riskLevel) }} Risk
                </mat-chip>
              </mat-chip-set>
            </div>

            <!-- Executive Summary -->
            <div class="executive-summary mb-4">
              <h3 class="text-lg font-semibold mb-2">Executive Summary</h3>
              <p class="text-gray-700">{{ riskSummary()!.executiveSummary }}</p>
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
                    <li class="flex items-start gap-2 mb-2">
                      <mat-icon class="action-icon">check_circle_outline</mat-icon>
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
            <div class="generated-info mt-4 text-sm text-gray-500 text-center">
              Analysis generated {{ getRelativeTime(riskSummary()!.generatedAt) }}
            </div>
          </div>
        } @else {
          <div class="text-center py-4">
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

    .py-8 {
      padding-top: 32px;
      padding-bottom: 32px;
    }

    .py-4 {
      padding-top: 16px;
      padding-bottom: 16px;
    }

    .p-4 {
      padding: 16px;
    }

    .mb-2 {
      margin-bottom: 8px;
    }

    .mb-4 {
      margin-bottom: 16px;
    }

    .mt-2 {
      margin-top: 8px;
    }

    .mt-4 {
      margin-top: 16px;
    }

    .ml-3 {
      margin-left: 12px;
    }

    .text-center {
      text-align: center;
    }

    .text-lg {
      font-size: 1.125rem;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    .font-semibold {
      font-weight: 600;
    }

    .cache-icon {
      font-size: 18px;
      color: #666;
    }

    .error-state {
      border: 1px solid #f87171;
      border-radius: 8px;
      background-color: #fef2f2;
    }

    .error-icon {
      color: #ef4444;
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .text-red-600 {
      color: #dc2626;
    }

    .text-gray-700 {
      color: #374151;
    }

    .text-gray-500 {
      color: #6b7280;
    }

    .risk-critical {
      background-color: #fef2f2 !important;
      color: #991b1b !important;
    }

    .risk-high {
      background-color: #fef3c7 !important;
      color: #92400e !important;
    }

    .risk-medium {
      background-color: #f0f9ff !important;
      color: #1e40af !important;
    }

    .risk-low {
      background-color: #f0fdf4 !important;
      color: #166534 !important;
    }

    .action-list {
      list-style: none;
      padding: 0;
    }

    .action-icon {
      color: #16a34a;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 2px;
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

  getRiskLevelClass(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.Critical:
        return 'risk-critical';
      case RiskLevel.High:
        return 'risk-high';
      case RiskLevel.Medium:
        return 'risk-medium';
      case RiskLevel.Low:
        return 'risk-low';
      default:
        return 'risk-medium';
    }
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